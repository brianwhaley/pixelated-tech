import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { strict as assert } from "node:assert";

const template = await readFile(new URL("./template.yaml", import.meta.url), "utf8");

const resourceBlock = (logicalId) => {
	const start = template.indexOf(`  ${logicalId}:`);
	assert.notEqual(start, -1, `${logicalId} must exist`);
	const nextResourceMatch = template.slice(start + 3).match(/\n  [A-Za-z0-9]+:/);
	const nextResource = nextResourceMatch ? start + 3 + nextResourceMatch.index : -1;
	return template.slice(start, nextResource === -1 ? template.length : nextResource);
};

test("defines separate intake and browser worker functions", () => {
	assert.match(resourceBlock("SocialPublishIntake"), /Handler: src\/index\.handler/);
	assert.match(resourceBlock("SocialPublishIntake"), /Runtime: nodejs24\.x/);
	assert.match(resourceBlock("SocialPublishWorker"), /PackageType: Image/);
	assert.match(resourceBlock("SocialPublishWorker"), /Timeout: 300/);
});

test("limits intake permissions to the browser worker", () => {
	const role = resourceBlock("SocialPublishIntakeRole");
	assert.match(role, /Action: lambda:InvokeFunction/);
	assert.match(role, /Resource: !GetAtt SocialPublishWorker\.Arn/);
});

test("passes only the approved config decryption key to the worker", () => {
	const worker = resourceBlock("SocialPublishWorker");
	assert.match(worker, /PIXELATED_CONFIG_KEY: !Ref PixelatedConfigKey/);
	assert.doesNotMatch(worker, /SOCIAL_PUBLISH_PASSWORD|NEXTDOOR_PASSWORD/);
});
