/**
 * Ingest raw Texting-in-Time xlsx exports into per-session JSON files.
 *
 * Reads every `*_database.xlsx` in `src/lib/assets/data/`, transforms the
 * `Messages` sheet (using the per-conversation anchor in the `Time` sheet) into
 * the app's `Message` shape, and writes one JSON file per recording session to
 * `src/lib/data/sessions/`. Also (re)generates `src/lib/data/manifest.ts`.
 *
 * Run with: `pnpm ingest`
 */
import { readdirSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSheet } from 'read-excel-file/node';
import type { Message } from '../src/lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RAW_DIR = join(ROOT, 'src/lib/assets/data');
const OUT_DIR = join(ROOT, 'src/lib/data/sessions');
const MANIFEST_PATH = join(ROOT, 'src/lib/data/manifest.ts');

const SELF_FALLBACK = 'Felicitas Albrecht';

type CellValue = string | number | boolean | Date | null;
type RawRow = Record<string, CellValue>;
type Ymd = { y: number; m: number; d: number };
type Anchor = { videoSeconds: number | null; clockSeconds: number | null; date: Ymd | null };

type SessionMeta = {
	id: string;
	participant: string;
	session: number;
	date: string | null;
	file: string;
	messageCount: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Parse an Excel clock value into seconds-of-day. Accepts a serial fraction
 * (0..1) or a `HH:MM:SS(.mmm)` string. Returns null when empty/unparseable. */
function clockToSeconds(value: CellValue): number | null {
	if (value === null || value === '') return null;
	if (value instanceof Date) {
		// read-excel-file stores time-only cells as a UTC epoch date, so read UTC
		// parts to avoid a timezone-dependent hour shift.
		return value.getUTCHours() * 3600 + value.getUTCMinutes() * 60 + value.getUTCSeconds();
	}
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) return null;
		const fraction = value % 1;
		return Math.round(fraction * 86400);
	}
	if (typeof value !== 'string') return null;
	const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/);
	if (!match) return null;
	const seconds = match[3] ? Math.round(parseFloat(match[3])) : 0;
	return Number(match[1]) * 3600 + Number(match[2]) * 60 + seconds;
}

/** Parse a video timecode `HH:MM:SS.mmm` into (fractional) seconds. */
function videoToSeconds(value: CellValue): number | null {
	if (value === null || value === '') return null;
	if (value instanceof Date) {
		return value.getUTCHours() * 3600 + value.getUTCMinutes() * 60 + value.getUTCSeconds();
	}
	if (typeof value === 'number') return value * 86400;
	if (typeof value !== 'string') return null;
	const match = value.trim().match(/^(\d{1,2}):(\d{2}):(\d{2}(?:\.\d+)?)$/);
	if (!match) return null;
	return Number(match[1]) * 3600 + Number(match[2]) * 60 + parseFloat(match[3]);
}

/** Parse an Excel date value (serial number or `DD.MM.YYYY`) into Y/M/D. */
function dateToYmd(value: CellValue): Ymd | null {
	if (value === null || value === '') return null;
	if (value instanceof Date) {
		return { y: value.getUTCFullYear(), m: value.getUTCMonth() + 1, d: value.getUTCDate() };
	}
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) return null;
		const excelEpochOffset = 25569;
		const msPerDay = 86400 * 1000;
		const asDate = new Date(Math.round((value - excelEpochOffset) * msPerDay));
		if (Number.isNaN(asDate.getTime())) return null;
		return { y: asDate.getUTCFullYear(), m: asDate.getUTCMonth() + 1, d: asDate.getUTCDate() };
	}
	if (typeof value !== 'string') return null;
	const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
	if (!match) return null;
	return { y: Number(match[3]), m: Number(match[2]), d: Number(match[1]) };
}

function asHeader(cell: CellValue): string {
	return typeof cell === 'string' ? cell.trim() : String(cell ?? '').trim();
}

function toRows(sheetData: CellValue[][]): RawRow[] {
	if (sheetData.length === 0) return [];
	const headers = sheetData[0].map(asHeader);
	const rows: RawRow[] = [];
	for (let i = 1; i < sheetData.length; i++) {
		const cells = sheetData[i] ?? [];
		const row: RawRow = {};
		for (let c = 0; c < headers.length; c++) {
			const key = headers[c];
			if (!key) continue;
			row[key] = cells[c] ?? null;
		}
		rows.push(row);
	}
	return rows;
}

async function readSheetRows(filePath: string, sheet: string): Promise<RawRow[]> {
	const sheetData = await readSheet(filePath, sheet);
	return toRows(sheetData as CellValue[][]);
}

