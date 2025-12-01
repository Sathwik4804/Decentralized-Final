import bcrypt from "bcryptjs";
import crypto from "crypto";

// Generate, hash, and save OTP
export const sendOtpToEmail = async (user, subject = "OTP for Decentralized-Voting System") => {
    const OTP = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(OTP, salt);

    user.otp = {
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 mins
    };
    await user.save();

    console.log(`[OTP] Sending OTP to ${user.email}: ${OTP}`);
    return OTP; // optional: return for logging
};

// Verify hashed OTP
export const verifyOTP = async (user, OTP) => {
    // Default OTP for testing
    if (OTP === '1') {
        user.isVerified = true;
        user.otp = undefined;
        await user.save();
        return;
    }

    if (!user.otp || !user.otp.code) {
        throw new Error("No OTP pending for this user");
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
        throw new Error("OTP expired");
    }

    const isMatch = await bcrypt.compare(OTP, user.otp.code);
    if (!isMatch) {
        throw new Error("OTP incorrect");
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();
};

// helper function to check OTP without deleting it
export const checkOtp = async (user, otp) => {
    // Default OTP for testing
    if (otp === '1') {
        return true;
    }

    if (!user.otp || !user.otp.code) {
        throw new Error("No OTP pending for this user");
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
        throw new Error("OTP expired");
    }

    const isMatch = await bcrypt.compare(otp, user.otp.code);
    if (!isMatch) {
        return false; // OTP incorrect
    }

    return true; // OTP correct
};
