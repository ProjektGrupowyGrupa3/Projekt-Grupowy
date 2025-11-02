const mongoose = require('mongoose');
const UserAnswer = require('../models/UserProgress');

/**
 * Zapisuje odpowiedź użytkownika (poprawna / błędna)
 * - aktualizuje istniejący wpis lub tworzy nowy
 * - zlicza liczbę podejść do pytania (answerCount)
 */
exports.saveAnswer = async (req, res) => {
  const { questionId, correct } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'Brak autoryzacji użytkownika.' });
  }
  if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: 'Niepoprawne ID pytania.' });
  }

  try {
    // ✅ Aktualizuj lub wstaw nowy wpis (atomicznie)
    await UserAnswer.findOneAndUpdate(
      { userId, questionId },
      {
        $set: { correct },
        $inc: { answerCount: 1 },
        $currentDate: { updatedAt: true }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Błąd podczas zapisu odpowiedzi:', err);
    res.status(500).json({ message: 'Błąd przy zapisie odpowiedzi.' });
  }
};

/**
 * Przełącza stan "zapamiętania" pytania (saved)
 * - jeśli rekord istnieje → odwraca stan saved
 * - jeśli nie istnieje → tworzy nowy z saved=true
 */
exports.toggleSave = async (req, res) => {
  const { questionId } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'Brak autoryzacji użytkownika.' });
  }
  if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: 'Niepoprawne ID pytania.' });
  }

  try {
    const record = await UserAnswer.findOne({ userId, questionId });

    if (record) {
      record.saved = !record.saved;
      await record.save();
      return res.json({ success: true, saved: record.saved });
    }
    
    const newRecord = await UserAnswer.create({
      userId,
      questionId,
      saved: true,
      answerCount: 0
    });

    res.json({ success: true, saved: newRecord.saved });
  } catch (err) {
    console.error('❌ Błąd toggleSave:', err);
    res.status(500).json({ message: 'Błąd przy aktualizacji stanu pytania.' });
  }
};
