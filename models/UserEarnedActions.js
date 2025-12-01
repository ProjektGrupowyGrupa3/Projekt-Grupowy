const mongoose = require("mongoose");

const earnedActionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actionType: { type: String, required: true }, // quiz_correct, created_flashcard_set, login_streak, share_test
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null }, // np. ID pytania lub testu
  points: { type: Number, required: true },
}, { timestamps: true });

earnedActionSchema.index({ userId: 1, actionType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model("UserEarnedAction", earnedActionSchema);
