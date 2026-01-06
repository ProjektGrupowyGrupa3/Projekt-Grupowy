const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["user", "comment", "userTest"],
      required: true
    },

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // For comment reports
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserTest"
    },

    commentId: {
      type: mongoose.Schema.Types.ObjectId
    },

    // For test reports
    userTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserTest"
    },

    reason: {
      type: String,
      required: true,
      maxlength: 1000
    },

    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
