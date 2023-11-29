const express = require("express");
const router = express.Router();
const productCategoryController = require("../../controller/admin-api/product-category-admin-controller");
const authMiddleware = require("../../middleware/auth-middleware");
// create Product Category Route
router.post(
  "/create",
  authMiddleware,
  productCategoryController.createProductCategory
);

// Update Product Category Route
router.patch(
  "/update/:productCategoryId",
  authMiddleware,
  productCategoryController.createProductCategory
);
//Delete Product Category
router.delete(
  "/delete/:productCategoryId",
  authMiddleware,
  productCategoryController.deleteProductCategory
);
//Get Category
router.get(
  "/get-productCategory/:productCategoryId",
  authMiddleware,
  productCategoryController.getProductCategory
);
// Get Categories
router.get(
  "/get-productCategories",
  authMiddleware,
  productCategoryController.getProductCategorys
);
module.exports = router;
