exports.adminMountRoutes = (app) => {
  // Define Web Routes
  const userRoutes = require("./user-routes");
  const productCategoryRoutes = require("./product-category-routes");
  const productRoutes = require("./product-admin-routes");

  // Map All Routes And Middleware
  app.use("/admin", userRoutes);
  app.use("/admin/product-category", productCategoryRoutes);
  app.use("/admin/product", productRoutes);
};
