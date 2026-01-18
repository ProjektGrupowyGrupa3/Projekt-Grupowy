const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const UserTest = require("../models/UserTest");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const Report = require("../models/Report");
const nodemailer = require('nodemailer');


function findCommentRecursive(comments, commentId) {
  for (const c of comments) {
    if (c._id.toString() === commentId.toString()) return c;
    if (c.replies?.length) {
      const found = findCommentRecursive(c.replies, commentId);
      if (found) return found;
    }
  }
  return null;
}

function removeCommentRecursive(comments, commentId) {
  const index = comments.findIndex(c => c._id.toString() === commentId.toString());
  if (index !== -1) {
    comments.splice(index, 1);
    return true;
  }
  for (const c of comments) {
    if (removeCommentRecursive(c.replies || [], commentId)) return true;
  }
  return false;
}



function validateReportPayload(type, body) {
  if (type === "user") {
    if (!body.reportedUserId) throw "reportedUserId required";
  }

  if (type === "comment") {
    if (!body.reportedUserId || !body.testId || !body.commentId)
      throw "reportedUserId, testId and commentId required";
  }

  if (type === "userTest") {
    if (!body.reportedUserId || !body.userTestId)
      throw "reportedUserId and userTestId required";
  }
}

router.post("/", auth, async (req, res) => {
  try {
    const { type } = req.body;

    validateReportPayload(type, req.body);

    const report = await Report.create({
      ...req.body,
      reporterId: req.user._id
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.toString() });
  }
});
router.get("/", auth, adminAuth(1), async (req, res) => {
  try {
    const reports = await Report.find({ status: "active" })
      .populate("reporterId", "name email")
      .populate("reportedUserId", "name email");

    // Use Promise.all to fetch comments for reports referencing comments
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        let commentContent = null;
        let commentNickname = null;

        if (report.type === "comment" && report.testId && report.commentId) {
          try {
            // Fetch the full UserTest document
            const UserTest = require("../models/UserTest"); // adjust path if needed
            const test = await UserTest.findById(report.testId)
              .populate("comments.userId", "name") // populate nicknames for comment authors
              .lean();

            if (test) {
              // Recursive function to find comment by ID
              const findCommentRecursive = (comments) => {
                for (const c of comments) {
                  if (c._id.toString() === report.commentId.toString()) {
                    return c;
                  }
                  if (c.replies?.length) {
                    const found = findCommentRecursive(c.replies);
                    if (found) return found;
                  }
                }
                return null;
              };

              const comment = findCommentRecursive(test.comments || []);
              if (comment) {
                commentContent = comment.content;
                commentNickname = comment.userId?.name || "Unknown";
              }
            }
          } catch (err) {
            console.error("Error fetching comment for report:", err);
          }
        }

        return {
          _id: report._id,
          type: report.type,
          status: report.status,

          reporter: report.reporterId,
          reportedUser: report.reportedUserId,

          testId: report.testId || null,
          testTitle: report.userTestId?.title || null,

          commentId: report.commentId || null,
          commentContent,
          commentNickname,

          createdAt: report.createdAt
        };
      })
    );

    res.json(enrichedReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load reports" });
  }
});


router.patch("/:id/resolve", auth, adminAuth(1), async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: "resolved" },
    { new: true }
  );

  res.json(report);
});
router.get("/user/:userId", auth, adminAuth(1), async (req, res) => {
  const reports = await Report.find({
    reportedUserId: req.params.userId
  });

  res.json(reports);
});

router.post("/:id/dismiss",auth,adminAuth(1),async (req, res) => {
    try {
      const report = await Report.findById(req.params.id)
        .populate("reporterId", "email name");

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      report.status = "resolved";
      report.resolution = "dismissed";
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
      report.adminReason = req.body.reason || "";
      const adminName = req.user.name; 
      await report.save();
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
        to: report.reporterId.email,
        subject: "Report Dissmissed",
        text: `Hello ${report.reporterId.name},\n\nYour report has been checked and dmissmissed by ${adminName}.\n\nNote: ${report.adminReason || "No note provided"}\n\nRegards,\nAdmin Team`
      });
      res.json({ message: "Report dismissed" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Dismiss failed" });
    }
  }
);
router.post("/:id/delete",auth,adminAuth(1),async (req, res) => {
    try {
      const report = await Report.findById(req.params.id)
        .populate("reporterId", "email name")
        .populate("reportedUserId", "email name");

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (report.type === "comment") {
        const test = await UserTest.findById(report.testId);
        if (test) {
          removeCommentRecursive(test.comments, report.commentId);
          await test.save();
        }
      }

      if (report.type === "userTest") {
        await UserTest.findByIdAndDelete(report.userTestId);
      }

      report.status = "resolved";
      report.resolution = "deleted";
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
      report.adminReason = req.body.reason || "";

      await report.save();

      const adminName = req.user.name; 
      await report.save();
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
        to: report.reporterId.email,
        subject: "Report Accepted",
        text: `Hello ${report.reporterId.name},\n\nYour report has been checked and violation was found by ${adminName}, reported content has been deleted\n\nRegards,\nAdmin Team`
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: report.reportedUserId.email,
        subject: "Report Accepted",
        text: `Hello ${report.reportedUserId.name},\n\Your content was reported and found to be violating the rules by ${adminName}, reported content has been deleted \n Reason: ${report.adminReason || "No reason provided"}\n Further infractions may result in permament ban\n\nRegards,\nAdmin Team`
      });
      res.json({ message: "Content deleted and user warned" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Delete failed" });
    }
  }
);

router.post("/:id/ban",auth,adminAuth(1),async (req, res) => {
    try {
      const report = await Report.findById(req.params.id)
        .populate("reporterId", "email name")
        .populate("reportedUserId", "email name");

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      await User.findByIdAndUpdate(report.reportedUserId._id, {
        banned: true,
        banReason: req.body.reason || "Violation of rules",
        bannedAt: new Date()
      });

      if (report.type === "comment") {
        const test = await UserTest.findById(report.testId);
        if (test) {
          removeCommentRecursive(test.comments, report.commentId);
          await test.save();
        }
      }

      if (report.type === "userTest") {
        await UserTest.findByIdAndDelete(report.userTestId);
      }

      report.status = "resolved";
      report.resolution = "banned";
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
      report.adminReason = req.body.reason || "";

      await report.save();


      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: report.reporterId.email,
        subject: "Report Accepted",
        text: `Hello ${report.reporterId.name},\n\nYour report has been checked and violation was found by ${adminName}, reported content has been deleted and user banned\n\nRegards,\nAdmin Team`
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: report.reportedUserId.email,
        subject: "Report Accepted",
        text: `Hello ${report.reportedUserId.name},\n\Your content was reported and found to be violating the rules by ${adminName}, reported content has been deleted and Your account permamently suspended\n Reason: ${report.adminReason || "No reason provided"}\n\nRegards,\nAdmin Team`
      });
      res.json({ message: "User banned and content removed" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ban failed" });
    }
  }
);



module.exports = router;