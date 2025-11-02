const Subject = require('../models/Subject');

exports.getSubjects = async(req, res) => {
    try {
        const { lang ='pl'} = req.query;
        const subjects = await Subject.find().sort({ semester: 1}).lean();

        const localized = subjects.map(s => ({
            _id: s._id,
            name: s.name?.[lang] || s.name?.pl,
            semester: s.semester,
            specialization: s.specialization,
            description: s.description?.[lang] || ''
        }));

        res.json(localized);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Błąd podczas pobierania przedmiotów'});
    }
};