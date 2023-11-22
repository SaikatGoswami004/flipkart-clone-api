exports.mountRoutes = (app) => {
  // Define Web Routes
  const authRoute = require("./auth-routes");

  // Map All Routes And Middleware
  app.use("/auth", authRoute);
};
