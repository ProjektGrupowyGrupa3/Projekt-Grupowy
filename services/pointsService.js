const User = require("../models/User");
const UserEarnedAction = require("../models/UserEarnedActions");


async function addPoints(userId, actionType, points, targetId = null) {
  try {
    console.log("addPoints wywołane:", userId, actionType, points);

    let exists = null;

    // 1. Logika dla LOGOWANIA (raz na dobę)
    if (actionType === 'login') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      exists = await UserEarnedAction.findOne({
        userId,
        actionType,
        createdAt: { $gte: startOfDay } 
      });

    } 
    // Logika dla testów i błędnych odpowiedzi
    else if (actionType === 'test_passed' || actionType === 'quiz_wrong') {
      exists = null; 

    } 
    // Logika dla poprawnych odpowiedzi (quiz_correct) 
    else if (actionType === 'quiz_correct') {
        // Sprawdzenie czy użytkownik dostał już punkty (> 0) za to pytanie
        const alreadyEarned = await UserEarnedAction.findOne({ 
            userId, 
            actionType, 
            targetId,
            points: { $gt: 0 } 
        });

        if (alreadyEarned) {
            console.log(`Powtórna poprawna odpowiedź na pytanie ${targetId}. Zapisuję 0 pkt.`);
            
            // Zapis historii aktywności (0 punktów)
            await UserEarnedAction.create({ userId, actionType, points: 0, targetId });
            
            // Zwracamy sukces, ale informujemy, że dodano 0 punktów
            // Dzięki temu frontend nie wyświetli błędu, a historia się zaktualizuje
            return { success: true, pointsAdded: 0 };
        }
        
        exists = null;
    }
    // Logika dla pozostałych (jednorazowe, np. rejestracja)
    else {
      exists = await UserEarnedAction.findOne({ userId, actionType, targetId });
    }

    // Blokada duplikatów (Dla Login i Innych jednorazowych) ---
    if (exists) {
      console.log(`Punkty za ${actionType} już przyznane (pomijam).`);
      return false; 
    }

    // Zapis standardowy
    await UserEarnedAction.create({ userId, actionType, points, targetId });
    
    // Aktualizacja punkty usera tylko jeśli są > 0
    if (points > 0) {
        await User.findByIdAndUpdate(userId, { $inc: { points } });
    }

    console.log("Punkty dodane poprawnie!");
    // Zwracamy obiekt, aby frontend wiedział ile punktów faktycznie dodano
    return { success: true, pointsAdded: points };

  } catch (err) {
    console.error("Error in addPoints:", err);
    return false;
  }
}

module.exports = { addPoints };