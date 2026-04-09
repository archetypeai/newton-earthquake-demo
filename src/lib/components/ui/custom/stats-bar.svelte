<script>
	import { cn } from '$lib/utils.js';
	import Badge from '$lib/components/ui/primitives/badge/index.js';

	let { earthquakes = [], class: className, ...restProps } = $props();

	let total = $derived(earthquakes.length);
	let maxMag = $derived(
		earthquakes.length ? Math.max(...earthquakes.map((e) => e.mag || 0)) : 0
	);
	let m5 = $derived(earthquakes.filter((e) => (e.mag || 0) >= 5).length);
	let m4 = $derived(earthquakes.filter((e) => (e.mag || 0) >= 4).length);
	let m3 = $derived(earthquakes.filter((e) => (e.mag || 0) >= 3).length);
</script>

<div
	class={cn('flex items-center gap-4 font-mono text-xs', className)}
	{...restProps}
>
	<span class="text-muted-foreground">
		<span class="text-foreground">{total}</span> events
	</span>
	<span class="text-muted-foreground">
		Max: <Badge variant="outline" class={cn('font-mono text-[10px]', maxMag >= 5 ? 'bg-atai-critical text-black/70' : maxMag >= 4 ? 'bg-atai-warning text-black/70' : 'bg-muted')}>
			M{maxMag.toFixed(1)}
		</Badge>
	</span>
	{#if m5 > 0}
		<span class="text-atai-critical">M5+: {m5}</span>
	{/if}
	{#if m4 > 0}
		<span class="text-atai-warning">M4+: {m4}</span>
	{/if}
	{#if m3 > 0}
		<span class="text-muted-foreground">M3+: {m3}</span>
	{/if}
</div>
