const User = require("../models/User");
const UserEarnedAction = require("../models/UserEarnedActions");


async function addPoints(userId, actionType, points, targetId = null) {
  try {
    console.log("addPoints wywołane:", userId, actionType, points);

    let exists = null;

    // --- 1. Logika sprawdzania duplikatów ---
    
    if (actionType === 'login') {
      // DLA LOGOWANIA: Tylko raz na dobę
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      exists = await UserEarnedAction.findOne({
        userId,
        actionType,
        createdAt: { $gte: startOfDay } 
      });

    } else if (actionType === 'test_passed' || actionType === 'quiz_wrong' ) {
      // DLA TESTÓW : ZAWSZE POZWALAJ (POMIŃ SPRAWDZANIE)
      // Ustawiamy exists na null, żeby kod przeszedł dalej
      exists = null; 

    } else {
      // DLA INNYCH (np. jednorazowe osiągnięcia): Sprawdzamy czy już istnieje w historii
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