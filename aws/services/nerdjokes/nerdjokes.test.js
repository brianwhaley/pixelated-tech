const assert = require('node:assert/strict');
const HTTPS = require('node:https');
const { EventEmitter } = require('node:events');
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
        jokesTagsDB: 'nerdjokes-tags',
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

test('returns normalized joke fields for getjokejson requests', async () => {
    const originalLoad = Joke.prototype.load;
    Joke.prototype.load = async function() {
        Object.assign(this, {
            id: 'teehee-nom',
            question: 'I have a mouth, but I do not eat. What am I?',
            answer: 'Hungry.',
            source: 'Teehee.dev',
            sourceUrl: 'https://teehee.dev/api/joke/nom',
            raw: {id: 'nom', question: 'I have a mouth, but I do not eat. What am I?', answer: 'Hungry.'}
        });
    };

    try {
        const response = await handler({
            httpMethod: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            stageVariables: prodStageVariables,
            body: 'command=%2Fnerdjokes&text=getjokejson'
        }, {});

        assert.equal(response.statusCode, 200);
        assert.deepEqual(JSON.parse(response.body), {
            id: 'teehee-nom',
            question: 'I have a mouth, but I do not eat. What am I?',
            answer: 'Hungry.',
            source: 'Teehee.dev',
            sourceUrl: 'https://teehee.dev/api/joke/nom',
            raw: {id: 'nom', question: 'I have a mouth, but I do not eat. What am I?', answer: 'Hungry.'}
        });
    } finally {
        Joke.prototype.load = originalLoad;
    }
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

    await loadedJoke.load('nerdjokes');

    assert.deepEqual(loadedJoke.raw, joke);
    assert.equal(loadedJoke.id, joke.id);
    assert.equal(loadedJoke.question, joke.question);
    assert.equal(loadedJoke.answer, joke.answer);
    assert.equal(loadedJoke.source, 'NerdJokes');
    assert.equal(ddbc.calls.length, 1);
});

test('falls back to a scan from the beginning when the random-start scan is empty', async () => {
    const ddbc = createDdbClient([{ Items: [] }, { Items: [joke] }]);
    const loadedJoke = new Joke(ddbc);

    await loadedJoke.load('nerdjokes');

    assert.deepEqual(loadedJoke.raw, joke);
    assert.equal(ddbc.calls.length, 2);
    assert.ok(ddbc.calls[0].start_key);
    assert.equal(Object.prototype.hasOwnProperty.call(ddbc.calls[1], 'start_key'), false);
});

test('throws a clear error when the jokes table is empty', async () => {
    const ddbc = createDdbClient([{ Items: [] }, { Items: [] }]);
    const loadedJoke = new Joke(ddbc);

    await assert.rejects(
        loadedJoke.load('nerdjokes'),
        new Error('No jokes available in DynamoDB table: nerdjokes')
    );
    assert.equal(ddbc.calls.length, 2);
});

test('loads a two-part JokeAPI joke with source attribution', async () => {
    const loadedJoke = new Joke();
    loadedJoke.containsProfanity = () => {
        throw new Error('JokeAPI should rely on safe-mode instead of the additional profanity matcher');
    };
    const randomValues = [0, 1];
    loadedJoke.getRandomInt = () => randomValues.shift();
    loadedJoke.fetchJson = async (url, source) => {
        assert.equal(source, 'JokeAPI');
        assert.match(url, /Misc\?type=twopart&safe-mode/);
        return {
        id: 42,
        type: 'twopart',
        setup: 'Why do programmers prefer dark mode?',
        delivery: 'Because light attracts bugs.',
        flags: {
            nsfw: false,
            political: false
        }
        };
    };

    await loadedJoke.load('jokeapi');
    assert.equal(loadedJoke.id, 'jokeapi-42');
    assert.equal(loadedJoke.question, 'Why do programmers prefer dark mode?');
    assert.equal(loadedJoke.answer, 'Because light attracts bugs.');
    assert.equal(loadedJoke.source, 'JokeAPI');
    assert.match(loadedJoke.sourceUrl, /Misc\?type=twopart&safe-mode/);
});

