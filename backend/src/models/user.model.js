import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required:true,
            unique: true,   
            lowercase: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },

        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        },
        resetPasswordToken: {type:String},
  resetPasswordExpires: {type:Date},
        gigPreferences: {
            currentStatus: {
                type: String,
                trim: true,
                default: ""
            },
            categories: {
                type: [String],
                default: []
            },
            skills: {
                type: [String],
                default: []
            },
            experienceLevel: {
                type: String,
                trim: true,
                default: ""
            },
            workTypes: {
                type: [String],
                default: []
            },
            education: {
                type: String,
                trim: true,
                default: ""
            },
            currentRole: {
                type: String,
                trim: true,
                default: ""
            },
            workExperience: {
                type: String,
                trim: true,
                default: ""
            },
            preferredBudget: {
                type: String,
                trim: true,
                default: ""
            },
            languages: {
                type: [String],
                default: []
            },
            location: {
                type: String,
                trim: true,
                default: ""
            },
            gender: {
                type: String,
                trim: true,
                default: ""
            },
            age: {
                type: Number,
                min: 13,
                max: 100
            },
            onboardingCompleted: {
                type: Boolean,
                default: false
            },
            updatedAt: {
                type: Date
            }
        },

    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)
