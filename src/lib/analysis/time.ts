import type { Message } from '../types.js';

export const MINUTE_MS = 60_000;

export function timeMs(m: Message): number {
	return new Date(m.t).getTime();
}

/** Messages sorted chronologically (stable, by `t`). */
export function sortByTime(messages: Message[]): Message[] {
	return messages
		.map((m) => ({ m, ts: timeMs(m) }))
		.sort((a, b) => a.ts - b.ts)
		.map(({ m }) => m);
}

export function minutesBetween(a: Message, b: Message): number {
	return (timeMs(b) - timeMs(a)) / MINUTE_MS;
}

export function formatMinutes(min: number): string {
	if (min < 1) return `${Math.round(min * 60)} s`;
	if (min < 60) return `${+min.toFixed(1)} min`;
	return `${+(min / 60).toFixed(1)} h`;
}
