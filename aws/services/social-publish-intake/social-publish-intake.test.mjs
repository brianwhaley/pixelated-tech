// eslint-disable-next-line pixelated/package-json-missing-dependency
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createWorkerEvent, getRequestBody } from "./src/index.mjs";

test("decodes a base64 API Gateway body", () => {
	const body = JSON.stringify({ postId: "42" });
	assert.equal(getRequestBody({ body: Buffer.from(body).toString("base64"), isBase64Encoded: true }), body);
});

test("preserves the raw body and normalized headers for signature verification", () => {
	const rawBody = JSON.stringify({ postId: "42", postUrl: "https://example.com/post" });
	const result = createWorkerEvent({
		body: rawBody,
		headers: {
			"X-Pixelated-Request-Id": "request-1",
			"X-WordPress-Signature": "sha256=signature",
		},
	});

	assert.deepEqual(result, {
		requestId: "request-1",
		rawBody,
		headers: {
			"x-pixelated-request-id": "request-1",
			"x-wordpress-signature": "sha256=signature",
		},
		payload: { postId: "42", postUrl: "https://example.com/post" },
	});
});

test("rejects malformed or incomplete webhook requests", () => {
	assert.equal(createWorkerEvent({ body: "not-json" }).error, "Invalid JSON payload.");
	assert.equal(createWorkerEvent({ body: JSON.stringify({}) }).error, "Provide at least one of postId or postUrl.");
});
