const express = require('express');
const Notification = require('../models/Notification.js');
const NotificationSettings = require('../models/NotificationSettings.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

/* =========================
   GET – lista powiadomień
========================= */
router.get('/', auth, async (req, res) => {
  const notifications = await Notification
    .find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.json(notifications);
});

/* =========================
   POST – oznacz jako przeczytane
========================= */
router.post('/:id/read', auth, async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, userId: req.user.id },
    { $set: { read: true } }
  );
  res.sendStatus(200);
});

/* =========================
   POST – oznacz wszystkie
========================= */
router.post('/read-all', auth, async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, read: false },
    { $set: { read: true } }
  );
  res.sendStatus(200);
});

/* =========================
   GET – ustawienia
========================= */
router.get('/settings', auth, async (req, res) => {
  let settings = await NotificationSettings.findOne({
    userId: req.user.id
  });

  if (!settings) {
    settings = await NotificationSettings.create({
      userId: req.user.id
    });
  }

  res.json(settings);
});

/* =========================
   PUT – zapisz ustawienia
========================= */
router.put('/settings', auth, async (req, res) => {
  const updated = await NotificationSettings.findOneAndUpdate(
    { userId: req.user.id },
    req.body,
    { new: true, upsert: true }
  );

  res.json(updated);
});

module.exports = router;