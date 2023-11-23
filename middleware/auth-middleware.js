const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
const UserToken = require("../models/user-token-model");
const { getRoleId } = require("../helpers/auth-helpers");
const UserRolePivot = require("../models/user-role-pivot");

async function authMiddleware(request, response, next) {
  try {
    const token = request.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, `${process.env.ENCRYPTION_KEY}`);
    const ipAddress = request.ip;

    if (decodedToken.ipAddress === ipAddress) {
      if (decodedToken.validTill > new Date()) {
        const userToken = await UserToken.findOne({
          where: {
            userId: decodedToken.userId,
            userToken: token,
          },
        });
        if (userToken) {
          const user = await User.findByPk(decodedToken.userId);
          if (user) {
            const admistratorRoleId = await getRoleId("Administrator");
            const userRole = await UserRolePivot.findOne({
              where: {
                userId: decodedToken.userId,
                roleId: admistratorRoleId,
              },
            });

            const isAdmin =
              String(admistratorRoleId) === String(userRole?.roleId);
            request.userData = user;
            request.userData.Admin = isAdmin;
            request.token = token;
          } else {
            return response.status(401).json({
              message: "Invalid User Account Or Token",
            });
          }
          next();
        } else {
          return response.status(401).json({
            message: "Token Has Been Expired",
          });
        }
      } else {
        await UserToken.destroy({
          where: {
            userId: decodedToken.userId,
            userToken: token,
          },
        });
        return response.status(401).json({
          message: "Token Has Been Expired",
        });
      }
    } else {
      return response.status(401).json({
        message:
          "Unauthenticated As You Are Trying To Access From Different IP Address",
      });
    }
  } catch (error) {
    console.log(error);
    return response.status(401).json({
      message: "Unauthenticated",
      error,
    });
  }
}

module.exports = authMiddleware;
