const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { isEmpty, isNil } = require('lodash');

const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const MAX_REFRESH_TOKENS_PER_USER = 5;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildSafeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signAccessToken(signToken, user) {
  return signToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function getRefreshExpiryDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function register({ name, email, password, role = 'staff' }, signToken, authConfig) {
  const existingUser = await User.findOne({ email }).lean();
  if (!isNil(existingUser)) {
    throw ApiError.badRequest('Email is already in use');
  }

  const usersCount = await User.countDocuments();
  const assignedRole = usersCount === 0 ? 'admin' : role;
  const password_hash = await bcrypt.hash(password, authConfig.bcryptRounds);
  const user = await User.create({ name, email, password_hash, role: assignedRole });

  const session = await createSession(user, signToken, authConfig);
  return { user: buildSafeUser(user), ...session };
}

async function login({ email, password }, signToken, authConfig) {
  const user = await User.findOne({ email }).select('+password_hash');

  if (isNil(user)) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const session = await createSession(user, signToken, authConfig);
  return { user: buildSafeUser(user), ...session };
}

async function refresh(refreshToken, signToken, authConfig) {
  if (isEmpty(refreshToken)) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const tokenHash = hashToken(refreshToken);
  const user = await User.findOne({
    refresh_tokens: {
      $elemMatch: {
        token_hash: tokenHash,
        expires_at: { $gt: new Date() },
      },
    },
  });

  if (isNil(user)) {
    throw ApiError.unauthorized('Refresh token is invalid or expired');
  }

  user.refresh_tokens = user.refresh_tokens.filter(
    (item) => item.token_hash !== tokenHash && item.expires_at > new Date()
  );

  const session = await createSession(user, signToken, authConfig);
  return { user: buildSafeUser(user), ...session };
}

async function logout(refreshToken) {
  if (isEmpty(refreshToken)) return;

  const tokenHash = hashToken(refreshToken);
  await User.updateOne(
    { 'refresh_tokens.token_hash': tokenHash },
    { $pull: { refresh_tokens: { token_hash: tokenHash } } }
  );
}

async function getMe(userId) {
  const user = await User.findById(userId).lean();
  if (isNil(user)) {
    throw ApiError.notFound('User not found');
  }

  return buildSafeUser(user);
}

async function createSession(user, signToken, authConfig) {
  const accessToken = signAccessToken(signToken, user);
  const refreshToken = generateRefreshToken();
  const refreshExpiry = getRefreshExpiryDate(authConfig.refreshTokenDays);

  user.refresh_tokens = (user.refresh_tokens || []).filter((item) => item.expires_at > new Date());
  user.refresh_tokens.push({
    token_hash: hashToken(refreshToken),
    expires_at: refreshExpiry,
  });
  user.refresh_tokens = user.refresh_tokens.slice(-MAX_REFRESH_TOKENS_PER_USER);
  await user.save();

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresAt: refreshExpiry.toISOString(),
  };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
