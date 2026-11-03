import * as d3 from 'd3';
import type { Message } from '../types.js';
import { minutesBetween, sortByTime } from './time.js';

export interface Reply {
	chat: string;
	/** First incoming message of the unanswered run. */
	incoming: Message;
	/** Her first outgoing message after that run. */
	reply: Message;
	minutes: number;
}

export interface ReplyResult {
	replies: Reply[];
	/** Incoming runs answered later than `maxGapMin` (not counted as replies). */
	excluded: number;
	median: number | undefined;
}

/**
 * Her reply times per chat: the time from the first incoming message of an unanswered run to the
 * next outgoing message in the same chat. Gaps over `maxGapMin` are excluded.
 */
export function computeReplies(messages: Message[], maxGapMin: number): ReplyResult {
	const replies: Reply[] = [];
	let excluded = 0;

	for (const [chat, chatMessages] of d3.group(messages, (m) => m.chatname)) {
		let pending: Message | null = null;
		for (const m of sortByTime(chatMessages)) {
			if (m.direction === 'incoming') {
				pending ??= m;
			} else if (m.direction === 'outgoing' && pending) {
				const minutes = minutesBetween(pending, m);
				if (minutes <= maxGapMin) replies.push({ chat, incoming: pending, reply: m, minutes });
				else excluded++;
				pending = null;
			}
		}
	}

	return { replies, excluded, median: d3.median(replies, (r) => r.minutes) };
}
