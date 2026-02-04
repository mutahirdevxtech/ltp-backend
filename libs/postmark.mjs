import postmark from "postmark"
import { companyEmail, postmarkEmailTmeplates } from "../utils/core.mjs"

const serverToken = process.env.POSTMARK_SERVER_TOKEN
const client = new postmark.ServerClient(serverToken)

export const sendEmailVerificationEmail = async (email, username, otp) => {
    try {
        const templateModel = {
            username,
            otp_code: otp,
        };

        await client.sendEmailWithTemplate({
            From: companyEmail,
            To: email?.toLowerCase(),
            TemplateId: postmarkEmailTmeplates.emailVerificationTemplate,
            TemplateModel: templateModel,
        });

        return "email sent successfully";
    } catch (error) {
        throw error;
    }
};

export const sendSecureLoginOtpEmail = async (email, username, otp) => {
    try {
        const templateModel = {
            username,
            verification_code: otp,
        };

        await client.sendEmailWithTemplate({
            From: companyEmail,
            To: email?.toLowerCase(),
            TemplateId: postmarkEmailTmeplates.secureLoginOtpRemplate,
            TemplateModel: templateModel,
        });

        return "email sent successfully";
    } catch (error) {
        throw error;
    }
};

export const sendForgotPasswordEmail = async (email, username, otp) => {
    try {
        const templateModel = {
            username,
            verification_code: otp,
        };

        await client.sendEmailWithTemplate({
            From: companyEmail,
            To: email?.toLowerCase(),
            TemplateId: postmarkEmailTmeplates.forgotPasswordTemplate,
            TemplateModel: templateModel,
        });

        return "email sent successfully";
    } catch (error) {
        throw error;
    }
};

export const sendAccountSuspendTemplate = async (email, username) => {
    try {
        const templateModel = { username };

        await client.sendEmailWithTemplate({
            From: companyEmail,
            To: email?.toLowerCase(),
            TemplateId: postmarkEmailTmeplates.accountSuspendTemplate,
            TemplateModel: templateModel,
        });

        return "email sent successfully";
    } catch (error) {
        throw error;
    }
};

export const sendAccountUnSuspendTemplate = async (email, username) => {
    try {
        const templateModel = { username };

        await client.sendEmailWithTemplate({
            From: companyEmail,
            To: email?.toLowerCase(),
            TemplateId: postmarkEmailTmeplates.accountUnSuspendTemplate,
            TemplateModel: templateModel,
        });

        return "email sent successfully";
    } catch (error) {
        throw error;
    }
};

export const sendWelcomeEmail = async (email) => {
    try {
        const templateModel = { };

        await client.sendEmailWithTemplate({
            From: companyEmail,
            To: email?.toLowerCase(),
            // To: "bryan@luxetravelplans.com",
            TemplateId: postmarkEmailTmeplates?.welcomeTemplate,
            TemplateModel: templateModel,
        });

        return "email sent successfully";
    } catch (error) {
        throw error;
    }
};

export const sendBulkWelcomeEmails = async (data) => {
    try {
        const results = await Promise.allSettled(
            data.map((d) => sendWelcomeEmail(d?.email, d?.firstName))
        );

        return results;
    } catch (error) {
        throw error;
    }
};

export const sendAccountActivationEmail = async (email, username) => {
    try {
        const templateModel = { username };

        await client.sendEmailWithTemplate({
            From: companyEmail,
            To: email?.toLowerCase(),
            TemplateId: postmarkEmailTmeplates?.accountActivationTemplate,
            TemplateModel: templateModel,
        });

        return "email sent successfully";
    } catch (error) {
        throw error;
    }
};

export const sendBulkActivationEmails = async (data) => {
    try {
        const results = await Promise.allSettled(
            data.map((d) => sendAccountActivationEmail(d?.email, d?.firstName))
        );

        return results;
    } catch (error) {
        throw error;
    }
};

// for dev testing
export const sendEmail = async (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            client.sendEmail({
                From: companyEmail,
                To: "muhammadahadansari2@gmail.com",
                Subject: "Hello World Testing",
                TextBody: "<h1>Hello World 123</h1>"
            })
            resolve("email send successfully")


        } catch (error) {
            reject(error)
        }
    })
}
