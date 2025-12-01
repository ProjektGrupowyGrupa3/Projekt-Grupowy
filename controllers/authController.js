const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Funkcja pomocnicza do generowania tokena JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// 📌 Rejestracja
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // sprawdź czy użytkownik istnieje
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik już istnieje' });
    }

    // haszowanie hasła
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // utwórz nowego użytkownika
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // wygeneruj token
    const token = generateToken(user._id);

    // wyślij token do frontendu
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd rejestracji użytkownika' });
  }
};

// 📌 Logowanie
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // znajdź użytkownika
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Nieprawidłowy e-mail lub hasło' });
    }

    // sprawdź hasło
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Nieprawidłowy e-mail lub hasło' });
    }

    // wygeneruj token
    const token = generateToken(user._id);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd logowania użytkownika' });
  }
};
