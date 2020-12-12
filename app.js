const cookieParser = require('cookie-parser');
const express = require('express');
const httpErrors = require('http-errors');
const logger = require('morgan');
const path = require('path');
const passport = require('passport');
const { Strategy } = require('passport-local');
const db = require('./db');
const i18next = require('i18next');
const Backend = require('i18next-node-fs-backend');
const i18nextMiddleware = require('i18next-express-middleware');
const flash = require('connect-flash');

db.users.addDefaultAdmin();

passport.use(new Strategy(
  ((username, password, cb) => {
    db.users.findByUsername(username, (err, user) => {
      if (err) { return cb(err, false, { message: i18next.t('unknown-error')}); }
      if (!user) { return cb(null, false, { message: i18next.t('wrong-logs') }); }
      if (user.password !== password) { return cb(null, false, { message: i18next.t('wrong-logs') }); }
      return cb(null, user);
    });
  })
));

passport.serializeUser((user, cb) => {
  console.log(user);
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  db.users.findById(id, (err, user) => {
    if (err) { return cb(err); }
    return cb(null, user);
  });
});

i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
     .init({
        backend: {
            loadPath: './locales/{{lng}}/{{ns}}.json'
        },
        fallbackLng: 'en',
        preload: [ 'en', 'es', 'ko', 'pt', 'zh' ]
    });

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', cookie: { maxAge: 604800000 }, resave: true, saveUninitialized: true }));
app.use(flash());
app.use(i18nextMiddleware.handle(i18next));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.theme = ('theme' in req.cookies) ? req.cookies.theme : 'dark';
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(httpErrors(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
