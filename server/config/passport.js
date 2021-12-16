const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');

/** LOCAL STRATEGY **/

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  (email, password, done) => {
    User.findOne({ email }, ((err, user) => {
      if (err) { return done(err); }

      // Verify email exists
      if (!user) { return done(null, false); }

      // Verify password match
      user.verifyPassword(password, (err, isMatch) => {
        if (err) { return done(err); }
        return isMatch ? done(null, user) : done(null, false);
      });
    }));
  }
));
