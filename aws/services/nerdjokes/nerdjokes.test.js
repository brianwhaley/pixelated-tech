const assert = require('node:assert/strict');
// eslint-disable-next-line pixelated/package-json-missing-dependency
const test = require('node:test');

const Event = require('./event');
const Joke = require('./joke');
const { handler } = require('./index');
const Message = require('./message');
const AWS = require('./aws');

const joke = {
    id: 'joke-1',
    question: 'Why do programmers prefer dark mode?',
    answer: 'Because light attracts bugs.'
};

const prodStageVariables = {
    NERDJOKES_PROD_CLIENT_ID: 'prod-client-id',
    NERDJOKES_PROD_CLIENT_SECRET: 'prod-client-secret',
    NERDJOKES_PROD_VERIFICATION_TOKEN: 'verification-token'
};

function createDdbClient(results) {
    return {
        jokesDB: 'nerdjokes',
        calls: [],
        async scanFromDynamo(params) {
            this.calls.push(params);
            return results.shift();
        }
    };
}

test('parses Slack form data with the expected content-type header', () => {
    const event = new Event({
        httpMethod: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        stageVariables: prodStageVariables,
        body: 'command=%2Fnerdjokes&text=getjokejson'
    });

    assert.equal(event.command, '/nerdjokes');
    assert.equal(event.text, 'getjokejson');
});

test('returns the Slack URL verification challenge for lowercase JSON content type', async () => {
    const response = await handler({
        httpMethod: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        stageVariables: {
            ...prodStageVariables
        },
        body: JSON.stringify({
            type: 'url_verification',
            token: 'verification-token',
            challenge: 'nerdjokes-challenge'
        })
    }, {});

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), { challenge: 'nerdjokes-challenge' });
});

test('selects DEV prefixed stage variables for the DEV route', () => {
    const event = new Event({
        httpMethod: 'GET',
        path: '/nerdjokes/dev',
        stageVariables: {
            ENV: 'PROD',
            NERDJOKES_DEV_CLIENT_ID: 'dev-client-id',
            NERDJOKES_DEV_CLIENT_SECRET: 'dev-client-secret',
            NERDJOKES_DEV_VERIFICATION_TOKEN: 'dev-verification-token',
            NERDJOKES_PROD_CLIENT_ID: 'prod-client-id',
            NERDJOKES_PROD_CLIENT_SECRET: 'prod-client-secret',
            NERDJOKES_PROD_VERIFICATION_TOKEN: 'prod-verification-token'
        }
    });

    assert.equal(event.env, 'DEV');
    assert.equal(event.client_id, 'dev-client-id');
    assert.equal(event.client_secret, 'dev-client-secret');
    assert.equal(event.v_token, 'dev-verification-token');
});

test('prefers PROD prefixed stage variables for the production route', () => {
    const event = new Event({
        httpMethod: 'GET',
        path: '/nerdjokes',
        stageVariables: {
            ENV: 'PROD',
            CLIENT_ID: 'legacy-client-id',
            CLIENT_SECRET: 'legacy-client-secret',
            VERIFICATION_TOKEN: 'legacy-verification-token',
            NERDJOKES_PROD_CLIENT_ID: 'prod-client-id',
            NERDJOKES_PROD_CLIENT_SECRET: 'prod-client-secret',
            NERDJOKES_PROD_VERIFICATION_TOKEN: 'prod-verification-token'
        }
    });

    assert.equal(event.env, 'PROD');
    assert.equal(event.client_id, 'prod-client-id');
    assert.equal(event.client_secret, 'prod-client-secret');
    assert.equal(event.v_token, 'prod-verification-token');
});

test('rejects missing prefixed stage variables', () => {
    assert.throws(
        () => new Event({
            httpMethod: 'GET',
            path: '/nerdjokes',
            stageVariables: {
                ENV: 'PROD',
                CLIENT_ID: 'legacy-client-id',
                CLIENT_SECRET: 'legacy-client-secret',
                VERIFICATION_TOKEN: 'legacy-verification-token'
            }
        }),
        new Error('Missing NerdJokes PROD stage configuration')
    );
});

test('handles OAuth callback requests without a logging exception', async () => {
    const originalOAuthVerify = Event.prototype.oAuthVerify;
    Event.prototype.oAuthVerify = async () => ({
        statusCode: 200,
        body: JSON.stringify({ ok: true })
    });

    try {
        const response = await handler({
            httpMethod: 'GET',
            queryStringParameters: { code: 'oauth-code' },
                stageVariables: prodStageVariables
        }, {});

        assert.equal(response.statusCode, 200);
        assert.deepEqual(JSON.parse(response.body), { ok: true });
    } finally {
        Event.prototype.oAuthVerify = originalOAuthVerify;
    }
});

