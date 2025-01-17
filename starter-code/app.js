const express		= require('express');
const path			= require('path');
const favicon		= require('serve-favicon');
const logger		= require('morgan');
const cookieParser	= require('cookie-parser');
const bodyParser	= require('body-parser');
const mongoose		= require("mongoose");
const expLayouts	= require('express-ejs-layouts');
const session		= require("express-session");
const bcrypt		= require("bcrypt");
const passport		= require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash			= require("connect-flash");
const User			= require("./models/user");

const app = express();

// Controllers
const siteController = require("./routes/siteController");

// Mongoose configuration
mongoose.connect("mongodb://localhost:27017/ibi-ironhack");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expLayouts);
app.set('layout', 'layouts/layout');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: "our-passport-local-strategy-app",
	cookie: { maxAge: 300000 },
	resave: true,
	saveUninitialized: true
}));

passport.serializeUser((user, cb) => {
	cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
	User.findOne({ "_id": id }, (err, user) => {
		if (err) { return cb(err); }
		cb(null, user);
	});
});

app.use(flash());

passport.use(new LocalStrategy({
	passReqToCallback: true
}, (req, username, password, next) => {
	User.findOne({ username }, (err, user) => {
		if (err) {
			return next(err);
		}
		if (!user) {
			return next(null, false, { message: "Incorrect username" });
		}
		if (!bcrypt.compareSync(password, user.password)) {
			return next(null, false, { message: "Incorrect password" });
		}

		return next(null, user);
	});
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
	res.locals.currentUser = req.user;
	next();
});

// Routes
app.use("/", siteController);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
