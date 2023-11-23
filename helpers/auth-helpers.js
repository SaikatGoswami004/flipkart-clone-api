const User = require("../models/user-model");
const UserToken = require("../models/user-token-model");
const bcrypt = require("bcrypt");
const sequelize = require("../utilities/database");
const jwt = require("jsonwebtoken");
const Role = require("../models/role-model");
exports.generateOTP = async (userId, transaction, registrationMail = false) => {
  const OTP = 123456;
  await User.update(
    {
      phoneOTP: OTP,
      emailOTP: OTP,
    },
    {
      where: {
        id: userId,
      },
      transaction,
    }
  );
  return true;
};

exports.hashPassword = async (plaintTextPassword) => {
  const saltRounds = 10;
  return await new Promise((resolve, reject) => {
    bcrypt.hash(plaintTextPassword, saltRounds, function (err, hash) {
      if (err) reject(err);
      resolve(hash);
    });
  });
};

exports.generateToken = async (userData) => {
  const token = await jwt.sign(userData, `${process.env.ENCRYPTION_KEY}`);
  if (token) {
    // Starting SQL Transaction
    const transaction = await sequelize.transaction();
    try {
      await UserToken.create(
        {
          userId: userData.userId,
          userToken: token,
          userIpAddress: userData.ipAddress,
        },
        {
          transaction,
        }
      );
      // Commit To DB
      transaction.commit();
      // Return The Response
      return token;
    } catch (error) {
      // Log The Error
      console.log(error.message);
      // Rollback The DB
      transaction.rollback();
      // Return The Response
      return false;
    }
  }
};

exports.userDetails = async (user) => {
  user = await User.findByPk(user.id);
  const response = {
    userId: user.id,
    profileImage: user.profileImage
      ? process.env.IMAGE_URL + user.profileImage
      : null,
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddress: user.emailAddress,
    phoneCountryCode: user.phoneCountryCode,
    phoneNumber: user.phoneNumber,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    registeredAt: user.createdAt,
    userRole: user.userRole,
  };
  return response;
};

exports.isPhoneNumber = (phoneNumber) => {
  var filter =
    /^((\+[1-9]{1,4}[ \-]*)|(\([0-9]{2,3}\)[ \-]*)|([0-9]{2,4})[ \-]*)*?[0-9]{3,4}?[ \-]*[0-9]{3,4}?$/;
  if (filter.test(phoneNumber)) {
    if (phoneNumber.length == 10) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

exports.getRoleId = async (roleTitle) => {
  const userRole = await Role.findOne({
    where: {
      title: roleTitle,
    },
  });

  if (userRole) {
    return userRole.id;
  } else {
    return false;
  }
};
