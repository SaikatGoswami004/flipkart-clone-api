const Validator = require("fastest-validator");
const bcrypt = require("bcrypt");
const User = require("../../models/user-model");
// const UserToken = require("../../models/user-token-model");
const UserRolePivot = require("../../models/user-role-pivot");
// const UserRoleCheck = require("../../helpers/user-role-check-helper");
const sequelize = require("../../utilities/database");
const { Op } = require("sequelize");
const {
  generateOTP,
  hashPassword,
  generateToken,
  userDetails,
} = require("../../helpers/auth-helpers");
const { getRoleId } = require("../../helpers/user-role-check-helpers");

exports.register = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      emailAddress: request.body.emailAddress,
      phoneCountryCode: request.body.phoneCountryCode,
      phoneNumber: request.body.phoneNumber,
      password: request.body.password,
    };
    // Preparing Validation Schema
    const schema = {
      firstName: {
        type: "string",
        optional: true,
        max: 32,
        default: null,
      },
      lastName: {
        type: "string",
        optional: true,
        max: 32,
        default: null,
      },
      emailAddress: {
        type: "email",
        optional: true,
        max: 128,
        defaultValue: null,
      },
      phoneCountryCode: {
        type: "string",
        optional: false,
        max: 8,
        defaultValue: null,
      },
      phoneNumber: {
        type: "string",
        optional: false,
        min: 10,
        max: 16,
        messages: {
          stringMin: "Phone Number Min Length",
        },
      },
      password: {
        type: "string",
        optional: false,
        min: 8,
        max: 32,
        messages: {
          stringMin: "Password Min Length",
        },
      },
    };

    // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);

    // Send Response On Validation Failed
    if (validationResponse !== true) {
      return response.status(400).json({
        message: "Validation Failed",
        errors: validationResponse,
      });
    } else {
      // Starting SQL Transaction
      const transaction = await sequelize.transaction();
      // Create User Variable
      let user = null;
      // Check If The User Phone Number Already Exists
      if (data.phoneCountryCode && data.phoneNumber) {
        const isPhoneExists = await User.findOne({
          where: {
            phoneCountryCode: request.body.phoneCountryCode,
            phoneNumber: request.body.phoneNumber,
          },
        });
        if (isPhoneExists) {
          return response.status(409).json({
            message: "Phone Number Already Exists",
          });
        }
      } else {
        data.phoneCountryCode = null;
        data.phoneNumber = null;
        if (!data.emailAddress) {
          return response.status(400).json({
            message: "Email Or Phone Mandatory !",
          });
        }
      }
      // Check If The User Email Address Already Exists
      if (data.emailAddress) {
        let isEmailExists = null;
        isEmailExists = await User.findOne({
          where: {
            emailAddress: request.body.emailAddress.toLowerCase(),
          },
        });
        if (isEmailExists) {
          return response.status(409).json({
            message: "Email Already Exists!",
          });
        }
      }
      // Hash Password Before Saving To The DB
      const myPlaintextPassword = data.password;
      const hashedPassword = await hashPassword(myPlaintextPassword);
      if (hashedPassword) {
        // Set Hashed Password
        data.password = hashedPassword;
        try {
          // Create User Section
          user = await User.create(data, { transaction });
          // Assign The Consumer Role
          await UserRolePivot.create(
            {
              userId: user.id,
              roleId: await getRoleId("Consumer"),
            },
            { transaction }
          );
          await transaction.commit();
          await generateOTP(user.id, null, true);
          return response.status(200).json({
            message: "Register Successfully !",
            token: await generateToken({
              userId: user.id,
              validTill: new Date().setDate(new Date().getDate() + 3),
              ipAddress: request.ip,
            }),
            user: await userDetails(user),
          });
        } catch (error) {
          console.log(error);
          // Rollback The DB Transaction
          transaction.rollback();
          // Return The Response
          return response.status(500).json({
            message: "Unable To Process",
            error: error.message,
          });
        }
      } else {
        // Return The Response
        return response.status(500).json({
          message: "Failed To Encrypt",
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log("web-api -> auth-controller -> register -> ", error);
    return response.status(500).json({
      message: error.message,
    });
  }
};

exports.verifyOTP = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      phoneNumber: request.body.phoneNumber,
      OTP: request.body.OTP,
    };

    // Preparing Validation Schema
    const schema = {
      phoneNumber: {
        type: "string",
        optional: false,
        min: 10,
      },
      OTP: {
        type: "string",
        optional: false,
        max: 6,
      },
    };

    // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);

    // Send Response On Validation Failed
    if (validationResponse !== true) {
      return response.status(400).json({
        message: "Validation Error",
        errors: validationResponse,
      });
    } else {
      // Check If The User ID Exists
      const user = await User.findOne({
        where: {
          phoneNumber: request.body.phoneNumber,
        },
      });
      if (user) {
        if (user.isPhoneVerified || user.isEmailVerified) {
          return response.status(400).json({
            message: "User Already Verified",
          });
        } else {
          if (user.phoneOTP === data.OTP || user.emailOTP === data.OTP) {
            // Starting SQL Transaction
            const transaction = await sequelize.transaction();
            try {
              if (
                user.phoneCountryCode &&
                user.phoneNumber &&
                user.phoneOTP === data.OTP
              ) {
                user.phoneOTP = null;
                user.isPhoneVerified = true;
              }
              await user.save({ transaction });
              return response.status(201).json({
                message: "Verified Successfully",
              });
            } catch (error) {
              transaction.rollback();
              // Return The Response
              return response.status(500).json({
                message: "Unable To Process",

                error: error.message,
              });
            }
          } else {
            return response.status(400).json({
              message: "inValid OTP",
            });
          }
        }
      } else {
        return response.status(404).json({
          message: "User DoesNot Exist",
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log("web-api -> auth-controller -> verifyOTP -> ", error.message);
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
exports.resendOTP = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      phoneNumber: request.body.phoneNumber,
    };

    // Preparing Validation Schema
    const schema = {
      phoneNumber: {
        type: "string",
        optional: false,
        max: 16,
      },
    };

    // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);

    // Send Response On Validation Failed
    if (validationResponse !== true) {
      return response.status(400).json({
        message: "validation Error",
        errors: validationResponse,
      });
    } else {
      // Check If The User ID Exists
      const user = await User.findOne({
        where: {
          phoneNumber: request.body.phoneNumber,
        },
      });
      if (user) {
        if (user.isPhoneVerified || user.isEmailVerified) {
          return response.status(400).json({
            message: "User Already Verified",
          });
        } else {
          // Starting SQL Transaction
          const transaction = await sequelize.transaction();
          try {
            const otpStatus = await generateOTP(user.id, transaction);
            if (otpStatus) {
              // Commit To DB
              transaction.commit();
              // Return The Response
              return response.status(200).json({
                message: "OTP Sent",
              });
            } else {
              // Rollback The DB
              transaction.rollback();
              // Return The Response
              return response.status(500).json({
                message: "Unable To Process",
              });
            }
          } catch (error) {
            // Rollback The DB
            transaction.rollback();
            // Return The Response
            return response.status(500).json({
              message: "Unable To Process",
              error,
            });
          }
        }
      } else {
        return response.status(404).json({
          message: "User DoesNot Exist",
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log("web-api -> auth-controller -> resendOTP -> ", error.message);
    return response.status(500).json({
      message: "server Error",
      error,
    });
  }
};
exports.login = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      phoneNumber: request.body.phoneNumber,
      password: request.body.password,
      rememberMe: request.body.rememberMe,
    };

    // Preparing Validation Schema
    const schema = {
      phoneNumber: {
        type: "string",
        optional: false,
        min: 10,
        max: 16,
      },
      password: {
        type: "string",
        optional: false,
        min: 8,
        max: 32,
      },
      rememberMe: {
        type: "boolean",
        optional: true,
        default: false,
      },
    };

    // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);

    // Send Response On Validation Failed
    if (validationResponse !== true) {
      return response.status(400).json({
        message: "Validation Error",
        errors: validationResponse,
      });
    } else {
      // Check If The User ID Exists

      const whereClause = {
        phoneNumber: data.phoneNumber,
      };
      const user = await User.findOne({
        where: whereClause,
      });
      if (user) {
        if (await bcrypt.compare(data.password, user.password)) {
          const userData = {
            userId: user.id,
            validTill: new Date().setDate(
              new Date().getDate() + (data.rememberMe ? 90 : 7)
            ),
            ipAddress: request.ip,
          };
          const userToken = await generateToken(userData);

          if (userToken) {
            // Return The Response
            return response.status(200).json({
              message: "you are successfully logged in.",
              token: userToken,
              user: await userDetails(user),
              ipAddress: request.ip,
            });
          } else {
            return response.status(500).json({
              message: "Unable to generate JWT token",
            });
          }
        }
      } else {
        return response.status(404).json({
          message: "Please check your credential",
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log("web-api -> auth-controller -> login -> ", error.message);
    return response.status(500).json({
      message: "serverError",
      error,
    });
  }
};
