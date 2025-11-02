const mongoose = require("mongoose");

const localizedStringSchema = new mongoose.Schema({
  pl: { type: String, required: true },
  en: { type: String, required: true }
}, { _id: false });

const answerSchema = new mongoose.Schema({
  label: { type: String, required: true },
  text: { type: localizedStringSchema, required: true },
  isCorrect: { type: Boolean, required: true },
  explanation: { type: localizedStringSchema, required: true }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  question: { type: localizedStringSchema, required: true },
  answers: { type: [answerSchema], required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  tags: [String],

  // 🆕 Stały numer pytania (unikalny, przypisany w pliku JSON)
  number: { type: Number, required: true, unique: true }

}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
