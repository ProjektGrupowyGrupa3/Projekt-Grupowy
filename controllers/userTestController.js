const UserTest = require('../models/UserTest.js');
const notificationService = require('../services/notificationService.js');

async function addComment(req, res) {
  const { testId, content } = req.body;

  const test = await UserTest.findById(testId);
  if (!test) return res.sendStatus(404);

  test.comments.push({
    userId: req.user.id,
    content
  });

  await test.save();

  if (test.creatorId.toString() !== req.user.id) {
    await notificationService.createNotification({
      userId: test.creatorId,
      type: 'comment_test',
      messageKey: 'notifCommentTest'
    });
  }

  res.status(201).json(test.comments);
}

async function replyToComment(req, res) {
  const { testId, commentId, content } = req.body;

  const test = await UserTest.findById(testId);
  if (!test) return res.sendStatus(404);

  const comment = test.comments.id(commentId);
  if (!comment) return res.sendStatus(404);

  comment.replies.push({
    userId: req.user.id,
    content
  });

  await test.save();

  if (comment.userId.toString() !== req.user.id) {
    await notificationService.createNotification({
      userId: comment.userId,
      type: 'comment_reply',
      messageKey: 'notifCommentReply'
    });
  }

  res.json(comment.replies);
}

async function rateTest(req, res) {
  const { testId, rating } = req.body;

  const test = await UserTest.findById(testId);
  if (!test) return res.sendStatus(404);

  test.rating.push({
    userId: req.user.id,
    rating
  });

  await test.save();

  if (test.creatorId.toString() !== req.user.id) {
    await notificationService.createNotification({
      userId: test.creatorId,
      type: 'test_rated',
      messageKey: 'notifTestRated'
    });
  }

  res.json({ success: true });
}

async function rateDifficulty(req, res) {
  const { testId, rating } = req.body;

  const test = await UserTest.findById(testId);
  if (!test) return res.sendStatus(404);

  test.difficultiyRating.push({
    userId: req.user.id,
    rating
  });

  await test.save();

  await notificationService.createNotification({
    userId: test.creatorId,
    type: 'difficulty_rated',
    messageKey: 'notifDifficultyRated'
  });

  res.json({ success: true });
}

module.exports = {
  addComment,
  replyToComment,
  rateTest,
  rateDifficulty
};