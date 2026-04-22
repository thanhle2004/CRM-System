const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    token_hash: { type: String, required: true },
    expires_at: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    refresh_tokens: { type: [refreshTokenSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
