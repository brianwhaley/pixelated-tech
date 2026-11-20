const CATEGORIES = ["dev", "science"];

module.exports = {
	async load(joke){
		const category = joke.getRandomItems(CATEGORIES, 1)[0];
		const url = `https://api.chucknorris.io/jokes/random?category=${category}`;
		const payload = await joke.fetchJson(url, "Chuck Norris API");
		if(
			!payload ||
            typeof payload.value !== "string" ||
            !payload.value.trim() ||
            (payload.categories || []).includes("explicit")
		){
			throw new Error("Chuck Norris API returned an invalid or blocked joke");
		}
		return {
			id: payload.id ? `chuck-norris-${payload.id}` : undefined,
			question: payload.value.trim(),
			answer: undefined,
			source: "Chuck Norris API",
			sourceUrl: payload.url || url,
			raw: payload
		};
	}
};
