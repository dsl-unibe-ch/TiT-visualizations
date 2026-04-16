<script lang="ts">
	import * as d3 from 'd3';
	import type { Message } from '$lib/types';
	import TimelineMinimap from '$lib/TimelineMinimap.svelte';

	let { data }: { data: Message[] } = $props();

	// Layout constants
	const margin = { top: 70, right: 40, bottom: 20, left: 160 };
	const rowHeight = 50;
	const width = 1400;

	// Overview minimap constants
	const overviewHeight = 50;
	const overviewMarginTop = 16;

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
	const mainChartHeight = $derived(margin.top + chatNames.length * rowHeight + margin.bottom);
	const totalHeight = $derived(mainChartHeight + overviewMarginTop + overviewHeight + 10);

	// Extract the day from first message for scale domain
	// Time domain: 1 hour before first message to 1 hour after last message
	const domainStart = $derived.by(() => {
		const firstTime = d3.min(data, (d: Message) => new Date(d.t));
		if (!firstTime) return new Date();
		return d3.utcHour.offset(firstTime, -1);
	});

	const domainEnd = $derived.by(() => {
		const lastTime = d3.max(data, (d: Message) => new Date(d.t));
		if (!lastTime) return d3.utcHour.offset(domainStart, 2);
		return d3.utcHour.offset(lastTime, 1);
	});

	// Zoom state
	let zoomLevel = $state(1);
	let panOffset = $state(0);

	const minZoom = 1;
	const maxZoom = 48;

	// Zoomed x scale — wider virtual width that gets clipped
	const zoomedWidth = $derived(innerWidth * zoomLevel);
	const xScaleFull = $derived(
		d3.scaleTime().domain([domainStart, domainEnd]).range([0, zoomedWidth])
	);

	// The visible x scale maps the panned/zoomed portion back to the viewport
	const xScale = $derived.by(() => {
		const visibleStart = xScaleFull.invert(panOffset);
		const visibleEnd = xScaleFull.invert(panOffset + innerWidth);
		return d3.scaleTime().domain([visibleStart, visibleEnd]).range([0, innerWidth]);
	});

	// Dynamic tick interval based on zoom level
	const ticks = $derived.by(() => {
		const [domainStart, domainEnd] = xScale.domain();
		const spanMinutes = (domainEnd.getTime() - domainStart.getTime()) / 60000;

		let interval: d3.TimeInterval;
		if (spanMinutes <= 30) interval = d3.utcMinute.every(1)!;
		else if (spanMinutes <= 120) interval = d3.utcMinute.every(5)!;
		else if (spanMinutes <= 360) interval = d3.utcMinute.every(15)!;
		else interval = d3.utcMinute.every(30)!;

		return interval.range(domainStart, domainEnd);
	});

	const timeFormat = d3.utcFormat('%H:%M');

	// Handle wheel zoom
	let svgEl: SVGSVGElement;

	function handleWheel(e: WheelEvent) {
		e.preventDefault();

		const zoomFactor = 1.15;
		const direction = e.deltaY < 0 ? 1 : -1;
		const newZoom = Math.min(
			maxZoom,
			Math.max(minZoom, zoomLevel * (direction > 0 ? zoomFactor : 1 / zoomFactor))
		);

		const svgRect = svgEl.getBoundingClientRect();
		const mouseX = e.clientX - svgRect.left - margin.left;
		const mouseRatio = (panOffset + mouseX) / zoomedWidth;

		const newZoomedWidth = innerWidth * newZoom;
		const newPanOffset = mouseRatio * newZoomedWidth - mouseX;

		zoomLevel = newZoom;
		panOffset = Math.max(0, Math.min(newPanOffset, newZoomedWidth - innerWidth));
	}

	// Handle panning via middle-click drag or shift+drag
	let isPanning = $state(false);
	let panStartX = $state(0);
	let panStartOffset = $state(0);

	function handlePointerDown(e: PointerEvent) {
		if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
			e.preventDefault();
			isPanning = true;
			panStartX = e.clientX;
			panStartOffset = panOffset;
			(e.target as Element).setPointerCapture(e.pointerId);
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isPanning) return;
		const dx = e.clientX - panStartX;
		panOffset = Math.max(0, Math.min(panStartOffset - dx, zoomedWidth - innerWidth));
	}

	function handlePointerUp() {
		isPanning = false;
	}

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

	// Attention line: all messages sorted chronologically with their row y-position
	const chatRowIndex = $derived(new Map(chatNames.map((name, i) => [name, i])));

	const attentionPath = $derived.by(() => {
		const sorted = [...data].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
		return sorted.map((msg) => ({
			x: xScale(new Date(msg.t)),
			y: (chatRowIndex.get(msg.chatname) ?? 0) * rowHeight + rowHeight / 2
		}));
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
	{width}
	height={totalHeight}
	class="timeline-chart"
	bind:this={svgEl}
	onwheel={handleWheel}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
>
	<!-- Fixed left labels -->
	<g transform="translate(0, {margin.top})">
		{#each chatGroups as [chatname, messages], i (chatname)}
			{@const y = i * rowHeight + rowHeight / 2}
			{@const platform = messages[0]?.platform ?? 'Unknown'}

			<!-- Platform icon -->
			<circle cx={margin.left - 130} cy={y} r="12" fill={platformColor(platform)} opacity="0.9" />
			<text
				x={margin.left - 130}
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
			<text
				x={margin.left - 108}
				{y}
				dominant-baseline="middle"
				font-size="13"
				font-weight="600"
				fill="#111827"
			>
				{chatname}
			</text>
		{/each}
	</g>

	<!-- Clipped timeline area -->
	<defs>
		<clipPath id="chart-clip">
			<rect x={0} y={-margin.top} width={innerWidth} height={totalHeight} />
		</clipPath>
	</defs>

	<g transform="translate({margin.left}, {margin.top})" clip-path="url(#chart-clip)">
		<!-- Time axis ticks -->
		{#each ticks as tick (tick.getTime())}
			{@const tx = xScale(tick)}
			<g transform="translate({tx}, 0)">
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

		<!-- Attention line -->
		{#each attentionPath as point, i}
			{#if i > 0}
				<line
					x1={attentionPath[i - 1].x}
					y1={attentionPath[i - 1].y}
					x2={point.x}
					y2={point.y}
					stroke="#9ca3af"
					stroke-width="1"
					stroke-dasharray="4 3"
					fill="none"
				/>
			{/if}
		{/each}

		<!-- Chat rows -->
		{#each chatGroups as [chatname, messages], i (chatname)}
			{@const y = i * rowHeight + rowHeight / 2}
			{@const sorted = [...messages].sort(
				(a, b) => new Date(a.t).getTime() - new Date(b.t).getTime()
			)}

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

	<!-- Overview minimap -->
	<g transform="translate({margin.left}, {mainChartHeight + overviewMarginTop})">
		<TimelineMinimap
			{chatGroups}
			dayStart={domainStart}
			dayEnd={domainEnd}
			{innerWidth}
			bind:zoomLevel
			bind:panOffset
			{minZoom}
			{maxZoom}
		/>
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
