console.log('Loading User class');

var Message = require("./message");

const log = true ;

module.exports = class User {

    constructor(props){
        if(log) console.log("USER CONSTRUCTOR");
        if(props){
            if(log) console.log("USER CONSTRUCTOR props : ", props);
            this.load(props);
        }
        return this ;
    }
    
    
    load(props){
        if(log) console.log("USER LOAD");
        if(log) console.log("USER LOAD props : ", props);
        for(var key in props) this[key] = props[key];
        if(log) console.log("USER - Loaded : ", this);
        return null;
    }
    
    
    async isAdmin(event){
        if(log) console.log("USER IS ADMIN");
        var message_data = {
            token: event.b_token,
            user: this.user_id,
            api_method: "users.info"
        };
        if(log) console.log("USER IS ADMIN - Msg Data : ", message_data);
        var message = new Message(message_data);
        var userinfo = await message.slackApiGet();
        if(log) console.log("USER IS ADMIN - User Info : ", userinfo);
        var isAdmin = userinfo.user.is_admin ;
        if(log) console.log("USER IS ADMIN - Is Admin : ", isAdmin);
        return isAdmin;
    }

 
};