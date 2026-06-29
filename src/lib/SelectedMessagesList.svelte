<script lang="ts">
	import type { Message } from '$lib/types';

	let { messages }: { messages: Message[] } = $props();

	function formatTime(value: string): string {
		// `value` is a naive local wall-clock timestamp ("YYYY-MM-DDTHH:MM:SS",
		// no timezone). Read HH:MM directly so the displayed time matches the
		// recorded wall clock regardless of the viewer's timezone.
		const match = value.match(/T(\d{2}):(\d{2})/);
		return match ? `${match[1]}:${match[2]}` : value;
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

	const pageSize = 100;
	let visibleCount = $state(pageSize);

	const messageSetKey = $derived(
		`${messages.length}:${messages[0]?.recording_id ?? ''}:${messages.at(-1)?.recording_id ?? ''}:${messages[0]?.message_id ?? ''}:${messages.at(-1)?.message_id ?? ''}`
	);

	$effect(() => {
		messageSetKey;
		visibleCount = Math.min(pageSize, messages.length);
	});

	const visibleMessages = $derived.by(() => {
		return messages.slice(0, visibleCount);
	});

	function loadMore() {
		if (visibleCount >= messages.length) return;
		visibleCount = Math.min(visibleCount + pageSize, messages.length);
	}

	let listViewportEl = $state<HTMLDivElement | null>(null);
	let sentinelEl = $state<HTMLLIElement | null>(null);

	$effect(() => {
		if (!listViewportEl) return;
		if (!sentinelEl) return;
		if (visibleMessages.length >= messages.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					loadMore();
				}
			},
			{
				root: listViewportEl,
				threshold: 0.1
			}
		);

		observer.observe(sentinelEl);

		return () => {
			observer.disconnect();
		};
	});
</script>

<section class="card mt-6 bg-base-200/40 card-border">
	<div class="card-body gap-4 p-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="card-title text-base">Selected messages</h2>
			<span class="badge badge-outline">{messages.length} items</span>
		</div>

		<div
			bind:this={listViewportEl}
			class="max-h-160 overflow-y-auto rounded-box border border-base-300"
		>
			<ul class="list bg-base-100">
				<li class="px-4 pt-4 pb-2 text-xs tracking-wide opacity-60">Metadata view</li>
				{#each visibleMessages as msg, i (`${msg.chatname}-${msg.t}-${i}`)}
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
				{#if visibleMessages.length < messages.length}
					<li bind:this={sentinelEl} class="px-4 py-3 text-xs opacity-60">
						Loading more messages...
					</li>
				{/if}
			</ul>
		</div>
	</div>
</section>
