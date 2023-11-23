exports.adminMountRoutes = (app) => {
  // Define Web Routes
  const userRoutes = require("./user-routes");

  // Map All Routes And Middleware
  app.use("/admin", userRoutes);
};
