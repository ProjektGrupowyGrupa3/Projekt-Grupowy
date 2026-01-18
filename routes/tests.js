const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const UserTest = require("../models/UserTest");
const UserTestResult = require("../models/UserTestResult");
const UserEarnedAction = require("../models/UserEarnedActions");

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
      questions = [],
      isPublic = false
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
        isPublic,
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

    if (isPublic !== undefined) {
        existingTest.isPublic = isPublic;
    }

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

    const filter = {
      isPublic: true
    };

    if(q){
      filter.$or = [
            { title: { $regex: q, $options: "i" } }, // priority
            { tags: { $in: [new RegExp(q, "i")] } }
          ];
    }


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
      tags: t.tags ,
      language: t.language,
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
      isPublic: t.isPublic,
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

  // Populate comment user nicknames (including replies)
  if (test.comments && test.comments.length) {

    const collectUserIds = (comments, set = new Set()) => {
      comments.forEach(c => {
        if (c.userId) set.add(c.userId.toString());
        if (c.replies && c.replies.length) {
          collectUserIds(c.replies, set);
        }
      });
      return set;
    };

    const userIds = [...collectUserIds(test.comments)];

    const users = await User.find({ _id: { $in: userIds } }).select("name");

    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u.name;
    });

    const attachNicknames = (comments) =>
      comments.map(comment => ({
        ...comment.toObject?.() ?? comment,
        nickname: userMap[comment.userId?.toString()] || "Unknown",
        replies: comment.replies && comment.replies.length
          ? attachNicknames(comment.replies)
          : []
      }));

    test.comments = attachNicknames(test.comments);
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

    if (test.creatorId.toString() !== userId.toString()) {
      try {
        const notificationService = require('../services/notificationService');
        await notificationService.createNotification({
          userId: test.creatorId,
          type: 'test_rated',
          messageKey: 'notifTestRated',
          targetId: test._id,
          data: {
            raterName: req.user.name || 'Użytkownik', 
            ratingValue: rating,
            testTitle: test.title
          }
          
        });
      } catch (err) {
        console.error("Błąd powiadomienia (rating):", err);
      }
    }

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

    if (test.creatorId.toString() !== userId.toString()) {
      try {
        const notificationService = require('../services/notificationService');
        await notificationService.createNotification({
          userId: test.creatorId,
          type: 'difficulty_rated',
          messageKey: 'notifDifficultyRated',
          targetId: test._id,
          data: {
            raterName: req.user.name || 'Użytkownik',
            ratingValue: rating,
            testTitle: test.title
          }
        });
      } catch (err) {
        console.error("Błąd powiadomienia (difficulty):", err);
      }
    }

    res.json({ message: "Difficulty rating saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/:testId/comments", adminAuth(0), async (req, res) => {
  try {
    const { content } = req.body;
    const { testId } = req.params;
    const userId = req.user._id; 

    // Walidacja treści
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Treść komentarza jest wymagana" });
    }

    // Pobranie testu
    const test = await UserTest.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test nie znaleziony" });
    }

    const newCommentId = new mongoose.Types.ObjectId();

    // Utworzenie obiektu komentarza
    const newComment = {
      _id: newCommentId,
      userId,
      content,
      replies: [],
      createdAt: new Date() 
    };

    // Dodanie do tablicy
    test.comments.push(newComment);
    await test.save();

    
    // SYSTEM POWIADOMIEŃ
    if (test.creatorId.toString() !== userId.toString()) {
      try {
        const notificationService = require('../services/notificationService');

        await notificationService.createNotification({
          userId: test.creatorId,
          type: 'comment_test',       
          messageKey: 'notifCommentTest', 
          targetId: test._id,
          forced: false, 
          contentId: newCommentId
        });
      } catch (notifErr) {
        console.error("Błąd systemu powiadomień:", notifErr);
      }
    }

    res.status(201).json(newComment);

  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Find comment by id recursively
function findCommentById(comments, commentId) {
  for (const comment of comments) {
    if (comment._id.toString() === commentId) return comment;
    const found = findCommentById(comment.replies || [], commentId);
    if (found) return found;
  }
  return null;
}

// Remove comment by id recursively
function removeCommentById(comments, commentId) {
  const index = comments.findIndex(c => c._id.toString() === commentId);
  if (index !== -1) {
    comments.splice(index, 1);
    return true;
  }
  for (const c of comments) {
    if (removeCommentById(c.replies || [], commentId)) return true;
  }
  return false;
}

// Permission check
function canModifyComment(user, comment) {
  return (
    comment.userId.toString() === user._id.toString() ||
    user.accessLvl > 1
  );
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

      const newReplyId = new mongoose.Types.ObjectId();
  
      const newReply = {
        _id: newReplyId,
        userId,
        content,
        replies: [],
        createdAt: new Date()
      };

      parentComment.replies.push(newReply);

      await test.save();

      if (parentComment.userId.toString() !== userId.toString()) {
        try {
            const notificationService = require('../services/notificationService');
            
            await notificationService.createNotification({
                userId: parentComment.userId, // Autor oryginalnego komentarza
                type: 'comment_reply',
                messageKey: 'notifCommentReply',
                targetId: test._id,    // ID Testu (do linku)
                contentId: newReplyId  // ID Odpowiedzi (do podświetlenia)
            });
        } catch (err) {
            console.error("Błąd powiadomienia (reply):", err);
        }
      }

      res.status(201).json({ message: "Reply added" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put("/:testId/comments/:commentId",adminAuth(0),async (req, res) => {
    try {
      const { testId, commentId } = req.params;
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Content required" });
      }

      const test = await UserTest.findById(testId);
      if (!test) return res.status(404).json({ message: "Test not found" });

      const comment = findCommentById(test.comments, commentId);
      if (!comment) return res.status(404).json({ message: "Comment not found" });

      if (!canModifyComment(req.user, comment)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      comment.content = content;
      comment.edited = true; // optional flag

      await test.save();

      res.json({
        message: "Comment updated",
        comment
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
router.delete("/:testId/comments/:commentId",adminAuth(0), async (req, res) => {
    try {
      const { testId, commentId } = req.params;

      const test = await UserTest.findById(testId);
      if (!test) return res.status(404).json({ message: "Test not found" });

      const comment = findCommentById(test.comments, commentId);
      if (!comment) return res.status(404).json({ message: "Comment not found" });

      if (!canModifyComment(req.user, comment)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      removeCommentById(test.comments, commentId);

      await test.save();

      res.json({ message: "Comment deleted" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.patch('/:id', adminAuth(0), async (req, res) => {
    try {
        const { isPublic } = req.body;

        if (isPublic === undefined) {
            return res.status(400).json({ msg: "Brak pola isPublic w żądaniu" });
        }

        //Wyszukiwanie właściwego testu względem id oraz aktualnie zalogowanego użytkownika 
        const test = await UserTest.findOneAndUpdate(
            { _id: req.params.id, creatorId: req.user._id }, 
            { $set: { isPublic: isPublic } },
            { new: true } 
        );

        if (!test) {
            return res.status(404).json({ msg: "Test nie znaleziony lub brak uprawnień do edycji" });
        }

        res.json(test);

    } catch (err) {
        console.error("Błąd zmiany statusu testu:", err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: "Test nie znaleziony" });
        }
        res.status(500).send("Błąd serwera");
    }
});

router.post("/save-result", auth, async (req, res) => {
  try {
    const { 
      testId, score, totalQuestions, correctAnswers, 
      testTitle, authorName 
    } = req.body;
    
    const userId = req.user._id;
    const PASS_THRESHOLD = 50; 
    const POINTS_REWARD = 20;

    // 1. Sprawdzenie czy użytkownik zdał i czy nie dostał wcześniej punktów
    let pointsToAdd = 0;
    let isPointsAwarded = false; 
    let alreadyRewarded = false; 

    if (score >= PASS_THRESHOLD) {
      const existingAction = await UserEarnedAction.findOne({
        userId: userId,
        actionType: "user_test_passed",
        targetId: testId
      });

      if (existingAction) {
        alreadyRewarded = true; // Już kiedyś zdał
      } else {
          // Zdaje pierwszy raz
          pointsToAdd = POINTS_REWARD;
          isPointsAwarded = true; 

          // Aktualizacja punktów 
          await User.findByIdAndUpdate(userId, { $inc: { points: POINTS_REWARD } });

          await new UserEarnedAction({
            userId,
            actionType: "user_test_passed",
            targetId: testId,
            points: POINTS_REWARD
          }).save();
        }
    }

    const historyEntry = new UserTestResult({
      userId,
      testId,
      testTitle: testTitle || "Nieznany test", 
      authorName: authorName || "Anonim",
      score,
      totalQuestions,
      correctAnswers,
      passed: score >= PASS_THRESHOLD,
      pointsAwarded: isPointsAwarded 
    });
    
    await historyEntry.save();

    res.json({
      success: true,
      pointsAdded: pointsToAdd,
      alreadyPassed: alreadyRewarded
    });

  } catch (err) {
    console.error("Błąd zapisu:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

module.exports = router;