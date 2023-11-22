const Sequelize = require("sequelize");
const sequelize = require("../utilities/database");

const Role = sequelize.define("role", {
  id: {
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false,
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

module.exports = Role;
