export type Message = {
	t: string;
	t_video: number;
	direction: 'incoming' | 'outgoing' | 'not sent';
	author: string;
	chatname: string;
	content: string;
	type: string;
	platform: string;
	n_revisions: number;
	language?: string;
	recording_id: string;
	message_id: string;
};