/** Build a naive local ISO timestamp (no timezone) from a date and seconds-of-day. */
function buildIso(date: Ymd, clockSeconds: number): string {
	const safe = ((clockSeconds % 86400) + 86400) % 86400;
	const h = Math.floor(safe / 3600);
	const m = Math.floor((safe % 3600) / 60);
	const s = Math.floor(safe % 60);
	return `${date.y}-${pad(date.m)}-${pad(date.d)}T${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Build a map of recording_id -> anchor from the `Time` sheet. */
function buildAnchorMap(rows: RawRow[]): Map<string, Anchor> {
	const map = new Map<string, Anchor>();
	for (const row of rows) {
		const id = String(row.recording_id ?? '').trim();
		if (!id) continue;
		map.set(id, {
			videoSeconds: videoToSeconds(row.anchor_video_time ?? null),
			clockSeconds: clockToSeconds(row.anchor_clock_time ?? null),
			date: dateToYmd(row.recording_date ?? null)
		});
	}
	return map;
}

/** Determine the participant's own name (most frequent party across the file). */
function detectSelf(rows: RawRow[]): string {
	const counts = new Map<string, number>();
	const bump = (name: string) => counts.set(name, (counts.get(name) ?? 0) + 1);
	for (const row of rows) {
		if (row.author) bump(String(row.author).trim());
		if (row.recipient) bump(String(row.recipient).trim());
	}
	let self = SELF_FALLBACK;
	let max = -1;
	for (const [name, count] of counts) {
		if (count > max) {
			max = count;
			self = name;
		}
	}
	return self;
}

async function transformFile(
	fileName: string
): Promise<{ messages: Message[]; meta: SessionMeta }> {
	const filePath = join(RAW_DIR, fileName);
	const messageRows = await readSheetRows(filePath, 'Messages');
	if (messageRows.length === 0) throw new Error(`${fileName}: missing or empty "Messages" sheet`);

	let timeRows: RawRow[] = [];
	try {
		timeRows = await readSheetRows(filePath, 'Time');
	} catch {
		timeRows = [];
	}
	const anchors = buildAnchorMap(timeRows);
	const self = detectSelf(messageRows);

	// All rows in a file share a single recording date; use the first available
	// anchor date as a fallback for conversations missing from the Time sheet.
	const fileDate =
		timeRows.map((r) => dateToYmd(r.recording_date ?? null)).find((d): d is Ymd => d !== null) ??
		null;

	const id = fileName.replace(/_database\.xlsx$/i, '');
	const idMatch = id.match(/^(.*?)-(\d+)$/);
	const participant = idMatch ? idMatch[1] : id;
	const session = idMatch ? Number(idMatch[2]) : 0;

	const messages: Message[] = [];
	for (const row of messageRows) {
		// Skip genuinely blank rows (no participants and no text).
		if (!row.author && !row.recipient && !row.text) continue;

		const recordingId = String(row.recording_id ?? '').trim();
		const anchor = anchors.get(recordingId);
		const direction = String(row.direction ?? '').trim() as Message['direction'];

		const clockSeconds =
			clockToSeconds(direction === 'outgoing' ? row.t_sent : row.t_received) ??
			clockToSeconds(row.t_sent) ??
			clockToSeconds(row.t_received) ??
			anchor?.clockSeconds ??
			null;

		const date = anchor?.date ?? fileDate;
		if (!date || clockSeconds === null) {
			console.warn(
				`${fileName}: skipping message ${row.message_id} (${recordingId}) — missing date or clock time`
			);
			continue;
		}
		if (!recordingId || !row.message_id) {
			console.warn(
				`${fileName}: skipping message ${row.message_id} (${recordingId}) — missing recording ID or message ID`
			);
			continue;
		}

		let videoSeconds = videoToSeconds(row.t_mmss);
		if (videoSeconds === null && anchor?.videoSeconds !== null && anchor?.clockSeconds != null) {
			videoSeconds = anchor.videoSeconds! + (clockSeconds - anchor.clockSeconds);
		}

		const author = String(row.author ?? '').trim();
		const recipient = String(row.recipient ?? '').trim();
		// The chat is the other side of the conversation: the recipient unless it's
		// self (a direct message to the participant), in which case it's the author.
		// This keeps group chats (recipient = "Gruppe: …") grouped by the group name
		// even for incoming messages authored by an individual member.
		const chatname = !recipient || recipient === self ? author : recipient;

		messages.push({
			t: buildIso(date, clockSeconds),
			t_video: videoSeconds ?? 0,
			direction,
			author,
			chatname,
			content: String(row.text ?? ''),
			type: String(row.message_type ?? 'text').toLowerCase(),
			platform: String(row.platform ?? '').trim(),
			n_revisions: 0,
			language: row.language ? String(row.language).trim() : undefined,
			recording_id: recordingId,
			message_id: String(row.message_id).trim()
		});
	}

	messages.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));

	const firstDate = timeRows.length ? dateToYmd(timeRows[0].recording_date ?? null) : null;
	const meta: SessionMeta = {
		id,
		participant,
		session,
		date: firstDate ? `${firstDate.y}-${pad(firstDate.m)}-${pad(firstDate.d)}` : null,
		file: `${id}.json`,
		messageCount: messages.length
	};

	return { messages, meta };
}

async function main() {
	const files = readdirSync(RAW_DIR)
		.filter((f) => /_database\.xlsx$/i.test(f) && !f.startsWith('~$'))
		.sort();
	if (files.length === 0) {
		console.error(`No "*_database.xlsx" files found in ${RAW_DIR}`);
		process.exit(1);
	}

	if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
	mkdirSync(OUT_DIR, { recursive: true });

	const metas: SessionMeta[] = [];
	for (const file of files) {
		const { messages, meta } = await transformFile(file);
		writeFileSync(join(OUT_DIR, meta.file), JSON.stringify(messages, null, '\t') + '\n');
		metas.push(meta);
		console.log(`✓ ${file} -> sessions/${meta.file} (${messages.length} messages)`);
	}

	const manifest = `// AUTO-GENERATED by scripts/ingest.ts — do not edit by hand.\n\nexport type SessionMeta = {\n\tid: string;\n\tparticipant: string;\n\tsession: number;\n\tdate: string | null;\n\tfile: string;\n\tmessageCount: number;\n};\n\nexport const sessions: SessionMeta[] = ${JSON.stringify(metas, null, '\t')};\n`;
	writeFileSync(MANIFEST_PATH, manifest);
	console.log(`✓ manifest.ts (${metas.length} sessions)`);
}

void main();
