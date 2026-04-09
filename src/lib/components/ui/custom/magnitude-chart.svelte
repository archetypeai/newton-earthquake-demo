<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
	import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
	import MaximizeIcon from '@lucide/svelte/icons/maximize';
	import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
	import { LAND_PATHS } from '$lib/data/world-land.js';

	let { earthquakes = [], onexpand, class: className, ...restProps } = $props();

	let view = $state('chart');

	let sorted = $derived(
		[...earthquakes]
			.sort((a, b) => a.time - b.time)
			.map((eq) => ({ ...eq, date: new Date(eq.time) }))
	);

	// Shared color/size helpers
	function dotColor(mag) {
		if (mag >= 5) return 'var(--color-atai-critical)';
		if (mag >= 4) return 'var(--color-atai-warning)';
		if (mag >= 2.5) return 'var(--color-atai-neutral)';
		return 'var(--color-muted-foreground)';
	}

	function dotRadius(mag) {
		return Math.max(2, Math.min(8, mag * 1.5));
	}

	// --- Chart view (dynamic sizing to avoid circle distortion) ---
	let chartContainer = $state(null);
	let CW = $state(600);
	let CH = $state(300);
	const CPAD = { top: 10, right: 10, bottom: 25, left: 35 };
	let cPlotW = $derived(CW - CPAD.left - CPAD.right);
	let cPlotH = $derived(CH - CPAD.top - CPAD.bottom);

	$effect(() => {
		if (!chartContainer) return;
		const ro = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect;
			if (width > 0 && height > 0) {
				CW = width;
				CH = height;
			}
		});
		ro.observe(chartContainer);
		return () => ro.disconnect();
	});

	let xMin = $derived(sorted.length ? sorted[0].time : Date.now() - 86400000);
	let xMax = $derived(sorted.length ? sorted[sorted.length - 1].time : Date.now());
	let yMax = $derived(Math.max(6, ...sorted.map((e) => e.mag || 0)) + 0.5);

	function xScale(t) {
		return CPAD.left + ((t - xMin) / (xMax - xMin || 1)) * cPlotW;
	}
	function yScale(m) {
		return CPAD.top + cPlotH - (m / yMax) * cPlotH;
	}

	let yTicks = $derived(
		Array.from({ length: Math.ceil(yMax) + 1 }, (_, i) => i).filter((v) => v <= yMax)
	);

	function formatTime(ts) {
		return new Date(ts).toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// --- Map view (equirectangular, matches pre-projected land paths at 580x250) ---
	const MW = 580;
	const MH = 250;

	function lonToX(lon) {
		return ((lon + 180) / 360) * MW;
	}
	function latToY(lat) {
		return ((90 - lat) / 180) * MH;
	}

	// Pan & zoom state
	let vbX = $state(0);
	let vbY = $state(0);
	let vbW = $state(MW);
	let vbH = $state(MH);
	let dragging = $state(false);
	let dragStart = $state({ x: 0, y: 0, vbX: 0, vbY: 0 });
	let mapSvg = $state(null);

	function resetView() {
		vbX = 0;
		vbY = 0;
		vbW = MW;
		vbH = MH;
	}

	function zoomBy(factor, cx, cy) {
		// cx, cy in viewBox coords — zoom centered on that point
		const newW = Math.max(40, Math.min(MW, vbW * factor));
		const newH = Math.max(17, Math.min(MH, vbH * factor));
		const scaleX = newW / vbW;
		const scaleY = newH / vbH;
		vbX = cx - (cx - vbX) * scaleX;
		vbY = cy - (cy - vbY) * scaleY;
		vbW = newW;
		vbH = newH;
		clampView();
	}

	function clampView() {
		vbX = Math.max(-MW * 0.2, Math.min(MW - vbW + MW * 0.2, vbX));
		vbY = Math.max(-MH * 0.2, Math.min(MH - vbH + MH * 0.2, vbY));
	}

	function svgPoint(e) {
		if (!mapSvg) return { x: vbX + vbW / 2, y: vbY + vbH / 2 };
		const rect = mapSvg.getBoundingClientRect();
		return {
			x: vbX + ((e.clientX - rect.left) / rect.width) * vbW,
			y: vbY + ((e.clientY - rect.top) / rect.height) * vbH
		};
	}

	function handleWheel(e) {
		e.preventDefault();
		const pt = svgPoint(e);
		const factor = e.deltaY > 0 ? 1.15 : 0.87;
		zoomBy(factor, pt.x, pt.y);
	}

	function handlePointerDown(e) {
		if (e.button !== 0) return;
		dragging = true;
		dragDist = 0;
		dragStart = { x: e.clientX, y: e.clientY, vbX, vbY };
		e.currentTarget.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e) {
		if (!dragging || !mapSvg) return;
		dragDist += Math.abs(e.movementX) + Math.abs(e.movementY);
		const rect = mapSvg.getBoundingClientRect();
		const dx = ((e.clientX - dragStart.x) / rect.width) * vbW;
		const dy = ((e.clientY - dragStart.y) / rect.height) * vbH;
		vbX = dragStart.vbX - dx;
		vbY = dragStart.vbY - dy;
		clampView();
	}

	let dragDist = $state(0);

	function handlePointerUp(e) {
		dragging = false;
		// If it was a click (not a drag), check if we hit a dot
		if (dragDist < 5) {
			const target = document.elementFromPoint(e.clientX, e.clientY);
			const url = target?.getAttribute?.('data-url');
			if (url) window.open(url, '_blank', 'noopener');
		}
	}
</script>

<BackgroundCard
	title="Magnitude"
	icon={ActivityIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	<div class="flex items-center gap-1">
		<Button
			variant={view === 'chart' ? 'default' : 'outline'}
			size="sm"
			onclick={() => (view = 'chart')}
		>
			<ActivityIcon class="size-3" aria-hidden="true" />
			Timeline
		</Button>
		<Button
			variant={view === 'map' ? 'default' : 'outline'}
			size="sm"
			onclick={() => (view = 'map')}
		>
			<GlobeIcon class="size-3" aria-hidden="true" />
			Map
		</Button>
		{#if onexpand}
			<div class="ml-auto">
				<Button variant="ghost" size="icon-sm" aria-label="Fullscreen" onclick={onexpand}>
					<Maximize2Icon class="size-3.5" />
				</Button>
			</div>
		{/if}
	</div>

	{#if sorted.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">No data</p>
	{:else if view === 'chart'}
		<div bind:this={chartContainer} class="min-h-0 w-full flex-1">
		<svg viewBox="0 0 {CW} {CH}" width={CW} height={CH}>
			{#each yTicks as tick}
				<line
					x1={CPAD.left}
					y1={yScale(tick)}
					x2={CW - CPAD.right}
					y2={yScale(tick)}
					stroke="var(--color-border)"
					stroke-width="0.5"
				/>
				<text
					x={CPAD.left - 6}
					y={yScale(tick) + 3}
					text-anchor="end"
					fill="var(--color-muted-foreground)"
					font-size="9"
					font-family="var(--font-mono)"
				>
					M{tick}
				</text>
			{/each}

			{#each [xMin, xMin + (xMax - xMin) / 2, xMax] as ts}
				<text
					x={xScale(ts)}
					y={CH - 5}
					text-anchor="middle"
					fill="var(--color-muted-foreground)"
					font-size="9"
					font-family="var(--font-mono)"
				>
					{formatTime(ts)}
				</text>
			{/each}

			{#each sorted as eq}
				{#if eq.url}
					<a href={eq.url} target="_blank" rel="noopener">
						<circle
							cx={xScale(eq.time)}
							cy={yScale(eq.mag || 0)}
							r={dotRadius(eq.mag || 0)}
							fill={dotColor(eq.mag || 0)}
							opacity="0.7"
							class="cursor-pointer hover:opacity-100"
						>
							<title>M{eq.mag?.toFixed(1)} - {eq.place} (click to view on USGS)</title>
						</circle>
					</a>
				{:else}
					<circle
						cx={xScale(eq.time)}
						cy={yScale(eq.mag || 0)}
						r={dotRadius(eq.mag || 0)}
						fill={dotColor(eq.mag || 0)}
						opacity="0.7"
					>
						<title>M{eq.mag?.toFixed(1)} - {eq.place}</title>
					</circle>
				{/if}
			{/each}
		</svg>
		</div>
	{:else}
		<div class="relative min-h-0 flex-1">
			<svg
				bind:this={mapSvg}
				viewBox="{vbX} {vbY} {vbW} {vbH}"
				class="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
				preserveAspectRatio="none"
				onwheel={handleWheel}
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointerleave={handlePointerUp}
			>
				<!-- Ocean background -->
				<rect x={-MW} y={-MH} width={MW * 3} height={MH * 3} fill="var(--color-card)" />

				<!-- Land masses -->
				{#each LAND_PATHS as d}
					<path
						{d}
						fill="var(--color-muted)"
						stroke="var(--color-border)"
						stroke-width={Math.max(0.2, 0.3 * (vbW / MW))}
					/>
				{/each}

				<!-- Earthquake dots -->
				{#each sorted as eq}
					{#if eq.lon != null && eq.lat != null}
						<circle
							cx={lonToX(eq.lon)}
							cy={latToY(eq.lat)}
							r={dotRadius(eq.mag || 0) * (vbW / MW)}
							fill={dotColor(eq.mag || 0)}
							opacity="0.8"
							class={eq.url ? 'cursor-pointer hover:opacity-100' : ''}
							data-url={eq.url || null}
						>
							<title>M{eq.mag?.toFixed(1)} - {eq.place} (depth {eq.depth?.toFixed(1)}km){eq.url ? ' — click to view on USGS' : ''}</title>
						</circle>
					{/if}
				{/each}
			</svg>

			<!-- Zoom controls -->
			<div class="absolute right-2 bottom-2 flex gap-1">
				<Button
					variant="outline"
					size="icon-sm"
					aria-label="Zoom in"
					onclick={() => zoomBy(0.7, vbX + vbW / 2, vbY + vbH / 2)}
				>
					<ZoomInIcon class="size-3.5" />
				</Button>
				<Button
					variant="outline"
					size="icon-sm"
					aria-label="Zoom out"
					onclick={() => zoomBy(1.4, vbX + vbW / 2, vbY + vbH / 2)}
				>
					<ZoomOutIcon class="size-3.5" />
				</Button>
				<Button
					variant="outline"
					size="icon-sm"
					aria-label="Reset zoom"
					onclick={resetView}
				>
					<MaximizeIcon class="size-3.5" />
				</Button>
			</div>
		</div>
	{/if}
</BackgroundCard>
