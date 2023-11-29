const express = require("express");
const router = express.Router();
const productController = require("../../controller/admin-api/product-admin-controller");
const authMiddleware = require("../../middleware/auth-middleware");
const { upload } = require("../../helpers/file-upload-helpers");
// create Product  Route
router.post(
  "/create",
  authMiddleware,
  upload.fields([
    {
      name: "productImage",
      maxCount: 1,
    },
  ]),
  productController.createProduct
);

// Update Product  Route
router.patch(
  "/update/:productId",
  authMiddleware,
  upload.fields([
    {
      name: "productImage",
      maxCount: 1,
    },
  ]),
  productController.createProduct
);
//Delete Product
router.delete(
  "/delete/:productId",
  authMiddleware,
  productController.deleteProduct
);
//Get product
router.get(
  "/get-product/:productId",
  authMiddleware,
  productController.getProduct
);
// Get products
router.get("/get-products", authMiddleware, productController.getProducts);
module.exports = router;
