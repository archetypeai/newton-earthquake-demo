const BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

const FEEDS = {
	all_hour: 'all_hour.geojson',
	all_day: 'all_day.geojson',
	all_week: 'all_week.geojson',
	'2.5_hour': '2.5_hour.geojson',
	'2.5_day': '2.5_day.geojson',
	'2.5_week': '2.5_week.geojson',
	'4.5_day': '4.5_day.geojson',
	'4.5_week': '4.5_week.geojson',
	significant_week: 'significant_week.geojson'
};

export async function fetchEarthquakes(feed = 'all_day') {
	const filename = FEEDS[feed];
	if (!filename) throw new Error(`Unknown feed: ${feed}`);

	const res = await fetch(`${BASE_URL}/${filename}`);
	if (!res.ok) throw new Error(`USGS feed failed: ${res.status}`);
	const data = await res.json();

	return {
		metadata: data.metadata,
		earthquakes: data.features.map((f) => ({
			id: f.id,
			mag: f.properties.mag,
			place: f.properties.place,
			time: f.properties.time,
			depth: f.geometry.coordinates[2],
			lat: f.geometry.coordinates[1],
			lon: f.geometry.coordinates[0],
			type: f.properties.type,
			sig: f.properties.sig,
			tsunami: f.properties.tsunami,
			alert: f.properties.alert,
			title: f.properties.title,
			url: f.properties.url
		}))
	};
}

function extractRegion(place) {
	if (!place) return 'Unknown';
	const parts = place.split(', ');
	if (parts.length >= 2) return parts[parts.length - 1];
	return place;
}

function clusterByRegion(earthquakes) {
	const map = new Map();
	for (const eq of earthquakes) {
		const region = extractRegion(eq.place);
		if (!map.has(region)) map.set(region, []);
		map.get(region).push(eq);
	}
	return [...map.entries()]
		.map(([region, events]) => ({
			region,
			count: events.length,
			maxMag: Math.max(...events.map((e) => e.mag || 0)),
			events: events.sort((a, b) => b.time - a.time)
		}))
		.sort((a, b) => b.maxMag - a.maxMag);
}

export function formatEarthquakesForNewton(earthquakes) {
	const sorted = [...earthquakes].sort((a, b) => b.time - a.time);

	const summary = {
		total: earthquakes.length,
		maxMag: Math.max(...earthquakes.map((e) => e.mag || 0)),
		avgMag: (earthquakes.reduce((s, e) => s + (e.mag || 0), 0) / earthquakes.length).toFixed(2),
		m5plus: earthquakes.filter((e) => (e.mag || 0) >= 5).length,
		m4plus: earthquakes.filter((e) => (e.mag || 0) >= 4).length,
		m3plus: earthquakes.filter((e) => (e.mag || 0) >= 3).length
	};

	// Global recent list (up to 100)
	const recentLines = sorted.slice(0, 100).map((eq) => {
		const time = new Date(eq.time).toISOString();
		return `M${eq.mag?.toFixed(1)} | ${eq.place} | depth ${eq.depth?.toFixed(1)}km | ${time}`;
	});

	// Regional clusters — show top active regions with their sequences
	const clusters = clusterByRegion(earthquakes);
	const activeRegions = clusters.filter((c) => c.count >= 3 || c.maxMag >= 4).slice(0, 10);

	let regionSection = '';
	if (activeRegions.length > 0) {
		regionSection = '\n\nActive regions (≥3 events or M4+):\n';
		for (const r of activeRegions) {
			regionSection += `\n[${r.region}] ${r.count} events, max M${r.maxMag.toFixed(1)}:\n`;
			for (const eq of r.events.slice(0, 10)) {
				const time = new Date(eq.time).toISOString();
				regionSection += `  M${eq.mag?.toFixed(1)} | ${eq.place} | depth ${eq.depth?.toFixed(1)}km | ${time}\n`;
			}
		}
	}

	return (
		`USGS Earthquake Data Summary:\n` +
		`Total events: ${summary.total} | Max magnitude: M${summary.maxMag.toFixed(1)} | Average: M${summary.avgMag}\n` +
		`M5+: ${summary.m5plus} | M4+: ${summary.m4plus} | M3+: ${summary.m3plus}\n\n` +
		`Recent earthquakes (newest first, up to 100):\n` +
		recentLines.join('\n') +
		regionSection
	);
}
