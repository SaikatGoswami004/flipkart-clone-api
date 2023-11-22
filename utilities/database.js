require("dotenv").config();

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "mysql",
    host: process.env.DB_HOST,
    pool: {
      max: 512,
    },
    logging: process.env.SQL_LOG == 1 ? true : false,
  }
);

module.exports = sequelize;
