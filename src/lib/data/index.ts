import type { Message } from '$lib/types';
import { sessions, type SessionMeta } from './manifest';

const modules = import.meta.glob<{ default: Message[] }>('./sessions/*.json', { eager: true });

/** Messages keyed by session id (e.g. `004FELI-01`). */
export const sessionMessages: Record<string, Message[]> = {};
for (const [path, mod] of Object.entries(modules)) {
	const id = path.replace(/^.*\/(.*)\.json$/, '$1');
	sessionMessages[id] = mod.default;
}

/** All messages from every session, combined. */
export const allMessages: Message[] = sessions.flatMap((s) => sessionMessages[s.id] ?? []);

/** Get the combined messages for a set of sessions (by id). */
export function messagesForSessions(ids: string[]): Message[] {
	return ids.flatMap((id) => sessionMessages[id] ?? []);
}

/** Get all messages for a given participant. */
export function messagesForParticipant(participant: string): Message[] {
	return sessions
		.filter((s) => s.participant === participant)
		.flatMap((s) => sessionMessages[s.id] ?? []);
}

export { sessions, type SessionMeta };
