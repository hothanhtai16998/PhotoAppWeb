import { asyncHandler } from "../middlewares/asyncHandler.js";

export const authMe = asyncHandler(async (req, res) => {
    const user = req.user; // From authMiddleware

    return res.status(200).json({
        user,
    });
});
