<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import Badge from '$lib/components/ui/primitives/badge/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import { ScrollArea } from '$lib/components/ui/primitives/scroll-area/index.js';
	import ListIcon from '@lucide/svelte/icons/list';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	let { earthquakes = [], loading = false, class: className, ...restProps } = $props();

	let view = $state('recent');

	function magColor(mag) {
		if (mag >= 5) return 'bg-atai-critical text-black/70';
		if (mag >= 4) return 'bg-atai-warning text-black/70';
		if (mag >= 2.5) return 'bg-atai-neutral text-black/70';
		return 'bg-muted text-muted-foreground';
	}

	function timeAgo(ts) {
		const diff = Date.now() - ts;
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	function extractRegion(place) {
		if (!place) return 'Unknown';
		// USGS format: "20 km E of Fort Davis, Texas" or "south of the Fiji Islands"
		const parts = place.split(', ');
		if (parts.length >= 2) return parts[parts.length - 1];
		// International: "south of the Fiji Islands", "western Indian-Antarctic Ridge"
		return place;
	}

	let regionData = $derived.by(() => {
		const map = new Map();
		for (const eq of earthquakes) {
			const region = extractRegion(eq.place);
			if (!map.has(region)) {
				map.set(region, { region, count: 0, maxMag: 0, totalMag: 0, latest: 0 });
			}
			const entry = map.get(region);
			entry.count++;
			entry.totalMag += eq.mag || 0;
			if ((eq.mag || 0) > entry.maxMag) entry.maxMag = eq.mag || 0;
			if (eq.time > entry.latest) entry.latest = eq.time;
		}
		return [...map.values()]
			.map((r) => ({ ...r, avgMag: r.totalMag / r.count }))
			.sort((a, b) => b.count - a.count);
	});
</script>

<BackgroundCard
	title="Earthquakes"
	icon={ListIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	<div class="flex gap-1">
		<Button
			variant={view === 'recent' ? 'default' : 'outline'}
			size="sm"
			onclick={() => (view = 'recent')}
		>
			<ListIcon class="size-3" aria-hidden="true" />
			Recent
		</Button>
		<Button
			variant={view === 'region' ? 'default' : 'outline'}
			size="sm"
			onclick={() => (view = 'region')}
		>
			<MapPinIcon class="size-3" aria-hidden="true" />
			By Region
		</Button>
	</div>

	<ScrollArea class="min-h-0 flex-1">
		<div class="flex flex-col gap-1 pr-3">
			{#if loading}
				<p class="text-muted-foreground py-8 text-center text-sm">Loading...</p>
			{:else if earthquakes.length === 0}
				<p class="text-muted-foreground py-8 text-center text-sm">No earthquakes found</p>
			{:else if view === 'recent'}
				{#each earthquakes as eq (eq.id)}
					<a
						href={eq.url}
						target="_blank"
						rel="noopener"
						class="hover:bg-accent/50 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xs px-2 py-1.5 transition-colors"
					>
						<Badge
							variant="outline"
							class={cn('w-14 justify-center font-mono text-xs', magColor(eq.mag))}
						>
							M{eq.mag?.toFixed(1)}
						</Badge>
						<div class="min-w-0">
							<p class="text-foreground truncate text-sm">{eq.place}</p>
							<p class="text-muted-foreground font-mono text-[10px]">
								Depth: {eq.depth?.toFixed(1)}km
							</p>
						</div>
						<span class="text-muted-foreground font-mono text-[10px] whitespace-nowrap">
							{timeAgo(eq.time)}
						</span>
					</a>
				{/each}
			{:else}
				{#each regionData as region (region.region)}
					<div
						class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xs px-2 py-1.5"
					>
						<div class="min-w-0">
							<p class="text-foreground truncate text-sm">{region.region}</p>
							<p class="text-muted-foreground font-mono text-[10px]">
								Avg: M{region.avgMag.toFixed(1)} · Latest: {timeAgo(region.latest)}
							</p>
						</div>
						<Badge
							variant="outline"
							class={cn('font-mono text-xs', magColor(region.maxMag))}
						>
							Max M{region.maxMag.toFixed(1)}
						</Badge>
						<span class="text-foreground font-mono text-sm">{region.count}</span>
						<span class="text-muted-foreground text-[10px]">events</span>
					</div>
				{/each}
			{/if}
		</div>
	</ScrollArea>
</BackgroundCard>
