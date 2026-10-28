console.log('Loading Stkr');
const Event = require("./event");
const StkrS3 = require("./stkr-s3");
const StkrURL = require("./stkr-url");
const Settings = require("./settings");
const Message = require("./message");

const log = true;


exports.handler = async function(data, _context) {
	// ########## STKR APP SETUP ##########
	if(log) console.log('STKR - Received DATA:', JSON.stringify(data));
	let result = null ;
	const event = new Event(data);
	if(data.body == null && data.queryStringParameters == null) {
		return event.directInstallRedirect(data);
	}


	if (event.code) {
		// ########## OAUTH REQUEST - APP INSTALL ##########
		// ########## THIS IS A WEB BASED REQUEST ##########
		result = event.oAuthVerify();
		return result;
	} else if(event.team_id){
		event.b_token = await event.getAccessToken();
		if(log) console.log("STKR - Access Token : " , event.b_token);
		event.image_storage = await event.getImageStorage();
		if(log) console.log("STKR - Image Storage : " , event.image_storage);
	}
    
    
	if (Object.prototype.hasOwnProperty.call(event, "type") || Object.prototype.hasOwnProperty.call(event, "event")) {
		let event_type;
		// let s3 = new AWS.S3();
		const stkr = (event.image_storage == "S3") ? new StkrS3() : new StkrURL() ;
		const settings = new Settings();
		if(Object.prototype.hasOwnProperty.call(event, "event")) { event_type = event.event.type; } 
		else if (Object.prototype.hasOwnProperty.call(event, "type")) { event_type = event.type; }
		if(log) console.log("STKR - Event Type: " , event_type);
		switch (event_type) {
		case "url_verification": 
			// ########## VERIFY EVENT CALLBACK URL ##########
			if(log) console.log("STKR - URL Verification");
			result = event.verifyURL(); 
			return result ;
			// break;
		case "app_uninstalled": 
			// ########## APP UNINSTALLED - DELETE ALL DATA FOR THAT WORKSPACE ##########
			if(log) console.log("STKR - App Uninstalled");
			await event.cleanUninstall();
			// ########## LOG EVENT ##########
			await event.logEvent();
			break;
		case "file_shared":
			// ########## FILE SHARED ##########
			// ########## MUST CREATE NEW CONVERSATION - NONE EXISTS YET ##########
			if(log) console.log("STKR - Event Callback");
			if(event.image_storage && event.image_storage == "S3"){
				await stkr.addNewImageFileShared(event);
			} else {
				if(log) console.log("STKR - Event Callback - Not S3 Image Storage - ", event.image_storage);
			}
			break;
		case "block_actions": {
			// ########## PROCESS IMAGE CONFIRMATION ##########
			const action_id = event.actions[0].action_id ;
			if(log) console.log("STKR - Block Actions : Action ID : ", action_id);
			switch (action_id) {
			case "shareimage_select":
				// ########## PROCESS URL IMAGE SHARE CONFIRMATION ##########
				// ########## PROCESS S3 IMAGE SHARE LIST CHOSEN ##########
				await stkr.shareImageProcess(event);
				break;
			case "deleteimage_select":
				// ########## PROCESS URL IMAGE SHARE CONFIRMATION ##########
				// ########## PROCESS S3 DELETE LIST CHOSEN ##########
				await stkr.deleteImageProcess(event); 
				break;
			case "upload-confirm-yes":
				// ########## PROCESS IMAGE UPLOAD CONFIRMATION ##########
				await stkr.addNewImageSubmit(event); 
				break;
			case "upload-confirm-no":
				// ########## PROCESS IMAGE UPLOAD DECLINE ##########
				await stkr.addNewImageErrorDeclined(event); 
				break;
			case "block_cancel": {
				// ########## BLOCK CANCELLED ##########
				// ########## delete previous message ##########
				const message4_data = {
					delete_original: true,
					b_token: event.b_token ,
					response_url: event.response_url
				};
				const message4 = new Message(message4_data);
				await message4.slackApiPost();
				break;
			}
			}
			// ########## LOG EVENT ##########
			await event.logEvent();
			break;
		}
		case "view_submission":
			// ########## MODAL DIALOG BOX SUBMITTED ##########
			if(log) console.log("STKR - View Submission - ", event.view.callback_id);
			if(event.view.callback_id == 'newimage-submit'){
				await stkr.addNewImageSubmit(event);
			}else if (event.view.callback_id == "settings-submit") {
				await settings.setSettingsSubmit(event);
				await settings.setSettingsThankYou(event);
				// ########## LOG EVENT ##########
				await event.logEvent();
			}
			// ########## 200 NULL SUBMIT CLOSES VIEW ##########
			break;
		case "view_closed":
			// ########## DIALOG BOX CLOSED ##########
			if(log) console.log("STKR - View Closed");
			break;
		case "interactive_message":
			if(log) console.log("STKR - Interactive Message");
			// ########## INTERACTIVE MESSAGES ##########
			// ########## INTERACTIVE MESSAGES REPLACED WITH BLOCK MESSAGES ##########
			break;
		default: 
                // result = "STKR - Event Type Error";
		}
	}
    
    
    
	// ########## SLASH COMMANDS ########## 
	if(event.command) {
		if((event.command == "/stkr") || (event.command == "/stkrz") || (event.command == "/stkrdev")){
			if (event.text.length == 0) {
				// ########## IF NO SLASH COMMAND TEXT, DEFAULT TO SHARE ##########
				event.text = "share" ;
			}
			// ########## SLASH COMMAND WITH TEXT ##########
			await event.processSlashCommand();
			// ########## LOG EVENT ##########
			await event.logEvent();
		} 
	}
    
	// ########## RESULT SHOULD NOT BE SET ##########
	if(log) console.log('STKR END - Response Results:', result);
    
	const finalMsg = {
		isBase64Encoded: false,
		statusCode: 200,
		headers: {
			"Content-type": "application/json; charset=utf-8",
			"Authorization": "Bearer " + event.b_token
		},
		body: null
	};
    
	if(log) console.log('STKR END - Final Message :', finalMsg);
	return finalMsg;
    
};