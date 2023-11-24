exports.adminMountRoutes = (app) => {
  // Define Web Routes
  const userRoutes = require("./user-routes");
  const productRoutes = require("./product-category-routes");

  // Map All Routes And Middleware
  app.use("/admin", userRoutes);
  app.use("/admin", productRoutes);
};
