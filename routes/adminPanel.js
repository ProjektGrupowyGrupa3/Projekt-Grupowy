const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");
const Question = require("../models/Question");
const Subject = require("../models/Subject");
const nodemailer = require('nodemailer');

//USERS

// Get user by ID
router.get("/users/:id", adminAuth(1), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Search user
router.get("/users", adminAuth(1), async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } }
          ]
        }
      : {}; 

    const users = await User.find(filter).limit(100);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Edit user
router.put("/users/:id", adminAuth(1), async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Ban user
router.post("/users/:id/ban", adminAuth(1), async (req, res) => {
  try {
    const { note } = req.body;
    const adminName = req.user.name; 

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accessLvl: -1 },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host:"pgpaigrupa@gmail.com",
      port:587,
      secure:false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: user.email,
      subject: "Account Banned",
      text: `Hello ${user.name},\n\nYour account has been banned by admin ${adminName}.\n\nNote: ${note || "No note provided"}\n\nRegards,\nAdmin Team`
    });

    res.json({ message: "User banned", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//DELETE USER
router.post("/users/:id/delete", adminAuth(2), async (req, res) => {
  try {
    const { note } = req.body;
    const adminName = req.user.name; 
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host:"pgpaigrupa@gmail.com",
      port:587,
      secure:false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: user.email,
      subject: "Account Deleted",
      text: `Hello ${user.name},\n\nYour account has been permanently deleted by admin ${adminName}.\n\nNote: ${note || "No note provided"}\n\nRegards,\nAdmin Team`
    });

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//QUESTIONS

// Search questions
router.get("/questions/search", adminAuth(1), async (req, res) => {
  try {
    const { q } = req.query;

    const filter = q
      ? {
          $or: [
            { "question.en": { $regex: q, $options: "i" } },
            { "question.pl": { $regex: q, $options: "i" } },
            { tags: { $in: [new RegExp(q, "i")] } }
          ]
        }
      : {};

    const result = await Question.find(filter)
      .limit(100)
      .populate("subject", "name"); 

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get question by ID
router.get("/questions/:id", adminAuth(1), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Not found" });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create question
router.post("/questions", adminAuth(1), async (req, res) => {
  try {
      const existing = await Question
      .find({ number: { $exists: true } })
      .select("number -_id")
      .sort({ number: 1 })
      .lean();
    let nextNumber = 1;
    for (const q of existing) {
      if (q.number === nextNumber) {
        nextNumber++;
      } else if (q.number > nextNumber) {
        break;
      }
    }
    const question = await Question.create({
      ...req.body,
      number: nextNumber
    });
    res.status(201).json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Edit question
router.put("/questions/:id", adminAuth(1), async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete question
router.delete("/questions/:id", adminAuth(1), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Not found" });
    }

    const deletedNumber = question.number;

    await Question.deleteOne({ _id: question._id });

    if (typeof deletedNumber === "number") {
      await Question.updateMany(
        { number: { $gt: deletedNumber } },
        { $inc: { number: -1 } }
      );
    }

    res.json({
      message: "Question deleted and numbering updated",
      deletedNumber
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
//SUBJECTS

// Search subjects
router.get("/subjects/search", adminAuth(1), async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? {
          $or: [
            { "name.en": { $regex: q, $options: "i" } },
            { "name.pl": { $regex: q, $options: "i" } },
            { "specialization.en": { $regex: q, $options: "i" } },
            { "specialization.pl": { $regex: q, $options: "i" } },
          ]
        }
      : {}; 

    const list = await Subject.find(filter).limit(100);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get subject by ID
router.get("/subjects/:id", adminAuth(1), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Not found" });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create subject
router.post("/subjects", adminAuth(1), async (req, res) => {
  try {
    const s = await Subject.create(req.body);
    res.status(201).json(s);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Edit subject
router.put("/subjects/:id", adminAuth(1), async (req, res) => {
  try {
    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete subject
router.delete("/subjects/:id", adminAuth(1), async (req, res) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
