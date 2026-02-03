import mongoose from "mongoose";
import { emailPattern } from "../../utils/core.mjs"

let otpSchemaEmail = new mongoose.Schema({
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
}, { timestamps: true });

otpSchemaEmail.pre('save', function (next) {
    if (this?.email) this.email = this?.email?.toLowerCase();
    next();
});

let verifyEmailOtpModel;

try {
    verifyEmailOtpModel = mongoose.model('email-otps');
} catch (error) {
    verifyEmailOtpModel = mongoose.model('email-otps', otpSchemaEmail);
}

export { verifyEmailOtpModel };
