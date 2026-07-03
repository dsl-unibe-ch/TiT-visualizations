import MiniSearch from 'minisearch';
import { allMessages } from '$lib/data';
import type { Message } from '$lib/types';

/** Globally unique, stable string key for a message. */
export function messageId(m: Message): string {
	return `${m.recording_id}:${m.message_id}`;
}

type IndexedMessage = { id: string; content: string };

const miniSearch = new MiniSearch<IndexedMessage>({
	fields: ['content'],
	idField: 'id',
	searchOptions: {
		prefix: true,
		fuzzy: 0.2,
		combineWith: 'AND'
	}
});

miniSearch.addAll(allMessages.map((m) => ({ id: messageId(m), content: m.content })));

/**
 * Full-text search over message content using MiniSearch.
 * Returns the set of message ids (recording_id:message_id) that match.
 */
export function searchContent(query: string): Set<string> {
	return new Set(miniSearch.search(query).map((r) => r.id as string));
}

/**
 * Filter message content with a regular expression.
 * Returns `{ ids, error: null }` on success or `{ ids: null, error }` if the
 * pattern is invalid — so callers can show a hint without crashing.
 */
export function regexSearch(
	pattern: string,
	flags: string
): { ids: Set<string> | null; error: string | null } {
	let re: RegExp;
	try {
		re = new RegExp(pattern, flags);
	} catch (e) {
		return { ids: null, error: e instanceof Error ? e.message : String(e) };
	}
	const ids = new Set<string>();
	for (const m of allMessages) {
		if (re.test(m.content)) {
			ids.add(messageId(m));
		}
	}
	return { ids, error: null };
}
