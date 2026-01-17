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
  answers: { 
      type: [String], 
      required: true,
      validate: [arrayLimit, '{PATH} musi mieć od 2 do 8 odpowiedzi']
  },
  correct: { type: [String], required: true },
  
  // Wyjaśnienie (opcjonalne)
  explanation: { 
      type: String, 
      default: "" 
  }
});

function arrayLimit(val) {
  return val.length >= 2 && val.length <= 8;
}

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
      enum: ["pl", "en"],
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
