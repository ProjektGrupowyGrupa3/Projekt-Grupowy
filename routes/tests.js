const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const UserTest = require("../models/UserTest");

function calcAverage(arr) {
  if (!arr || arr.length === 0) return null;
  const sum = arr.reduce((a, b) => a + b.rating, 0);
  return Number((sum / arr.length).toFixed(2));
}

router.post("/create", auth, async (req, res) => {
  try {
    const user = req.user;

    // ❌ banned users
    if (user.accessLvl === -1) {
      return res.status(403).json({ message: "User is banned" });
    }

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

router.get("/all", auth, async (req, res) => {
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

router.get("/userTest", auth, async (req, res) => {
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

router.delete("/:testId", auth, async (req, res) => {
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

router.get("/:testId", auth, async (req, res) => {
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

    const test = await UserTest.findById(testId)
      .populate("creatorId", "name email")
      .lean();

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json(test);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;