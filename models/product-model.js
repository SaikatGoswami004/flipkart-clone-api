const Sequelize = require("sequelize");
const sequelize = require("../utilities/database");

const Product = sequelize.define("product", {
  id: {
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  },
  productImage: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  brand: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  productCategoryId: {
    allowNull: false,
    type: Sequelize.UUID,
  },
  price: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  inventory: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  ratings: {
    type: Sequelize.FLOAT,
    allowNull: true,
    defaultValue: 0.0,
  },
  numReviews: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    default: true,
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

module.exports = Product;
