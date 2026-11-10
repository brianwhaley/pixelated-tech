// eslint-disable-next-line pixelated/package-json-missing-dependency
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { getSiteFromPostUrl, getWorkerPayload } from "./src/index.mjs";

test("extracts the normalized WordPress hostname", () => {
	assert.equal(getSiteFromPostUrl("https://Example.com/posts/hello"), "example.com");
	assert.equal(getSiteFromPostUrl("not-a-url"), "");
});

test("accepts the intake Lambda envelope", () => {
	const envelope = { requestId: "request-1", rawBody: "{}", headers: {}, payload: {} };
	assert.deepEqual(getWorkerPayload(envelope), envelope);
	assert.equal(getWorkerPayload({}), null);
});
