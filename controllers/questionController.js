const mongoose = require('mongoose');
const Question = require('../models/Question');
const UserAnswer = require('../models/UserProgress');

/**
 * GET /api/questions
 * Zwraca pytania dla danego przedmiotu w określonym trybie:
 *  - unanswered: pytania bez odpowiedzi
 *  - incorrect: błędne odpowiedzi
 *  - saved: zapamiętane przez użytkownika
 *  - all: wszystkie (sortowane wg zasad)
 *  - random: losowo
 */

exports.getQuestions = async (req, res) => {
  const { mode = 'all', subject, lang = 'pl', limit = 50 } = req.query;
  const userId = req.user?._id;

  try {
    // ✅ Walidacja i konwersja subject
    if (!subject || !mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({ message: 'Niepoprawny identyfikator przedmiotu.' });
    }
    const subjectId = new mongoose.Types.ObjectId(subject);

    // ✅ Liczba wszystkich pytań
    const totalCount = await Question.countDocuments({ subject: subjectId });

    // ✅ Pobierz pytania z danego przedmiotu
    const allQuestions = await Question.find({ subject: subjectId })
      .populate('subject', `name.${lang}`)
      .sort({ number: 1 })
      .lean();

    // ✅ Pobierz odpowiedzi użytkownika
    const userAnswers = userId ? await UserAnswer.find({ userId }).lean() : [];
    const answersMap = new Map(userAnswers.map(a => [a.questionId.toString(), a]));

    // 🔹 Pomocnicze funkcje
    const byIds = ids => allQuestions.filter(q => ids.includes(q._id.toString()));
    const unanswered = allQuestions.filter(q => !answersMap.has(q._id.toString()));

    let questions = [];

    // 🔹 Logika trybów
    switch (mode) {
      case 'unanswered':
        questions = unanswered;
        break;

      case 'incorrect':
        questions = byIds(
          userAnswers.filter(a => a.correct === false).map(a => a.questionId.toString())
        );
        break;

      case 'saved':
        questions = byIds(
          userAnswers.filter(a => a.saved === true).map(a => a.questionId.toString())
        );
        break;

      case 'random':
        questions = allQuestions.sort(() => Math.random() - 0.5);
        break;

      case 'all':
      default:
        const withAnswers = allQuestions
          .filter(q => answersMap.has(q._id.toString()))
          .map(q => {
            const ans = answersMap.get(q._id.toString());
            return { ...q, answerCount: ans.answerCount || 0, lastUpdated: ans.updatedAt };
          });

        // sortuj: najpierw mniej razy odpowiadane, potem starsze
        withAnswers.sort((a, b) => {
          if (a.answerCount !== b.answerCount) return a.answerCount - b.answerCount;
          return new Date(a.lastUpdated) - new Date(b.lastUpdated);
        });

        questions = [...unanswered, ...withAnswers];
        break;
    }

    // 🔹 Przytnij wynik
    questions = questions.slice(0, limit);

    // 🔹 Mapowanie dla frontu
    const localized = questions.map(q => ({
      _id: q._id,
      number: q.number,
      subject: q.subject?.name?.[lang] || '',
      question: q.question?.[lang] || '',
      difficulty: q.difficulty,
      tags: q.tags,
      answers: q.answers.map(a => ({
        label: a.label,
        text: a.text[lang] || '',
        isCorrect: a.isCorrect,
        explanation: a.explanation?.[lang] || ''
      }))
    }));

    // ✅ Odpowiedź
    res.json({ totalCount, questions: localized });
  } catch (err) {
    console.error('❌ Błąd getQuestions:', err);
    res.status(500).json({ message: 'Błąd przy pobieraniu pytań.' });
  }
};
