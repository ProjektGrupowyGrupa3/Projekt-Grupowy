const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    replies: [] // recursive comments
  },
  { timestamps: true }
);
CommentSchema.add({
  replies: [CommentSchema]
});

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answerA: { type: String, required: true },
  answerB: { type: String, required: true },
  answerC: { type: String, required: true },
  answerD: { type: String, required: true },
  correct: {
    type: String,
    enum: ["A", "B", "C", "D"],
    required: true
  }
});

const RatingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true }
});

const DifficultyRatingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 3, required: true }
});

const UserTestSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: { type: String, required: true },

    isPublic: { 
      type: Boolean, 
      default: false, 
      required: true 
    },

    date: {
      type: Date,
      default: Date.now
    },

    tags: [{ type: String }],

    language: {
      type: String,
      enum: ["pl", "eng"],
      required: true
    },

    questions: {
      type: [QuestionSchema],
    },

    rating: [RatingSchema],

    difficultiyRating: [DifficultyRatingSchema],

    comments: [CommentSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserTest", UserTestSchema);
