const AWS = require("aws-sdk");
const LAMBDA = new AWS.Lambda();
const CRYPTO = require('crypto');
const log = true;
const firstRequest = "Would you like to hear a nerd joke?";
const subsequentRequest = "Would you like to hear another nerd joke?";

exports.handler = async (event, context) => {
    if(log) console.log("NERD JOKE SKILL - Event Type : ", event.request.type);
    switch (event.request.type) {
        case "LaunchRequest":
            if(log) console.log("NERD JOKE SKILL - Launch Handler");
            return generateResponse(buildSpeechletResponse("Welcome to Nerd Jokes.  " + firstRequest , false));
        case "IntentRequest":
            switch (event.request.intent.name) {
                case "NerdJoke":
                    return NerdJokeHandler();
                case "AMAZON.FallbackIntent":
                    if(log) console.log("NERD JOKE SKILL - Fallback Handler");
                    return generateResponse(buildSpeechletResponse(firstRequest, false));
                case "AMAZON.HelpIntent":
                    if(log) console.log("NERD JOKE SKILL - Help Handler");
                    return generateResponse(buildSpeechletResponse(`
    Thanks for using Nerd Jokes version ${process.env.AWS_LAMBDA_FUNCTION_VERSION}.  
    There is not a lot to do with this skill, just a bunch of nerd jokes.  
    Would you like to hear a Nerd Joke?  
    Just say yes, or no.
    `, false));
                case "AMAZON.CancelIntent":
                case "AMAZON.StopIntent":
                    if(log) console.log("NERD JOKE SKILL - Stop Handler");
                    return generateResponse(buildSpeechletResponse("Thanks for listening to some nerd jokes.", true));
            }
        break;
    }
};


var NerdJokeHandler = async () => {
    if(log) console.log("NERD JOKE SKILL - Nerd Joke Handler");
    var joke = await getJoke();
    if(log) console.log("RECEIVED Joke : ", joke);
    var jokePayload = JSON.parse(joke.Payload) ;
    if(log) console.log("RECEIVED Payload: ", jokePayload);
    var jokeBody = JSON.parse(jokePayload.body);
    if(log) console.log("RECEIVED Body : ", jokeBody);
    return generateResponse(buildJokeSpeechletResponse(jokeBody, false));
};


var buildSpeechletResponse = (outputText, shouldEndSession) => {
    return {
        outputSpeech: {
            type: "PlainText",
            text: outputText 
        },
        shouldEndSession: shouldEndSession
    };
};

var buildJokeSpeechletResponse = (outputText, shouldEndSession) => {
    if(log) console.log("Build Response : ", outputText);
    var output = {
        outputSpeech: {
            type: "SSML",
            ssml: `<speak> 
                <p> ${outputText.question} </p> 
                <break time="0.5s"/>
                <p> ${outputText.answer} </p> 
                <break time="0.5s"/>
                <p> ${randomResponse()} </p>
                <p> ${subsequentRequest} </p>
                </speak>`
        },
        shouldEndSession: shouldEndSession
    };
    if(log) console.log("Build Response Output : ", output);
    return output;
};


var generateResponse = (speechletResponse) => {
    return {
        version: "1.0",
        response: speechletResponse
    };
};


var getJoke = async () => {
    var lambdaPayload = {
        "httpMethod": "POST",
        "headers": {
	        "Content-Type": "application/json",
        }, 
        "body": {
            "command": "/nerdjokes",
            "text": "getjokejson",
        }
    };
    if(log) console.log("GET JOKE - Lambda - Payload : ", lambdaPayload); 
    const lambdaParams = {
        FunctionName: 'nerdjokes:PROD',
        Payload: JSON.stringify(lambdaPayload)
    };
    if(log) console.log("GET JOKE - Lambda - Params : ", lambdaParams); 
    var myjoke = await callLambda(lambdaParams);
    if(log) console.log("GET JOKE - Lambda - Joke : ", myjoke); 
    return myjoke ;
};


var callLambda = async (params) => {
    return new Promise((resolve, reject) => {
        LAMBDA.invoke(params, function(error, data) {
            if (error) {
                console.log("CALL LAMBDA - ERROR", JSON.stringify(error));
                console.log("CALL LAMBDA - ERROR Code : ", JSON.stringify(error.code));
                console.log("CALL LAMBDA - ERROR Message : ", JSON.stringify(error.message));
                console.log("CALL LAMBDA - ERROR Stack : ", JSON.stringify(error.stack));
                reject(error);
            } else {
                if(log) console.log("CALL LAMBDA - Success");
                if(log) console.log("CALL LAMBDA - Success Data", data);
                resolve(data);
            }
        });
    });
};


var randomResponse = () => {
    var responses = [
        "" ,
        "Hahaha! That was an awesome joke!" ,
        "That was a great joke, right?" ,
        "Oh emm gee, that was a terrible joke." ,
        "LOL." ,
        "I call shenanigans!" ,
        "" ,
        "You're Sir Loll-a-lot," ,
        "Hahaha!" ,
        "Hm.  That was cheeky." ,
        "Hee hee hee!" ,
        "ROTFL!" ,
        "" ,
        "Oh My Giggle!" ,
        "What a dud." ,
        "Tee he he." ,
        "Thats sofa knee." ,
        "Womp, womp, womp." ,
        "" ,
        "That one cracks me up!" ,
        "Bazinga!" ,
        "Wow, what a nerdy joke." ,
        "Wakka Wakka!" ,
        "That one rocked my socks!" ,
        "" ,
        "Doh!" ,
        "Ugh.  Maybe the next joke will be better.",
        "Ba-dum-bum.  Shhhh.",
        "Ouch.  That one hurt.",
        "" ,
    ];
    var randomNumbers = [];
    for (var index = 0; index < 20; index++) {
        const randomValue = CRYPTO.randomBytes(8).readUInt32LE() / 0xffffffff;
        randomNumbers[index] = Math.floor(randomValue * responses.length);
    }
    var rnd = randomNumbers[Math.floor(Math.random() * randomNumbers.length)];
    if(log) console.log("RANDOM RESPONSE - Rnd :", rnd, " Text: ", responses[rnd]);
    return responses[rnd];
};
