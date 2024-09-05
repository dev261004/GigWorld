import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from "dotenv"; 
dotenv.config({
    path:'./env'
})


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:2540/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }

  passport.serializeUser((user,done))
));