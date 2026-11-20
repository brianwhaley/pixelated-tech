console.log('Loading Joke class');

const CRYPTO = require('crypto');
const HTTPS = require('https');
const {
    RegExpMatcher,
    englishDataset,
    englishRecommendedTransformers
} = require('obscenity');
var AWS = require("./aws");
var Message = require("./message");
const PROFANITY_MATCHER = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers
});
const EXTERNAL_PROVIDER_ATTEMPTS = 2;
const providers = {
    nerdjokes: require("./providers/nerdjokes"),
    jokeapi: require("./providers/jokeapi"),
    icanhazdadjoke: require("./providers/icanhazdadjoke"),
    officialjokeapi: require("./providers/official-joke-api"),
    geekjokes: require("./providers/geek-jokes"),
    teehee: require("./providers/teehee"),
    chucknorris: require("./providers/chuck-norris")
};

const log = false ;
module.exports = class Joke {

    constructor(ddbc){
        if(log) console.log("JOKE CONSTRUCTOR");
        this.ddbc = ddbc;
        this.id ;
        this.question ;
        this.answer ;
        this.source ;
        this.sourceUrl ;
        this.raw ;
        this.tags ;
        this.email = "nerdjokes@pixelated.tech" ;
        return this ;
    }
 
    async load(provider = this.getRandomItems(Object.keys(providers), 1)[0]){
        if(log) console.log("JOKE LOAD");
        const selectedProvider = providers[provider];
        if(!selectedProvider){
            throw new Error(`Unknown joke provider: ${provider}`);
        }
        const attempts = provider === "nerdjokes" ? 1 : EXTERNAL_PROVIDER_ATTEMPTS;
        for(let attempt = 1; attempt <= attempts; attempt++){
            try {
                const result = await selectedProvider.load(this);
                if(!["nerdjokes", "jokeapi"].includes(provider) && this.containsProfanity(result)){
                    throw new Error(`${provider} returned blocked content`);
                }
                this.assign(result);
                return;
            } catch(error) {
                console.log(`${provider} WARNING : `, JSON.stringify(error));
                console.log(`${provider} WARNING Message : `, JSON.stringify(error.message));
                if(provider === "nerdjokes"){
                    throw error;
                }
                if(attempt < attempts){
                    console.log(`${provider} RETRY : attempt ${attempt + 1} of ${attempts}`);
                }
            }
        }
        console.log(`${provider} FALLBACK : NerdJokes`);
        this.assign(await providers.nerdjokes.load(this));
    }

    assign(result){
        Object.assign(this, result);
    }

    containsProfanity(result){
        return ["question", "answer"]
            .some((field) => typeof result?.[field] === "string" &&
                PROFANITY_MATCHER.hasMatch(result[field]));
    }

    async fetchJson(url, source, headers = {}){
        return new Promise((resolve, reject) => {
            const request = HTTPS.get(
                url,
                {
                    headers: {
                        "Accept": "application/json",
                        ...(source === "icanhazdadjoke" && {
                            "User-Agent": "NerdJokes development test"
                        }),
                        ...headers
                    }
                },
                (response) => {
                    let body = "";
                    response.setEncoding("utf8");
                    response.on("data", (chunk) => {
                        body += chunk;
                    });
                    response.on("end", () => {
                        if(response.statusCode < 200 || response.statusCode >= 300){
                            reject(new Error(`${source} returned HTTP ${response.statusCode}`));
                            return;
                        }
                        try {
                            resolve(JSON.parse(body));
                        } catch(error) {
                            reject(new Error(`${source} returned invalid JSON`));
                        }
                    });
                }
            );
            request.setTimeout(3000, () => {
                request.destroy(new Error(`${source} request timed out`));
            });
            request.on("error", reject);
        });
    }


// ==========================================
//            SHARED FUNCTIONS
// ==========================================


    sortByProperty(property){  
        // MUST RUN AGAINST AN ARRAY AS ARRAY SORT FUNCTION
        // https://medium.com/@asadise/sorting-a-json-array-according-one-property-in-javascript-18b1d22cd9e9
        return function(a,b){  
            if(a[property] > b[property])  
                return 1;  
            else if(a[property] < b[property])  
                return -1;
            return 0;  
        }; 
    }

    getRandomItems(items, count){
        if(!Array.isArray(items) || !items.length || !Number.isInteger(count) || count <= 0){
            return [];
        }
        const remaining = [...items];
        const selected = [];
        const selectionCount = Math.min(count, remaining.length);
        while(selected.length < selectionCount){
            const index = this.getRandomInt(0, remaining.length - 1);
            selected.push(...remaining.splice(index, 1));
        }
        return selected;
    }

    async getNerdJokesTags(count){
        const ddbc = this.ddbc || new AWS.DDBCLIENT();
        const result = await ddbc.scanFromDynamo({
            tablename: ddbc.jokesTagsDB,
            proj_expr: "tag"
        });
        const tags = [...new Set(
            (result?.Items || [])
                .map((item) => item.tag)
                .filter((tag) => typeof tag === "string" && tag.trim())
        )];
        return Number.isInteger(count) ? this.getRandomItems(tags, count) : tags;
    }
    
    
    getRandomInt (min, max) {
        var numbers = [];
        numbers.length = 20;
        for (var i = 0; i < numbers.length ; i++) {
            numbers[i] = this.randomCryptoInt(min, max);
        }
        if(log) console.log("GET RANDOM INT - Min: " , min , " Max: ", max , " Nums: ", numbers);
        return numbers[this.randomInt(0, numbers.length - 1)];
    }
    getGUID(){
        console.log("GET GUID");
        const guid = this.randomGUIDv4();
        console.log("GET GUID - ", guid);
        return guid ;
    }
    randomInt(min, max) {
        // min and max are inclusive
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    randomCryptoInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        if(min >= max) return false;
        const diff = max - min + 1;
        const rnd = CRYPTO.randomBytes(8).readUInt32LE() / 0xffffffff ;
        return Math.floor( rnd * diff ) + min ; 
    }
    randomGUIDv1(){
        var hexString = CRYPTO.randomBytes(16).toString("hex");
        var guidString = hexString.substring(0,8) + "-" + 
            hexString.substring(8,12) + "-" + 
            hexString.substring(12,16) + "-" + 
            hexString.substring(16,20) + "-" + 
            hexString.substring(20);
        return guidString;
    }
    randomGUIDv4(){
        if(log) console.log("RANDOM GUID v4 ");
        const guid = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ (CRYPTO.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16)
        );
        if(log) console.log("RANDOM GUID v4 - ", guid);
        return guid ;
    }
    randomStr(howMany, chars) {
        chars = chars || 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
        var rnd = CRYPTO.randomBytes(howMany);
        var value = new Array(howMany);
        var len = Math.min(256, chars.length);
        var d = 256 / len ;
        for (var i = 0; i < howMany; i++) {
              value[i] = chars[Math.floor(rnd[i] / d)];
        }
        return value.join('');
    }


