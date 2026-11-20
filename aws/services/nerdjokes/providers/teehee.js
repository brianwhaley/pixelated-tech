const URL = "https://teehee.dev/api/joke";

module.exports = {
	async load(joke){
		const payload = await joke.fetchJson(URL, "Teehee.dev");
		if(
			!payload ||
            typeof payload.question !== "string" ||
            !payload.question.trim() ||
            typeof payload.answer !== "string" ||
            !payload.answer.trim()
		){
			throw new Error("Teehee.dev returned an invalid joke");
		}
		return {
			id: payload.id ? `teehee-${payload.id}` : undefined,
			question: payload.question.trim(),
			answer: payload.answer.trim(),
			source: "Teehee.dev",
			sourceUrl: payload.permalink || URL,
			raw: payload
		};
	}
};