test('loads a single-part JokeAPI joke without an answer', async () => {
    const loadedJoke = new Joke();
    const randomValues = [2, 0];
    loadedJoke.getRandomInt = () => randomValues.shift();
    loadedJoke.fetchJson = async () => ({
        id: 43,
        type: 'single',
        joke: 'There are only 10 kinds of people.'
    });

    await loadedJoke.load('jokeapi');

    assert.equal(loadedJoke.question, 'There are only 10 kinds of people.');
    assert.equal(loadedJoke.answer, undefined);
    assert.equal(loadedJoke.source, 'JokeAPI');
});

test('rejects JokeAPI responses with blocked content flags', async () => {
    const ddbc = createDdbClient([{ Items: [joke] }]);
    const loadedJoke = new Joke(ddbc);
    loadedJoke.fetchJson = async () => ({
        type: 'single',
        joke: 'A joke with a political flag.',
        flags: { political: true }
    });

    await loadedJoke.load('jokeapi');

    assert.equal(loadedJoke.source, 'NerdJokes');
    assert.equal(loadedJoke.question, joke.question);
});

test('falls back to NerdJokes when JokeAPI fails', async () => {
    const ddbc = createDdbClient([{ Items: [joke] }]);
    const loadedJoke = new Joke(ddbc);
    loadedJoke.fetchJson = async () => {
        throw new Error('service unavailable');
    };

    await loadedJoke.load('jokeapi');

    assert.equal(loadedJoke.question, joke.question);
    assert.equal(loadedJoke.answer, joke.answer);
    assert.equal(loadedJoke.source, 'NerdJokes');
    assert.equal(ddbc.calls.length, 1);
});

test('loads a Geek-Jokes API single-part joke', async () => {
    const loadedJoke = new Joke();
    loadedJoke.fetchJson = async (url, source) => {
        assert.equal(url, 'https://geek-jokes.sameerkumar.website/api?format=json');
        assert.equal(source, 'Geek-Jokes API');
        return {joke: 'There are 10 kinds of people: those who understand binary and those who do not.'};
    };

    await loadedJoke.load('geekjokes');

    assert.equal(loadedJoke.question, 'There are 10 kinds of people: those who understand binary and those who do not.');
    assert.equal(loadedJoke.answer, undefined);
    assert.equal(loadedJoke.source, 'Geek-Jokes API');
});

test('detects profanity in either normalized joke field without substring false positives', () => {
    const loadedJoke = new Joke();

    assert.equal(
        loadedJoke.containsProfanity({
            question: 'This joke contains ass.',
            answer: undefined
        }),
        true
    );
    assert.equal(
        loadedJoke.containsProfanity({
            question: 'This is a class joke.',
            answer: 'It is clean.'
        }),
        false
    );
    assert.equal(
        loadedJoke.containsProfanity({
            question: 'This joke is fuuuuuck.',
            answer: undefined
        }),
        true
    );
});

test('retries an external provider once after blocked content', async () => {
    const loadedJoke = new Joke();
    let attempts = 0;
    loadedJoke.fetchJson = async () => {
        attempts++;
        return attempts === 1
            ? {joke: 'This joke contains ass.'}
            : {joke: 'There are 10 kinds of people: those who understand binary and those who do not.'};
    };

    await loadedJoke.load('geekjokes');

    assert.equal(attempts, 2);
    assert.equal(
        loadedJoke.question,
        'There are 10 kinds of people: those who understand binary and those who do not.'
    );
    assert.equal(loadedJoke.source, 'Geek-Jokes API');
});

test('falls back to NerdJokes after two blocked external responses', async () => {
    const ddbc = createDdbClient([{Items: [joke]}]);
    const loadedJoke = new Joke(ddbc);
    let attempts = 0;
    loadedJoke.fetchJson = async () => {
        attempts++;
        return {joke: `Blocked response ${attempts}: ass.`};
    };

    await loadedJoke.load('geekjokes');

    assert.equal(attempts, 2);
    assert.equal(loadedJoke.source, 'NerdJokes');
    assert.equal(loadedJoke.question, joke.question);
});

