import mongoose from "mongoose";
import { emailPattern, otpPattern } from "../../utils/core.mjs"

let otpSchemaPassword = new mongoose.Schema({
    email: {
        type: String,
        unique: false,
        required: true,
        minlength: 3,
        maxlength: 100,
        trim: true,
        match: emailPattern
    },
    otpCodeHash: {
        type: String,
        required: true,
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

otpSchemaPassword.pre('save', function (next) {
    if (this?.email) this.email = this?.email?.toLowerCase();
    next();
});

let forgotPasswordOtpModel;

try {
    forgotPasswordOtpModel = mongoose.model('password-otps');
} catch (error) {
    forgotPasswordOtpModel = mongoose.model('password-otps', otpSchemaPassword);
}

export { forgotPasswordOtpModel };