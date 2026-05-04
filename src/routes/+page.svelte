<script lang="ts">
	import SelectedMessagesList from '$lib/SelectedMessagesList.svelte';
	import TimelineFilters from '$lib/filter.svelte';
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
			t: '2026-04-15T09:07:00Z',
			t_video: 20,
			direction: 'not sent',
			author: 'Me',
			chatname: 'Caro',
			content: 'Actually nvm',
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
			t: '2026-04-15T10:20:00Z',
			t_video: 178,
			direction: 'not sent',
			author: 'Me',
			chatname: 'Tobias',
			content: 'Maybe...',
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
			t: '2026-04-15T15:07:00Z',
			t_video: 338,
			direction: 'not sent',
			author: 'Me',
			chatname: 'Adam',
			content: 'Nvm figured it out',
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

	const directionOrder: Message['direction'][] = ['incoming', 'outgoing', 'not sent'];
	const directionOptions: Message['direction'][] = directionOrder.filter((direction) =>
		data.some((message) => message.direction === direction)
	);
	const typeOptions = [...new Set(data.map((message) => message.type))].sort((a, b) =>
		a.localeCompare(b)
	);
	const platformOptions = [...new Set(data.map((message) => message.platform))].sort((a, b) =>
		a.localeCompare(b)
	);

	let selectedDirections = $state<Message['direction'][]>([...directionOptions]);
	let selectedTypes = $state<string[]>([...typeOptions]);
	let selectedPlatforms = $state<string[]>([...platformOptions]);
	let visibleStart = $state<Date | null>(null);
	let visibleEnd = $state<Date | null>(null);

	const filteredData = $derived.by((): Message[] => {
		return data.filter(
			(message) =>
				selectedDirections.includes(message.direction) &&
				selectedTypes.includes(message.type) &&
				selectedPlatforms.includes(message.platform)
		);
	});

	const visibleData = $derived.by((): Message[] => {
		if (!visibleStart || !visibleEnd) return filteredData;

		const startMs = Math.min(visibleStart.getTime(), visibleEnd.getTime());
		const endMs = Math.max(visibleStart.getTime(), visibleEnd.getTime());

		return filteredData.filter((message) => {
			const messageMs = new Date(message.t).getTime();
			return messageMs >= startMs && messageMs <= endMs;
		});
	});

	const hasResults = $derived(filteredData.length > 0);
</script>

<div class="min-h-screen bg-base-100 p-8">
	<h1 class="mb-6 text-2xl font-bold text-base-content">Texting in Time — Timeline</h1>

	<TimelineFilters
		{directionOptions}
		{typeOptions}
		{platformOptions}
		bind:selectedDirections
		bind:selectedTypes
		bind:selectedPlatforms
	/>

	<p class="mb-4 text-sm text-base-content/70">
		Showing {visibleData.length} visible messages ({filteredData.length} after filters, {data.length}
		total)
	</p>

	{#if hasResults}
		<div class="overflow-x-auto">
			<TimelineChart data={filteredData} bind:visibleStart bind:visibleEnd />
		</div>

		{#if visibleData.length === 0}
			<div role="status" class="mt-4 alert alert-soft alert-info">
				<span>No filtered messages are visible in the current timeline viewport.</span>
			</div>
		{:else}
			<SelectedMessagesList messages={visibleData} />
		{/if}
	{:else}
		<div role="alert" class="alert alert-soft alert-warning">
			<span>No messages match your filters. Adjust selections or reset all.</span>
		</div>
	{/if}
</div>
