<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import { LAND_PATHS } from '$lib/data/world-land.js';

	let { earthquakes = [], class: className, ...restProps } = $props();

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

	// --- Chart view ---
	const CW = 600;
	const CH = 200;
	const CPAD = { top: 20, right: 20, bottom: 30, left: 40 };
	const cPlotW = CW - CPAD.left - CPAD.right;
	const cPlotH = CH - CPAD.top - CPAD.bottom;

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
</script>

<BackgroundCard
	title="Magnitude"
	icon={ActivityIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	<div class="flex gap-1">
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
	</div>

	{#if sorted.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">No data</p>
	{:else if view === 'chart'}
		<svg viewBox="0 0 {CW} {CH}" class="min-h-0 flex-1" preserveAspectRatio="xMidYMin meet">
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
				<circle
					cx={xScale(eq.time)}
					cy={yScale(eq.mag || 0)}
					r={dotRadius(eq.mag || 0)}
					fill={dotColor(eq.mag || 0)}
					opacity="0.7"
				>
					<title>M{eq.mag?.toFixed(1)} - {eq.place}</title>
				</circle>
			{/each}
		</svg>
	{:else}
		<svg viewBox="0 0 {MW} {MH}" class="min-h-0 flex-1" preserveAspectRatio="xMidYMin meet">
			<!-- Ocean background -->
			<rect width={MW} height={MH} fill="var(--color-card)" />

			<!-- Land masses -->
			{#each LAND_PATHS as d}
				<path
					{d}
					fill="var(--color-muted)"
					stroke="var(--color-border)"
					stroke-width="0.3"
				/>
			{/each}

			<!-- Earthquake dots -->
			{#each sorted as eq}
				{#if eq.lon != null && eq.lat != null}
					<circle
						cx={lonToX(eq.lon)}
						cy={latToY(eq.lat)}
						r={dotRadius(eq.mag || 0)}
						fill={dotColor(eq.mag || 0)}
						opacity="0.8"
					>
						<title>M{eq.mag?.toFixed(1)} - {eq.place} (depth {eq.depth?.toFixed(1)}km)</title>
					</circle>
				{/if}
			{/each}
		</svg>
	{/if}
</BackgroundCard>
