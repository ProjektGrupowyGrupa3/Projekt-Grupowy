const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const Report = require("../models/Report");

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

module.exports = router;