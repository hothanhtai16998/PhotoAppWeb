import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";
import { env } from "../libs/env.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { TOKEN } from "../utils/constants.js";

export const signUp = asyncHandler(async (req, res) => {
    const { username, password, email, firstName, lastName } = req.body;

    // Note: Input validation is handled by validationMiddleware
    // This is just for data extraction

    // Check if username or email already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        if (existingUser.username === username) {
            return res.status(409).json({ message: "Username already exists" });
        }
        return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    await User.create({
        username,
        hashedPassword,
        email,
        displayName: `${firstName.trim()} ${lastName.trim()}`,
    });

    return res.status(201).json({
        message: "User created successfully",
    });
});

export const signIn = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Note: Input validation is handled by validationMiddleware

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(401).json({
            message: "Invalid username or password",
        });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordMatch) {
        return res.status(401).json({
            message: "Invalid username or password",
        });
    }

    // Generate access token
    const accessToken = jwt.sign(
        { userId: user._id },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: TOKEN.ACCESS_TOKEN_TTL }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // Create session
    await Session.create({
        userId: user._id,
        refreshToken,
        expiresAt: new Date(Date.now() + TOKEN.REFRESH_TOKEN_TTL),
    });

    // Set refresh token cookie
    const isProduction = env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: TOKEN.REFRESH_TOKEN_TTL,
    });

    return res.status(200).json({
        message: "Login successful",
        accessToken,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
        },
    });
});

export const signOut = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (token) {
        await Session.deleteOne({ refreshToken: token });
    }

    const isProduction = env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
        message: "Logout successful",
    });
});

export const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        return res.status(401).json({
            message: "Refresh token not found",
        });
    }

    // Find session
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
        return res.status(403).json({
            message: "Invalid or expired refresh token",
        });
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
        await Session.deleteOne({ refreshToken: token });
        return res.status(403).json({
            message: "Refresh token expired",
        });
    }

    // Generate new access token
    const accessToken = jwt.sign(
        { userId: session.userId },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: TOKEN.ACCESS_TOKEN_TTL }
    );

    return res.status(200).json({ accessToken });
});
