const Validator = require("fastest-validator");
const bcrypt = require("bcrypt");
const User = require("../../models/user-model");
const UserToken = require("../../models/user-token-model");
const UserRolePivot = require("../../models/user-role-pivot");
// const UserRoleCheck = require("../../helpers/user-role-check-helper");
const sequelize = require("../../utilities/database");
const { Op } = require("sequelize");
const {
  generateOTP,
  hashPassword,
  generateToken,
  userDetails,
  isPhoneNumber,
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
      userRole: request.body.userRole,
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
      userRole: {
        type: "enum",
        optional: true,
        values: ["Consumer", "Administrator", "Saler"],
        default: "Consumer",
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
          const roleData = {
            userId: user.id,
          };
          if (data.userRole === "Administrator") {
            Object.assign(roleData, {
              roleId: await getRoleId("Administrator"),
            });
          } else if (data.userRole === "Saler") {
            Object.assign(roleData, {
              roleId: await getRoleId("Saler"),
            });
          } else {
            Object.assign(roleData, {
              roleId: await getRoleId("Consumer"),
            });
          }
          // Assign The Consumer Role
          await UserRolePivot.create(roleData, { transaction });
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
        const isvalidPassword = await bcrypt.compare(
          data.password,
          user.password
        );
        if (isvalidPassword) {
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
              message: "Unable to generate JWT token!!",
            });
          }
        } else {
          return response.status(404).json({
            message: "Please check your credential!!",
          });
        }
      } else {
        return response.status(404).json({
          message: "User does not exists!!",
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

exports.me = async (request, response) => {
  try {
    // Return Response
    return response.status(200).json({
      user: await userDetails(request.userData),
    });
  } catch (error) {
    // Log Error And Return Response
    console.log("web-api -> auth-controller -> me -> ", error.message);
    return response.status(500).json({
      message: "serverError",
      error,
    });
  }
};
exports.logout = async (request, response) => {
  try {
    const token = request.headers.authorization.split(" ")[1];
    await UserToken.destroy({
      where: {
        userId: request.userData.id,
        userToken: token,
      },
    });
    return response.status(200).json({
      message: "Logout Successfull !",
    });
  } catch (error) {
    // Log Error And Return Response
    console.log("web-api -> auth-controller -> logout -> ", error);
    return response.status(500).json({
      message: "serverError",
      error: error.message,
    });
  }
};

exports.requestOTP = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      phoneCountryCode: request.body.phoneCountryCode,
      phoneNumber: request.body.phoneNumber,
    };

    // Preparing Validation Schema
    const schema = {
      phoneCountryCode: {
        type: "string",
        optional: true,
        default: null,
      },
      phoneNumber: {
        type: "string",
        optional: false,
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
      // Check Unique Identity Type
      const isPhone = isPhoneNumber(data.phoneNumber);

      // Fetch The User Details
      let user = null;
      if (isPhone) {
        user = await User.findOne({
          where: {
            phoneNumber: data.phoneNumber,
            isBlocked: false,
          },
        });
      } else {
        return response.status(403).json({
          message: "Please enter valid phone number",
        });
      }
      if (user) {
        // Check If User Exists
        await generateOTP(user.id, null, true);

        // Starting SQL Transaction
        const transaction = await sequelize.transaction();
        try {
          // Generate And Send The OTP
          const otpStatus = await generateOTP(user.id, transaction);
          if (otpStatus) {
            // Commit The DB Transaction
            transaction.commit();
            // Return The Response

            return response.status(200).json({
              message: "OTP sent successfully",
            });
          } else {
            // Rollback The DB
            transaction.rollback();
            // Return The Response
            return response.status(500).json({
              message: "Unable To generate OTP",
            });
          }
        } catch (error) {
          // Rollback The DB Transaction
          transaction.rollback();
          console.log(error);
          // Return The Response
          return response.status(500).json({
            message: "Unable To Process",
            error: error.message,
          });
        }
      } else {
        return response.status(404).json({
          message: "User Does Not Exist",
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "web-api -> forgot-password-controller -> requestOtp -> ",
      error.message
    );
    return response.status(500).json({
      message: "Server Error",
    });
  }
};

exports.resetPassword = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      phoneCountryCode: request.body.phoneCountryCode,
      phoneNumber: request.body.phoneNumber,
      newPassword: request.body.newPassword,
      OTP: request.body.OTP,
    };

    // Preparing Validation Schema
    const schema = {
      phoneCountryCode: {
        type: "string",
        optional: true,
      },
      phoneNumber: {
        type: "string",
        optional: false,
      },
      newPassword: {
        type: "string",
        optional: false,
        min: 8,
        max: 32,
      },
      OTP: {
        type: "string",
        optional: false,
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
      // Check Unique Identity Type
      const isPhone = isPhoneNumber(data.phoneNumber);
      // Verify OTP And Fetch The User Details
      let user = null;
      if (isPhone) {
        user = await User.findOne({
          where: {
            phoneNumber: data.phoneNumber,
            phoneOTP: data.OTP,
            isBlocked: false,
          },
        });
      } else {
        return response.status(403).json({
          message: "Please enter valid phone number",
        });
      }
      // Check If User Exists
      if (user) {
        try {
          // Change The Password And Save It
          const hashedPassword = await hashPassword(data.newPassword);
          if (hashedPassword) {
            // Starting SQL Transaction
            const transaction = await sequelize.transaction();
            try {
              // Change The Password
              user.password = hashedPassword;
              user.phoneOTP = null;
              user.save();
              // Logout From All Devices
              await UserToken.destroy({
                where: {
                  userId: user.id,
                },
                transaction,
              });
              // Commit The DB Transaction
              transaction.commit();
              // Return The Response
              return response.status(200).json({
                message: "Password Change Successfully",
              });
            } catch (error) {
              // Rollback The DB Transaction
              transaction.rollback();
              console.log(error);
              // Return The Response
              return response.status(500).json({
                message: "Unable To Change Password",
                error,
              });
            }
          } else {
            // Return The Response
            return response.status(500).json({
              message: "Failed To Encrypt",
            });
          }
        } catch (error) {
          // Rollback The DB Transaction
          transaction.rollback();
          console.log(error);
          // Return The Response
          return response.status(500).json({
            message: "Unable To Process",
            error: error.message,
          });
        }
      } else {
        return response.status(404).json({
          message: "User does not exists or otp request does not send!",
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "web-api -> folower-controller -> resetPassword -> ",
      error.message
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.changePassword = async (request, response) => {
  try {
    //Preparing Data
    let data = {
      currentPassword: request.body.currentPassword,
      newPassword: request.body.newPassword,
    };
    //Preparing Validation Schema
    const schema = {
      currentPassword: {
        type: "string",
        optional: false,
      },
      newPassword: {
        type: "string",
        optional: false,
      },
    };

    // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);

    if (validationResponse !== true) {
      return response.status(400).json({
        message: "Validation Error",
        errors: validationResponse,
      });
    } else {
      //Comparing the current password of the user
      bcrypt.compare(
        data.currentPassword,
        request.userData.password,
        async function (error, result) {
          if (result) {
            // Find the user
            const user = await User.findOne({
              where: {
                id: request.userData.id,
              },
            });
            // Check If User Exists
            if (user) {
              const textPassword = data.newPassword;
              const hashedPassword = await hashPassword(textPassword);
              //Changing The Password And Updating It
              if (hashedPassword) {
                const transaction = await sequelize.transaction();
                try {
                  //Change the password
                  user.password = hashedPassword;
                  user.save();
                  // Logout From All Devices
                  await UserToken.destroy({
                    where: {
                      userId: user.id,
                      userToken: {
                        [Op.ne]: request.token,
                      },
                    },
                    transaction,
                  });
                  // Commit The DB Transaction
                  transaction.commit();
                  // Return The Response
                  return response.status(200).json({
                    message: "Pasword Successfully Change",
                  });
                } catch (error) {
                  // Rollback The DB Transaction
                  transaction.rollback();
                  console.log(error);
                  // Return The Response
                  return response.status(500).json({
                    message: "Unable To Process",

                    error,
                  });
                }
              } else {
                // Return The Response
                return response.status(500).json({
                  message: "Failed To Encrypt",
                  request,
                });
              }
            } else {
              return response.status(404).json({
                message: "user DoesNot Exist",
              });
            }
          } else {
            response.status(400).json({
              message: "InCorrect Password",
            });
          }
        }
      );
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "web-api -> auth-controller -> changePassword -> ",
      error.message
    );
    return response.status(500).json({
      message: "Server Error",
    });
  }
};
exports.setProfileRole = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      profileRole: request.body.profileRole,
      userId: request.body.userId,
    };

    // Preparing Validation Schema
    const schema = {
      profileRole: {
        type: "enum",
        optional: false,
        values: ["Consumer", "Administrator", "Saler"],
      },
      userId: {
        type: "string",
        optional: false,
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
      const userData = request.userData;
      userData.userRole = data.profileRole;

      // Begin The SQL Transaction
      const transaction = await sequelize.transaction();
      try {
        if (!request.userData.Admin) {
          // Return Response
          return response.status(400).json({
            message: "Your role dose not change this settings ,Contact Admin",
          });
        }
        // Update User Object
        await User.update(
          {
            userData,
          },
          {
            where: {
              id: data.userId,
            },
            transaction,
          }
        );
      } catch (error) {
        // Rollback The Transaction
        await transaction.rollback();
        // Return Response
        return response.status(500).json({
          message: error.message,
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log("web-api -> auth-controller -> setProfileState -> ", error);
    return response.status(500).json({
      message: "server Error",
      error: error.message,
    });
  }
};
