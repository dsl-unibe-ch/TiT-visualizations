<script lang="ts">
	import * as d3 from 'd3';
	import type { Message } from './types.js';
	import { groupByOptions, type GroupById } from './hourly.js';
	import { computeReplies } from './analysis/responses.js';
	import { formatMinutes } from './analysis/time.js';

	let { data }: { data: Message[] } = $props();

	// Grouping applies to her reply message, so direction is always "outgoing" and is omitted.
	const options = groupByOptions.filter((o) => o.id !== 'direction');

	let groupBy = $state<GroupById>('none');
	let maxGap = $state(8);
	let width = $state(800);

	const labelWidth = 150;
	const statsWidth = 130;
	const rowHeight = 34;
	const axisHeight = 28;

	const result = $derived(computeReplies(data, Math.max(0, maxGap || 0)));
	const option = $derived(options.find((o) => o.id === groupBy) ?? options[0]);

	const rows = $derived(
		[...d3.group(result.replies, (r) => option.key(r.reply))]
			.map(([key, replies]) => ({
				key,
				replies,
				median: d3.median(replies, (r) => r.minutes) ?? 0
			}))
			.sort((a, b) => b.replies.length - a.replies.length || a.key.localeCompare(b.key))
	);

	const plotWidth = $derived(Math.max(200, width - labelWidth - statsWidth));
	const xMax = $derived(Math.max(maxGap || 0, d3.max(result.replies, (r) => r.minutes) ?? 0, 1));
	const xScale = $derived(d3.scaleLinear().domain([0, xMax]).range([0, plotWidth]).nice());
	const svgHeight = $derived(rows.length * rowHeight + axisHeight);

	// Deterministic vertical jitter so dots don't overlap exactly.
	function jitter(i: number): number {
		return (((i * 37) % 11) / 10 - 0.5) * (rowHeight - 14);
	}
	function timeOf(m: Message): string {
		return m.t.slice(0, 16).replace('T', ' ');
	}
	function truncate(label: string, max = 20): string {
		return label.length > max ? `${label.slice(0, max - 1)}…` : label;
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<label class="flex items-center gap-2 text-sm">
			<span class="opacity-70">Group by</span>
			<select class="select select-sm" bind:value={groupBy}>
				{#each options as o (o.id)}
					<option value={o.id}>{o.label}</option>
				{/each}
			</select>
		</label>
		<label class="flex items-center gap-2 text-sm">
			<span class="opacity-70">Max reply gap (min)</span>
			<input class="input w-20 input-sm" type="number" min="0" step="1" bind:value={maxGap} />
		</label>
	</div>

	<p class="text-xs opacity-60">
		Her reply time: from the first unanswered incoming message in a chat to her next outgoing
		message in that chat. Grouped by her reply message. {result.replies.length} replies, median
		{result.median === undefined ? '–' : formatMinutes(result.median)};
		{result.excluded} answered later than {maxGap} min are not counted.
	</p>

	{#if rows.length === 0}
		<div role="status" class="alert alert-soft alert-info">
			<span>No replies within {maxGap} min for the current filters.</span>
		</div>
	{:else}
		<div class="overflow-x-auto" bind:clientWidth={width}>
			<svg
				width={labelWidth + plotWidth + statsWidth}
				height={svgHeight}
				role="img"
				aria-label="Reply time strip plot"
			>
				{#each xScale.ticks(8) as tick (tick)}
					<line
						x1={labelWidth + xScale(tick)}
						x2={labelWidth + xScale(tick)}
						y1="0"
						y2={rows.length * rowHeight}
						stroke="var(--color-base-content)"
						stroke-opacity="0.1"
					/>
					<text
						x={labelWidth + xScale(tick)}
						y={rows.length * rowHeight + 16}
						text-anchor="middle"
						font-size="10"
						fill="var(--color-base-content)"
						opacity="0.7">{tick}</text
					>
				{/each}
				<text
					x={labelWidth + plotWidth}
					y={rows.length * rowHeight + 27}
					text-anchor="end"
					font-size="10"
					fill="var(--color-base-content)"
					opacity="0.7">minutes</text
				>

				{#each rows as row, i (row.key)}
					{@const cy = i * rowHeight + rowHeight / 2}
					<text
						x={labelWidth - 8}
						y={cy + 4}
						text-anchor="end"
						font-size="11"
						fill="var(--color-base-content)"><title>{row.key}</title>{truncate(row.key)}</text
					>
					<line
						x1={labelWidth}
						x2={labelWidth + plotWidth}
						y1={cy}
						y2={cy}
						stroke="var(--color-base-content)"
						stroke-opacity="0.08"
					/>
					{#each row.replies as r, j (r.reply.recording_id + ':' + r.reply.message_id)}
						<circle
							cx={labelWidth + xScale(r.minutes)}
							cy={cy + jitter(j)}
							r="4"
							fill="var(--color-primary)"
							fill-opacity="0.6"
							><title
								>{r.chat} · replied after {formatMinutes(r.minutes)}
								{timeOf(r.incoming)} ← {r.incoming.content}
								{timeOf(r.reply)} → {r.reply.content}</title
							></circle
						>
					{/each}
					<line
						x1={labelWidth + xScale(row.median)}
						x2={labelWidth + xScale(row.median)}
						y1={cy - rowHeight / 2 + 3}
						y2={cy + rowHeight / 2 - 3}
						stroke="var(--color-secondary)"
						stroke-width="2.5"><title>median {formatMinutes(row.median)}</title></line
					>
					<text
						x={labelWidth + plotWidth + 10}
						y={cy + 4}
						font-size="11"
						fill="var(--color-base-content)"
						opacity="0.8">n={row.replies.length} · {formatMinutes(row.median)}</text
					>
				{/each}
			</svg>
		</div>
		<p class="text-xs opacity-60">
			Dots = individual replies; <span class="text-secondary">vertical bar</span> = median.
		</p>
	{/if}
</div>
