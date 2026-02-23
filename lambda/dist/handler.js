"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const client_sns_1 = require("@aws-sdk/client-sns");
const client_ses_1 = require("@aws-sdk/client-ses");
const index_1 = require("./repositories/index");
const tokenUtils_1 = require("./tokenUtils");
const emailTemplates_1 = require("./emailTemplates");
const repository = (0, index_1.createRepository)();
const sns = new client_sns_1.SNSClient({});
const ses = new client_ses_1.SESClient({});
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
function response(statusCode, body) {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body),
    };
}
function redirect(url) {
    return {
        statusCode: 302,
        headers: {
            ...corsHeaders,
            Location: url,
        },
        body: "",
    };
}
async function publishSns(email, timestamp) {
    const topicArn = process.env.SNS_TOPIC_ARN;
    if (topicArn) {
        try {
            await sns.send(new client_sns_1.PublishCommand({
                TopicArn: topicArn,
                Message: JSON.stringify({ email, timestamp, source: "harold" }),
            }));
        }
        catch (snsErr) {
            console.error("SNS publish failed (signup saved):", snsErr);
        }
    }
}
async function handleSignup(event) {
    const body = JSON.parse(event.body || "{}");
    const email = body.email;
    if (!email || !EMAIL_REGEX.test(email)) {
        return response(400, { message: "Valid email is required" });
    }
    const timestamp = new Date().toISOString();
    const ip = event.requestContext?.identity?.sourceIp || "unknown";
    const verificationEnabled = process.env.EMAIL_VERIFICATION_ENABLED === "true";
    if (verificationEnabled) {
        const token = (0, tokenUtils_1.generateVerificationToken)();
        const expiryHours = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || "24", 10);
        const tokenExpiry = (0, tokenUtils_1.calculateTokenExpiry)(expiryHours);
        const isNew = await repository.saveSignup({
            email,
            timestamp,
            ip,
            verificationToken: token,
            verificationTokenExpiry: tokenExpiry,
            verified: false,
        });
        if (!isNew) {
            return response(200, { message: "Already registered" });
        }
        // Send verification email via SES
        const apiUrl = process.env.API_URL || "";
        const brandName = process.env.BRAND_NAME || "Harold";
        const senderEmail = process.env.EMAIL_SENDER || "";
        const verificationUrl = `${apiUrl}verify?token=${encodeURIComponent(token)}`;
        try {
            await ses.send(new client_ses_1.SendEmailCommand({
                Source: senderEmail,
                Destination: { ToAddresses: [email] },
                Message: {
                    Subject: { Data: `Verify your email for ${brandName}` },
                    Body: {
                        Html: {
                            Data: (0, emailTemplates_1.generateVerificationEmail)(verificationUrl, brandName),
                        },
                    },
                },
            }));
        }
        catch (sesErr) {
            console.error("SES send failed (signup saved):", sesErr);
        }
        return response(200, {
            message: "Verification email sent",
            verificationRequired: true,
        });
    }
    // Verification disabled — existing flow
    const isNew = await repository.saveSignup({ email, timestamp, ip });
    if (!isNew) {
        return response(200, { message: "Already registered" });
    }
    await publishSns(email, timestamp);
    return response(200, { message: "Success" });
}
async function handleVerify(event) {
    const siteUrl = process.env.SITE_URL || "";
    const token = event.queryStringParameters?.token;
    if (!token || token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(token)) {
        return redirect(`${siteUrl}?verified=false`);
    }
    const result = await repository.verifyEmail(token);
    if (result.success && result.email) {
        if (!result.alreadyVerified) {
            await publishSns(result.email, new Date().toISOString());
        }
        return redirect(`${siteUrl}?verified=true`);
    }
    return redirect(`${siteUrl}?verified=false`);
}
async function handler(event) {
    if (event.httpMethod === "OPTIONS") {
        return response(200, {});
    }
    try {
        const path = event.path || "";
        if (event.httpMethod === "POST" && path.endsWith("/signup")) {
            return await handleSignup(event);
        }
        if (event.httpMethod === "GET" && path.endsWith("/verify")) {
            return await handleVerify(event);
        }
        // Legacy: POST without specific path (backward compat for existing tests/deployments)
        if (event.httpMethod === "POST" && !path.includes("/verify")) {
            return await handleSignup(event);
        }
        return response(404, { message: "Not found" });
    }
    catch (err) {
        console.error("Handler error:", err);
        return response(500, { message: "Internal server error" });
    }
}
