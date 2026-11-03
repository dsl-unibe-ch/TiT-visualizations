<script lang="ts">
	import * as d3 from 'd3';
	import type { Message } from './types.js';
	import { computeTransitions } from './analysis/switching.js';

	let { data, gap = $bindable(10) }: { data: Message[]; gap: number } = $props();

	let mode = $state<'count' | 'row'>('count');
	let width = $state(800);

	const labelWidth = 150;
	const headerHeight = 110;
	const totalWidth = 50;

	const result = $derived(computeTransitions(data, Math.max(0, gap || 0)));
	const n = $derived(result.chats.length);
	const cellSize = $derived(
		Math.max(24, Math.min(56, (width - labelWidth - totalWidth) / Math.max(n, 1)))
	);
	const rowTotals = $derived(result.matrix.map((row) => d3.sum(row)));

	function value(from: number, to: number): number {
		const count = result.matrix[from][to];
		if (mode === 'count') return count;
		return rowTotals[from] ? count / rowTotals[from] : 0;
	}

	// Scale on switches only (off-diagonal), so staying in a chat doesn't wash out the colors.
	const maxOffDiagonal = $derived(
		d3.max(
			result.chats.flatMap((_, i) => result.chats.map((_, j) => (i === j ? 0 : value(i, j))))
		) ?? 0
	);
	const color = $derived(
		d3
			.scaleSequential(d3.interpolateBlues)
			.domain([0, maxOffDiagonal > 0 ? maxOffDiagonal : 1])
			.clamp(true)
	);

	const percent = d3.format('.0%');
	function format(v: number): string {
		return mode === 'count' ? String(v) : percent(v);
	}
	function truncate(label: string, max = 20): string {
		return label.length > max ? `${label.slice(0, max - 1)}…` : label;
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<label class="flex items-center gap-2 text-sm">
			<span class="opacity-70">Burst gap (min)</span>
			<input class="input w-20 input-sm" type="number" min="0" step="1" bind:value={gap} />
		</label>
		<div class="join" role="radiogroup" aria-label="Cell value">
			<input
				class="btn join-item btn-sm"
				type="radio"
				name="switching-mode"
				aria-label="Count"
				value="count"
				bind:group={mode}
			/>
			<input
				class="btn join-item btn-sm"
				type="radio"
				name="switching-mode"
				aria-label="% of row"
				value="row"
				bind:group={mode}
			/>
		</div>
	</div>

	<p class="text-xs opacity-60">
		Which chat follows which: consecutive messages (any chat) at most {gap} min apart. Rows = previous
		chat, columns = next chat; the diagonal (staying in the same chat) is muted.
		{result.switches} switches, {result.stays} stays — switch rate {percent(result.switchRate)}.
	</p>

	{#if n === 0}
		<div role="status" class="alert alert-soft alert-info">
			<span>No messages for the current filters.</span>
		</div>
	{:else}
		<div class="overflow-x-auto" bind:clientWidth={width}>
			<svg
				width={labelWidth + n * cellSize + totalWidth}
				height={headerHeight + n * cellSize + 8}
				role="img"
				aria-label="Chat switching matrix"
			>
				{#each result.chats as chat, j (chat)}
					{@const x = labelWidth + j * cellSize + cellSize / 2}
					<text
						transform="translate({x}, {headerHeight - 8}) rotate(-45)"
						font-size="11"
						fill="var(--color-base-content)"><title>{chat}</title>{truncate(chat, 16)}</text
					>
				{/each}
				<text
					x={labelWidth + n * cellSize + totalWidth - 4}
					y={headerHeight - 8}
					text-anchor="end"
					font-size="10"
					fill="var(--color-base-content)"
					opacity="0.7">total</text
				>

				{#each result.chats as from, i (from)}
					{@const y = headerHeight + i * cellSize}
					<text
						x={labelWidth - 8}
						y={y + cellSize / 2 + 4}
						text-anchor="end"
						font-size="11"
						fill="var(--color-base-content)"><title>{from}</title>{truncate(from)}</text
					>
					{#each result.chats as to, j (to)}
						{@const v = value(i, j)}
						{@const count = result.matrix[i][j]}
						{@const diagonal = i === j}
						<rect
							x={labelWidth + j * cellSize + 1}
							y={y + 1}
							width={cellSize - 2}
							height={cellSize - 2}
							rx="2"
							fill={count === 0 || diagonal ? 'var(--color-base-300)' : color(v)}
							opacity={count === 0 ? 0.4 : 1}
							><title
								>{from} → {to}: {count} ({percent(rowTotals[i] ? count / rowTotals[i] : 0)} of row){diagonal
									? ' — stays in chat'
									: ''}</title
							></rect
						>
						{#if count > 0}
							<text
								x={labelWidth + j * cellSize + cellSize / 2}
								y={y + cellSize / 2 + 4}
								text-anchor="middle"
								font-size="10"
								pointer-events="none"
								fill={!diagonal && v > maxOffDiagonal * 0.6 ? 'white' : 'var(--color-base-content)'}
								opacity={diagonal ? 0.6 : 1}>{format(v)}</text
							>
						{/if}
					{/each}
					<text
						x={labelWidth + n * cellSize + totalWidth - 4}
						y={y + cellSize / 2 + 4}
						text-anchor="end"
						font-size="11"
						fill="var(--color-base-content)"
						opacity="0.8">{rowTotals[i]}</text
					>
				{/each}
			</svg>
		</div>
	{/if}
</div>
