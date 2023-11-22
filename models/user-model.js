const Sequelize = require("sequelize");
const sequelize = require("../utilities/database");

const User = sequelize.define("user", {
  id: {
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  },
  profileImage: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  emailAddress: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },

  isEmailVerified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  phoneCountryCode: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  phoneNumber: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  phoneOTP: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  isPhoneVerified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  isBlocked: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  userRole: {
    type: Sequelize.STRING,
    defaultValue: "Consumer",
  },
  emailOTP: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  phoneOTP: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  createdAt: {
    allowNull: false,
    defaultValue: Sequelize.fn("now"),
    type: Sequelize.DATE,
  },
  updatedAt: {
    allowNull: false,
    defaultValue: Sequelize.fn("now"),
    type: Sequelize.DATE,
  },
});

module.exports = User;
