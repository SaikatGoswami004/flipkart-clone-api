const Sequelize = require("sequelize");
const sequelize = require("../utilities/database");

const UserRolePivot = sequelize.define(
  "userRolePivot",
  {
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
    },
    roleId: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    timestamp: false,
  }
);

module.exports = UserRolePivot;
