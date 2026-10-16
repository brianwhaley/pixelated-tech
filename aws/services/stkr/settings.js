console.log('Loading Settings class');


var AWS = require("./aws");
var User = require("./user");
var Message = require("./message");

const log = true ;

module.exports = class Joke {

    constructor(){
        if(log) console.log("SETTINGS CONSTRUCTOR");
        return this ;
    }
    
    
    // ========================================
    //              GLOBAL SETTINGS 
    // ========================================
    
    
    async setSettings(event){
        if(log) console.log("SET SETTINGS");
        var user = new User({user_id: event.user_id});
        if(await user.isAdmin(event)){
            await this.setSettingsMessage(event);
        } else {
            await this.setSettingsNotAdmin(event);
        }
        return null;
    }
    
    
    async setSettingsMessage(event){
        if(log) console.log("SET SETTINGS MESSAGE");
        let _view = {
            "type": "modal",
        	"callback_id": "settings-submit",
            "private_metadata": JSON.stringify({channel_id: event.channel_id}),
            "clear_on_close": true,
            "notify_on_close": false,
        	"title": { "type": "plain_text", "text": "Stkr - Global Settings" },
        	"submit": { "type": "plain_text", "text": "Submit" },
        	"close": { "type": "plain_text", "text": "Cancel" },
        	"blocks": [
        		{
        			"type": "divider"
        		},{
        			"type": "input",
        			"block_id": "settings_view_image_types",
        			"element": {
        				"type": "static_select",
                        "action_id": "settings_image_type",
        				"placeholder": {
        					"type": "plain_text",
        					"text": "Select an item",
        					"emoji": true
        				},
        				"initial_option": {
    						"text": {
    							"type": "plain_text",
    							"text": "File (S3) Image Storage"
    						},
    						"value": "S3"
    					},
        				"options": [
        					{
        						"text": {
        							"type": "plain_text",
        							"text": "File (S3) Image Storage"
        						},
        						"value": "S3"
        					},
        					{
        						"text": {
        							"type": "plain_text",
        							"text": "URL Image Storage"
        						},
        						"value": "URL"
        					}
        				]
        			},
        			"label": {
        				"type": "plain_text",
        				"text": "Image Storage Method",
        				"emoji": true
        			}
        		},{
        			"type": "context",
        			"elements": [
        				{
        					"type": "mrkdwn",
        					"text": "*File (S3) Image Storage* - save uploaded images to a file system."
        				},
        				{
        					"type": "mrkdwn",
        					"text": "*URL Image Storage* - save URLs of web based images."
        				}
        			]
        		},{
        			"type": "divider"
        		}
        	]
        };
        if(log) console.log("SET SETTINGS MESSAGE - Set Value : ", event.image_storage);
        if(event.image_storage == "URL"){
            _view.blocks[1].element.initial_option = _view.blocks[1].element.options[1];
        }
        if(log) console.log("SET SETTINGS MESSAGE - View : ", _view);
        let message_data = {
            token: event.b_token,
            trigger_id: event.trigger_id ,
            view: _view ,
            b_token: event.b_token ,
            api_method: "views.open"
        };
        if(log) console.log("SET SETTINGS MESSAGE - Result : ", message_data);
        var message = new Message(message_data);
        await message.slackApiPost();
        return null;
    }
    
    
    async setSettingsNotAdmin(event){
        if(log) console.log("SET SETTINGS NOT ADMIN MESSAGE");
        var returntext = "Unfortunately, you are not a worspace admin. \n" + 
            "Only worspace admins can change Stkr Global Settings." ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }
    
    
    async setSettingsSubmit(event){
    	if(log) console.log("SET SETTINGS SUBMIT ");
        event.image_storage = event.view.state.values.settings_view_image_types.settings_image_type.selected_option.value ;
        var ddbc = new AWS.DDBCLIENT();
        await ddbc.updateToDynamo({
            tablename: ddbc.stkrTokenDB,
            key: { team_id : event.team_id } ,
            update_expr: "set image_storage = :imagestorage",
            attrib_vals: { ":imagestorage": event.image_storage }
        });
    	if(log) console.log("SET SETTINGS SUBMIT - Submitted ");
    	return null;
    }
    
    
    async setSettingsThankYou(event){
        if(log) console.log("SET SETTINGS SUBMIT THANK YOU");
        var returntext = "Thank you for updating Stkr Global Settings for your workspace! \n" ;
        await new Message().sendTextMessage(event,returntext);
        return null;
    }

 
};