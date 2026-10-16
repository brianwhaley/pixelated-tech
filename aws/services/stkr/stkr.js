console.log('Loading Stkr class');

var AWS = require("./aws");

const log = true ;

module.exports = class Stkr {

    constructor(){
        if(log) console.log("STKR CONSTRUCTOR");
        this.email = "stkr@pixelated.tech" ;
        this.email_link = `<mailto:${this.email}|${this.email}>` ;
        this.stkr_url = "https://pixelated.tech/stkr.html" ;
        this.maxImages = 50;
        this.maxFileSize = 200;
        this.stkr_id;
        this.image_list = [];
        this.image_list_count ;
        this.image_name;
        this.image_url;
        this.image_type;
        this.image_buffer; 
        this.image_buffer_size;
        return this ;
    }
    
    
    // ========================================
    //              SHARED FUNCTIONS
    // ========================================
    
    
    sortByProperty(property){
        if(log) console.log("STKR - SORT BY PROPERTY ");
        return function(a,b){  
            if(a[property] > b[property])  
                return 1;  
            else if(a[property] < b[property])  
                return -1;
            return 0;  
        }; 
    }
    
    
    /*
    
    
    async urlExists(url) {}
    
    
    async getFileInfo(event){}
    
    
    async fetchImage(data){}
    
    
    // ========================================
    //              LIST S3 IMAGES
    // ========================================
    
    
    async getImageCount(event){}
    
    
    async getImageList(event){}
    
    
    async getList(event){}
    
    
    async noListMessage(event){}
    
    
    async shareListMessage(event){}
    
    
    // ========================================
    //              UPLOAD NEW S3 IMAGE 
    // ========================================
    
    
    async addNewImage(event){}
    
    
    async addNewImageFileShared(event){}
    
    
    async addNewImageMessage(event){}
    
    
    async addNewImageSubmit(event){}
    
    
    async addNewImageThankYou(event){}
    
    
    async addNewImageErrorDeclined(event){}
    
    
    async addNewImageErrorSize(event){}
    
    
    async addNewImageErrorMax(event){}
    
    
    async addNewNotImage(event){}
    
    
    async addNewImageErrorNotAdmin(event){}
    
    
    // ========================================
    //             SHARE IMAGE 
    // ========================================
    
    
    async shareImage(event){}
    
    
    async shareImageMessage(event){}
    
    
    async shareImageProcess(event){}
    
    
    // ========================================
    //              DELETE IMAGE 
    // ========================================
    
    
    async deleteImage(event){}
    
    
    async deleteImageMessage(event){}
    
    
    async deleteImageProcess(event){}
    
    
    async deleteImageErrorNotAdmin(event){}

    
    */
    
 
};