test('loads a Teehee.dev two-part joke and uses its permalink', async () => {
    const loadedJoke = new Joke();
    loadedJoke.fetchJson = async (url, source) => {
        assert.equal(url, 'https://teehee.dev/api/joke');
        assert.equal(source, 'Teehee.dev');
        return {
            id: '1',
            question: 'Why did the developer go broke?',
            answer: 'Because they used up all their cache.',
            permalink: 'https://teehee.dev/joke/1'
        };
    };

    await loadedJoke.load('teehee');

    assert.equal(loadedJoke.id, 'teehee-1');
    assert.equal(loadedJoke.answer, 'Because they used up all their cache.');
    assert.equal(loadedJoke.sourceUrl, 'https://teehee.dev/joke/1');
});

test('loads a random Chuck Norris dev or science joke', async () => {
    const loadedJoke = new Joke();
    loadedJoke.getRandomItems = () => ['science'];
    loadedJoke.fetchJson = async (url, source) => {
        assert.equal(url, 'https://api.chucknorris.io/jokes/random?category=science');
        assert.equal(source, 'Chuck Norris API');
        return {
            id: 'chuck-1',
            value: 'Chuck Norris understands quantum mechanics.',
            categories: ['science'],
            url: 'https://api.chucknorris.io/jokes/chuck-1'
        };
    };

    await loadedJoke.load('chucknorris');

    assert.equal(loadedJoke.id, 'chuck-norris-chuck-1');
    assert.equal(loadedJoke.question, 'Chuck Norris understands quantum mechanics.');
    assert.equal(loadedJoke.answer, undefined);
    assert.equal(loadedJoke.sourceUrl, 'https://api.chucknorris.io/jokes/chuck-1');
});

test('loads a random programming joke from the local Official Joke API dataset', async () => {
    const loadedJoke = new Joke();
    loadedJoke.getRandomItems = (items) => [items[0]];

    await loadedJoke.load('officialjokeapi');

    assert.match(loadedJoke.id, /^official-joke-api-programming-\d+$/);
    assert.equal(loadedJoke.raw.type, 'programming');
    assert.ok(loadedJoke.question);
    assert.ok(loadedJoke.answer);
    assert.equal(loadedJoke.source, 'Official Joke API');
    assert.equal(
        loadedJoke.sourceUrl,
        'https://raw.githubusercontent.com/15Dkatz/official_joke_api/master/jokes/index.json'
    );
});

test('rejects explicit Chuck Norris jokes and falls back to NerdJokes', async () => {
    const ddbc = createDdbClient([{Items: [joke]}]);
    const loadedJoke = new Joke(ddbc);
    loadedJoke.fetchJson = async () => ({
        id: 'chuck-explicit',
        value: 'An explicit joke.',
        categories: ['dev', 'explicit']
    });

    await loadedJoke.load('chucknorris');

    assert.equal(loadedJoke.source, 'NerdJokes');
    assert.equal(loadedJoke.question, joke.question);
});

test('returns plain unique NerdJokes tags and preserves Slack tag options', async () => {
    const ddbc = createDdbClient([{
        Items: [
            {tag: 'math'},
            {tag: 'atom'},
            {tag: 'math'},
            {tag: ''}
        ]
    }]);
    const loadedJoke = new Joke(ddbc);
    loadedJoke.getRandomInt = (min) => min;

    const tags = await loadedJoke.getNerdJokesTags(2);
    assert.deepEqual(tags, ['math', 'atom']);

    ddbc.scanFromDynamo = async (params) => {
        ddbc.calls.push(params);
        return {
            Items: [
                {tag: 'math'},
                {tag: 'atom'},
                {tag: 'math'},
                {tag: ''}
            ]
        };
    };
    const options = await loadedJoke.getTagOptions({});
    assert.deepEqual(options, [
        {
            text: {type: 'plain_text', text: 'atom'},
            value: 'atom'
        },
        {
            text: {type: 'plain_text', text: 'math'},
            value: 'math'
        }
    ]);
});

