var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');



var itemSchema = new Schema({
    itemname : {type:String, require:true },
    itemdesc : {type:String, require:true },
    itemimgurl: {type:String, require:true },
    itemprice: {type:Number, require:true },
    itempreptime: {type:Number, require:true },
},{
    collection:'items'
});

var schema = new Schema({
    name : {type:String, require:true },
    title : {type:String, require:true },
    fssai : {type:String, require:true },
    url: {type:String, require:true },
    email : {type:String, require:true, unique:true},
    password :{type:String, require:true},
    acceptStatus : { type:Boolean, default:false},
    items: [itemSchema],
    orders : {
        type: Array
    }
});

schema.statics.hashPassword = function hashPassword(password){
    return bcrypt.hashSync(password,10);
}

schema.methods.isValid = function(hashedpassword){
    return  bcrypt.compareSync(hashedpassword, this.password);
}

module.exports = mongoose.model('Vendor',schema);