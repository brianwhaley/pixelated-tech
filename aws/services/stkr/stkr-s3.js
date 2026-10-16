console.log('Loading Stkr class');

const HTTPS = require('https');
const QS = require('querystring');

var AWS = require("./aws");
var Stkr = require("./stkr");
var User = require("./user");
var Message = require("./message");

const log = true ;

module.exports = class StkrS3 extends Stkr {

    constructor(){
        if(log) console.log("STKR S3 CONSTRUCTOR");
        super();
    }
    
    
    // ========================================
    //              SHARED FUNCTIONS
    // ========================================
    
    
    async getFileInfo(event){
        // ########## GET FILE INFO ##########
        var file_id = (event.event) ? event.event.file_id : event.actions[0].value ;
        if(log) console.log("FILE INFO - FILE ID : ", file_id);
        var message = { 
            token: event.b_token,
            file: file_id
        };
        if(log) console.log("FILE INFO - Request Message : ", message);
        var qstring = QS.stringify(message);
        if(log) console.log("FILE INFO - Request QString : ", qstring);
        var options = {
            method: "GET",
            port: 443,
            protocol: "https:",
            hostname: "slack.com",
            path: "/api/files.info?" + qstring,
        };
        if(log) console.log("FILE INFO - Request File Options : ", options);
        let retJSON = '';
        return new Promise( (resolve, reject) => {
            const request = HTTPS.request(options, (res) => {
                if(log) console.log('FILE INFO - Request Status Code:', res.statusCode);
                if(log) console.log('FILE INFO - Request Headers:', res.headers);
                res.setEncoding( 'utf8' );
                res.on("data", function(data) { 
                    retJSON += data; 
                });
                res.on("end", function () {
                    if(log) console.log("FILE INFO - Response Results", retJSON.toString());
                    resolve(JSON.parse(retJSON));
                });
            });
            request.on("error", function (error) { 
                if(log) console.log("FILE INFO - ERROR : ", JSON.stringify(error));
                if(log) console.log("FILE INFO - ERROR Code : ", JSON.stringify(error.code));
                if(log) console.log("FILE INFO - ERROR Message : ", JSON.stringify(error.message));
                if(log) console.log("FILE INFO - ERROR Stack : ", JSON.stringify(error.stack));
                reject(error);
            });
            request.end();
            if(log) console.log("FILE INFO - Request Results : ", request);
        });
    }
    
    
    async fetchImage(data){
        var imgBuffer;
        var options = {
            headers: {
                "Authorization": "Bearer " + data.b_token
            }
        };
        return new Promise( (resolve, reject) => {
            const request = HTTPS.get(data.url, options, (res) => {
                if(log) console.log('FETCH IMAGE - Request Status Code:', res.statusCode);
                if(log) console.log('FETCH IMAGE - Request Headers:', res.headers);
                // res.setEncoding('base64');
                var retIMG = Buffer.alloc(0);
                res.on("data", function(chunk) { 
                    retIMG = Buffer.concat([retIMG, chunk]);
                });
                res.on("end", function () {
                    imgBuffer = retIMG;
                    // if(log) console.log("FETCH IMAGE - Response Results : ", imgBuffer.toString());
                    if(log) console.log("FETCH IMAGE - Response Results : SUCCESS");
                    resolve(imgBuffer);
                });
            });
            request.on("error", function (error) { 
                console.log("FETCH IMAGE - ERROR : ", JSON.stringify(error));
                console.log("FETCH IMAGE - ERROR Code : ", JSON.stringify(error.code));
                console.log("FETCH IMAGE - ERROR Message : ", JSON.stringify(error.message));
                console.log("FETCH IMAGE - ERROR Stack : ", JSON.stringify(error.stack));
                reject(error);
            });
            request.end();
            if(log) console.log("FETCH IMAGE - Request Results : ", request);
        });
    }
    
    
    // ========================================
    //              LIST S3 IMAGES
    // ========================================
    
    
    async getImageCount(event){
        if(log) console.log("GET S3 IMAGE COUNT ");
        var s3 = new AWS.S3();
        var qryCount = await s3.getS3ItemCount({ 
            bucket: s3.stkrS3Bucket,
            team_id : event.team_id, 
        });
        this.image_list_count = qryCount ;
        return null ;
    }
    
    
    async getImageList(event){
        if(log) console.log("GET S3 IMAGE LIST ");
        var s3 = new AWS.S3();
        var qryList = await await s3.getS3ItemList({ 
            bucket: s3.stkrS3Bucket,
            team_id : event.team_id 
        });
        this.image_list = qryList ;
        if(log) console.log("GET S3 IMAGE LIST - ", this.image_list);
        return qryList ;
    }
    
    
    async getList(event){
        if(log) console.log("GET S3 LIST ");
        await this.getImageList(event);
        this.image_list_count = this.image_list.length ;
        if(log) console.log("GET S3 LIST - List Data : ", this.image_list);
        // ########## SEND THE MESSAGE ##########
        if(this.image_list.length < 1) {
            await this.noListMessage(event);
        } else {
            await this.shareListMessage(event);
        }
        return null;
    }
    
    
    async noListMessage(event){
        if(log) console.log("NO LIST MESSAGE ");
        var returntext = "No images have been uploaded to Stkr to share with your teammates. \n" + 
            "Drag and drop an image here or in the Stkr App channel to upload and share. \n" + 
            "There is a limit of " + this.maxImages + " images that can be uploaded and shared." ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async shareListMessage(event){
        if(log) console.log("SHARE S3 LIST MESSAGE ");
        if(log) console.log("SHARE S3 LIST MESSAGE - Image List : ", this.image_list);
        var msgText = "List of uploaded images to share : " + "(" + this.image_list_count + " of " + this.maxImages + ") \n" ;
        var image_names = this.image_list.map(img => { 
            return "* " + img.text.text  ;
        });
        msgText += image_names.join(" \n ") ;
        if(log) console.log("SHARE S3 LIST MESSAGE - Message Text : ", msgText);
        var returntext = msgText;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    // ========================================
    //              UPLOAD NEW S3 IMAGE 
    // ========================================
    
    
    async addNewImage(event){
        if(log) console.log("ADD NEW S3 IMAGE - Slash Command");
        var returntext = "If you would like to upload a new image, drag and drop it into a channel or direct message with Stkr." ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async addNewImageFileShared(event){
        if(log) console.log("ADD NEW S3 IMAGE - Event Callback");
        // ########## CHECK MAX IMAGES ##########
        await this.getImageCount(event);
        // ########## TOO MANY IMAGES ##########
        if(this.image_list_count >= this.maxImages){
            await this.addNewImageErrorMax(event);
            return null;
        }
        
        var fileInfo = await this.getFileInfo(event);
        this.image_url = fileInfo.file.url_private ;
        this.image_name = fileInfo.file.name ;
        this.image_type = fileInfo.file.filetype;
        
        var user = new User({user_id: event.user_id});
        if(await user.isAdmin(event)){
            // ########## VERIFY UPLOAD YES OR NO ##########
            const message_data = await this.addNewImageMessage(event);
            var message = new Message(message_data);
            await message.slackApiPost();
        } else {
           // ########## NOT AN ADMIN ##########
        }
        return null;
    }
    
    
    async addNewImageMessage(event){
    	let blocks =  [{
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Are you sure you want to upload " + this.image_name + " to Stkr?"
            }
    	},{
    		type: "actions",
    		elements: [{
        		type: "button",
        		text: {
        			type: "plain_text",
        			text: "Yes"
        		},
        		value: event.event.file_id,
        		action_id: "upload-confirm-yes"
        	},{
        		type: "button",
        		text: {
        			type: "plain_text",
        			text: "No"
        		},
        		value: "no",
        		action_id: "upload-confirm-no"
        	}]
    	}];
        let message = {
            token: event.b_token,
            channel: event.event.channel_id,
            user: event.event.user_id ,
            blocks: JSON.stringify(blocks),
            b_token: event.b_token,
            // api_method: "chat.postMessage"
            api_method: "chat.postEphemeral"
        };
        return(message);
    }
    
    
    async addNewImageSubmit(event){
        // ########## GET FILE INFO ##########
        if(log) console.log("PROCESS UPLOAD APPROVED ");
        if(log) console.log("PROCESS UPLOAD APPROVED - FILE ID : ", event.actions[0].value);
        var fileInfo = await this.getFileInfo(event);
        this.image_url = fileInfo.file.url_private ;
        this.image_name = fileInfo.file.name ;
        this.image_type = fileInfo.file.filetype;
        // ########## IS IMAGE ##########
        if((this.image_type !== "jpg") && (this.image_type !== "png")) {
            await this.addNewNotImage(event);
            return null;
        } 
        // ########## DOWNLOAD IMAGE TO BUFFER ##########
        this.image_buffer = await this.fetchImage({
            url: this.image_url,
            b_token: event.b_token
        });
        this.image_buffer_size = (this.image_buffer.byteLength / 1024) ;
        console.log( "PROCESS UPLOAD APPROVED - Buffer Size : ", this.image_buffer_size, " KB" );
        // ########## FILE SIZE CHECK ##########
        if(this.image_buffer_size > this.maxFileSize) {
            if(log) console.log("PROCESS UPLOAD APPROVED - Buffer Size Too Large: ", this.image_buffer_size , " KB" );
            await this.addNewImageErrorSize(event);
            return null;
        }
        // ########## UPLOAD IMAGE TO S3 ##########
        // TODO - CHECK TO SEE IF RETURN VALUE IS NEEDED FOR UPLOADIMGTOS3 FUNCTION
        var s3 = new AWS.S3();
        await s3.uploadImgToS3(this.image_buffer, {
            bucket: s3.stkrS3Bucket,
            team_id : event.team_id,
            filename: this.image_name
        });
        await this.getImageCount(event);
        // ########## RETURN MESSAGE ##########
        await this.addNewImageThankYou(event);
        return null;
    }
    
    
    async addNewImageThankYou(event){
        if(log) console.log("ADD NEW S3 IMAGE THANK YOU ");
        var returntext = "Thank you for uploading " + this.image_name + " to Stkr! \n" + 
                "This is image " + this.image_list_count + " of " + this.maxImages ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async addNewImageErrorDeclined(event){
        if(log) console.log("PROCESS UPLOAD DECLINED ");
        var returntext = "Thank you.  The image will not be uploaded to Stkr" ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async addNewImageErrorSize(event){
        if(log) console.log("ADD NEW S3 IMAGE ERROR" );
        var returntext = "You have tried to upload a file that is too large for Stkr - " + 
                this.image_name + " - " + this.image_buffer_size + " KB" + "\n" + 
                "Please upload a smaller JPG or PNG file to Stkr below " + this.maxFileSize + " KB.  Thanks!" ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async addNewImageErrorMax(event){
        if(log) console.log("ADD NEW S3 IMAGE ERROR" );
        var returntext = "Stkr has already uploaded the maximum number of images (" + this.maxImages + "). \n" + 
                "You can make more room by deleting images with '" + event.command + " delete' ." ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async addNewNotImage(event){
        if(log) console.log("PROCESS UPLOAD APPROVED - Unsupported file type: " + this.image_name);
        var returntext = "You have tried to upload an unsupported file type to Stkr - " + this.image_name + "\n" + 
                "Please upload a JPG or PNG file to Stkr.  Thanks!" ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    // ========================================
    //             SHARE IMAGE 
    // ========================================
    
    
    async shareImage(event){
        if(log) console.log("SHARE IMAGE ");
        await this.getImageCount(event);
        if(this.image_list_count == 0){
            await this.noListMessage(event);
        } else {
            await this.getImageList(event);
            await this.shareImageMessage(event);
        }
        return null;
    }
    
    
    async shareImageMessage(event){
        if(log) console.log("SHARE IMAGE MESSAGE ");
        let blocks = [
    		{
    			"type": "section",
    			"block_id": "sharelist_message",
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
    					"options": this.image_list
    				},
    				{
    					"type": "button",
    					"text": {
    						"type": "plain_text",
    						"text": "Cancel"
    					},
    					"style": "danger",
    					"value": "sharelist_cancel",
                        "action_id": "block_cancel"
    				}
    			]
    		}
        ];
        let message_data = {
            token: event.b_token,
            replace_original: true,
            response_type: 'ephemeral' ,
            channel: event.channel_id, 
            api_method: "chat.postMessage" ,
            response_url: event.response_url ,
            b_token: event.b_token ,
            blocks: blocks,
        };
        if(log) console.log("SHARE IMAGE MESSAGE - Result : ", JSON.stringify(message_data));
        var message = new Message(message_data);
        await message.slackApiPost();
        return null;
    }
    
    
    async shareImageProcess(event){
        if(log) console.log("SHARE IMAGE MESSAGE - Data : ");
        var s3 = new AWS.S3();
        var filename = event.actions[0].selected_option.value;
        var url = 'https://' + s3.stkrS3Bucket + '.s3.amazonaws.com/' + event.team_id + "/" + filename ;
        if(log) console.log("SHARE IMAGE MESSAGE - Url : ", url);
        var blocks = [
    		{
    			"type": "section",
    		    "block_id": "shareimage_message",
    			"text": {
    				"type": "plain_text",
    				"text": event.user.name + " shared " + filename 
    			}
    		},
    		{
    			"type": "image",
    		    "block_id": "shareimage_image",
    			"image_url": url,
    			"alt_text": filename
    		}
    	];
        if(log) console.log("SHARE IMAGE MESSAGE - Blocks : ", blocks);
        let message_data = {
            token: event.b_token,
            delete_original: true,
            replace_original: true,
            response_type: 'in_channel',
            channel: event.channel_id, 
            api_method: "chat.postMessage" ,
            response_url: event.response_url ,
            b_token: event.b_token ,
            blocks: blocks
        };
        if(log) console.log("SHARE IMAGE MESSAGE - Result : ", message_data);
        var message = new Message(message_data);
        await message.slackApiPost();
        return null;
    }
    
    
    // ========================================
    //              DELETE IMAGE 
    // ========================================
    
    
    async deleteImage(event){
        if(log) console.log("DELETE S3 IMAGE ");
        var user = new User({user_id: event.user_id});
        if(await user.isAdmin(event)){
            await this.getImageList(event);
            this.image_list_count = this.image_list.length ;
            if(log) console.log("GET S3 LIST - List Data : ", this.image_list);
            // ########## SEND THE MESSAGE ##########
            if(this.image_list_count < 1) {
                await this.noListMessage(event);
            } else {
                await this.deleteImageMessage(event);
            }
        } else {
            await this.deleteImageErrorNotAdmin(event);
        }
        return null;
    }
    
    
    async deleteImageMessage(event){
        if(log) console.log("DELETE LIST MESSAGE ");
        if(log) console.log("DELETE LIST MESSAGE - Images : ", this.image_list);
        let blocks = [
    		{
    			"type": "section",
    			"block_id": "deletelist_message",
    			"text": {
    				"type": "mrkdwn",
    				"text": "Please select a sticker image to delete"
    			}
    		},{
    			"type": "actions",
    			"elements": [
    				{
    					"type": "static_select",
    					"action_id": "deleteimage_select",
    					"placeholder": {
    						"type": "plain_text",
    						"text": "Select an image..."
    					},
    					"options": this.image_list
    				},{
    					"type": "button",
    					"text": {
    						"type": "plain_text",
    						"text": "Cancel"
    					},
    					"style": "danger",
    					"value": "deletelist_cancel",
                        "action_id": "block_cancel"
    				}
    			]
    		}
        ];
        let message_data = {
            token: event.b_token,
            replace_original: true,
            response_type: 'ephemeral' ,
            channel: event.channel_id, 
            api_method: "chat.postMessage" ,
            response_url: event.response_url ,
            b_token: event.b_token ,
            blocks: blocks,
        };
        if(log) console.log("DELETE LIST MESSAGE - Result : ", message_data);
        var message = new Message(message_data);
        await message.slackApiPost();
        return null;
    }
    
    
    async deleteImageProcess(event){
        if(log) console.log("DELETE IMAGE COMPLETE ");
        let s3 = new AWS.S3();
        await s3.deleteImgFromS3({
            bucket: s3.stkrS3Bucket,
            filename: event.actions[0].selected_option.value,
            team_id: event.team_id
        }); 
        var filename = event.actions[0].selected_option.value;
        var returntext = "File " + filename + " has been deleted from Stkr succesfully." ;
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