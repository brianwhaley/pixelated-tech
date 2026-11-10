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

test("exposes the unified east-one API domain without a stage path", () => {
	assert.match(template, /DomainName: api\.pixelated\.tech/);
	assert.match(template, /Value: https:\/\/api\.pixelated\.tech/);
	assert.doesNotMatch(template, /BasePath: /);
	assert.match(template, /StageName: prod/);
});

test("routes Sendmail directly to the existing Lambda", () => {
	assert.match(resourceBlock("SendmailResource"), /PathPart: sendmail/);
	const method = resourceBlock("SendmailMethod");
	assert.match(method, /Type: AWS_PROXY/);
	assert.match(method, /SendmailFunctionArn/);
	assert.match(resourceBlock("SendmailPermission"), /POST\/sendmail/);
});

test("routes social publishing to the intake Lambda", () => {
	assert.match(resourceBlock("SocialPublishResource"), /PathPart: social-publish/);
	const method = resourceBlock("SocialPublishMethod");
	assert.match(method, /HttpMethod: POST/);
	assert.match(method, /SocialPublishIntakeFunctionArn/);
	assert.match(resourceBlock("SocialPublishPermission"), /POST\/social-publish/);
});

test("preserves Forms direct S3 ingestion", () => {
	const method = resourceBlock("FormsMethod");
	assert.match(method, /Credentials: !Ref FormsIntegrationRoleArn/);
	assert.match(method, /IntegrationHttpMethod: PUT/);
	assert.match(method, /SelectionPattern: '2\\d\{2\}'/);
	assert.match(method, /Type: AWS/);
	assert.match(method, /s3:path\/\$\{FormsBucketName\}\/\{requestId\}\.json/);
});

test("preserves the DynDNS legacy event mapping", () => {
	assert.match(resourceBlock("DyndnsResource"), /PathPart: dyndns53/);
	assert.match(resourceBlock("DyndnsNicResource"), /PathPart: nic/);
	assert.match(resourceBlock("DyndnsUpdateResource"), /PathPart: update/);
	const method = resourceBlock("DyndnsMethod");
	assert.match(method, /Type: AWS/);
	assert.match(method, /\"body-json\"/);
	assert.match(method, /\"\$type\"/);
	assert.match(method, /method\.request\.querystring\.hostname/);
	assert.match(method, /\"context\"/);
	assert.match(method, /DyndnsFunctionArn/);
});

test("routes Proxy directly and retains its required URL query parameter", () => {
	const method = resourceBlock("ProxyMethod");
	assert.match(method, /HttpMethod: ANY/);
	assert.match(method, /method\.request\.querystring\.url: true/);
	assert.match(method, /ProxyFunctionArn/);
});

test("routes NerdJokes to the production alias without IAM auth", () => {
	const getMethod = resourceBlock("NerdjokesGetMethod");
	const postMethod = resourceBlock("NerdjokesPostMethod");
	assert.match(getMethod, /AuthorizationType: NONE/);
	assert.match(postMethod, /AuthorizationType: NONE/);
	assert.match(template, /Default: arn:aws:lambda:us-east-1:971579260814:function:nerdjokes:PROD/);
	assert.match(getMethod, /NerdjokesFunctionArn/);
	assert.match(postMethod, /NerdjokesFunctionArn/);
});

test("manages unified API Gateway logs and 5XX alarm", () => {
	assert.match(resourceBlock("UnifiedApiAccessLogGroup"), /LogGroupName: \/aws\/apigateway\/pixelated-api\/prod/);
	assert.match(resourceBlock("UnifiedApiExecutionLogGroup"), /API-Gateway-Execution-Logs_\$\{UnifiedApi\}\/prod/);
	const alarm = resourceBlock("UnifiedApi5xxAlarm");
	assert.match(alarm, /AlarmName: Pixelated API 5XX Errors Alarm/);
	assert.match(alarm, /MetricName: 5XXError/);
	assert.match(alarm, /Value: pixelated-api/);
	assert.match(alarm, /Value: prod/);
	assert.match(alarm, /AlarmTopicArn/);
});

test("does not add STKR to the unified gateway", () => {
	assert.doesNotMatch(template, /StkrFunctionArn/);
	assert.match(template, /StkrStatus:/);
	assert.match(template, /Not included; existing STKR gateway remains unchanged\./);
});
