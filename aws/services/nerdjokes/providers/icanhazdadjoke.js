module.exports = {
	async load(joke){
		const tags = await joke.getNerdJokesTags();
		let lastError;

		for(let attempt = 0; attempt < 2 && tags.length; attempt++){
			try {
				const tagCount = joke.getRandomInt(1, tags.length);
				const selectedTags = joke.getRandomItems(tags, tagCount);
				const response = await joke.fetchJson(
					this.getUrl(selectedTags, 5),
					"icanhazdadjoke"
				);
				if(response.results?.length){
					const selected = joke.getRandomItems(response.results, 1)[0];
					return this.normalize(selected, response.search_term);
				}
			} catch(error) {
				lastError = error;
			}
		}

		try {
			return this.normalize(
				await joke.fetchJson(this.getUrl(), "icanhazdadjoke"),
				""
			);
		} catch(error) {
			throw lastError || error;
		}
	},

	getUrl(tags, limit){
		const url = new URL(
			tags?.length
				? "https://icanhazdadjoke.com/search"
				: "https://icanhazdadjoke.com/"
		);
		if(tags?.length){
			url.searchParams.set("term", tags.join(" "));
			url.searchParams.set("limit", String(limit));
		}
		return url.toString();
	},

	normalize(payload, searchTerm){
		if(!payload || typeof payload.joke !== "string" || !payload.joke.trim()){
			throw new Error("icanhazdadjoke returned an invalid joke");
		}
		return {
			id: payload.id ? `icanhazdadjoke-${payload.id}` : undefined,
			question: payload.joke.trim(),
			answer: undefined,
			source: "icanhazdadjoke",
			sourceUrl: searchTerm
				? `https://icanhazdadjoke.com/search?term=${encodeURIComponent(searchTerm)}&limit=5`
				: "https://icanhazdadjoke.com/",
			raw: payload
		};
	}
};
