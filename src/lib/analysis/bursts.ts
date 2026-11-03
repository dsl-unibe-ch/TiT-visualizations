import type { Message } from '../types.js';
import { minutesBetween, sortByTime } from './time.js';

export interface Burst {
	start: Message;
	end: Message;
	durationMin: number;
	messages: Message[];
	chats: string[];
	/** Number of consecutive message pairs within the burst that change chat. */
	switches: number;
}

/** Splits messages into bursts: a new burst starts after more than `gapMin` minutes of silence. */
export function computeBursts(messages: Message[], gapMin: number): Burst[] {
	const bursts: Burst[] = [];
	let current: Message[] = [];

	const flush = () => {
		if (!current.length) return;
		const start = current[0];
		const end = current[current.length - 1];
		let switches = 0;
		for (let i = 1; i < current.length; i++)
			if (current[i].chatname !== current[i - 1].chatname) switches++;
		bursts.push({
			start,
			end,
			durationMin: minutesBetween(start, end),
			messages: current,
			chats: [...new Set(current.map((m) => m.chatname))],
			switches
		});
		current = [];
	};

	for (const m of sortByTime(messages)) {
		const last = current[current.length - 1];
		if (last && minutesBetween(last, m) > gapMin) flush();
		current.push(m);
	}
	flush();
	return bursts;
}
