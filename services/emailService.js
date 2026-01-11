const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendNotificationEmail(to, messageKey) {
  const messages = {
    notifCommentTest: 'Nowy komentarz pod Twoim testem',
    notifCommentReply: 'Odpowiedź na Twój komentarz',
    notifTestRated: 'Twój test został oceniony',
    notifModerationDecision: 'Decyzja moderatora',
    notifRankingUpdate: 'Aktualizacja rankingu'
  };

  await transporter.sendMail({
    from: 'LearnIt <no-reply@learnit.pl>',
    to,
    subject: 'LearnIt – powiadomienie',
    text: messages[messageKey] || 'Masz nowe powiadomienie'
  });
}

module.exports = {
  sendNotificationEmail
};