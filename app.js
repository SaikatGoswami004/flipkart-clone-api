"use strict";

// Import Required Modules
require("dotenv").config();
const http = require("http");
const express = require("express");
// const compression = require("compression");
const cors = require("cors");
const bodyParser = require("body-parser");
const sequelize = require("./utilities/database");
const DatabaseRelation = require("./database/database-relation");
const { mountRoutes } = require("./routes/routes");
const { initialSeeding } = require("./database/database-seed");
const { adminMountRoutes } = require("./routes/admin/admin-routes");

// Instantiate Express.JS
const app = express();

// Enable CORS Middleware
app.use(cors());

// Setup Static Public Directory
app.use(express.static("public"));

// Enable Body Parser Middleware
app.use(bodyParser.json());

//Start The Server
DatabaseRelation.initializeRelation()
  .then(() => {
    //Database Seeding
    initialSeeding();
    // Initialize Routes
    mountRoutes(app);
    adminMountRoutes(app);
    // Sync Sequelize And Start The Server
    sequelize
      .sync({
        alter: process.env.ALTER_TABLE == 1 ? true : false,
      })
      .then(() => {
        const httpServer = http.createServer(app);
        const httpPort = process.env.HTTP_PORT;
        httpServer.listen(httpPort);

        console.log(
          `HTTP Server Started At ${process.env.HTTP_PROTOCOL}://${process.env.HTTP_URL}:${httpPort}`
        );
      })
      .catch((error) => {
        console.log("Failed To Sync DB", error);
      });
  })
  .catch((error) => {
    console.log("Failed To Fetch Relations", error);
  });
