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

export function formatEarthquakesForNewton(earthquakes, limit = 30) {
	const sorted = [...earthquakes].sort((a, b) => b.time - a.time).slice(0, limit);

	const lines = sorted.map((eq) => {
		const time = new Date(eq.time).toISOString();
		return `M${eq.mag?.toFixed(1)} | ${eq.place} | depth ${eq.depth?.toFixed(1)}km | ${time}`;
	});

	const summary = {
		total: earthquakes.length,
		maxMag: Math.max(...earthquakes.map((e) => e.mag || 0)),
		avgMag: (earthquakes.reduce((s, e) => s + (e.mag || 0), 0) / earthquakes.length).toFixed(2),
		m5plus: earthquakes.filter((e) => (e.mag || 0) >= 5).length,
		m4plus: earthquakes.filter((e) => (e.mag || 0) >= 4).length,
		m3plus: earthquakes.filter((e) => (e.mag || 0) >= 3).length
	};

	return (
		`USGS Earthquake Data Summary:\n` +
		`Total events: ${summary.total} | Max magnitude: M${summary.maxMag.toFixed(1)} | Average: M${summary.avgMag}\n` +
		`M5+: ${summary.m5plus} | M4+: ${summary.m4plus} | M3+: ${summary.m3plus}\n\n` +
		`Recent earthquakes (newest first):\n` +
		lines.join('\n')
	);
}
