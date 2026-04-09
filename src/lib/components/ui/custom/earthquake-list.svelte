<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import Badge from '$lib/components/ui/primitives/badge/index.js';
	import { ScrollArea } from '$lib/components/ui/primitives/scroll-area/index.js';
	import ListIcon from '@lucide/svelte/icons/list';

	let { earthquakes = [], loading = false, class: className, ...restProps } = $props();

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
</script>

<BackgroundCard
	title="Earthquakes"
	icon={ListIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	<ScrollArea class="min-h-0 flex-1">
		<div class="flex flex-col gap-1 pr-3">
			{#if loading}
				<p class="text-muted-foreground py-8 text-center text-sm">Loading...</p>
			{:else if earthquakes.length === 0}
				<p class="text-muted-foreground py-8 text-center text-sm">No earthquakes found</p>
			{:else}
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
			{/if}
		</div>
	</ScrollArea>
</BackgroundCard>
