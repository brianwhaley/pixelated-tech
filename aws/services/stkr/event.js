console.log('Loading Event class');

var AWS = require("./aws");
var Stkr = require("./stkr");
var StkrS3 = require("./stkr-s3");
var StkrURL = require("./stkr-url");
var Settings = require("./settings");
var Message = require("./message");

const log = true ;

module.exports = class Event {

    constructor(data){
        if(log) console.log("EVENT CONSTRUCTOR");
        if(log) console.log('EVENT - Received DATA:', JSON.stringify(data));
        var temp;
        this.b_token;
        this.v_token = (data.stageVariables) ? data.stageVariables.VERIFICATION_TOKEN : undefined ;
        this.client_id = (data.stageVariables) ? data.stageVariables.CLIENT_ID : undefined ;
        this.client_secret = (data.stageVariables) ? data.stageVariables.CLIENT_SECRET : undefined ;
        this.env = (data.stageVariables) ? data.stageVariables.ENV : "PROD" ;
        

        if (data.httpMethod == "POST"){
            if(log) console.log("EVENT - RECEIVED POST");
            if(data.headers['Content-Type'] == "application/json"){
            if(log) console.log("EVENT - RECEIVED POST - JSON");
                temp = (typeof data.body == "string") ? JSON.parse(data.body) : data.body ;
                for(var i in temp) this[i] = temp[i];
            } else if(data.headers['Content-Type'] == 'application/x-www-form-urlencoded' ){
                if(log) console.log("EVENT - RECEIVED POST - URLENCODED");
                temp = this.querystringToJSON(data.body);
                if(temp.payload) {
                    temp = JSON.parse(temp.payload);
                    if(log) console.log("EVENT - RECEIVED PAYLOAD : ", JSON.stringify(temp));
                }
                for(var k in temp) this[k] = temp[k];
            }
        } else if (data.httpMethod == "GET"){
            if(log) console.log("EVENT - RECEIVED GET");
            if(data.queryStringParameters){
                // ########## OAUTH ##########
                temp = data.queryStringParameters;
                for(var m in temp) this[m] = temp[m];
                if (log) console.log("EVENT - Event Code : ", this.code);
            }
        }
        
        this.setTeamId();
        this.setUserId();
        this.setChannelId();
        this.setEventType();
        
        if(log) console.log('EVENT - Event:', JSON.stringify(this));
        return this ;
    }
    

// ==========================================
//            SHARED FUNCTIONS
// ==========================================


    querystringToJSON(qs) {
        if(log) console.log("QUERYSTRING TO JSON");
        var pairs = qs.split('&');
        var result = {};
        for(var key in pairs) {
            var pair = pairs[key];
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        }
        return JSON.parse(JSON.stringify(result));
    }
    
    
    async processSlashCommand(){
        if(log) console.log("PROCESS SLASH COMMAND ");
        if(log) console.log("PROCESS SLASH COMMAND - Text : ", this.text);
        // let result ;
        let returntext;
        var stkr = (this.image_storage == "S3") ? new StkrS3() : new StkrURL() ;
        var settings = new Settings();
        switch (this.text) {
            case "help": 
                if(log) console.log("PROCESS SLASH COMMAND - Help");
                returntext = this.helpMessage();
                await new Message().sendTextMessage(this,returntext);
                break;
            case "bug": 
                if(log) console.log("PROCESS SLASH COMMAND - Bug");
                returntext = "If you want to report a bug, email " + stkr.email_link + " or " +
                    "join the bug channel on the pixelated-tech.slack.com workspace.";
                await new Message().sendTextMessage(this,returntext);
                break;
            case "support": 
                if(log) console.log("PROCESS SLASH COMMAND - Support");
                returntext = "If you need some support, email " + stkr.email_link + " or " +
                    "join the support channel on the pixelated-tech.slack.com workspace.";
                await new Message().sendTextMessage(this,returntext);
                break;
            case "list": 
                if(log) console.log("PROCESS SLASH COMMAND - List");
                await stkr.getList(this);
                break;
            case "share": 
                if(log) console.log("PROCESS SLASH COMMAND - Share");
                await stkr.shareImage(this);
                break;
            case "version":
                if(log) console.log("PROCESS SLASH COMMAND - Version");
                var version = process.env.AWS_LAMBDA_FUNCTION_VERSION ;
                returntext = "This is version " + version + " of Stkr.  Enjoy!" ;
                await new Message().sendTextMessage(this,returntext);
                break;
            case "settings": 
                if(log) console.log("PROCESS SLASH COMMAND - Settings");
                await settings.setSettings(this);
                break;
            case "add": 
                if(log) console.log("PROCESS SLASH COMMAND - Add");
                await stkr.addNewImage(this);
                break;
            case "delete": 
                if(log) console.log("PROCESS SLASH COMMAND - Delete");
                await stkr.deleteImage(this);
                break;         
            default: 
                if(log) console.log("PROCESS SLASH COMMAND - Default");
                returntext = "Stkr: Unknown Image or Command - " + this.text;
                await new Message().sendTextMessage(this,returntext);
        }
        return null ;
    }
    
    
    directInstallRedirect(data){
        if(data.body == null && data.queryStringParameters == null) {
            // ########## DIRECT INSTALL FROM APP DIRECTORY ==#####
            if(log) console.log("STKR - DIRECT INSTALL FROM APP DIRECTORY ");
            var url = "https://slack.com/oauth/v2/authorize" ;
            var qs = "client_id=" + this.client_id  + "&scope=chat:write,commands,im:write" ; 
            var msg = {
                statusCode: 302,
                headers: { "Location": url + "?" + qs },
                body: null
            };
            if(log) console.log("STKR - DIRECT INSTALL FROM APP DIRECTORY - Message", msg);
            return msg;
        }
    }
    
    
    setTeamId(){
        if(log) console.log("SET TEAM ID ");
        var teamId = null;
        if(this.team_id) { teamId = this.team_id}
        else if(this.team) {  teamId = this.team.id ; }
        // else (this.team_id = "N/A");
        teamId = (this.env != "PROD") ? teamId + "-" + this.env : teamId ;
        if(log) console.log("SET TEAM ID : ", teamId);
        this.team_id = teamId;
        return null;
    }
    
    setUserId(){
        if(log) console.log("SET USER ID ");
        var userId = null;
        if (this.user_id) { userId = this.user_id; }
        else if (this.user) { userId = this.user.id ; }
        else if(this.authed_user) { userId = this.authed_user.id ; }
        else if(this.event) { userId = this.event.user_id ; }
        else { userId = "." ; }
        if(log) console.log("SET USER ID - userId : ", userId);
        this.user_id = userId ;
        return null;
    }
    
    setChannelId(){
        if(log) console.log("SET CHANNEL ID ");
        var channelId = null ;
        if (this.channel_id){ channelId = this.channel_id; } 
        else if (this.channel){ channelId = this.channel.id ; } 
        else if (this.event){ channelId = this.event.channel_id ; } 
        else if (this.view && this.view.private_metadata) { channelId = JSON.parse(this.view.private_metadata).channel_id ; }
        else { channelId = "." ; }
        if(log) console.log("SET CHANNEL ID - channelId : ", channelId);
        this.channel_id = channelId ;
        return null;
    }
    
    setEventType(){
        if(log) console.log("SET EVENT TYPE ");
        var eventType = null;
        if(this.command && this.text) { eventType = this.command + " " + this.text ; }
        else if (this.event) { eventType = this.event.type ; }
        else if (this.view) { eventType = this.view.callback_id ; }
        else if (this.actions){ eventType = this.actions[0].action_id ; }
        else if (this.code) { eventType = "app_installed" ; }
        if(log) console.log("SET EVENT TYPE - eventType : ", eventType);
        this.event_type = eventType ;
        return null;
    }
    
    
    async getAccessToken(){
        if(log) console.log("GET ACCESS TOKEN");
        var b_token ;
        if(this.team_id) {
            var ddbc = new AWS.DDBCLIENT();
            var getAuth = await ddbc.readFromDynamo({
                tablename: ddbc.stkrTokenDB,
                key_cond_expr: "team_id = :teamid",
                attrib_vals: { ":teamid": this.team_id },
                proj_expr: "access_token"
            });
            if(log) console.log("GET ACCESS TOKEN - Auth Results : ", getAuth);
            b_token = await getAuth.Items[0].access_token;
            if(log) console.log("GET ACCESS TOKEN - Access Token : ", b_token);
            return b_token;
        }
    }
    
    
    async getImageStorage(){
        if(log) console.log("GET IMAGE STORAGE");
        var image_storage ;
        if(this.team_id) {
            var ddbc = new AWS.DDBCLIENT();
            var getImgStor = await ddbc.readFromDynamo({
                tablename: ddbc.stkrTokenDB,
                key_cond_expr: "team_id = :teamid",
                attrib_vals: { ":teamid": this.team_id },
                proj_expr: "image_storage"
            });
            if(log) console.log("GET IMAGE STORAGE - Image Storage Results : ", getImgStor);
            image_storage = (await getImgStor.Items[0].image_storage) ? await getImgStor.Items[0].image_storage : "S3" ;
            if(log) console.log("GET IMAGE STORAGE - Image Storage : ", image_storage);
            return image_storage;
        }
    }
    
    
    verifyURL(e_challenge, e_token, v_token) {
        if(log) console.log("VERIFY URL - Event Challenge ");
        var result;
        // ########## CHALLENGE ##########
        if (this.token === this.v_token) {
            result = { challenge: this.challenge };
        } else {
            result = "VERIFY URL - Verification Failed";   
        }
        if(log) console.log("VERIFY URL - Results : ", result);
        return {
            statusCode: 200,
            isBase64Encoded: false,
            headers: {"content-type": "application/x-www-form-urlencoded"},
            body: JSON.stringify(result)
        };
    }
    
    
    async oAuthVerify() {
        if(log) console.log("OAUTH VERIFY - OAuth - App Install ");
        var stkr = new Stkr();
        const message_data = {
            client_id: this.client_id,
            client_secret: this.client_secret,
            code: this.code ,
            api_method: "oauth.v2.access"
        };
        if(log) console.log("OAUTH VERIFY - OAuth Message Data : ", message_data );
        var message = new Message(message_data);
        var oauthaccess = await message.slackApiGet();
        if(log) console.log("OAUTH VERIFY - OAuth - Verify : ", oauthaccess);
        this.team_id = oauthaccess.team.id;
        this.setTeamId();
        if(log) console.log("OAUTH VERIFY - Set Team ID : ", this.team_id);
        var ddbc = new AWS.DDBCLIENT();
        const storeAuth = await ddbc.writeToDynamo({
            tablename: ddbc.stkrTokenDB,
            item: {
                team_id : this.team_id ,
                access_token : oauthaccess.access_token ,
                response : JSON.stringify(oauthaccess) ,
                put_date : new Date().toISOString() 
            }
        });
        if(log) console.log("OAUTH VERIFY - OAuth - Key Store : ", storeAuth);
        var ses = new AWS.SES();
        const email_res = await ses.sendEmail({
            from: stkr.email,
            to: stkr.email,
            subject: "New Stk App Install!"
        });
        if(log) console.log("OAUTH VERIFY - OAuth - Email Sent : ", email_res);
        // ########## LOG EVENT ##########
        await this.logEvent();
        return {
            isBase64Encoded: false,
            statusCode: 302,
            headers: {
                "Location": stkr.stkr_url 
            },
            body: null
        };
    }
    
    
    // ==========================================
    //         HELP
    // ==========================================


    helpMessage(){
        var cmd = this.command ;
        var stkr = new Stkr();
        return (`
STKR COMMANDS :
* Type '${cmd}' in any channel to share an image.  This is the same as typing '${cmd} share'.
* Type '${cmd} help' in any channel to get basic help information.
* Type '${cmd} bug' in any channel to get information on reporting bugs to the development team.
* Type '${cmd} support' to get basic support information, including a support email address.
* Type '${cmd} list' to see a full list of all images that are available to your workspace.
* Type '${cmd} share' to share an image with your teammates.
FOR ADMINS :
* Type '${cmd} settings' to change Stkr settings forthe workspace, including how images are stored.
* Type '${cmd} add' to add a new image for sharing.
* Type '${cmd} delete' to get a list of images to delete if you upload too many.
* There is a maximum of ${stkr.maxImages} images that can be added per workspace.
* There is a limit of ${stkr.maxFileSize} KB file size for uploaded images.
        `);
    }
    
    
    // ==========================================
    //         CLEAN UNINSTALL FUNCTIONS
    // ==========================================
    
    
    async cleanUninstall(){
        if(log) console.log("CLEAN UNINSTALL ");
        // var stkr = (this.image_storage == "S3") ? new StkrS3() : new StkrURL() ;
        var ddbc = new AWS.DDBCLIENT();
        var s3 = new AWS.S3();
        var stkr = new StkrURL() ;
        
        // ########## GET ALL URL IMAGES ##########
        await stkr.getImageList(this);
        if(log) console.log("CLEAN UNINSTALL - App Uninstalled - Images", stkr.image_list);
    
        if(stkr.image_list_count > 0){
            // ########## DELETE URL IMAGES ##########
            var itemsArray = [];
            for(var key in stkr.image_list) {
                var image = stkr.image_list[key];
        		var newitem = {
            		DeleteRequest : {
                		Key : { team_id: this.team_id, stkr_id: image.stkr_id }
            		}
        		};
        		itemsArray.push(newitem);
        	}
            if(log) console.log("CLEAN UNINSTALL - App Uninstalled - Image Items", JSON.stringify(itemsArray));
        	var params = { RequestItems : { [ddbc.stkrImageDB] : itemsArray } };
            if(log) console.log("CLEAN UNINSTALL - App Uninstalled - Params", JSON.stringify(params));
            await ddbc.batchDeleteFromDynamo({
            	params: params
            });
        }
    
        // ########## DELETE S3 IMAGES ##########
        await s3.emptyS3Directory({ 
            bucket: s3.stkrS3Bucket,
            team_id: this.team_id 
        });
        if(log) console.log("CLEAN UNINSTALL - App Uninstalled - Empty S3 Directory");
    
        // ########## DELETE TOKEN ##########
        await ddbc.deleteFromDynamo( {
            tablename: ddbc.stkrTokenDB,
            key: { "team_id" : this.team_id }
        });
        if(log) console.log("CLEAN UNINSTALL - App Uninstalled - Delete Token");
        
        if(log) console.log("CLEAN UNINSTALL - Complete");
    }
    
    
    async logEvent(){
        if(log) console.log("LOG EVENT ");
        if(this.env != "DEV"){
            if(this.team_id) {
                // ########## LOG TO DYNAMO ##########
                var ddbc = new AWS.DDBCLIENT();
                var logged = await ddbc.writeToDynamo({
                    tablename: ddbc.stkrLogDB,
                    item: {
                        team_id : this.team_id ,
                        log_id: Date.now().valueOf().toString() ,
                        event_type : this.event_type ,
                        user_id : this.user_id ,
                        channel_id : this.channel_id 
                    }
                });
                if(log) console.log("LOG EVENT  - Logged : ", logged);
            } else {
                if(log) console.log("LOG EVENT  - No team_id ");
            }
        }
        return null;
    }
    
 
};