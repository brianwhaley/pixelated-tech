const assert = require('node:assert/strict');
// eslint-disable-next-line pixelated/package-json-missing-dependency
const test = require('node:test');

const Event = require('./event');
const Joke = require('./joke');

const joke = {
    id: 'joke-1',
    question: 'Why do programmers prefer dark mode?',
    answer: 'Because light attracts bugs.'
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
        body: 'command=%2Fnerdjokes&text=getjokejson'
    });

    assert.equal(event.command, '/nerdjokes');
    assert.equal(event.text, 'getjokejson');
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
