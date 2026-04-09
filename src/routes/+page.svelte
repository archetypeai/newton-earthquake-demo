<script>
	import Menubar from '$lib/components/ui/patterns/menubar/index.js';
	import FeedSelector from '$lib/components/ui/custom/feed-selector.svelte';
	import StatsBar from '$lib/components/ui/custom/stats-bar.svelte';
	import MagnitudeChart from '$lib/components/ui/custom/magnitude-chart.svelte';
	import EarthquakeList from '$lib/components/ui/custom/earthquake-list.svelte';
	import ChatPanel from '$lib/components/ui/custom/chat-panel.svelte';
	import { fetchEarthquakes, analyzeEarthquakes } from '$lib/api/earthquakes.js';

	let selectedFeed = $state('all_day');
	let earthquakes = $state([]);
	let loading = $state(false);
	let chatMessages = $state([]);
	let chatLoading = $state(false);
	let intervalId = $state(null);

	async function loadData(feed) {
		loading = true;
		try {
			const data = await fetchEarthquakes(feed);
			earthquakes = data.earthquakes;
		} catch (err) {
			console.error('Failed to load earthquakes:', err);
		} finally {
			loading = false;
		}
	}

	function handleFeedChange(feed) {
		loadData(feed);
	}

	async function handleChatSend(text) {
		chatMessages = [
			...chatMessages,
			{ id: crypto.randomUUID(), role: 'user', text, timestamp: Date.now() }
		];
		chatLoading = true;

		try {
			const result = await analyzeEarthquakes(text, selectedFeed);
			chatMessages = [
				...chatMessages,
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					text: result.analysis,
					timestamp: result.timestamp
				}
			];
		} catch (err) {
			chatMessages = [
				...chatMessages,
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					text: `Error: ${err.message}`,
					timestamp: Date.now()
				}
			];
		} finally {
			chatLoading = false;
		}
	}

	// Load data on mount and auto-refresh every 60s
	$effect(() => {
		loadData(selectedFeed);
		intervalId = setInterval(() => loadData(selectedFeed), 60000);
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

{#snippet partnerSnippet()}
	<span class="text-muted-foreground font-mono text-sm tracking-wider uppercase"
		>Seismic Monitor</span
	>
{/snippet}

<div
	class="bg-background text-foreground grid h-screen w-screen grid-rows-[auto_auto_1fr] overflow-hidden"
>
	<Menubar partnerLogo={partnerSnippet}>
		<StatsBar {earthquakes} />
	</Menubar>

	<div class="border-border border-b px-4 py-2">
		<FeedSelector bind:selected={selectedFeed} onchange={handleFeedChange} />
	</div>

	<main class="grid grid-cols-2 grid-rows-2 gap-4 overflow-hidden p-4">
		<MagnitudeChart {earthquakes} class="max-h-full overflow-hidden" />

		<ChatPanel
			bind:messages={chatMessages}
			loading={chatLoading}
			onsend={handleChatSend}
			class="row-span-2 max-h-full"
		/>

		<EarthquakeList {earthquakes} {loading} class="max-h-full" />
	</main>
</div>
