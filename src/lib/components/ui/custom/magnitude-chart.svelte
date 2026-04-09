<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import ActivityIcon from '@lucide/svelte/icons/activity';

	let { earthquakes = [], class: className, ...restProps } = $props();

	let sorted = $derived(
		[...earthquakes]
			.sort((a, b) => a.time - b.time)
			.map((eq) => ({
				...eq,
				date: new Date(eq.time)
			}))
	);

	// Chart dimensions
	const W = 600;
	const H = 200;
	const PAD = { top: 20, right: 20, bottom: 30, left: 40 };
	const plotW = W - PAD.left - PAD.right;
	const plotH = H - PAD.top - PAD.bottom;

	let xMin = $derived(sorted.length ? sorted[0].time : Date.now() - 86400000);
	let xMax = $derived(sorted.length ? sorted[sorted.length - 1].time : Date.now());
	let yMax = $derived(Math.max(6, ...sorted.map((e) => e.mag || 0)) + 0.5);

	function xScale(t) {
		return PAD.left + ((t - xMin) / (xMax - xMin || 1)) * plotW;
	}
	function yScale(m) {
		return PAD.top + plotH - (m / yMax) * plotH;
	}

	function dotColor(mag) {
		if (mag >= 5) return 'var(--color-atai-critical)';
		if (mag >= 4) return 'var(--color-atai-warning)';
		if (mag >= 2.5) return 'var(--color-atai-neutral)';
		return 'var(--color-muted-foreground)';
	}

	function dotRadius(mag) {
		return Math.max(2, Math.min(8, mag * 1.5));
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
</script>

<BackgroundCard
	title="Magnitude"
	icon={ActivityIcon}
	class={cn('gap-3', className)}
	{...restProps}
>
	{#if sorted.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">No data</p>
	{:else}
		<svg viewBox="0 0 {W} {H}" class="w-full" preserveAspectRatio="xMidYMid meet">
			<!-- Grid lines -->
			{#each yTicks as tick}
				<line
					x1={PAD.left}
					y1={yScale(tick)}
					x2={W - PAD.right}
					y2={yScale(tick)}
					stroke="var(--color-border)"
					stroke-width="0.5"
				/>
				<text
					x={PAD.left - 6}
					y={yScale(tick) + 3}
					text-anchor="end"
					fill="var(--color-muted-foreground)"
					font-size="9"
					font-family="var(--font-mono)"
				>
					M{tick}
				</text>
			{/each}

			<!-- X axis labels -->
			{#each [xMin, xMin + (xMax - xMin) / 2, xMax] as ts}
				<text
					x={xScale(ts)}
					y={H - 5}
					text-anchor="middle"
					fill="var(--color-muted-foreground)"
					font-size="9"
					font-family="var(--font-mono)"
				>
					{formatTime(ts)}
				</text>
			{/each}

			<!-- Data points -->
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
	{/if}
</BackgroundCard>
