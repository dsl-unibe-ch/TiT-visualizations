<script lang="ts">
	import * as d3 from 'd3';
	import type { Message } from './types.js';
	import {
		HOURS,
		buildHourMatrix,
		cellModes,
		cellValue,
		groupByOptions,
		type CellMode,
		type GroupById
	} from './hourly.js';

	let { data }: { data: Message[] } = $props();

	let groupBy = $state<GroupById>('none');
	let mode = $state<CellMode>('count');
	let width = $state(800);

	const labelWidth = 150;
	const totalWidth = 56;
	const headerHeight = 22;
	const rowHeight = 26;
	const legendHeight = 34;

	const matrix = $derived(buildHourMatrix(data, groupBy));

	const cellWidth = $derived(Math.max(14, (width - labelWidth - totalWidth) / 24));
	const svgWidth = $derived(labelWidth + cellWidth * 24 + totalWidth);
	const gridHeight = $derived(matrix.rows.length * rowHeight);
	const svgHeight = $derived(headerHeight + gridHeight + legendHeight);

	const values = $derived(
		matrix.rows.map((row) => HOURS.map((hour) => cellValue(mode, row, hour, matrix)))
	);
	const maxValue = $derived(d3.max(values.flat()) ?? 0);
	const color = $derived(
		d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxValue > 0 ? maxValue : 1])
	);

	const percent = d3.format('.1%');
	function formatValue(v: number): string {
		return mode === 'count' ? String(v) : percent(v);
	}
	function hourLabel(h: number): string {
		return String(h).padStart(2, '0');
	}
	function truncate(label: string, max = 20): string {
		return label.length > max ? `${label.slice(0, max - 1)}…` : label;
	}

	const legendWidth = 160;
	const legendStops = $derived(
		d3.range(0, 1.0001, 0.1).map((t) => ({ t, c: color(t * maxValue) }))
	);
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<label class="flex items-center gap-2 text-sm">
			<span class="opacity-70">Group by</span>
			<select class="select select-sm" bind:value={groupBy}>
				{#each groupByOptions as option (option.id)}
					<option value={option.id}>{option.label}</option>
				{/each}
			</select>
		</label>
		<div class="join" role="radiogroup" aria-label="Cell value">
			{#each cellModes as m (m.id)}
				<input
					class="btn join-item btn-sm"
					type="radio"
					name="heatmap-mode"
					aria-label={m.label}
					value={m.id}
					bind:group={mode}
				/>
			{/each}
		</div>
	</div>

	<p class="text-xs opacity-60">
		{#if mode === 'count'}
			Number of messages per hour of day, across all days ({matrix.total} messages).
		{:else if mode === 'row'}
			Share of each row's messages sent in each hour — compare when groups are active.
		{:else}
			Share of each hour's messages that belong to each row.
		{/if}
	</p>

	<div class="overflow-x-auto" bind:clientWidth={width}>
		<svg width={svgWidth} height={svgHeight} role="img" aria-label="Time-of-day heatmap">
			{#each HOURS as hour (hour)}
				<text
					x={labelWidth + hour * cellWidth + cellWidth / 2}
					y={headerHeight - 8}
					text-anchor="middle"
					font-size="10"
					fill="var(--color-base-content)"
					opacity="0.7">{hourLabel(hour)}</text
				>
			{/each}
			<text
				x={labelWidth + cellWidth * 24 + totalWidth - 4}
				y={headerHeight - 8}
				text-anchor="end"
				font-size="10"
				fill="var(--color-base-content)"
				opacity="0.7">total</text
			>

			{#each matrix.rows as row, i (row.key)}
				{@const y = headerHeight + i * rowHeight}
				<text
					x={labelWidth - 8}
					y={y + rowHeight / 2 + 4}
					text-anchor="end"
					font-size="11"
					fill="var(--color-base-content)"><title>{row.key}</title>{truncate(row.key)}</text
				>
				{#each HOURS as hour (hour)}
					{@const v = values[i][hour]}
					<rect
						x={labelWidth + hour * cellWidth + 1}
						y={y + 1}
						width={cellWidth - 2}
						height={rowHeight - 2}
						rx="2"
						fill={row.counts[hour] ? color(v) : 'var(--color-base-300)'}
						opacity={row.counts[hour] ? 1 : 0.4}
						><title
							>{row.key} · {hourLabel(hour)}:00–{hourLabel(hour)}:59
							{row.counts[hour]} messages ({percent(cellValue('row', row, hour, matrix))} of row, {percent(
								cellValue('hour', row, hour, matrix)
							)} of hour)</title
						></rect
					>
				{/each}
				<text
					x={labelWidth + cellWidth * 24 + totalWidth - 4}
					y={y + rowHeight / 2 + 4}
					text-anchor="end"
					font-size="11"
					fill="var(--color-base-content)"
					opacity="0.8">{row.total}</text
				>
			{/each}

			<g transform="translate({labelWidth}, {headerHeight + gridHeight + 12})">
				<defs>
					<linearGradient id="heatmap-legend-gradient">
						{#each legendStops as stop (stop.t)}
							<stop offset="{stop.t * 100}%" stop-color={stop.c} />
						{/each}
					</linearGradient>
				</defs>
				<text x="0" y="10" font-size="10" fill="var(--color-base-content)" opacity="0.7"
					>{formatValue(0)}</text
				>
				<rect x="28" y="1" width={legendWidth} height="10" fill="url(#heatmap-legend-gradient)" />
				<text
					x={28 + legendWidth + 6}
					y="10"
					font-size="10"
					fill="var(--color-base-content)"
					opacity="0.7">{formatValue(maxValue)}</text
				>
			</g>
		</svg>
	</div>
</div>
