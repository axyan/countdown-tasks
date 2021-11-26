const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require('../models/user');

/** LOCAL STRATEGY **/

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  (email, password, done) => {
    User.findOne({ email }, ((err, user) => {
      if (err) { return done(err) }

      // Verify email exists
      if (!user) { return done(null, false) }

      // Verify password match
      user.verifyPassword(password, (err, isMatch) => {
        if (err) { return done(err) }
        return isMatch ? done(null, user) : done(null, false);
      });
    }));
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id)
});

passport.deserializeUser((userId, done) => {
  User.findById(userId, (err, user) => {
    done(err, user);
  });
});

/** JWT STRATEGY **/

passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  },
  (jwtPayload, done) => {
    User.findById(jwtPayload.user._id, (err, user) => {
      if (err) { return done(err) }

      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  }
));
