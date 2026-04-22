const { isNil } = require("lodash");

const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const AuthService = require("../services/auth.service");
const { signToken } = require("../middleware/auth");
const User = require("../models/User");

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: env.IS_PROD,
        sameSite: env.IS_PROD ? "strict" : "lax",
        path: "/api/auth",
        maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    };
}

function setRefreshCookie(res, refreshToken) {
    res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, getCookieOptions());
}

function clearRefreshCookie(res) {
    res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, getCookieOptions());
}

const AuthController = {
    async register(req, res, next) {
        try {
            const usersCount = await User.countDocuments();
            if (usersCount > 0 && req.user?.role !== "admin") {
                return next(ApiError.forbidden("Only admins can create additional users"));
            }

            const result = await AuthService.register(req.body, signToken, env);
            setRefreshCookie(res, result.refreshToken);

            return res.status(201).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    accessTokenExpiresIn: result.accessTokenExpiresIn,
                },
            });
        } catch (err) {
            return next(err);
        }
    },

    async login(req, res, next) {
        try {
            const result = await AuthService.login(req.body, signToken, env);
            setRefreshCookie(res, result.refreshToken);

            return res.json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    accessTokenExpiresIn: result.accessTokenExpiresIn,
                },
            });
        } catch (err) {
            return next(err);
        }
    },

    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
            const result = await AuthService.refresh(refreshToken, signToken, env);
            setRefreshCookie(res, result.refreshToken);

            return res.json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    accessTokenExpiresIn: result.accessTokenExpiresIn,
                },
            });
        } catch (err) {
            return next(err);
        }
    },

    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
            await AuthService.logout(refreshToken);
            clearRefreshCookie(res);

            return res.json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (err) {
            return next(err);
        }
    },

    async me(req, res, next) {
        try {
            const userId = req.user?.sub;
            if (isNil(userId)) {
                return next(ApiError.unauthorized("Authenticated user id is missing"));
            }

            const user = await AuthService.getMe(userId);
            return res.json({ success: true, data: user });
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = AuthController;
