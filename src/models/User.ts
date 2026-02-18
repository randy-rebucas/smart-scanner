import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  // password is optional to support OAuth (GitHub) users who have no password
  password: { type: String },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },

  // --- Subscription ---
  // "trial"   : 3 lifetime scans (default for all new users)
  // "starter" : 30 scans / 30-day billing cycle
  // "pro"     : unlimited scans
  plan: {
    type: String,
    enum: ["trial", "starter", "pro"],
    default: "trial",
  },
  scansUsed: { type: Number, default: 0 },
  // -1 means unlimited (pro plan)
  scansLimit: { type: Number, default: 3 },
  // set when a paid plan starts / resets each billing cycle
  billingCycleStart: { type: Date, default: null },
});

export default models.User || model("User", UserSchema);
