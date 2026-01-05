const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const UserTest = require("../models/UserTest");

function calcAverage(arr) {
  if (!arr || arr.length === 0) return null;
  const sum = arr.reduce((a, b) => a + b.rating, 0);
  return Number((sum / arr.length).toFixed(2));
}

router.post("/create", adminAuth(0), async (req, res) => {
  try {
    const user = req.user;

    const {
      testID,
      title,
      tags = [],
      questions = []
    } = req.body;

    if (!title || !questions.length) {
      return res.status(400).json({ message: "Title and questions are required" });
    }

    const language = req.header("X-Language") || "PL";


    // CREATE NEW TEST
    if (!testID) {
      const newTest = new UserTest({
        creatorId: user._id,
        title,
        date: new Date(),
        tags,
        language,
        questions,
        rating: [],
        difficultiyRating: [],
        comments: []
      });

      await newTest.save();
      return res.status(201).json(newTest);
    }


    // EDIT EXISTING TEST
    if (!mongoose.Types.ObjectId.isValid(testID)) {
      return res.status(400).json({ message: "Invalid testID" });
    }

    const existingTest = await UserTest.findById(testID);

    if (!existingTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    const isOwner = existingTest.creatorId.toString() === user._id.toString();
    const isPrivileged = user.accessLvl >= 1; // moderator or admin

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Not authorized to edit this test" });
    }

    existingTest.title = title;
    existingTest.tags = tags;
    existingTest.questions = questions;
    existingTest.language = language;

    await existingTest.save();

    res.json(existingTest);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all", adminAuth(0), async (req, res) => {
  try {
    const { q } = req.query;
    console.log(q);
    const filter = q
      ? {
          $or: [
            { title: { $regex: q, $options: "i" } }, // priority
            { tags: { $in: [new RegExp(q, "i")] } }
          ]
        }
      : {};

    const tests = await UserTest.find(filter)
      .populate("creatorId", "name email")
      .lean();

    const result = tests.map(t => ({
      testId: t._id,
      title: t.title,
      owner: {
        id: t.creatorId?._id,
        name: t.creatorId?.name,
        email: t.creatorId?.email
      },
      numberOfQuestions: t.questions.length,
      averageDifficultyRating: calcAverage(t.difficultiyRating),
      averageRating: calcAverage(t.rating),
      numberOfRatings: t.rating.length,
      numberOfComments: t.comments.length
    }));

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/userTest", adminAuth(0), async (req, res) => {
  try {
    const user = req.user;
    const { q } = req.query;

    const baseFilter = { creatorId: user._id };

    const filter = q
      ? {
          ...baseFilter,
          $or: [
            { title: { $regex: q, $options: "i" } },
            { tags: { $in: [new RegExp(q, "i")] } }
          ]
        }
      : baseFilter;

    const tests = await UserTest.find(filter).lean();

    const result = tests.map(t => ({
      testId: t._id,
      title: t.title,
      numberOfQuestions: t.questions.length,
      averageDifficultyRating: calcAverage(t.difficultiyRating),
      averageRating: calcAverage(t.rating),
      numberOfRatings: t.rating.length,
      numberOfComments: t.comments.length
    }));

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:testId", adminAuth(0), async (req, res) => {
  try {
    const user = req.user;
    const { testId } = req.params;

    if (user.accessLvl === -1) {
      return res.status(403).json({ message: "User is banned" });
    }

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }

    const test = await UserTest.findById(testId);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const isOwner = test.creatorId.toString() === user._id.toString();
    const isPrivileged = user.accessLvl >= 1; // moderator+
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Not authorized to delete this test" });
    }

    await test.deleteOne();

    res.json({ message: "Test deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:testId", adminAuth(0), async (req, res) => {
  try {
    const { testId } = req.params;
    const user = req.user;

    // Block banned users
    if (user.accessLvl === -1) {
      return res.status(403).json({ message: "User is banned" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }

    // Fetch test and populate creatorId
    const test = await UserTest.findById(testId)
      .populate("creatorId", "name email")
      .lean();

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Populate comment user nicknames
    if (test.comments && test.comments.length) {
      // Collect unique userIds from comments
      const userIds = [...new Set(test.comments.map(c => c.userId.toString()))];

      // Fetch users once
      const users = await User.find({ _id: { $in: userIds } }).select("name");

      const userMap = {};
      users.forEach(u => {
        userMap[u._id.toString()] = u.name;
      });

      // Add nickname to each comment
      test.comments = test.comments.map(comment => ({
        ...comment,
        nickname: userMap[comment.userId.toString()] || "Unknown"
      }));
    }

    res.json(test);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/rating", adminAuth(0), async (req, res) => {
  try {
    const { rating } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const test = await UserTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const existing = test.rating.find(r =>
      r.userId.toString() === userId.toString()
    );

    if (existing) {
      existing.rating = rating; // 🔁 update
    } else {
      test.rating.push({ userId, rating }); // ➕ add
    }

    await test.save();

    res.json({ message: "Rating saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/difficulty-rating", adminAuth(0), async (req, res) => {
  try {
    const { rating } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 3) {
      return res.status(400).json({ message: "Difficulty rating must be 1–3" });
    }

    const test = await UserTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const existing = test.difficultiyRating.find(r =>
      r.userId.toString() === userId.toString()
    );

    if (existing) {
      existing.rating = rating;
    } else {
      test.difficultiyRating.push({ userId, rating });
    }

    await test.save();

    res.json({ message: "Difficulty rating saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/:id/comments", adminAuth(0), async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content required" });
    }

    const test = await UserTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    test.comments.push({
      userId,
      content,
      replies: []
    });

    await test.save();

    res.status(201).json({ message: "Comment added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
function findCommentById(comments, commentId) {
  for (const comment of comments) {
    if (comment._id.toString() === commentId.toString()) {
      return comment;
    }
    const found = findCommentById(comment.replies || [], commentId);
    if (found) return found;
  }
  return null;
}
router.post("/:testId/comments/:commentId/reply", adminAuth(0), async (req, res) => {
    try {
      const { content } = req.body;
      const { testId, commentId } = req.params;
      const userId = req.user._id;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Reply content required" });
      }

      const test = await UserTest.findById(testId);
      if (!test) return res.status(404).json({ message: "Test not found" });

      const parentComment = findCommentById(test.comments, commentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      parentComment.replies.push({
        userId,
        content,
        replies: []
      });

      await test.save();

      res.status(201).json({ message: "Reply added" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


module.exports = router;