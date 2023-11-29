const Validator = require("fastest-validator");
const User = require("../../models/user-model");
const { Op } = require("sequelize");
const sequelize = require("../../utilities/database");
const { userAttributes } = require("../../helpers/attributes-helpers");

exports.getAlluser = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      ...basicListPaginationDataPrepare(
        request.query.page,
        request.query.size,
        request.query.keywords
      ),
      role: request.query.role,
    };

    // Preparing Validation Schema
    const schema = {
      role: {
        type: "enum",
        optional: true,
        values: ["Consumer", "Administrator", "Saler"],
      },
      ...basicListPaginationValidationSchema,
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
      if (!data.role) {
        const users = await User.findAll({
          where: {
            id: {
              [Op.ne]: request.userData.id,
            },
          },
          order: [["createdAt", "desc"]],
          attributes: userAttributes,
        });
        return response.status(200).json(users);
      } else {
        const users = await User.findAll({
          where: {
            id: {
              [Op.ne]: request.userData.id,
            },
            userRole: data.role,
          },
          order: [["createdAt", "desc"]],
          attributes: userAttributes,
        });
        return response.status(200).json(users);
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log("admin-api -> user-admin-controller -> getAlluser -> ", error);
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.blockUnblockUser = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      userId: request.params.userId,
    };

    // Preparing Validation Schema
    const schema = {
      userId: {
        type: "uuid",
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
      try {
        const transaction = await sequelize.transaction();
        const user = await User.findOne({
          where: {
            id: data.userId,
          },
        });
        if (!user) {
          return response.status(404).json({
            message: "User does not exists!",
          });
        }
        if (!user.isBlocked) {
          await User.update(
            {
              isBlocked: true,
            },
            {
              where: {
                id: data.userId,
              },
              transaction,
            }
          );
          // Commit The DB Transaction
          transaction.commit();
          console.log();
          return response.status(200).json({
            message: "User Block Successfully!!",
          });
        }
        await User.update(
          {
            isBlocked: false,
          },
          {
            where: {
              id: data.userId,
            },
            transaction,
          }
        );
        // Commit The DB Transaction
        transaction.commit();
        return response.status(200).json({
          message: "User UnBlock Successfully!!",
        });
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
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "admin-api -> user-admin-controller -> blockUnblockUser -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.deleteUser = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      userId: request.params.userId,
    };

    // Preparing Validation Schema
    const schema = {
      userId: {
        type: "uuid",
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
      try {
        const transaction = await sequelize.transaction();
        const user = await User.findOne({
          where: {
            id: data.userId,
          },
        });
        if (!user) {
          return response.status(404).json({
            message: "User does not exists!",
          });
        }
        await User.destroy({
          where: {
            id: data.userId,
          },
        });
        // Commit The DB Transaction
        transaction.commit();

        return response.status(200).json({
          message: "User Delete Successfully!!",
        });
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
    }
  } catch (error) {
    // Log Error And Return Response
    console.log("admin-api -> user-admin-controller -> deleteUser -> ", error);
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
