const Sequelize = require("sequelize");
const sequelize = require("../utilities/database");

const ProductCategory = sequelize.define("productCategory", {
  id: {
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  createdAt: {
    allowNull: false,
    defaultValue: Sequelize.fn("NOW"),
    type: Sequelize.DATE,
  },
  updatedAt: {
    allowNull: false,
    defaultValue: Sequelize.fn("NOW"),
    type: Sequelize.DATE,
  },
});

module.exports = ProductCategory;
