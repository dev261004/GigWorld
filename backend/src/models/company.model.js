import mongoose, {Schema} from "mongoose";

const companySchema= new Schema({
    company_name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    industry: {
        type: String,
        required: true,
    },
    website: {
        type: String,
    },
    contact_info:{
        type: String,
        required:true
    },
    company_mail:{
        type:String,
        required:true
    }
})

export const Company = mongoose.model('Company', jobSchema);