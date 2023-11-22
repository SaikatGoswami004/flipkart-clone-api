const Sequelize = require("sequelize");
const sequelize = require("../utilities/database");
const User = require("./user-model");

const UserToken = sequelize.define("userToken", {
  id: {
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  },
  userId: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },
  userToken: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userIpAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = UserToken;
