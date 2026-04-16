<script lang="ts">
	import TimelineChart from '$lib/TimelineChart.svelte';
	import type { Message } from '$lib/types';

	const data: Message[] = [
		// Caro — WhatsApp, 09:00–09:30
		{
			t: '2026-04-15T09:02:00Z',
			t_video: 0,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Caro',
			content: 'Hey, are you coming today?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:04:30Z',
			t_video: 8,
			direction: 'incoming',
			author: 'Caro',
			chatname: 'Caro',
			content: 'Yes! On my way',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:05:10Z',
			t_video: 12,
			direction: 'incoming',
			author: 'Caro',
			chatname: 'Caro',
			content: 'Should I bring anything?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:06:45Z',
			t_video: 18,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Caro',
			content: 'Just yourself 😊',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:25:00Z',
			t_video: 45,
			direction: 'incoming',
			author: 'Caro',
			chatname: 'Caro',
			content: 'Almost there',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},

		// Papa — WhatsApp, 09:15–09:45
		{
			t: '2026-04-15T09:15:00Z',
			t_video: 50,
			direction: 'incoming',
			author: 'Papa',
			chatname: 'Papa',
			content: 'Call me when you can',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:18:30Z',
			t_video: 55,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Papa',
			content: 'Will do in 10 min',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:35:00Z',
			t_video: 70,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Papa',
			content: 'Calling now',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:45:00Z',
			t_video: 85,
			direction: 'incoming',
			author: 'Papa',
			chatname: 'Papa',
			content: '👍',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},

		// Linda — Instagram, 09:30–10:00 + 12:00–12:30
		{
			t: '2026-04-15T09:30:00Z',
			t_video: 90,
			direction: 'incoming',
			author: 'Linda',
			chatname: 'Linda',
			content: 'Check this out!',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:32:00Z',
			t_video: 95,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Linda',
			content: 'Haha nice',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:55:00Z',
			t_video: 100,
			direction: 'incoming',
			author: 'Linda',
			chatname: 'Linda',
			content: 'Right??',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T12:05:00Z',
			t_video: 200,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Linda',
			content: 'Lunch?',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T12:20:00Z',
			t_video: 210,
			direction: 'incoming',
			author: 'Linda',
			chatname: 'Linda',
			content: 'Sure, where?',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},

		// Paul — WhatsApp, 09:30–10:00
		{
			t: '2026-04-15T09:33:00Z',
			t_video: 110,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Paul',
			content: 'Meeting still at 3?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:40:00Z',
			t_video: 115,
			direction: 'incoming',
			author: 'Paul',
			chatname: 'Paul',
			content: 'Yep',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:55:00Z',
			t_video: 120,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Paul',
			content: 'Cool, see you then',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},

		// Liz — WhatsApp, 09:45–10:30 + 14:30–15:30
		{
			t: '2026-04-15T09:45:00Z',
			t_video: 130,
			direction: 'incoming',
			author: 'Liz',
			chatname: 'Liz',
			content: 'Did you see the news?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:48:00Z',
			t_video: 135,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Liz',
			content: 'No, what happened?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T09:50:00Z',
			t_video: 140,
			direction: 'incoming',
			author: 'Liz',
			chatname: 'Liz',
			content: 'Check your email',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T10:20:00Z',
			t_video: 150,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Liz',
			content: 'Wow, interesting',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T14:30:00Z',
			t_video: 300,
			direction: 'incoming',
			author: 'Liz',
			chatname: 'Liz',
			content: 'Any updates?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T14:45:00Z',
			t_video: 310,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Liz',
			content: 'Not yet',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T15:15:00Z',
			t_video: 320,
			direction: 'incoming',
			author: 'Liz',
			chatname: 'Liz',
			content: 'Ok keep me posted',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},

		// Markus — Instagram, 10:00–10:30
		{
			t: '2026-04-15T10:00:00Z',
			t_video: 160,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Markus',
			content: 'Nice post!',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T10:10:00Z',
			t_video: 165,
			direction: 'incoming',
			author: 'Markus',
			chatname: 'Markus',
			content: 'Thanks!',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T10:25:00Z',
			t_video: 170,
			direction: 'incoming',
			author: 'Markus',
			chatname: 'Markus',
			content: 'New one coming soon',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},

		// Tobias — Instagram, 10:15–10:30
		{
			t: '2026-04-15T10:15:00Z',
			t_video: 175,
			direction: 'incoming',
			author: 'Tobias',
			chatname: 'Tobias',
			content: 'Party Saturday?',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T10:28:00Z',
			t_video: 180,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Tobias',
			content: 'Count me in!',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},

		// Kirsten — Instagram, 14:00–14:15
		{
			t: '2026-04-15T14:00:00Z',
			t_video: 280,
			direction: 'incoming',
			author: 'Kirsten',
			chatname: 'Kirsten',
			content: 'Happy birthday!!',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T14:10:00Z',
			t_video: 285,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Kirsten',
			content: 'Thank you!! 🎉',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},

		// Adam — WhatsApp, 15:00–15:30
		{
			t: '2026-04-15T15:00:00Z',
			t_video: 330,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Adam',
			content: 'Hey, got a sec?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T15:05:00Z',
			t_video: 335,
			direction: 'incoming',
			author: 'Adam',
			chatname: 'Adam',
			content: 'Sure, whats up?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T15:08:00Z',
			t_video: 340,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Adam',
			content: 'Can you review my PR?',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T15:20:00Z',
			t_video: 350,
			direction: 'incoming',
			author: 'Adam',
			chatname: 'Adam',
			content: 'Done, looks good!',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},

		// Lisa — Instagram, 16:00–17:00
		{
			t: '2026-04-15T16:00:00Z',
			t_video: 400,
			direction: 'incoming',
			author: 'Lisa',
			chatname: 'Lisa',
			content: 'Dinner tonight?',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T16:15:00Z',
			t_video: 410,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Lisa',
			content: 'Yes! 7pm?',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T16:30:00Z',
			t_video: 420,
			direction: 'incoming',
			author: 'Lisa',
			chatname: 'Lisa',
			content: 'Perfect',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},
		{
			t: '2026-04-15T16:50:00Z',
			t_video: 430,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Lisa',
			content: 'See you there',
			type: 'text',
			platform: 'Instagram',
			n_revisions: 0
		},

		// Janina — WhatsApp, 17:00–17:30
		{
			t: '2026-04-15T17:00:00Z',
			t_video: 440,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Janina',
			content: 'Hey!',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T17:15:00Z',
			t_video: 450,
			direction: 'incoming',
			author: 'Janina',
			chatname: 'Janina',
			content: 'Hey, long time!',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		},
		{
			t: '2026-04-15T17:25:00Z',
			t_video: 460,
			direction: 'outgoing',
			author: 'Me',
			chatname: 'Janina',
			content: 'We should catch up',
			type: 'text',
			platform: 'WhatsApp',
			n_revisions: 0
		}
	];
</script>

<div class="min-h-screen bg-white p-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-900">Texting in Time — Timeline</h1>
	<div class="overflow-x-auto">
		<TimelineChart {data} />
	</div>
</div>
