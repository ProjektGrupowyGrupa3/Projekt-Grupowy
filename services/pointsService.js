const User = require("../models/User");
const UserEarnedAction = require("../models/UserEarnedActions");


async function addPoints(userId, actionType, points, targetId = null) {
  try {
    console.log("addPoints wywołane:", userId, actionType, points);

    let exists = null;

    // Logika sprawdzania duplikatów 
    
    if (actionType === 'login') {
      // Za logowanie punkty tylko raz na dobę
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      exists = await UserEarnedAction.findOne({
        userId,
        actionType,
        createdAt: { $gte: startOfDay } 
      });

    } else if (actionType === 'test_passed' || actionType === 'quiz_wrong' ) {
  
      exists = null; 

    } else {
      // Dla innych sprawdz czy już istnieje w historii
      exists = await UserEarnedAction.findOne({ userId, actionType, targetId });
    }

    
    if (exists) {
      console.log(`Punkty za ${actionType} już przyznane (pomijam).`);
      return false;
    }

    await UserEarnedAction.create({ userId, actionType, points, targetId });
    await User.findByIdAndUpdate(userId, { $inc: { points } });

    console.log("Punkty dodane poprawnie!");
    return true;

  } catch (err) {
    console.error("Error in addPoints:", err);
    return false;
  }
}

module.exports = { addPoints };