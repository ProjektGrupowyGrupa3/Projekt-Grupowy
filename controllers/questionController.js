const mongoose = require('mongoose');
const Question = require('../models/Question');
const UserAnswer = require('../models/UserProgress');


exports.getQuestions = async (req, res) => {
  const { mode = 'all', subject, lang = 'pl', limit = 50 } = req.query;
  const userId = req.user?._id;

  try {
    if (!subject || !mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({ message: 'Niepoprawny identyfikator przedmiotu.' });
    }
    const subjectId = new mongoose.Types.ObjectId(subject);

    const totalCount = await Question.countDocuments({ subject: subjectId });

    // Wszystkie pytania dla przedmiotu
    const allQuestions = await Question.find({ subject: subjectId })
      .populate('subject', `name.${lang}`)
      .sort({ number: 1 })
      .lean();

    // Odpowiedzi użytkownika
    const userAnswers = userId ? await UserAnswer.find({ userId }).lean() : [];
    // Mapa dla szybkiego dostępu: questionId -> UserAnswer Object
    const answersMap = new Map(userAnswers.map(a => [a.questionId.toString(), a]));

    const byIds = ids => allQuestions.filter(q => ids.includes(q._id.toString()));
    
    // Pytania bez jakiejkolwiek odpowiedzi (Priorytet 1 - Najwyższy)
    const unanswered = allQuestions.filter(q => !answersMap.has(q._id.toString()));

    let questions = [];

    // Logika trybów
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
        // Wyodrębnij pytania, na które już udzielono odpowiedzi
        const answeredList = allQuestions
          .filter(q => answersMap.has(q._id.toString()))
          .map(q => {
            const ans = answersMap.get(q._id.toString());
            return { 
              ...q, 
              _userCorrect: ans.correct,      // status poprawności (true/false)
              _lastUpdated: ans.updatedAt     // data ostatniej odpowiedzi
            };
          });

        // Podziel na Błędne i Poprawne
        const incorrectList = answeredList.filter(q => q._userCorrect === false);
        const correctList = answeredList.filter(q => q._userCorrect === true);

        // Funkcja sortująca: Od najstarszej daty do najnowszej (rosnąco)
        const sortByDateAsc = (a, b) => new Date(a._lastUpdated) - new Date(b._lastUpdated);

        incorrectList.sort(sortByDateAsc);
        correctList.sort(sortByDateAsc);

        // Złącz w kolejności: Nieodpowiedziane -> Błędne (stare) -> Poprawne (stare)
        questions = [...unanswered, ...incorrectList, ...correctList];
        break;
    }

    // Limit wyników 
    questions = questions.slice(0, limit);

    // Mapowanie dla frontu
    const localized = questions.map(q => ({
      _id: q._id,
      number: q.number,
      subject: q.subject?.name?.[lang] || '',
      difficulty: q.difficulty,
      tags: q.tags,
      question: q.question?.[lang] || '',
      answers: q.answers.map(a => ({
        label: a.label,
        text: a.text[lang] || '',
        isCorrect: a.isCorrect,
        explanation: a.explanation?.[lang] || '',
        _full: {
          text: a.text,
          explanation: a.explanation
        }
      })),
      _full: {
        question: q.question,
        answers: q.answers
      }
    }));

    res.json({ totalCount, questions: localized });
  } catch (err) {
    console.error('❌ Błąd getQuestions:', err);
    res.status(500).json({ message: 'Błąd przy pobieraniu pytań.' });
  }
};

