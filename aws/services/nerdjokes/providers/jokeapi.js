const CATEGORIES = ["Misc", "Programming", "Pun"];
const TYPES = ["single", "twopart"];

module.exports = {
	async load(joke){
		const category = CATEGORIES[joke.getRandomInt(0, CATEGORIES.length - 1)];
		const type = TYPES[joke.getRandomInt(0, TYPES.length - 1)];
		const sourceUrl = `https://v2.jokeapi.dev/joke/${encodeURIComponent(category)}?type=${encodeURIComponent(type)}&safe-mode`;
		const payload = await joke.fetchJson(sourceUrl, "JokeAPI");
		if(!payload || payload.error){
			throw new Error("JokeAPI returned an invalid response");
		}
		if(Object.values(payload.flags || {}).some(Boolean)){
			throw new Error("JokeAPI returned a joke with a blocked content flag");
		}
		if(payload.type === "single" && typeof payload.joke === "string" && payload.joke.trim()){
			return {
				id: payload.id ? `jokeapi-${payload.id}` : undefined,
				question: payload.joke.trim(),
				answer: undefined,
				source: "JokeAPI",
				sourceUrl,
				raw: payload
			};
		}
		if(
			payload.type === "twopart" &&
            typeof payload.setup === "string" &&
            payload.setup.trim() &&
            typeof payload.delivery === "string" &&
            payload.delivery.trim()
		){
			return {
				id: payload.id ? `jokeapi-${payload.id}` : undefined,
				question: payload.setup.trim(),
				answer: payload.delivery.trim(),
				source: "JokeAPI",
				sourceUrl,
				raw: payload
			};
		}
		throw new Error("JokeAPI returned an unsupported joke format");
	}
};