test('loads a random icanhazdadjoke search result as a single-part joke', async () => {
    const loadedJoke = new Joke();
    loadedJoke.getNerdJokesTags = async () => ['atom', 'math', 'pi'];
    loadedJoke.getRandomInt = (min) => min;
    let searchRequest;
    loadedJoke.fetchJson = async (url) => {
        const requestUrl = new URL(url);
        searchRequest = {
            tags: requestUrl.searchParams.get('term').split(' '),
            limit: Number(requestUrl.searchParams.get('limit'))
        };
        return {
            search_term: requestUrl.searchParams.get('term'),
            results: [{id: 'dad-1', joke: 'Donut worry, be happy.'}]
        };
    };

    await loadedJoke.load('icanhazdadjoke');

    assert.deepEqual(searchRequest, {
        tags: ['atom'],
        limit: 5
    });
    assert.equal(loadedJoke.id, 'icanhazdadjoke-dad-1');
    assert.equal(loadedJoke.question, 'Donut worry, be happy.');
    assert.equal(loadedJoke.answer, undefined);
    assert.equal(loadedJoke.source, 'icanhazdadjoke');
});

test('retries icanhazdadjoke searches before using the unfiltered endpoint', async () => {
    const loadedJoke = new Joke();
    loadedJoke.getNerdJokesTags = async () => ['atom'];
    loadedJoke.getRandomInt = (min) => min;
    let searchAttempts = 0;
    loadedJoke.fetchJson = async (url) => {
        const requestUrl = new URL(url);
        const tags = requestUrl.searchParams.get('term');
        if(tags?.length){
            searchAttempts++;
            return {results: []};
        }
        return {
            id: 'dad-2',
            joke: 'A random dad joke.'
        };
    };

    await loadedJoke.load('icanhazdadjoke');

    assert.equal(searchAttempts, 2);
    assert.equal(loadedJoke.id, 'icanhazdadjoke-dad-2');
    assert.equal(loadedJoke.source, 'icanhazdadjoke');
});

test('falls back to NerdJokes when all icanhazdadjoke attempts fail', async () => {
    const ddbc = createDdbClient([
        {Items: [{tag: 'server'}]},
        {Items: [{tag: 'server'}]},
        {Items: [joke]}
    ]);
    const loadedJoke = new Joke(ddbc);
    loadedJoke.getRandomInt = (min) => min;
    loadedJoke.fetchJson = async () => {
        throw new Error('random unavailable');
    };

    await loadedJoke.load('icanhazdadjoke');

    assert.equal(loadedJoke.question, joke.question);
    assert.equal(loadedJoke.source, 'NerdJokes');
});

test('appends source only to the final message', () => {
    const loadedJoke = new Joke();
    loadedJoke.source = 'JokeAPI';

    assert.equal(
        loadedJoke.formatMessageText('Setup', false),
        'Setup'
    );
    assert.equal(
        loadedJoke.formatMessageText('Delivery', true),
        'Delivery\n\n— Source: JokeAPI'
    );
});

test('uses UTF-8 byte length for Slack JSON requests', async () => {
    const originalRequest = HTTPS.request;
    let requestOptions;
    let requestBody;
    HTTPS.request = (url, options, callback) => {
        requestOptions = options;
        const response = new EventEmitter();
        response.setEncoding = () => {};
        const request = new EventEmitter();
        request.write = (body) => {
            requestBody = body;
        };
        request.end = () => {
            process.nextTick(() => {
                callback(response);
                response.emit('data', '{"ok":true}');
                response.emit('end');
            });
        };
        return request;
    };

    try {
        const message = new Message({
            text: 'Joke\n\n— Source: JokeAPI',
            b_token: 'test-token',
            api_method: 'chat.postMessage'
        });

        await message.slackApiPost();

        assert.equal(
            requestOptions.headers['Content-Length'],
            Buffer.byteLength(requestBody, 'utf8')
        );
    } finally {
        HTTPS.request = originalRequest;
    }
});
