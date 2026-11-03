import type { Message } from './types.js';

export const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Hour of day (0–23) read directly from the naive wall-clock timestamp. */
export function hourOf(m: Message): number {
	return Number(m.t.slice(11, 13));
}

/** A message "has emoji" when its `type` field mentions emoji or emoticon. */
export function hasEmoji(m: Message): boolean {
	return /emoji|emoticon/i.test(m.type);
}

export type GroupById =
	'none' | 'direction' | 'platform' | 'type' | 'language' | 'chat' | 'emoji' | 'day';

export interface GroupByOption {
	id: GroupById;
	label: string;
	key: (m: Message) => string;
}

export const groupByOptions: GroupByOption[] = [
	{ id: 'none', label: 'None (all messages)', key: () => 'All messages' },
	{ id: 'direction', label: 'Direction', key: (m) => m.direction },
	{ id: 'platform', label: 'Platform', key: (m) => m.platform },
	{ id: 'type', label: 'Type', key: (m) => m.type },
	{ id: 'language', label: 'Language', key: (m) => m.language || '(unknown)' },
	{ id: 'chat', label: 'Chat', key: (m) => m.chatname },
	{ id: 'emoji', label: 'Has emoji', key: (m) => (hasEmoji(m) ? 'with emoji' : 'without emoji') },
	{ id: 'day', label: 'Day', key: (m) => m.t.slice(0, 10) }
];

export interface HourRow {
	key: string;
	counts: number[];
	total: number;
}

export interface HourMatrix {
	rows: HourRow[];
	hourTotals: number[];
	total: number;
}

const directionOrder = ['incoming', 'outgoing', 'not sent'];
const emojiOrder = ['with emoji', 'without emoji'];

function orderIndex(order: string[], key: string): number {
	const i = order.indexOf(key);
	return i === -1 ? order.length : i;
}

function compareRows(groupBy: GroupById) {
	return (a: HourRow, b: HourRow): number => {
		if (groupBy === 'direction')
			return (
				orderIndex(directionOrder, a.key) - orderIndex(directionOrder, b.key) ||
				a.key.localeCompare(b.key)
			);
		if (groupBy === 'emoji') return orderIndex(emojiOrder, a.key) - orderIndex(emojiOrder, b.key);
		if (groupBy === 'day') return a.key.localeCompare(b.key);
		return b.total - a.total || a.key.localeCompare(b.key);
	};
}

export function buildHourMatrix(messages: Message[], groupBy: GroupById): HourMatrix {
	const option = groupByOptions.find((o) => o.id === groupBy) ?? groupByOptions[0];
	const byKey = new Map<string, HourRow>();
	const hourTotals = HOURS.map(() => 0);

	for (const m of messages) {
		const hour = hourOf(m);
		if (!(hour >= 0 && hour < 24)) continue;
		const key = option.key(m);
		let row = byKey.get(key);
		if (!row) {
			row = { key, counts: HOURS.map(() => 0), total: 0 };
			byKey.set(key, row);
		}
		row.counts[hour]++;
		row.total++;
		hourTotals[hour]++;
	}

	const rows = [...byKey.values()].sort(compareRows(option.id));
	return { rows, hourTotals, total: rows.reduce((sum, r) => sum + r.total, 0) };
}

export type CellMode = 'count' | 'row' | 'hour';

export const cellModes: { id: CellMode; label: string }[] = [
	{ id: 'count', label: 'Count' },
	{ id: 'row', label: '% of row' },
	{ id: 'hour', label: '% of hour' }
];

/** Cell value: raw count, or a share (0–1) of the row total / hour total. */
export function cellValue(mode: CellMode, row: HourRow, hour: number, matrix: HourMatrix): number {
	const count = row.counts[hour];
	if (mode === 'count') return count;
	const denom = mode === 'row' ? row.total : matrix.hourTotals[hour];
	return denom ? count / denom : 0;
}
