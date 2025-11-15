import { asyncHandler } from "../middlewares/asyncHandler.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";

export const authMe = asyncHandler(async (req, res) => {
    const user = req.user; // From authMiddleware

    return res.status(200).json({
        user,
    });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { password, newPassword, newPasswordMatch } = req.body;
    const userId = req.user._id; // From authMiddleware

    if (!password || !newPassword || !newPasswordMatch) {
        return res.status(400).json({
            message: "Các trường mật khẩu và xác nhận mật khẩu mới không được để trống",
        });
    }

    // Fetch user with hashedPassword (authMiddleware excludes it for security)
    const user = await User.findById(userId);

    // Verify current password
    const isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Xác nhận mật khẩu hiện tại không đúng, xin thử lại"
        });
    }

    if (newPassword !== newPasswordMatch) {
        return res.status(400).json({
            message: "Mật khẩu mới không khớp, xin thử lại"
        });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.findByIdAndUpdate(userId, { hashedPassword });

    return res.status(200).json({
        message: "Cập nhật mật khẩu thành công"
    });
})

export const forgotPassword = asyncHandler(async (req, res) => { })

export const changeInfo = asyncHandler(async (req, res) => { })