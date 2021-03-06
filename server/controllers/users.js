//get secrets
var secrets = require('../config')[process.env.NODE_ENV].secrets;

var User = require('mongoose').model('User')
  , utilitiesCtrl = require('./utilities')
  ;

exports.list = function(req, res) {
  if(req.query.page) {
    logger.debug("listing users with pagination");
    var page = req.query.page || 1;
    var per = req.query.per || 20;
    User.find({}).skip((page-1)*per).limit(per).exec(function(err, users) {
      if(err || !users) {
        res.send({success: false, message: err});
      } else {
        res.send({success: true, users: users
          , pagination: {
            page: page
            , per: per
          }
        });
      }
    });
  } else {
    logger.debug("listing users");
    User.find({}).exec(function(err, users) {
      if(err || !users) {
        res.send({success: false, message: err});
      } else {
        res.send({success: true, users: users});
      }
    });
  }
}

exports.getById = function(req, res) {
  User.findById(req.params.id).exec(function(err, user) {
    if(err || !user) {
      res.send({success: false, message: "Error retrieving user", err: err});
    } else {
      res.send({success: true, user: user});
    }
  })
}

exports.utilCheckAndSaveUser = function(userData, callback) {
  console.log("util create user");
  //we need both register and create for yote admin to function
  // this util method handles most of the creation stuff
  userData.username = userData.username.toLowerCase().trim();
  //very simple email format validation
  if (!( /(.+)@(.+){2,}\.(.+){2,}/.test(userData.username) )) {
    logger.debug("invalid email");
    callback({success: false, message: "Invalid email address."});
    return;
  }
  //check password for length
  if(userData.password.length <= 6) {
    logger.debug("password too short");
    callback({success: false, message: "Password not long enough. Min 6 characters."});
    return;
  }
  //perform additional checks
  userData.password_salt = User.createPasswordSalt();
  userData.password_hash = User.hashPassword(userData.password_salt, userData.password);

  User.create(userData, function(err, user) {
    if(err || !user) {
      if(err.toString().indexOf('E11000') > -1) {
        err = new Error('Duplicate Username');
      }
      callback({success: false, message: "Username is already in use."});
    } else {
      callback({success: true, user: user});
    }
  });
}

exports.create = function(req, res, next) {
  var userData = req.body;
  exports.utilCheckAndSaveUser(userData, function(result) {
    res.send(result);
  });
}

exports.register = function(req, res, next) {
  var userData = req.body;
  userData.roles = []; //don't let registering user set their own roles
  exports.utilCheckAndSaveUser(userData, function(result) {
    if(!result.success) {
      res.send(result);
    } else {
      req.login(result.user, function(err) {
        if(err) {
          console.log("ERROR LOGGING IN NEW USER");
          console.log(err);
          return next(err);
        } else {
          if(req.param("withToken")) {
            logger.info("create api token for mobile user");
            result.user.createToken(function(err, token) {
              if(err || !token) {
                res.send({ success: false, message: "unable to generate user API token" });
              } else {
                res.send({success: true, user: result.user});
              }
            });
          } else {
            console.log("NEWLY REGISTERED USER LOGGING IN");
            logger.warn(req.user.username);
            var returnUser = {
              _id: result.user._id
              , firstName: result.user.firstName
              , lastName: result.user.lastName
              , username: result.user.username
              , roles: result.user.roles
            }
            console.log("logged in");
            logger.debug(returnUser);
            res.send({success:true, user: returnUser});
          }
        }
      });
    }
  });

}

exports.update = function(req, res) {
  //update user object EXCEPT for password related fields
  User.findOne({_id: req.param('userId')}).exec(function(err, user) {
    if(err || !user) {
      res.send({success: false, message: "Could not find user"});
    } else {
      //not standard yote with the loop; can't allow update of protected fields.
      user.username = req.param('username');
      user.firstName = req.param('firstName');
      user.lastName = req.param('lastName');
      user.updated = new Date();
      user.roles = req.param('roles');
      user.save(function(err, user) {
        if(err || !user) {
          res.send({success: false, message: "Error saving user profile"});
        } else {
          res.send({success: true, user: user});
        }
      });
    }
  });
}

exports.changePassword = function(req, res) {
  logger.debug("change password");
  //additional error checking
  if(req.param('newPass') !== req.param('newPassConfirm')) {
    res.send({success: false, message: "New passwords do not match"});
  }
  //do additional validation here (must contain special character, etc)
  else if(req.param('newPass') == "") {
    res.send({success: false, message: "Invalid New Password"});
  }
  var projection = {
    updated: 1, firstName: 1, lastName: 1, username: 1, password_salt: 1, password_hash: 1, roles: 1
  }
  User.findOne({_id: req.user._id}, projection).exec(function(err, user) {
    if(err || !user) {
      res.send({success: false, message: "Could not find user in db"});
    } else {
      if(req.param('oldPass') == "") {
        res.send({success: false, message: "Old Password Incorrect"});
      }
      logger.debug("checking old password...");
      //is old password correct?
      if(User.hashPassword(user.password_salt, req.param('oldPass')) == user.password_hash) {
        logger.debug("password matches.");

        var newSalt = User.createPasswordSalt();
        var newHash = User.hashPassword(newSalt, req.param('newPass'));
        user.password_salt = newSalt;
        user.password_hash = newHash;
        user.save(function(err, user) {
          if(err) {
            res.send({success: false, message: "Error updating user password"});
          } else {
            res.send({success: true, message: "Success! Please login with your new password."});
          }
        });

      } else {
        res.send({success: false, message: "Old Password Incorrect"});
      }
    }
  })
}

