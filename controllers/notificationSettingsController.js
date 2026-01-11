const NotificationSettings = require('../models/NotificationSettings.js');

async function getSettings(req, res) {
  let settings = await NotificationSettings.findOne({ userId: req.user.id });
  if (!settings) settings = await NotificationSettings.create({ userId: req.user.id });
  res.json(settings);
}

async function updateSettings(req, res) {
  const settings = await NotificationSettings.findOneAndUpdate(
    { userId: req.user.id },
    req.body,
    { new: true, upsert: true }
  );
  res.json(settings);
}

module.exports = {
  getSettings,
  updateSettings
};