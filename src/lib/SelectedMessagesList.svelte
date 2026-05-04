<script lang="ts">
	import type { Message } from '$lib/types';

	let { messages }: { messages: Message[] } = $props();

	const sortedMessages = $derived.by(() => {
		return [...messages].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
	});

	function formatTime(value: string): string {
		return new Date(value).toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: 'UTC'
		});
	}

	function toTitle(value: string): string {
		return value
			.split(' ')
			.map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
			.join(' ');
	}

	function directionBadge(direction: Message['direction']): string {
		if (direction === 'incoming') return 'badge-success';
		if (direction === 'not sent') return 'badge-neutral';
		return 'badge-primary';
	}
</script>

<section class="card mt-6 bg-base-200/40 card-border">
	<div class="card-body gap-4 p-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="card-title text-base">Selected messages</h2>
			<span class="badge badge-outline">{sortedMessages.length} items</span>
		</div>

		<ul class="list rounded-box border border-base-300 bg-base-100">
			<li class="px-4 pt-4 pb-2 text-xs tracking-wide opacity-60">Metadata view</li>
			{#each sortedMessages as msg, i (`${msg.chatname}-${msg.t}-${i}`)}
				<li class="list-row">
					<div class="w-14 text-xs tabular-nums opacity-70">{formatTime(msg.t)}</div>

					<div class="list-col-grow">
						<p class="text-sm leading-relaxed">{msg.content}</p>
						<div class="mt-2 flex flex-wrap gap-2 text-xs">
							<span class="badge badge-ghost badge-sm">Author: {msg.author}</span>
							<span class="badge badge-ghost badge-sm">Chat: {msg.chatname}</span>
						</div>
					</div>

					<div class="flex flex-col items-end gap-1">
						<span class={`badge badge-sm ${directionBadge(msg.direction)}`}
							>{toTitle(msg.direction)}</span
						>
						<span class="badge badge-outline badge-sm">{msg.platform}</span>
						<span class="badge badge-outline badge-sm">{toTitle(msg.type)}</span>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</section>
