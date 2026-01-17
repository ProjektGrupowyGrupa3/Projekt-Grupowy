const express = require('express');
const router = express.Router();
const { getSubjects } = require('../controllers/subjectController');
const auth = require('../middleware/auth');

router.get('/', getSubjects);

router.get('/subjects/:id', auth, async (req, res) => {
    const subjectId = req.params.id;
    const userId = req.user._id;

    const questionIds = await Question
        .find({ subject: subjectId })
        .distinct('_id');

    const total = questionIds.length;

    const answered = await UserProgress.countDocuments({
        userId,
        questionId: { $in: questionIds }
    });

    const isCompleted = answered >= total && total > 0;

    res.render('subject', {
        subjectId,
        isCompleted
    });
});


module.exports = router;