test('awaits OAuth failures so the handler returns its error response', async () => {
    const originalOAuthVerify = Event.prototype.oAuthVerify;
    Event.prototype.oAuthVerify = async () => {
        throw new Error('Slack OAuth failed: invalid_code');
    };

    try {
        const response = await handler({
            httpMethod: 'GET',
            queryStringParameters: { code: 'oauth-code' },
            stageVariables: prodStageVariables
        }, {});

        assert.equal(response.statusCode, 500);
        assert.deepEqual(JSON.parse(response.body), {
            error: 'NerdJokes request failed'
        });
    } finally {
        Event.prototype.oAuthVerify = originalOAuthVerify;
    }
});

test('surfaces Slack OAuth errors without exposing credentials', async () => {
    const originalSlackApiGet = Message.prototype.slackApiGet;
    Message.prototype.slackApiGet = async () => ({
        ok: false,
        error: 'bad_client_secret'
    });

    try {
        const event = new Event({
            httpMethod: 'GET',
            queryStringParameters: { code: 'oauth-code' },
            stageVariables: prodStageVariables
        });

        await assert.rejects(
            event.oAuthVerify(),
            new Error('Slack OAuth failed: bad_client_secret')
        );
    } finally {
        Message.prototype.slackApiGet = originalSlackApiGet;
    }
});

test('stores a successful OAuth installation without a user token', async () => {
    const originalSlackApiGet = Message.prototype.slackApiGet;
    const originalWriteToDynamo = AWS.DDBCLIENT.prototype.writeToDynamo;
    const originalSendEmail = AWS.SES.prototype.sendEmail;
    const originalLogEvent = Event.prototype.logEvent;
    let storedItem;

    Message.prototype.slackApiGet = async () => ({
        ok: true,
        access_token: 'xoxb-bot-token',
        team: { id: 'T123' }
    });
    AWS.DDBCLIENT.prototype.writeToDynamo = async function(data) {
        storedItem = data.item;
        return {};
    };
    AWS.SES.prototype.sendEmail = async () => ({});
    Event.prototype.logEvent = async () => null;

    try {
        const event = new Event({
            httpMethod: 'GET',
            queryStringParameters: { code: 'oauth-code' },
            stageVariables: prodStageVariables
        });

        const response = await event.oAuthVerify();

        assert.equal(response.statusCode, 302);
        assert.equal(storedItem.team_id, 'T123');
        assert.equal(storedItem.access_token, 'xoxb-bot-token');
        assert.equal(Object.prototype.hasOwnProperty.call(storedItem, 'user_token'), false);
    } finally {
        Message.prototype.slackApiGet = originalSlackApiGet;
        AWS.DDBCLIENT.prototype.writeToDynamo = originalWriteToDynamo;
        AWS.SES.prototype.sendEmail = originalSendEmail;
        Event.prototype.logEvent = originalLogEvent;
    }
});

test('loads a joke from the random-start scan', async () => {
    const ddbc = createDdbClient([{ Items: [joke] }]);
    const loadedJoke = new Joke(ddbc);

    await loadedJoke.load();

    assert.deepEqual(loadedJoke.raw, joke);
    assert.equal(loadedJoke.id, joke.id);
    assert.equal(loadedJoke.question, joke.question);
    assert.equal(loadedJoke.answer, joke.answer);
    assert.equal(ddbc.calls.length, 1);
});

test('falls back to a scan from the beginning when the random-start scan is empty', async () => {
    const ddbc = createDdbClient([{ Items: [] }, { Items: [joke] }]);
    const loadedJoke = new Joke(ddbc);

    await loadedJoke.load();

    assert.deepEqual(loadedJoke.raw, joke);
    assert.equal(ddbc.calls.length, 2);
    assert.ok(ddbc.calls[0].start_key);
    assert.equal(Object.prototype.hasOwnProperty.call(ddbc.calls[1], 'start_key'), false);
});

test('throws a clear error when the jokes table is empty', async () => {
    const ddbc = createDdbClient([{ Items: [] }, { Items: [] }]);
    const loadedJoke = new Joke(ddbc);

    await assert.rejects(
        loadedJoke.load(),
        new Error('No jokes available in DynamoDB table: nerdjokes')
    );
    assert.equal(ddbc.calls.length, 2);
});
