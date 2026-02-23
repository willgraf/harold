"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerificationToken = generateVerificationToken;
exports.calculateTokenExpiry = calculateTokenExpiry;
const crypto_1 = require("crypto");
function generateVerificationToken() {
    return (0, crypto_1.randomBytes)(32).toString("base64url");
}
function calculateTokenExpiry(hoursFromNow) {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hoursFromNow);
    return expiry.toISOString();
}
