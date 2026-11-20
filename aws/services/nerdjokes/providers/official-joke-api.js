const SOURCE_URL = "https://raw.githubusercontent.com/15Dkatz/official_joke_api/master/jokes/index.json";
// const API_URL = "https://official-joke-api.appspot.com/random_joke";
const JOKES = require("../data/official-joke-api.json")
	.filter((payload) => payload.type === "programming")
	.map((payload, index) => ({payload, id: `official-joke-api-programming-${index}`}));

module.exports = {
	async load(joke){
		const selected = joke.getRandomItems(JOKES, 1)[0];
		const payload = selected?.payload;
		if(
			!payload ||
            typeof payload.setup !== "string" ||
            !payload.setup.trim() ||
            typeof payload.punchline !== "string" ||
            !payload.punchline.trim()
		){
			throw new Error("Official Joke API returned an invalid joke");
		}
		return {
			id: selected.id,
			question: payload.setup.trim(),
			answer: payload.punchline.trim(),
			source: "Official Joke API",
			sourceUrl: SOURCE_URL,
			raw: payload
		};
	}
};