// ==========================================
//            ADD JOKE FUNCTIONS
// ==========================================

    
    async addNewJoke(event){
        if(log) console.log("ADD NEW JOKE ");
        const message_data = await this.addNewJokeMessage(event);
        if(log) console.log("ADD NEW JOKE - Message : ", message_data);
        var message = new Message(message_data);
        await message.slackApiPost();
        return null;
    }
    
    
    async addNewJokeMessage(event){
        if(log) console.log("ADD NEW JOKE MESSAGE ");
        var tag_options = await this.getTagOptions(event);
        const _view = JSON.stringify({
        	"type": "modal",
        	"callback_id": "newjoke-submit",
            "private_metadata": JSON.stringify({channel_id: event.channel_id}),
            "clear_on_close": true,
            "notify_on_close": false,
        	"title": {
        		"type": "plain_text",
        		"text": "NerdJokes Add New Joke"
        	},
        	"submit": {
        		"type": "plain_text",
        		"text": "Submit"
        	},
        	"close": {
        		"type": "plain_text",
        		"text": "Cancel"
        	},
        	"blocks": [
        		{
        			"type": "section",
        			"block_id": "newjoke_view_title",
        			"text": {
        				"type": "mrkdwn",
        				"text": "Please enter the details of your new joke."
        			}
        		},
        		{
        			"type": "input",
        			"block_id": "newjoke_question_block",
        			"element": {
        				"type": "plain_text_input",
        				"multiline": true,
                        "action_id": "newjoke_question"
        			},
        			"label": {
        				"type": "plain_text",
        				"text": "Question:"
        			}
        		},
        		{
        			"type": "input",
        			"block_id": "newjoke_answer_block",
        			"element": {
        				"type": "plain_text_input",
        				"multiline": true,
                        "action_id": "newjoke_answer"
        			},
        			"label": {
        				"type": "plain_text",
        				"text": "Answer:"
        			}
        		},{
    				"type": "input",
                    "block_id": "newjoke_tags_block",
    				"label": {
    					"type": "plain_text",
    					"text": "Tags: (select all that apply)"
    				},
    				"element": {
    					"type": "multi_static_select",
                        "action_id": "newjoke_tags_selected",
    					"placeholder": {
    						"type": "plain_text",
    						"text": "Select tags..."
    					},
    					// "initial_option": { },
    					"options": tag_options 
    				}
    			}
        	]
        });
        if(log) console.log("ADD NEW JOKE MESSAGE - View : ", _view);
        const message = {
            trigger_id: event.trigger_id,
            view: _view,
            api_method: "views.open",
            b_token: event.b_token
        };
        if(log) console.log("ADD NEW JOKE MESSAGE - Message : ", message);
        return(message);
    }
    
    
    async getTagOptions(event){
    	if(log) console.log("GET TAG OPTIONS ");
        const tags = await this.getNerdJokesTags();
        if(log) console.log("GET TAG OPTIONS - Tags : ", tags);
        // ==#####== SORT ITEMS ==#####== 
        tags.sort();
        if(log) console.log("GET TAG OPTIONS - Tags Sorted : ", tags);
        var items = [];
        for (var i = 0; i < tags.length; i++) {
            var item = {};
            item.text = { "type": "plain_text", "text": tags[i] } ;
            item.value = tags[i] ;
            items.push(item);
        }
        if(log) console.log("GET TAG OPTIONS : ", items);
        return items;
    }


    async addNewJokeSubmit(event){
    	if(log) console.log("ADD NEW JOKE SUBMIT ");
        // var prvmeta = JSON.parse(event.view.private_metadata);
        var q = event.view.state.values.newjoke_question_block.newjoke_question.value.replace(/\+/g, ' ') ;
        var a = event.view.state.values.newjoke_answer_block.newjoke_answer.value.replace(/\+/g, ' ') ;
        var tags = event.view.state.values.newjoke_tags_block.newjoke_tags_selected.selected_options ; // array
        var tags_set = [];
        for(var key in tags) {
            var tag = tags[key];
        //tags.forEach(async function(tag) {
            tags_set.push(tag.value);
        }
        if(event.team.id == "T011Q2H2HQ8" && event.user.id == "U011Q2H2KG8"){
            var ddbc = new AWS.DDBCLIENT();
            await ddbc.writeToDynamo({
                tablename: ddbc.jokesDB,
                item: {
                    id : this.getGUID() ,// Date.now().valueOf().toString() ,
                    question : q ,
                    answer : a ,
                    tags : await ddbc.createDynamoSet(tags_set) ,
                    put_date : new Date().toISOString() 
                }
            });
        	if(log) console.log("ADD NEW JOKE SUBMIT - Submitted ");
        } else {
            var ses = new AWS.SES();
            await ses.sendEmail({
                to: this.email,
                from: this.email,
                subject: "New NerdJokes Submitted",
                body: q + "\n\n" + a
            });
        }
        await this.addNewJokeThankYou(event);
        return null;
    }


    async addNewJokeThankYou(event){
        if(log) console.log("ADD NEW JOKE THANK YOU ");
        var returntext = "Thank you for submitting a new NerdJoke!" ;
        await new Message().sendTextMessage(event,returntext);
       
        return null;
    }


