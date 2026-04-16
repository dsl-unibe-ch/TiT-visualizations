<script lang="ts">
	import * as d3 from 'd3';
	import type { Message } from '$lib/types'; // used in chatGroups type

	let {
		chatGroups,
		dayStart,
		dayEnd,
		innerWidth,
		zoomLevel = $bindable(1),
		panOffset = $bindable(0),
		minZoom,
		maxZoom
	}: {
		chatGroups: [string, Message[]][];
		dayStart: Date;
		dayEnd: Date;
		innerWidth: number;
		zoomLevel: number;
		panOffset: number;
		minZoom: number;
		maxZoom: number;
	} = $props();

	const chatNames = $derived(chatGroups.map(([name]) => name));

	const height = 50;

	// Overview x scale (always full 24h)
	const overviewXScale = $derived(d3.scaleTime().domain([dayStart, dayEnd]).range([0, innerWidth]));

	// Compress all chat rows into the small height
	const yScale = $derived.by(() => {
		return d3
			.scalePoint()
			.domain(chatNames)
			.range([6, height - 6]);
	});

	// Brush selection in overview pixel coords
	const zoomedWidth = $derived(innerWidth * zoomLevel);
	const brushSelection = $derived.by((): [number, number] => {
		const x0 = (panOffset / zoomedWidth) * innerWidth;
		const x1 = ((panOffset + innerWidth) / zoomedWidth) * innerWidth;
		return [x0, x1];
	});

	// D3 Brush
	let brushGroupEl: SVGGElement;
	let isBrushing = false;

	const brush = $derived(
		d3
			.brushX<unknown>()
			.extent([
				[0, 0],
				[innerWidth, height]
			])
			.on('brush', (event: d3.D3BrushEvent<unknown>) => {
				if (!event.sourceEvent) return;
				const sel = event.selection as [number, number] | null;
				if (!sel) return;

				isBrushing = true;
				const brushWidth = sel[1] - sel[0];
				const newZoom = innerWidth / brushWidth;
				const newPanOffset = (sel[0] / innerWidth) * innerWidth * newZoom;

				zoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoom));
				panOffset = Math.max(0, Math.min(newPanOffset, innerWidth * zoomLevel - innerWidth));
				isBrushing = false;
			})
	);

	$effect(() => {
		if (!brushGroupEl) return;
		const g = d3.select(brushGroupEl);

		g.call(brush);

		// Click-to-recenter
		g.select('.overlay')
			.datum({ type: 'selection' })
			.on('mousedown touchstart', function beforebrushstarted(event: MouseEvent | TouchEvent) {
				const [x0, x1] = brushSelection;
				const bw = x1 - x0;
				const half = bw / 2;

				let cx: number;
				if (event instanceof MouseEvent) {
					const rect = brushGroupEl.getBoundingClientRect();
					cx = event.clientX - rect.left;
				} else {
					const rect = brushGroupEl.getBoundingClientRect();
					cx = event.touches[0].clientX - rect.left;
				}

				const newX0 = Math.max(0, Math.min(cx - half, innerWidth - bw));
				const newX1 = newX0 + bw;

				const newZoom = innerWidth / (newX1 - newX0);
				zoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoom));
				const newPanOffset = (newX0 / innerWidth) * innerWidth * zoomLevel;
				panOffset = Math.max(0, Math.min(newPanOffset, innerWidth * zoomLevel - innerWidth));

				d3.select(brushGroupEl).call(brush.move, [newX0, newX1]);
			});

		// Style
		g.select('.selection')
			.attr('fill', '#3b82f6')
			.attr('fill-opacity', 0.25)
			.attr('stroke', '#3b82f6')
			.attr('stroke-width', 1);
	});

	// Sync brush when zoom/pan changes externally
	$effect(() => {
		if (!brushGroupEl || isBrushing) return;
		const sel = brushSelection;
		d3.select(brushGroupEl).call(brush.move, sel);
	});

	function directionColor(direction: string): string {
		if (direction === 'incoming') return '#22c55e';
		if (direction === 'not sent') return '#a3a3a3';
		return '#ef4444';
	}
</script>

<g>
	<!-- Background -->
	<rect x={0} y={0} width={innerWidth} {height} rx="4" fill="#f9fafb" stroke="#e5e7eb" />

	<!-- Time ticks -->
	{#each d3.utcHour.every(2)?.range(dayStart, dayEnd) ?? [] as tick (tick.getTime())}
		<line
			x1={overviewXScale(tick)}
			x2={overviewXScale(tick)}
			y1={0}
			y2={height}
			stroke="#e5e7eb"
			stroke-width="0.5"
		/>
	{/each}

	<!-- Mini message dots -->
	{#each chatGroups as [chatname, messages] (chatname)}
		{#each messages as msg (msg.t)}
			<circle
				cx={overviewXScale(new Date(msg.t))}
				cy={yScale(chatname) ?? height / 2}
				r={2}
				fill={msg.direction === 'not sent' ? 'none' : directionColor(msg.direction)}
				stroke={msg.direction === 'not sent' ? directionColor(msg.direction) : 'none'}
				stroke-width={msg.direction === 'not sent' ? 0.8 : 0}
				opacity="0.7"
			/>
		{/each}
	{/each}

	<!-- D3 brush layer -->
	<g bind:this={brushGroupEl}></g>
</g>
