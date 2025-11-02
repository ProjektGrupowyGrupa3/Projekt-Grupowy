const mongoose = require("mongoose");

const localizedStringSchema = new mongoose.Schema({
  pl: { type: String, required: true },
  en: { type: String, required: true }
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  name: { type: localizedStringSchema, required: true },
  semester: { type: Number, required: true, min: 1 },
  specialization: { type: localizedStringSchema },
  description: { type: localizedStringSchema }
});

module.exports = mongoose.model("Subject", subjectSchema);
