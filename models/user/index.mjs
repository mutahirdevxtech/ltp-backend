import mongoose from "mongoose";
import {
    emailPattern, phoneNumberPattern,
    rolesEnum, userStatusArray
} from "../../utils/core.mjs";

// user schema
let userSchema = new mongoose.Schema({
    profilePhoto: {
        type: String,
        default: null,
        maxlength: 1000,
    },
    firstName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 15,
        trim: true,
        index: true,
    },
    lastName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 15,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        minlength: 3,
        maxlength: 100,
        trim: true,
        match: emailPattern,
        index: true,
    },
    password: {
        type: String,
        default: null,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: rolesEnum,
        default: "CUSTOMER"
    },
    status: {
        type: String,
        enum: userStatusArray,
        default: "ACTIVE"
    },
    pushNotifications: {
        type: Boolean,
        default: true
    },
    is2faEnabled: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

userSchema.pre('save', function (next) {
    if (this.email) this.email = this.email.toLowerCase();
    next();
});

let userModel;

try {
    userModel = mongoose.model('users');
} catch (error) {
    userModel = mongoose.model('users', userSchema);
}

export { userModel };