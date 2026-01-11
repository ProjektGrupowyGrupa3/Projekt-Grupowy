const User = require('../models/User');
const UserEarnedAction = require('../models/UserEarnedActions'); 

exports.getRanking = async (req, res) => {
  try {
    const top = parseInt(req.query.limit) || 50;
    const period = req.query.period || 'all';

    // Ranking Całkowity ("Od początku") 
    if (period === 'all') {
      const ranking = await User.find({}, "name points")
        .sort({ points: -1 })
        .limit(top)
        .lean();

      return res.json({ success: true, ranking });
    }

    // Ranking Okresowy (Bieżący/Zeszły tydzień)
    
    let startDate = new Date();
    let endDate = new Date();

    // Logika dat 
    if (period === 'current_week') {
      const day = startDate.getDay(); 
      const diff = startDate.getDate() - (day === 0 ? 6 : day - 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0); 
    } else if (period === 'last_week') {
      const today = new Date();
      const dayRelToMon = today.getDay() === 0 ? 6 : today.getDay() - 1;
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() - dayRelToMon);
      currentMonday.setHours(0,0,0,0);
      startDate = new Date(currentMonday);
      startDate.setDate(currentMonday.getDate() - 7);
      endDate = new Date(currentMonday);
      endDate.setMilliseconds(-1);
    } else {
        const ranking = await User.find({}, "name points").sort({ points: -1 }).limit(top).lean();
        return res.json({ success: true, ranking });
    }

    const ranking = await User.aggregate([
      // Łączenie użytkownika z jego akcjami 
      {
        $lookup: {
          from: "userearnedactions", 
          let: { userId: "$_id" },   
          pipeline: [
            { 
              $match: { 
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] }, 
                    { $gte: ["$createdAt", startDate] }, 
                    { $lte: ["$createdAt", endDate] }    
                  ]
                }
              } 
            },
            { $project: { points: 1 } } 
          ],
          as: "periodActions" 
        }
      },
      {
        $addFields: {
          points: { $sum: "$periodActions.points" }
        }
      },
      { $project: { name: 1, points: 1 } },
      
      { $sort: { points: -1 } },
      
      { $limit: top }
    ]);

    res.json({ success: true, ranking });

  } catch (err) {
    console.error("Ranking error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};