// ==========================================
//            SEND JOKE FUNCTIONS
// ==========================================


    async sendJoke(event){
        if(log) console.log("SEND JOKE " );
        // const joke = await this.getJoke();
        const sendquestion = await this.sendJokeQuestion(event);
        if(sendquestion.error){
            event.error = sendquestion.error ;
            await this.sendJokeError(event);
        } else {
            var my_ts;
            if (await sendquestion) {
                if (await sendquestion.message) {
                    my_ts = await sendquestion.message.ts;
                } else {
                    my_ts = await sendquestion.ts;
                }
            }
            const sendanswer = await this.sendJokeAnswer(event, my_ts );
            if(sendanswer.error){
                event.error = sendanswer.error ;
                await this.sendJokeError(event);
            }
        }
        return null;
    }


    async sendJokeQuestion(event){
        if(log) console.log("SEND JOKE QUESTION ");
        const message_data = {
            token: event.b_token,
            replace_original: true,
            channel: event.channel_id,
            response_type: 'in_channel' ,
            text: this.formatMessageText(this.question, !this.answer),
            b_token: event.b_token ,
            api_method: "chat.postMessage" ,
        };
        if(log) console.log("SEND JOKE QUESTION - Result : ", message_data);
        var message = new Message(message_data);
        var result = await message.slackApiPost() ;
        return result;
    }


    async sendJokeAnswer(event, q_ts){
        if(log) console.log("SEND JOKE ANSWER - Even ");
        if(log) console.log("SEND JOKE ANSWER - Q TS : ", q_ts);
        if(!this.answer){
            return {ok: true};
        }
        const message_data = {
            token: event.b_token,
            replace_original: true,
            channel: event.channel_id,
            response_type: 'in_channel' ,
            text: this.formatMessageText(this.answer, true),
            b_token: event.b_token ,
            api_method: "chat.postMessage" ,
            thread_ts: q_ts 
        };
        if(log) console.log("SEND JOKE ANSWER - Result : ", message_data);
        var message = new Message(message_data);
        var result = await message.slackApiPost() ;
        return result;
    }

    formatMessageText(text, includeSource){
        const message = (text || "").replace(/’/g, "'");
        if(!includeSource || !this.source){
            return message;
        }
        return `${message}\n\n— Source: ${this.source}`;
    }
    
    
    async sendJokeError(event){
        console.log("SEND JOKE WARNING : ", JSON.stringify(event.error));
        var returntext = "NerdJokes Warning: " + event.error + "\n";
        if(event.error == "channel_not_found"){
            returntext += "You have tried to send a NerdJoke in a channel that NerdJokes is not a member. \n" + 
                "Please add NerdJokes to this channel by typing '/invite @NerdJokes' or try using another channel. ";
        } 
        await new Message().sendTextMessage(event, returntext);
        return null;
    }
 
};