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
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },

      // B. Pierwszy LOOKUP: Złącz UserProgress z Questions
      {
        $lookup: {
          from: 'questions',       
          localField: 'questionId',
          foreignField: '_id',
          as: 'questionData'
        }
      },
      { $unwind: '$questionData' }, 

      // C. Drugi LOOKUP: Złącz wynik (Questions) z Subjects
      {
        $lookup: {
          from: 'subjects',            
          localField: 'questionData.subject', 
          foreignField: '_id',
          as: 'subjectData'
        }
      },
      { $unwind: '$subjectData' }, 

      // D. Grupowanie po nazwie przedmiotu
      { 
        $group: { 
            _id: "$subjectData._id",           
            subjectName: { $first: "$subjectData.name" }, 
            count: { $sum: 1 } 
        } 
      },

      // E. Sortujemy i limitujemy
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // 3. PODIUM: Najlepsza skuteczność (średni wynik w %)
    let bestCategories = await TestResult.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        
        // Lookup do przedmiotów
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
                subjectName: { $first: "$subjectData.name" }, 
                avgScore: { $avg: "$score" },                 
                count: { $sum: 1 }                            
            } 
        },
        
        { $sort: { avgScore: -1 } },
        { $limit: 3 }
    ]);

    // LOGIKA UZUPEŁNIANIA (Aby ranking nie był pusty, w przypadku gdy uzytkownik dopiero zaczyna) 

    const fillPodium = async (currentList, type) => {
        // Jeśli mamy już 3 lub więcej wyników, nic nie robimy
        if (currentList.length >= 3) return currentList;

        const needed = 3 - currentList.length;
        
        
        const existingIds = currentList.map(item => item._id);

        // Pobieramy losowe przedmioty, których nie ma na liście
        const randomSubjects = await Subject.aggregate([
            { $match: { _id: { $nin: existingIds } } }, 
            { $sample: { size: needed } },             
            { $project: { name: 1 } }                   
        ]);

        const fillers = randomSubjects.map(subj => {
            if (type === 'popular') {
                return {
                    _id: subj._id,
                    subjectName: subj.name, 
                    count: 0 
                };
            } else { 
                return {
                    _id: subj._id,
                    subjectName: subj.name,
                    avgScore: 0, 
                    count: 0
                };
            }
        });

        return [...currentList, ...fillers];
    };

    popularCategories = await fillPodium(popularCategories, 'popular');
    bestCategories = await fillPodium(bestCategories, 'best');

    // 4. Ostatnia aktywność użytkownika
    // A. Pobieranie ostatnich wyników testów
    const testsPromise = TestResult.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10) 
        .populate('subjectId', 'name') 
        .lean();

    // B. Pobieramy inne akcje punktowe (Logowania, Rejestracja, Pojedyncze pytania)
    const actionsPromise = UserEarnedActions.aggregate([
        { $match: { 
            userId: new mongoose.Types.ObjectId(userId),
            actionType: { $ne: 'test_passed' } 
        }},
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'questions',
                localField: 'targetId',
                foreignField: '_id',
                as: 'questionData'
            }
        },
        { $unwind: { path: '$questionData', preserveNullAndEmptyArrays: true } },
        // Lookup dla przedmiotu 
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

    const [tests, actions] = await Promise.all([testsPromise, actionsPromise]);

    // C. Formatowanie i Łączenie danych
        const formattedTests = tests.map(t => ({
        type: 'test_result', 
        date: t.createdAt,
        points: t.score >= 50 ? 20 : 0, 
        score: t.score, 
        subjectName: t.subjectId ? t.subjectId.name : null,
        isSuccess: t.score > 50
    }));

    const formattedActions = actions.map(a => ({
        type: 'action', 
        originalType: a.actionType, 
        date: a.createdAt,
        points: a.points,
        score: null, 
        subjectName: a.subjectName,
        isSuccess: a.points > 0 
    }));

    let combinedActivity = [...formattedTests, ...formattedActions];
    
    combinedActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    
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