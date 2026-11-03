<script lang="ts">
	import * as d3 from 'd3';
	import type { Message } from './types.js';
	import { computeBursts } from './analysis/bursts.js';
	import { formatMinutes } from './analysis/time.js';

	let { data, gap = $bindable(10) }: { data: Message[]; gap: number } = $props();

	let width = $state(800);

	const margin = { top: 12, right: 16, bottom: 36, left: 44 };
	const scatterHeight = 300;
	const histHeight = 160;

	const bursts = $derived(computeBursts(data, Math.max(0, gap || 0)));

	const stats = $derived({
		count: bursts.length,
		medianDuration: d3.median(bursts, (b) => b.durationMin) ?? 0,
		medianMessages: d3.median(bursts, (b) => b.messages.length) ?? 0,
		multiChatShare: bursts.length
			? bursts.filter((b) => b.chats.length > 1).length / bursts.length
			: 0
	});

	const innerWidth = $derived(Math.max(200, width - margin.left - margin.right));
	const innerHeight = scatterHeight - margin.top - margin.bottom;
	const xScale = $derived(
		d3
			.scaleLinear()
			.domain([0, Math.max(1, d3.max(bursts, (b) => b.durationMin) ?? 1)])
			.range([0, innerWidth])
			.nice()
	);
	const yScale = $derived(
		d3
			.scaleLinear()
			.domain([0, Math.max(1, d3.max(bursts, (b) => b.messages.length) ?? 1)])
			.range([innerHeight, 0])
			.nice()
	);
	const maxChats = $derived(Math.max(1, d3.max(bursts, (b) => b.chats.length) ?? 1));
	const chatColor = $derived(d3.scaleSequential(d3.interpolateViridis).domain([maxChats + 0.5, 1]));

	const histogram = $derived(
		d3.range(1, maxChats + 1).map((chats) => ({
			chats,
			count: bursts.filter((b) => b.chats.length === chats).length
		}))
	);
	const histInner = histHeight - margin.top - margin.bottom;
	const histX = $derived(
		d3
			.scaleBand<number>()
			.domain(histogram.map((h) => h.chats))
			.range([0, Math.min(innerWidth, histogram.length * 70)])
			.padding(0.25)
	);
	const histY = $derived(
		d3
			.scaleLinear()
			.domain([0, Math.max(1, d3.max(histogram, (h) => h.count) ?? 1)])
			.range([histInner, 0])
			.nice()
	);

	const percent = d3.format('.0%');
	function timeOf(m: Message): string {
		return m.t.slice(0, 16).replace('T', ' ');
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<label class="flex items-center gap-2 text-sm">
			<span class="opacity-70">Burst gap (min)</span>
			<input class="input w-20 input-sm" type="number" min="0" step="1" bind:value={gap} />
		</label>
	</div>

	<p class="text-xs opacity-60">
		A burst is a run of messages (any chat) where no gap is longer than {gap} min.
	</p>

	<div class="stats w-full stats-vertical bg-base-100 shadow-sm sm:stats-horizontal">
		<div class="stat">
			<div class="stat-title">Bursts</div>
			<div class="stat-value text-2xl">{stats.count}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Median duration</div>
			<div class="stat-value text-2xl">{formatMinutes(stats.medianDuration)}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Median messages</div>
			<div class="stat-value text-2xl">{stats.medianMessages}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Span &gt; 1 chat</div>
			<div class="stat-value text-2xl">{percent(stats.multiChatShare)}</div>
		</div>
	</div>

	{#if bursts.length > 0}
		<div bind:clientWidth={width}>
			<h3 class="mb-1 text-sm font-semibold">Duration vs. messages per burst</h3>
			<svg {width} height={scatterHeight} role="img" aria-label="Burst scatter plot">
				<g transform="translate({margin.left}, {margin.top})">
					{#each xScale.ticks(8) as tick (tick)}
						<line
							x1={xScale(tick)}
							x2={xScale(tick)}
							y1="0"
							y2={innerHeight}
							stroke="var(--color-base-content)"
							stroke-opacity="0.1"
						/>
						<text
							x={xScale(tick)}
							y={innerHeight + 16}
							text-anchor="middle"
							font-size="10"
							fill="var(--color-base-content)"
							opacity="0.7">{tick}</text
						>
					{/each}
					{#each yScale.ticks(6) as tick (tick)}
						<line
							x1="0"
							x2={innerWidth}
							y1={yScale(tick)}
							y2={yScale(tick)}
							stroke="var(--color-base-content)"
							stroke-opacity="0.1"
						/>
						<text
							x="-6"
							y={yScale(tick) + 3}
							text-anchor="end"
							font-size="10"
							fill="var(--color-base-content)"
							opacity="0.7">{tick}</text
						>
					{/each}
					<text
						x={innerWidth}
						y={innerHeight + 30}
						text-anchor="end"
						font-size="10"
						fill="var(--color-base-content)"
						opacity="0.7">duration (minutes)</text
					>
					<text
						transform="translate(-34, 0) rotate(-90)"
						text-anchor="end"
						font-size="10"
						fill="var(--color-base-content)"
						opacity="0.7">messages</text
					>
					{#each bursts as b (b.start.recording_id + ':' + b.start.message_id)}
						<circle
							cx={xScale(b.durationMin)}
							cy={yScale(b.messages.length)}
							r="5"
							fill={chatColor(b.chats.length)}
							fill-opacity="0.75"
							stroke="var(--color-base-100)"
							><title
								>{timeOf(b.start)} – {b.end.t.slice(11, 16)} · {formatMinutes(b.durationMin)}
								{b.messages.length} messages, {b.switches} chat switches
								{b.chats.join(', ')}</title
							></circle
						>
					{/each}
				</g>
			</svg>
			<div class="flex flex-wrap items-center gap-3 text-xs opacity-80">
				<span>Chats in burst:</span>
				{#each histogram as h (h.chats)}
					<span class="flex items-center gap-1">
						<span class="inline-block size-3 rounded-full" style:background={chatColor(h.chats)}
						></span>
						{h.chats}
					</span>
				{/each}
			</div>
		</div>

		<div>
			<h3 class="mb-1 text-sm font-semibold">Number of chats per burst</h3>
			<svg {width} height={histHeight} role="img" aria-label="Chats per burst histogram">
				<g transform="translate({margin.left}, {margin.top})">
					{#each histY.ticks(4) as tick (tick)}
						<line
							x1="0"
							x2={histX.range()[1]}
							y1={histY(tick)}
							y2={histY(tick)}
							stroke="var(--color-base-content)"
							stroke-opacity="0.1"
						/>
						<text
							x="-6"
							y={histY(tick) + 3}
							text-anchor="end"
							font-size="10"
							fill="var(--color-base-content)"
							opacity="0.7">{tick}</text
						>
					{/each}
					{#each histogram as h (h.chats)}
						<rect
							x={histX(h.chats)}
							y={histY(h.count)}
							width={histX.bandwidth()}
							height={histInner - histY(h.count)}
							fill={chatColor(h.chats)}
							><title>{h.count} bursts with {h.chats} chat{h.chats === 1 ? '' : 's'}</title></rect
						>
						<text
							x={(histX(h.chats) ?? 0) + histX.bandwidth() / 2}
							y={histInner + 16}
							text-anchor="middle"
							font-size="10"
							fill="var(--color-base-content)"
							opacity="0.7">{h.chats}</text
						>
					{/each}
				</g>
			</svg>
		</div>
	{/if}
</div>
