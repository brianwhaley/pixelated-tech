import { randomUUID } from "node:crypto";

const workerFunctionName = "social-publish-worker";

export const getRequestBody = (event) => {
	if (!event?.body) return "";
	if (event.isBase64Encoded) return Buffer.from(event.body, "base64").toString("utf8");
	return typeof event.body === "string" ? event.body : JSON.stringify(event.body);
};

export const createWorkerEvent = (event) => {
	const rawBody = getRequestBody(event);
	const headers = Object.fromEntries(Object.entries(event?.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
	const requestId = headers["x-pixelated-request-id"] || randomUUID();

	if (!rawBody) {
		return { error: "Request body cannot be empty." };
	}

	let payload;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		return { error: "Invalid JSON payload." };
	}

	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { error: "JSON payload must be an object." };
	}

	if ((!payload.postId || typeof payload.postId !== "string") && (!payload.postUrl || typeof payload.postUrl !== "string")) {
		return { error: "Provide at least one of postId or postUrl." };
	}

	return {
		requestId,
		rawBody,
		headers,
		payload,
	};
};

export const handler = async (event) => {
	const workerEvent = createWorkerEvent(event);
	if (workerEvent.error) {
		return {
			statusCode: 400,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: workerEvent.error }),
		};
	}

	const { InvokeCommand, InvocationType, LambdaClient } = await import("@aws-sdk/client-lambda");
	const lambdaClient = new LambdaClient({});
	await lambdaClient.send(new InvokeCommand({
		FunctionName: workerFunctionName,
		InvocationType: InvocationType.Event,
		Payload: Buffer.from(JSON.stringify(workerEvent)),
	}));

	return {
		statusCode: 202,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ accepted: true, requestId: workerEvent.requestId }),
	};
};
