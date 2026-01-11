const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require("./routes/auth"); 
const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const quizTestRouter = require('./routes/quiz-test');
const quizLearnRouter = require('./routes/quiz-learn');
const subjectsRouter = require('./routes/subjects');
const usersRouter = require('./routes/users');
const userProgressRouter = require('./routes/userProgress');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./auth.yaml');
const questionsRouter = require('./routes/questions')
const resetPasswordRouter = require('./routes/reset-password');
const setPasswordRouter = require('./routes/set-password');
const flashcardsRouter = require('./routes/flashcards');
const createtestRouter = require('./routes/create-test');
const adminPanelRouter = require("./routes/adminPanel");
const userTestRouter = require('./routes/tests')
const reportsRouter = require('./routes/reports')
const userTestDetailsRouter = require('./routes/user-test-details');
const userTestListRouter = require('./routes/user-test-list');
const administrationPanelRouter = require("./routes/administrationPanel");
const dashboardRouter = require("./routes/dashboard")
const rankRouter = require("./routes/rank");
const pointsRouter = require("./routes/points");
const notification = require("./routes/notification");
const notificationPageRouter = require('./routes/notificationPage');
var app = express();

// 🔹 Load environment variables
dotenv.config();

// 🔹 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/static', express.static('public'))
//Index Page
app.use('/', indexRouter);
//EDIT THIS FOR ADMIN PANEL
app.use('/users', usersRouter);
//Register/Login logic
app.use("/api/auth", authRoutes);
//Open API implementation for testing and documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//Register Page
app.use('/register', registerRouter);
//Login Page
app.use('/login', loginRouter);
//Quiz Pages
app.use('/quiz/learn', quizLearnRouter);
app.use('/quiz/test', quizTestRouter);
app.use('/api/questions',questionsRouter)
app.use('/api/subjects', subjectsRouter);
app.use('/api/tests',userTestRouter);
app.use('/api/user-progress', userProgressRouter);
//User Progress Page
app.use('/dashboard', dashboardRouter);
//Flashcards Page
app.use('/flashcards', flashcardsRouter);
//User test details
app.use('/user-test-details', userTestDetailsRouter);
//User test list
app.use('/user-test-list', userTestListRouter);

//Create Test Page
app.use('/create-test', createtestRouter);
//Notifications
app.use('/api/notification', notification);
app.use('/notification', notificationPageRouter);
//Rank of Users
app.use("/rank", rankRouter);
app.use('/api/points', pointsRouter);
// Admin stuff
app.use("/api/adminPanel", adminPanelRouter);
app.use("/adminPanel",administrationPanelRouter)
//Reset Password Page
app.use('/reset-password', resetPasswordRouter);
app.use('/set-password/:id',setPasswordRouter)
//Reporting
app.use('/api/reports', reportsRouter)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;