exports.requestPasswordReset = function(req, res) {
  logger.debug("user requested password reset for " + req.param('email'));
  if(req.param('email') == "") {
    res.send({success: false, message: "Email needed to reset password."});
  }
  var projection = {
    firstName: 1, lastName: 1, username: 1, roles: 1, resetPasswordTime: 1, resetPasswordHex: 1
  }
  User.findOne({username: req.param('email')}, projection).exec(function(err, user) {
    if(err || !user) {
      logger.debug("fail: no user with that email found");
      res.send({success: false, message: "No user with that email found. Please register."});
    } else {
      //found user who requested a password reset
      user.resetPasswordTime = new Date();
      user.resetPasswordHex = Math.floor(Math.random()*16777215).toString(16) + Math.floor(Math.random()*16777215).toString(16);
      user.save(function(err, user) {
        if(err) {
          logger.error("fail: error saving user reset options");
          res.send({success: false, message: "Error processing request. Please try again."});
        } else {
          //send user an email with their reset link.
          logger.debug("creating password reset email");
          logger.error(user.resetPasswordHex);
          var targets = [user.username];
          var resetUrl = "http://localhost:3030/user/resetpassword/" + user.resetPasswordHex;
          var html = "<h1> You have requested a password reset for your Fugitive Labs YOTE account.</h1>";
          html += "<p> You reset link will be active for 24 hours. ";
          html += "If you believe you received this email by mistake, please call (919) 414-4801 and ask for Zabajone.</p>";
          html += "<br><p>" + resetUrl + " Reset Rostr Password</p>";

          utilitiesCtrl.sendEmail(targets, "Your Password for YOTE", html, function(data) {
            // console.log("RETURN:");
            // console.log(data);
            res.send({success: data.success, message: data.message});
          });
        }
      });
    }
  });
}

exports.checkResetRequest = function(req, res, next) {
  console.log("check reset request");
  console.log(req.params.resetHex);
  //must be a valid hex and no older than 24 hours
  exports.utilCheckResetRequest(req.params.resetHex, function(result) {
    if(result.success) {
      res.send({success: true}); //DONT send user id back
    } else {
      res.send({success: false, message: "Invalid or Expired Token"});
    }
  })
}

exports.utilCheckResetRequest = function(resetHex, callback) {
  console.log("util check password reset request");
  var projection = {
    firstName: 1, lastName: 1, username: 1, roles: 1, resetPasswordTime: 1, resetPasswordHex: 1
  }
  User.findOne({resetPasswordHex: resetHex}, projection).exec(function(err, user) {
    if(err || !user) {
      callback({success: false, message: "1 Invalid or Expired Reset Token"});
    } else {
      console.log("found user's date: ");
      console.log(user.resetPasswordTime);
      var nowDate = new Date();
      var cutoffDate = new Date(user.resetPasswordTime);
      console.log(cutoffDate);
      var validHours = 24;
      cutoffDate.setHours((cutoffDate.getHours() + validHours));
      console.log(cutoffDate);
      if(nowDate < cutoffDate) {
        console.log("TRUE");
        callback({success: true, userId: user._id});
      } else {
        console.log("FALSE");
        callback({success: false, message: "2 Invalid or Expired Reset Token"});
      }

    }
  });
}


exports.resetPassword = function(req, res) {
  console.log("RESETTING USER PASSWORD");
  console.log(req.param('resetHex'));
  exports.utilCheckResetRequest(req.param('resetHex'), function(result) {
    if(result.success) {
      if(!req.param('newPass') || req.param('newPass').length < 6) {
        console.log("needs to use a better password");
        res.send({success: false, message: "Password requirements not met: Must be at least 6 characters long."}); //bare minimum
      } else {
        User.findOne({_id: result.userId}).exec(function(err, user) {
          if(err || !user) {
            res.send({success: false, message: "Could not find user in db"});
          } else {
            var newSalt = User.createPasswordSalt();
            var newHash = User.hashPassword(newSalt, req.param('newPass'));
            user.password_salt = newSalt;
            user.password_hash = newHash;
            user.resetPasswordHex = Math.floor(Math.random()*16777215).toString(16) + Math.floor(Math.random()*16777215).toString(16);
            //if we reset this, the link won't be valid after they're reset it
            user.save(function(err, user) {
              if(err || !user) {
                res.send({success: false, message: "Error updating user password"});
              } else {
                res.send({success: true, user: user});
              }
            });
          }
        }); 
      }
    } else {
      res.send(result);
    }
  });
}
