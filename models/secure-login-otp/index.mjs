import mongoose from "mongoose";
import { emailPattern } from "../../utils/core.mjs"

let otpSchemaSecureLogin = new mongoose.Schema({
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

otpSchemaSecureLogin.pre('save', function (next) {
    if (this?.email) this.email = this?.email?.toLowerCase();
    next();
});

let secureLoginOtpModel;

try {
    secureLoginOtpModel = mongoose.model('secure-login-otps');
} catch (error) {
    secureLoginOtpModel = mongoose.model('secure-login-otps', otpSchemaSecureLogin);
}

export { secureLoginOtpModel };