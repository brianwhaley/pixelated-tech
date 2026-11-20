const AWS = require("../aws");

module.exports = {
	async load(joke){
		const ddbc = joke.ddbc || new AWS.DDBCLIENT();
		const scanParams = {
			tablename: ddbc.jokesDB,
			limit: 1
		};
		let response = await ddbc.scanFromDynamo({
			...scanParams,
			start_key: {"id": joke.getGUID()}
		});
		if(!response?.Items?.length){
			response = await ddbc.scanFromDynamo(scanParams);
		}
		const payload = response?.Items?.[0];
		if(!payload){
			throw new Error(`No jokes available in DynamoDB table: ${ddbc.jokesDB}`);
		}
		return {
			id: payload.id,
			question: payload.question,
			answer: payload.answer,
			source: "NerdJokes",
			sourceUrl: undefined,
			raw: payload
		};
	}
};
