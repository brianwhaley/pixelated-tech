console.log('Loading Stkr class');

const HTTP = require('http');
const HTTPS = require('https');
const URL = require('url');

var AWS = require("./aws");
var Stkr = require("./stkr");
var User = require("./user");
var Message = require("./message");

const log = true ;

module.exports = class StkrURL extends Stkr {

    constructor(){
        if(log) console.log("STKR URL CONSTRUCTOR");
        super();
    }
    
    
    // ========================================
    //              SHARED FUNCTIONS
    // ========================================
    
    
    async urlExists(url) {
        if(log) console.log("URL EXISTS ");
        if(log) console.log("URL EXISTS - URL : ", url);
        const request = (opts = {}, cb) => {
            const requester = opts.protocol === 'https:' ? HTTPS : HTTP;
            return requester.request(opts, cb);
        };
        var options = {
            method: 'HEAD',
            port: URL.parse(url).port,
            protocol: URL.parse(url).protocol,
            host: URL.parse(url).host,
            path: URL.parse(url).pathname,
        };
        return new Promise( (resolve, reject) => {
            var req = request(options, (res) => {
                if(log) console.log("URL EXISTS - Results ", res);
                if(log) console.log("URL EXISTS - Status Code : ", res.statusCode);
                if(log) console.log("URL EXISTS - Headers : ", JSON.stringify(res.headers));
                if(log) console.log("URL EXISTS - Content Type : ", res.headers['content-type']);
                /* 
                if(res.statusCode == 200){
                    resolve(true);
                } else {
                    resolve(false);
                }
                */
                resolve(res);
            });
            req.on("error", function (error) { 
                if(log) console.log("URL EXISTS - ERROR : ", JSON.stringify(error));
                if(log) console.log("URL EXISTS - ERROR Code : ", JSON.stringify(error.code));
                if(log) console.log("URL EXISTS - ERROR Message : ", JSON.stringify(error.message));
                if(log) console.log("URL EXISTS - ERROR Stack : ", JSON.stringify(error.stack));
                reject(false);
            });
            req.end();
        });
    }
    

    // ========================================
    //              LIST IMAGES
    // ========================================
    
    
    async getImageCount(event){
        if(log) console.log("GET URL IMAGE COUNT ");
        var ddbc = new AWS.DDBCLIENT();
        var qryCount = await ddbc.readFromDynamo({
            tablename: ddbc.stkrImageDB ,
            indexname: "team_id-index",
            key_cond_expr: "team_id = :teamid",
            attrib_vals: { ":teamid": event.team_id },
            select: 'COUNT'
        });
        this.image_list_count = qryCount.Count;
        if(log) console.log("GET URL IMAGE COUNT - Count : ", qryCount.Count);
        return null ;
    }
    
    
    async getImageList(event){
        var ddbc = new AWS.DDBCLIENT();
        let image_list = await ddbc.readFromDynamo({
            tablename: ddbc.stkrImageDB ,
            indexname: "team_id-index",
            key_cond_expr: "team_id = :teamid",
            attrib_vals: { ":teamid": event.team_id }
        });
        image_list.Items.sort(this.sortByProperty("image_name"));
        this.image_list = image_list.Items;
        this.image_list_count = this.image_list.length ;
        return null;
    }
    
    
    async getList(event){
        if(log) console.log("GET URL LIST ");
        await this.getImageList(event);
        // ########## GENERATE LIST ##########
        var image_list = this.image_list.map(item => { 
            return "* " + item.image_name ;
        }).sort();
        if(log) console.log("GET URL LIST - Images List : ", image_list);
        // ########## PACKAGE THE MESSAGE ##########
        if(this.image_list_count < 1) {
            await this.noListMessage(event);
        } else {
            await this.shareListMessage(event, image_list);
        }
        // ########## SEND THE MESSAGE ##########
        return null;
    }
    
    
    async noListMessage(event){
        if(log) console.log("NO URL LIST MESSAGE");
        var returntext = "No images have been added to Stkr to share with your teammates. \n" + 
            "Type '" + event.command + " add' to add images that can be shared. \n" + 
            "There is a limit of " + this.maxImages + " images that can be added and shared." ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async shareListMessage(event){
        if(log) console.log("SHARE URL LIST MESSAGE");
        if(log) console.log("SHARE URL LIST MESSAGE - Image List : ", image_list);
        var msgText ;
        await this.getImageList(event);
        // ########## GENERATE LIST ##########
        var image_list = this.image_list.map(item => { 
            return "* " + item.image_name ;
        }).sort();
        msgText = "List of URL images to share : " + "(" + this.image_list_count + " of " + this.maxImages + ") \n" ;
        msgText += image_list.join(" \n ") ;
        var returntext = msgText;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    // ========================================
    //              ADD NEW IMAGE 
    // ========================================
    
    
    async addNewImage(event){
        var user = new User({user_id: event.user_id});
        if(await user.isAdmin(event)){
            let message_data = await this.addNewImageMessage(event);
            if(log) console.log("ADD NEW URL IMAGE - Message Data : ", message_data);
            var message = new Message(message_data);
            await message.slackApiPost();
        } else {
            await this.addNewImageErrorNotAdmin(event);
        }
        return null;
    }
    
    
    async addNewImageMessage(event){
        if(log) console.log("ADD NEW URL IMAGE MESSAGE ");
        let _view = {
        	"type": "modal",
        	"callback_id": "newimage-submit",
            "private_metadata": JSON.stringify({channel_id: event.channel_id}),
            "clear_on_close": true,
            "notify_on_close": false,
        	"title": {
        		"type": "plain_text",
        		"text": "Stkr - Add Image"
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
        			"block_id": "newimage_view_title",
        			"text": {
        				"type": "plain_text",
        				"text": "Please paste your image URL here and submit."
        			}
        		},
        		{
        			"type": "input",
        			"block_id": "newimage_name_block",
        			"element": {
        				"type": "plain_text_input",
                        "action_id": "newimage_name",
        				"placeholder": {
        					"type": "plain_text",
        					"text": "Type in image name..."
        				}
        			},
        			"label": {
        				"type": "plain_text",
        				"text": "Image Name: (no spaces)"
        			}
        		},
        		{
        			"type": "input",
        			"block_id": "newimage_url_block",
        			"element": {
        				"type": "plain_text_input",
                        "action_id": "newimage_url",
        				"placeholder": {
        					"type": "plain_text",
        					"text": "Type in image URL..."
        				}
        			},
        			"label": {
        				"type": "plain_text",
        				"text": "Image URL:"
        			}
        		}
        	]
        };
        if(log) console.log("ADD NEW URL IMAGE MESSAGE - View : ", _view);
        let message = {
            trigger_id: event.trigger_id,
            view: _view,
            api_method: "views.open",
            b_token: event.b_token
        };
        if(log) console.log("ADD NEW URL IMAGE MESSAGE - Message : ", message);
        return(message);
    }
    
    
    async addNewImageSubmit(event){
    	if(log) console.log("ADD NEW URL IMAGE SUBMIT ");
        // ########## NEW IMAGE SUBMITTED ##########
        if(log) console.log("ADD NEW URL IMAGE SUBMIT - New Image Submitted");
        this.image_url = event.view.state.values.newimage_url_block.newimage_url.value ;
        this.image_name = event.view.state.values.newimage_name_block.newimage_name.value.replace(/\+/g, '-') ;
        var urlExists = await this.urlExists(this.image_url) ;
        this.image_type = urlExists.headers['content-type'] ;
        if (urlExists.statusCode == 200){
            if(log) console.log("ADD NEW URL IMAGE SUBMIT - New Image Exists");
            var mimes = ["image/jpeg", "image/jpg", "image/png"];
            if(mimes.includes(this.image_type)){
                // ########## NEW IMAGE SUBMITTED - ITS AN IMAGE ##########
                var ddbc = new AWS.DDBCLIENT();
                await ddbc.writeToDynamo({
                    tablename: ddbc.stkrImageDB,
                    item: {
                        team_id : event.team_id ,
                        stkr_id : Date.now().valueOf().toString() ,
                        image_name : this.image_name ,
                        image_url : this.image_url ,
                        put_date : new Date().toISOString() 
                    }
                });
                if(log) console.log("ADD NEW URL IMAGE SUBMIT - Saved ");
                await this.addNewImageThankYou(event);
                // ########## LOG EVENT ##########
                await event.logEvent();
            } else {
        	    if(log) console.log("ADD NEW URL IMAGE SUBMIT - Not Image ");
                await this.addNewNotImage(event);
            }
        } else {
    	    if(log) console.log("ADD NEW URL IMAGE SUBMIT - Error ");
            await this.addNewImageError(event);
        }
    	return null;
    }
    
    
    async addNewImageThankYou(event){
        if(log) console.log("ADD NEW URL IMAGE SUBMIT THANK YOU ");
        await this.getImageCount(event);
        if(log) console.log("ADD NEW URL IMAGE SUBMIT THANK YOU - Count : ", this.image_list_count);
        var returntext = "Thank you for adding " + this.image_name + " to Stkr! \n" + 
    				"This is image " + this.image_list_count + " of " + this.maxImages.toString() ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async addNewImageError(event){
        if(log) console.log("ADD NEW URL IMAGE SUBMIT ERROR ");
        var returntext = "There was an error with your image.  Please try again." ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async addNewNotImage(event){
        if(log) console.log("ADD NEW URL NOT IMAGE ");
        var returntext = "You have tried to add an unsupported file type to Stkr. \n" + 
            "Please upload a JPG or PNG file to Stkr.  Thanks!" ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async addNewImageErrorNotAdmin(event){
        if(log) console.log("ADD NEW URL IMAGE NOT ADMIN");
        var returntext = "Unfortunately, you are not a worspace admin. \n" + 
			"Only worspace admins can add images to Stkr." ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    // ========================================
    //            SHARE IMAGE
    // ========================================
    
    
    async shareImage(event){
        if(log) console.log("SHARE URL IMAGE");
        await this.getImageList(event) ;
        if(this.image_list_count == 0){
            await this.noListMessage(event);
        } else {
            // ########## PACKAGE THE MESSAGE ##########
            let message_data = await this.shareImageMessage(event);
            if(log) console.log("SHARE URL IMAGE - Message : ", message_data);
            var message = new Message(message_data);
            await message.slackApiPost();
        }
        return null;
    }
    
    
    async shareImageMessage(event){
        if(log) console.log("SHARE URL IMAGE MESSAGE ");
        // ########## GENERATE LIST ##########
        var image_list = this.image_list.map(item => { 
            return { "text": { "type": "plain_text", "text": item.image_name } , value: item.stkr_id } ;
        });
        if(log) console.log("SHARE URL IMAGE MESSAGE - Image List : ", image_list);
        let blocks = [
    		{
    			"type": "section",
    			"block_id": "shareimage_message",
    			"text": {
    				"type": "mrkdwn",
    				"text": "Please select a sticker image to share"
    			}
    		},
    		{
    			"type": "actions",
    			"elements": [
    				{
    					"type": "static_select",
    					"action_id": "shareimage_select",
    					"placeholder": {
    						"type": "plain_text",
    						"text": "Select an image..."
    					},
    					"options": image_list
    				},
    				{
    					"type": "button",
    					"text": {
    						"type": "plain_text",
    						"text": "Cancel"
    					},
    					"style": "danger",
    					"value": "shareimage_cancel",
                        "action_id": "block_cancel"
    				}
    			]
    		}
        ];
        let message = {
            token: event.b_token,
            channel: event.channel_id, 
            response_type: 'ephemeral', 
            replace_original: true,
            b_token: event.b_token,
            api_method: "chat.postMessage",
            response_url: event.response_url,
            blocks: blocks
        };
        if(log) console.log("SHARE URL IMAGE MESSAGE - Result : ", message);
        return(message);
    }
    
    
    async  shareImageProcess(event){
        if(log) console.log("SHARE URL IMAGE PROCESS ");
        // ########## GET IMAGE DATA FROM EVENT ########## 
        this.stkr_id = event.actions[0].selected_option.value ;
        // ########## QUERY DYNAMO FOR URL ##########
        var ddbc = new AWS.DDBCLIENT();
        let getImg = await ddbc.readFromDynamo({
            tablename: ddbc.stkrImageDB ,
            key_cond_expr: "team_id = :teamid AND stkr_id = :stkrid",
            attrib_vals: { ":teamid": event.team_id, ":stkrid": this.stkr_id }
        });
        if(log) console.log("SHARE URL IMAGE PROCESS - Get Img : ", getImg);
        this.image_name = getImg.Items[0].image_name ;
        this.image_url = getImg.Items[0].image_url;
        this.image_name = getImg.Items[0].image_name ;
        var blocks = [
    		{
    			"type": "image",
    			"title": {
    				"type": "plain_text",
    				"text": event.user.name + " shared " + this.image_name
    			},
    			"image_url": this.image_url,
    			"alt_text": this.image_name
    		}
    	];
        let message_data = {
            token: event.b_token,
            delete_original: true,
            replace_original: true,
            response_type: 'in_channel' ,
            channel: event.channel.id, 
            blocks: blocks,
            b_token: event.b_token ,
            api_method: "chat.postMessage" ,
            response_url: event.response_url
        };
        var message = new Message(message_data);
        await message.slackApiPost();
        return null;
    }
    
    
    // ========================================
    //            DELETE IMAGE 
    // ========================================
    
    
    async deleteImage(event){
        if(log) console.log("DELETE URL IMAGE ");
        var user = new User({user_id: event.user_id});
        if(await user.isAdmin(event)){
            await this.getImageList(event);
            if(this.image_list_count == 0){
                await this.noListMessage(event);
            } else {
                let message_data = await this.deleteImageMessage(event);
                var message = new Message(message_data);
                await message.slackApiPost();
            }
        } else {
            await this.deleteImageErrorNotAdmin(event);
        }
        return null;
    }
    
    
    async deleteImageMessage(event){
        if(log) console.log("DELETE IMAGE MESSAGE ");
        // ########## GENERATE LIST ##########
        var image_list = this.image_list.map(item => { 
            return { "text": { "type": "plain_text", "text": item.image_name } , value: item.stkr_id } ;
        });
        if(log) console.log("DELETE URL IMAGE - Images List : ", image_list);
        let blocks = [
    		{
    			"type": "section",
    			"block_id": "deleteimage_message",
    			"text": {
    				"type": "mrkdwn",
    				"text": "Please select a sticker image to delete"
    			}
    		},
    		{
    			"type": "actions",
    			"elements": [
    				{
    					"type": "static_select",
    					"action_id": "deleteimage_select",
    					"placeholder": {
    						"type": "plain_text",
    						"text": "Select an image..."
    					},
    					"options": image_list
    				},
    				{
    					"type": "button",
    					"text": {
    						"type": "plain_text",
    						"text": "Cancel"
    					},
    					"style": "danger",
    					"value": "deleteimage_cancel",
                        "action_id": "block_cancel"
    				}
    			]
    		}
        ];
        let message = {
            token: event.b_token,
            replace_original: true,
            response_type: 'ephemeral', 
            channel: event.channel_id, 
            blocks: blocks,
            b_token: event.b_token ,
            api_method: "chat.postMessage" ,
            response_url: event.response_url 
        };
        if(log) console.log("DELETE IMAGE MESSAGE - Result : ", message);
        return(message);
    }
    
    
    async deleteImageProcess(event){
        if(log) console.log("DELETE URL IMAGE PROCESS ");
        // ########## GET IMAGE DATA FROM EVENT ########## 
        this.stkr_id = event.actions[0].selected_option.value ;
        this.image_name = event.actions[0].selected_option.text.text ;
        // ########## QUERY DYNAMO FOR URL ##########
        var ddbc = new AWS.DDBCLIENT();
        let delImg = await ddbc.deleteFromDynamo({
            tablename: ddbc.stkrImageDB ,
            key: { "team_id" : event.team_id, stkr_id: this.stkr_id }
        });
        if(log) console.log("DELETE URL IMAGE PROCESS - DelImg : ", delImg);
        var returntext = "The image " + this.image_name + " has been deleted. " ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async deleteImageErrorNotAdmin(event){
        if(log) console.log("DELETE S3 IMAGE NOT ADMIN");
        var returntext = "Unfortunately, you are not a worspace admin. \n" + 
			"Only worspace admins can delete images from Stkr." ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
};