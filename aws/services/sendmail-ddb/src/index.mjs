import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const dynamodb = new DynamoDBClient({});

export const handler = async (event) => {
	try {
		const { domain, formName, formData } = event;

		if (!domain || !formName || !formData) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					error: "Missing required fields: domain, formName, formData",
				}),
			};
		}

		const submissionId = randomUUID();
		const timestamp = new Date().toISOString();

		const item = {
			domain,
			submissionId,
			formName,
			timestamp,
			...formData,
		};

		const command = new PutCommand({
			TableName: "PixelatedFormSubmissionsTable",
			Item: item,
		});

		await dynamodb.send(command);

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Submission successful",
				submissionId,
			}),
		};
	} catch (error) {
		console.error("Error:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({
				error: "Failed to process submission",
				details: error.message,
			}),
		};
	}
};