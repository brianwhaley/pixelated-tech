const URL = "https://geek-jokes.sameerkumar.website/api?format=json";

module.exports = {
	async load(joke){
		const payload = await joke.fetchJson(URL, "Geek-Jokes API");
		if(!payload || typeof payload.joke !== "string" || !payload.joke.trim()){
			throw new Error("Geek-Jokes API returned an invalid joke");
		}
		return {
			id: undefined,
			question: payload.joke.trim(),
			answer: undefined,
			source: "Geek-Jokes API",
			sourceUrl: URL,
			raw: payload
		};
	}
};
