const express = require("express");
const router = express.Router();
const productController = require("../../controller/admin-api/product-category-admin-controller");
const authMiddleware = require("../../middleware/auth-middleware");
// create Product Category Route
router.post(
  "/create-product-category",
  authMiddleware,
  productController.createProductCategory
);

// Update Product Category Route
router.patch(
  "/update-product-category/:productCategoryId",
  authMiddleware,
  productController.createProductCategory
);
//Delete Product Category
router.delete(
  "/delete-productCategory/:productCategoryId",
  authMiddleware,
  productController.deleteProductCategory
);
//Get Category
router.get(
  "/get-productCategory/:productCategoryId",
  authMiddleware,
  productController.getProductCategory
);
// Get Categorys
router.get(
  "/get-productCategorys",
  authMiddleware,
  productController.getProductCategorys
);
module.exports = router;
