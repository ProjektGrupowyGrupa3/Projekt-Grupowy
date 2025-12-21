const User = require('../models/User');
const Subject = require('../models/Subject');
const UserEarnedActions = require('../models/UserEarnedActions'); 
const UserProgress = require('../models/UserProgress');
const TestResult = require('../models/TestResult');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Podstawowe statystyki
    const user = await User.findById(userId, 'points name');
    const totalTests = await UserEarnedActions.countDocuments({ userId });


    // 2. PODIUM: Najczęściej rozwiązywane kategorie
    let popularCategories = await UserProgress.aggregate([
      // A. Filtrujemy postęp tego użytkownika
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },

      // B. Pierwszy LOOKUP: Złącz UserProgress z Questions
      {
        $lookup: {
          from: 'questions',       // Nazwa kolekcji pytań
          localField: 'questionId',
          foreignField: '_id',
          as: 'questionData'
        }
      },
      { $unwind: '$questionData' }, // Spłaszczamy tablicę (bo user ma 1 pytanie na wpis)

      // C. Drugi LOOKUP: Złącz wynik (Questions) z Subjects
      {
        $lookup: {
          from: 'subjects',            // <--- Nazwa kolekcji przedmiotów (sprawdź w bazie!)
          localField: 'questionData.subject', // Pole subject z zaciągniętego wyżej pytania
          foreignField: '_id',
          as: 'subjectData'
        }
      },
      { $unwind: '$subjectData' }, // Spłaszczamy tablicę przedmiotów

      // D. Grupujemy po nazwie przedmiotu
      // Zakładam, że model Subject ma pole 'name' typu localizedStringSchema
      // Dzięki temu _id zwróci obiekt { pl: "...", en: "..." }
      { 
        $group: { 
            _id: "$subjectData._id",           // Grupujemy po ID przedmiotu (bezpieczne)
            subjectName: { $first: "$subjectData.name" }, // Zachowujemy obiekt nazwy {pl, en} 
            count: { $sum: 1 } // Liczymy ilość unikalnych pytań rozwiązanych z tego przedmiotu
            // Opcjonalnie: Jeśli chcesz liczyć ilość wszystkich podejść:
            // count: { $sum: "$answerCount" }
        } 
      },

      // E. Sortujemy i limitujemy
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // 3. PODIUM: Najlepsza skuteczność (średni wynik w %)
    let bestCategories = await TestResult.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        
        // Teraz wystarczy TYLKO JEDEN lookup do przedmiotów
        {
            $lookup: {
                from: 'subjects',
                localField: 'subjectId',
                foreignField: '_id',
                as: 'subjectData'
            }
        },
        { $unwind: '$subjectData' },

        { 
            $group: { 
                _id: "$subjectData._id",
                subjectName: { $first: "$subjectData.name" }, // {pl, en}
                avgScore: { $avg: "$score" },                 // Średnia z pola score!
                count: { $sum: 1 }                            // Ile testów rozwiązano
            } 
        },
        
        { $sort: { avgScore: -1 } },
        { $limit: 3 }
    ]);

    // LOGIKA UZUPEŁNIANIA (FILLING) 

    // Funkcja pomocnicza do pobierania losowych przedmiotów
    const fillPodium = async (currentList, type) => {
        // Jeśli mamy już 3 lub więcej wyników, nic nie robimy
        if (currentList.length >= 3) return currentList;

        const needed = 3 - currentList.length;
        
        // Zbieramy ID przedmiotów, które już mamy na liście (żeby ich nie dublować)
        const existingIds = currentList.map(item => item._id);

        // Pobieramy losowe przedmioty, których nie ma na liście
        const randomSubjects = await Subject.aggregate([
            { $match: { _id: { $nin: existingIds } } }, // Wyklucz obecne
            { $sample: { size: needed } },              // Weź losowe X sztuk
            { $project: { name: 1 } }                   // Weź tylko nazwę i ID
        ]);

        // Mapujemy je do struktury pasującej do reszty wyników
        const fillers = randomSubjects.map(subj => {
            if (type === 'popular') {
                return {
                    _id: subj._id,
                    subjectName: subj.name, // {pl, en}
                    count: 0 // Zero aktywności
                };
            } else { // type === 'best'
                return {
                    _id: subj._id,
                    subjectName: subj.name,
                    avgScore: 0, // Zero procent
                    count: 0
                };
            }
        });

        // Łączymy prawdziwe wyniki z "wypełniaczami"
        return [...currentList, ...fillers];
    };

    // Uruchamiamy uzupełnianie
    popularCategories = await fillPodium(popularCategories, 'popular');
    bestCategories = await fillPodium(bestCategories, 'best');

    // 4. Ostatnia aktywność (Pobieramy z UserEarnedAction, bo tam są typy akcji)
    // A. Pobieramy ostatnie wyniki testów (Zdane i Niezdane)
    const testsPromise = TestResult.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10) // Pobieramy z zapasem
        .populate('subjectId', 'name') // Pobieramy nazwę przedmiotu
        .lean();

    // B. Pobieramy inne akcje punktowe (Logowania, Rejestracja, Pojedyncze pytania)
    // WYKLUCZAMY 'test_passed', żeby nie dublować wpisów (bo testy bierzemy z punktu A)
    const actionsPromise = UserEarnedActions.aggregate([
        { $match: { 
            userId: new mongoose.Types.ObjectId(userId),
            actionType: { $ne: 'test_passed' } // Wykluczamy zaliczenie testu
        }},
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        // Lookup dla pytań (jeśli to quiz_correct / quiz_wrong)
        {
            $lookup: {
                from: 'questions',
                localField: 'targetId',
                foreignField: '_id',
                as: 'questionData'
            }
        },
        { $unwind: { path: '$questionData', preserveNullAndEmptyArrays: true } },
        // Lookup dla przedmiotu (z pytania)
        {
            $lookup: {
                from: 'subjects',
                localField: 'questionData.subject',
                foreignField: '_id',
                as: 'subjectData'
            }
        },
        { $unwind: { path: '$subjectData', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                actionType: 1,
                points: 1,
                createdAt: 1,
                subjectName: '$subjectData.name'
            }
        }
    ]);

    // Czekamy na oba zapytania
    const [tests, actions] = await Promise.all([testsPromise, actionsPromise]);

    // C. Formatowanie i Łączenie danych
    // Musimy sprowadzić oba źródła do wspólnego formatu
    
    const formattedTests = tests.map(t => ({
        type: 'test_result', // Własny znacznik
        date: t.createdAt,
        points: t.score >= 50 ? 20 : 0, // Zakładamy 20 pkt za zdany, 0 za oblany
        score: t.score, // Wynik w %
        subjectName: t.subjectId ? t.subjectId.name : null,
        isSuccess: t.score > 50
    }));

    const formattedActions = actions.map(a => ({
        type: 'action', // Znacznik akcji
        originalType: a.actionType, // np. login, quiz_correct, quiz_wrong
        date: a.createdAt,
        points: a.points,
        score: null, // Akcje nie mają procentów
        subjectName: a.subjectName,
        isSuccess: a.points > 0 // Jeśli 0 pkt, to uznajemy za "niepowodzenie/info"
    }));

    // D. Złączenie, Sortowanie i Limit
    let combinedActivity = [...formattedTests, ...formattedActions];
    
    // Sortuj malejąco po dacie
    combinedActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Weź 10 ostatnich
    const recentActivity = combinedActivity.slice(0, 10);

    res.json({
        success: true,
        stats: {
            points: user.points,
            totalTests,
            popularCategories,
            bestCategories,
            recentActivity 
        }
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};