import type { Message } from '../types.js';
import { minutesBetween, sortByTime } from './time.js';

export interface TransitionResult {
	chats: string[];
	/** matrix[from][to] = number of consecutive message pairs going from chat `from` to `to`. */
	matrix: number[][];
	switches: number;
	stays: number;
	switchRate: number;
}

/**
 * Counts chat-to-chat transitions between consecutive messages (across all chats) that are at most
 * `gapMin` minutes apart, i.e. within the same burst.
 */
export function computeTransitions(messages: Message[], gapMin: number): TransitionResult {
	const sorted = sortByTime(messages);
	const counts = new Map<string, number>();
	for (const m of sorted) counts.set(m.chatname, (counts.get(m.chatname) ?? 0) + 1);
	const chats = [...counts.keys()].sort(
		(a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b)
	);
	const index = new Map(chats.map((c, i) => [c, i]));
	const matrix = chats.map(() => chats.map(() => 0));

	let switches = 0;
	let stays = 0;
	for (let i = 1; i < sorted.length; i++) {
		const prev = sorted[i - 1];
		const cur = sorted[i];
		if (minutesBetween(prev, cur) > gapMin) continue;
		matrix[index.get(prev.chatname)!][index.get(cur.chatname)!]++;
		if (prev.chatname === cur.chatname) stays++;
		else switches++;
	}

	const total = switches + stays;
	return { chats, matrix, switches, stays, switchRate: total ? switches / total : 0 };
}
