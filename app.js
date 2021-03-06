const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const indexRouter = require('./routes/index');
const menuRouter = require('./routes/menu');
const orderRouter = require('./routes/order');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const userRouter = require('./routes/user');

const rememberMe = require('./remember-me');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  cookie: { maxAge: 360000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.use(rememberMe.checkCookie);  

app.use('/', indexRouter);
app.use('/menu', menuRouter);
app.use('/order', orderRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
