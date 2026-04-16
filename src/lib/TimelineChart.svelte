<script lang="ts">
	import * as d3 from 'd3';
	import type { Message } from '$lib/types';

	let { data }: { data: Message[] } = $props();

	// Layout constants
	const margin = { top: 70, right: 40, bottom: 20, left: 160 };
	const rowHeight = 50;
	const blockWidth = 6;
	const blockHeight = 22;
	const width = 1400;

	// Group messages by chatname, sorted by first message time
	const chatGroups = $derived.by(() => {
		const groups = d3.group(data, (d: Message) => d.chatname);
		return [...groups.entries()].sort((a, b) => {
			const aFirst = d3.min(a[1], (d: Message) => new Date(d.t).getTime()) ?? 0;
			const bFirst = d3.min(b[1], (d: Message) => new Date(d.t).getTime()) ?? 0;
			return aFirst - bFirst;
		});
	});

	const chatNames = $derived(chatGroups.map(([name]) => name));

	// Dimensions
	const innerWidth = width - margin.left - margin.right;
	const totalHeight = $derived(margin.top + chatNames.length * rowHeight + margin.bottom);

	// Extract the day from first message for scale domain
	const dayStart = $derived.by(() => {
		const firstTime = d3.min(data, (d: Message) => new Date(d.t));
		if (!firstTime) return new Date();
		return d3.utcDay.floor(firstTime);
	});

	const dayEnd = $derived(d3.utcDay.offset(dayStart, 1));

	// X scale — full 24-hour range
	const xScale = $derived(d3.scaleTime().domain([dayStart, dayEnd]).range([0, innerWidth]));

	// Tick values every 30 minutes
	const ticks = $derived(d3.utcMinute.every(30)!.range(dayStart, dayEnd));

	const timeFormat = d3.utcFormat('%H:%M');

	// Colors
	function directionColor(direction: string): string {
		if (direction === 'incoming') return '#22c55e';
		if (direction === 'not sent') return '#a3a3a3';
		return '#ef4444';
	}

	function platformColor(platform: string): string {
		switch (platform.toLowerCase()) {
			case 'whatsapp':
				return '#25D366';
			case 'instagram':
				return '#E1306C';
			default:
				return '#6b7280';
		}
	}

	// Compute active period span for gray bars
	function getActiveSpan(messages: Message[]): [Date, Date] | null {
		const times = messages.map((m) => new Date(m.t).getTime());
		const min = d3.min(times);
		const max = d3.max(times);
		if (min == null || max == null) return null;
		return [new Date(min), new Date(max)];
	}
</script>

<svg {width} height={totalHeight} class="timeline-chart">
	<g transform="translate({margin.left}, {margin.top})">
		<!-- Time axis ticks -->
		{#each ticks as tick (tick.getTime())}
			<g transform="translate({xScale(tick)}, 0)">
				<line y1={-5} y2={chatNames.length * rowHeight} stroke="#e5e7eb" stroke-width="0.5" />
				<text
					y={-10}
					text-anchor="end"
					transform="rotate(-45, 0, -10)"
					font-size="11"
					fill="#374151"
				>
					{timeFormat(tick)}
				</text>
			</g>
		{/each}

		<!-- Chat rows -->
		{#each chatGroups as [chatname, messages], i (chatname)}
			{@const y = i * rowHeight + rowHeight / 2}
			{@const platform = messages[0]?.platform ?? 'Unknown'}
			{@const span = getActiveSpan(messages)}
			{@const sorted = [...messages].sort(
				(a, b) => new Date(a.t).getTime() - new Date(b.t).getTime()
			)}

			<!-- Active period gray bar -->
			{#if span}
				<rect
					x={xScale(span[0]) - 4}
					y={y - blockHeight / 2 - 3}
					width={Math.max(xScale(span[1]) - xScale(span[0]) + blockWidth + 8, blockWidth + 8)}
					height={blockHeight + 6}
					rx="4"
					fill="#6b7280"
					opacity="0.25"
				/>
			{/if}

			<!-- Platform icon -->
			<circle cx={-130} cy={y} r="12" fill={platformColor(platform)} opacity="0.9" />
			<text
				x={-130}
				y={y + 1}
				text-anchor="middle"
				dominant-baseline="middle"
				font-size="10"
				fill="white"
				font-weight="bold"
			>
				{platform.charAt(0).toUpperCase()}
			</text>

			<!-- Chat name -->
			<text x={-108} {y} dominant-baseline="middle" font-size="13" font-weight="600" fill="#111827">
				{chatname}
			</text>

			<!-- Message blocks -->
			{#each sorted as msg (msg.t)}
				{@const msgTime = new Date(msg.t)}
				<circle
					cx={xScale(msgTime)}
					cy={y}
					r={8}
					fill={msg.direction === 'not sent' ? 'none' : directionColor(msg.direction)}
					stroke={directionColor(msg.direction)}
					stroke-width={msg.direction === 'not sent' ? 1.5 : 0}
					stroke-dasharray={msg.direction === 'not sent' ? '3 2' : 'none'}
				/>
			{/each}
		{/each}
	</g>
</svg>

<style lang="postcss">
	.timeline-chart {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
