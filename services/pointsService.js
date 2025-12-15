const User = require("../models/User");
const UserEarnedAction = require("../models/UserEarnedActions");


async function addPoints(userId, actionType, points, targetId = null) {
  try {
    console.log("addPoints wywołane:", userId, actionType, points);

    // Czy użytkownik już dostał punkty za tę akcję?
    const exists = await UserEarnedAction.findOne({ userId, actionType, targetId });
    if (exists) {
      console.log("Punkty już przyznane — pomijam.");
      return false;
    }

    // Zapisujemy wpis w historii punktów
    await UserEarnedAction.create({
      userId,
      actionType,
      points,
      targetId
    });

    // Zwiększamy liczbę punktów użytkownika
    await User.findByIdAndUpdate(userId, { $inc: { points } });

    console.log("PARAMS in addPoints:", userId, actionType, points, targetId);

    console.log("Punkty dodane poprawnie!");

    return true;
  } catch (err) {
    console.error("Error in addPoints:", err);
    return false;
  }
}

module.exports = { addPoints };
