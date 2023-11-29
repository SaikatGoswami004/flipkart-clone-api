const Validator = require("fastest-validator");
const sequelize = require("../../utilities/database");
const Product = require("../../models/product-model");
const { Op } = require("sequelize");
const {
  productAttributes,
  productCategoryAttributes,
  basicListPaginationDataPrepare,
  basicListPaginationValidationSchema,
} = require("../../helpers/attributes-helpers");
const ProductCategory = require("../../models/product-category-model");
const crypto = require("crypto");
const path = require("path");

exports.createProduct = async (request, response) => {
  try {
    // check isActive param
    if (request.body.isActive && request.body.isActive === "true") {
      request.body.isActive = true;
    } else {
      request.body.isActive = false;
    }
    // Preparing Data
    let data = {
      name: request.body.name,
      description: request.body.description,
      brand: request.body.brand,
      price: Number(request.body.price),
      productCategoryId: request.body.productCategoryId,
      inventory: Number(request.body.inventory),

      isActive: request.body.isActive,
    };

    // // Preparing Validation Schema
    const schema = {
      name: {
        type: "string",
        optional: false,
      },
      description: {
        type: "string",
        optional: false,
      },
      brand: {
        type: "string",
        optional: false,
      },

      productCategoryId: {
        type: "uuid",
        optional: false,
      },
      price: {
        type: "number",
        positive: true,
        optional: false,
      },
      inventory: {
        type: "number",
        optional: false,
      },
      isActive: {
        type: "boolean",
        optional: false,
      },
    };
    // // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);
    // Send Response On Validation Failed
    if (validationResponse !== true) {
      return response.status(400).json({
        message: "Validation Error",
        errors: validationResponse,
      });
    } else {
      const transaction = await sequelize.transaction();
      try {
        const productId = request.params.productId || null;
        let product = null;

        // Check Whether Product ID Valid
        if (productId) {
          product = await Product.findOne({
            where: {
              id: productId,
            },
          });

          if (!productId) {
            return response.status(404).json({
              message: "Product does not exists!",
            });
          }
        }

        // Prepare Data For Update Or Create
        const updateData = {
          name: data.name,
          description: data.description,
          brand: data.brand,
          productCategoryId: data.productCategoryId,
          price: data.price,
          inventory: data.inventory,
          isActive: data.isActive,
        };
        // Upload image If Provided
        if (request.files["productImage"]) {
          // Generate Dynamic File Name And Save The Image Into S3 Storage
          const customFileName = crypto.randomBytes(18).toString("hex");
          const imageBufferData = request.files["productImage"][0].buffer;
          const imageExtension = path.extname(
            request.files["productImage"][0].originalname
          );
          const imageFileName =
            `flipcart-clone/product/` + customFileName + imageExtension;
          const mimeType = request.files["productImage"][0].mimetype;
          // Save To S3
          const params = {
            Key: imageFileName,
            Body: imageBufferData,
            ACL: "public-read",
            contentType: mimeType,
          };

          Object.assign(updateData, {
            productImage: params.Key,
          });
        }

        // Insert Or Update Product  Into DB
        if (product) {
          await Product.update(updateData, {
            where: { id: productId },
          });
          await transaction.commit();
        } else {
          await Product.create(updateData);
          await transaction.commit();
        }

        // Return Response
        return response.status(productId ? 200 : 201).json({
          message: "Product successfully saved.",
        });
      } catch (error) {
        // Log Error And Return Response
        console.log(error);
        await transaction.rollback();
        return response.status(500).json({
          message: "Unable To Process",
          error: error.message,
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "admin-api -> product-admin-controller -> createProduct -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
exports.deleteProduct = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      productId: request.params.productId,
    };

    // Preparing Validation Schema
    const schema = {
      productId: {
        type: "uuid",
        optional: false,
      },
    };

    // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);

    // Send Response On Validation Failed
    if (validationResponse !== true) {
      return response.status(400).json({
        message: "Validation Error",
        errors: validationResponse,
      });
    } else {
      try {
        const transaction = await sequelize.transaction();
        const product = await Product.findOne({
          where: {
            id: data.productId,
          },
        });
        if (!product) {
          return response.status(404).json({
            message: "Product does not exists!",
          });
        }
        await Product.destroy({
          where: {
            id: data.productId,
          },
        });
        // Commit The DB Transaction
        transaction.commit();

        return response.status(200).json({
          message: "Product Delete Successfully!!",
        });
      } catch (error) {
        // Rollback The DB Transaction
        transaction.rollback();
        console.log(error);
        // Return The Response
        return response.status(500).json({
          message: "Unable To Process",
          error: error.message,
        });
      }
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "admin-api -> product-admin-controller -> deleteProduct -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getProduct = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      productId: request.params.productId,
    };

    // Preparing Validation Schema
    const schema = {
      productId: {
        type: "uuid",
        optional: false,
      },
    };

    // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);

    // Send Response On Validation Failed
    if (validationResponse !== true) {
      return response.status(400).json({
        message: "Validation Error",
        errors: validationResponse,
      });
    } else {
      const product = await Product.findOne({
        where: {
          id: data.productId,
        },
        attributes: productAttributes,
        include: {
          model: ProductCategory,
          as: "productCategory",
          attributes: productCategoryAttributes,
        },
      });
      if (!product) {
        return response.status(400).json({
          message: "Product Not Found!",
        });
      }
      return response.status(200).json(product);
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "admin-api -> product-admin-controller -> getProduct -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
exports.getProducts = async (request, response) => {
  try {
    const data = basicListPaginationDataPrepare(
      request.query.page,
      request.query.size,
      request.query.keywords
    );

    const schema = basicListPaginationValidationSchema;
    // Creating Validator Object And Validating
    const validation = new Validator();
    const validationResponse = validation.validate(data, schema);

    // Send Response On Validation Failed
    if (validationResponse !== true) {
      return response.status(400).json({
        message: "Validation Error",
        errors: validationResponse,
      });
    } else {
      // Define Pagination Algorithm
      let page = 0;
      let size = 5;
      const pageAsNumber = Number.parseInt(request.query.page);
      const sizeAsNumber = Number.parseInt(request.query.size);
      if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
        page = pageAsNumber - 1;
      }
      if (!Number.isNaN(sizeAsNumber) && sizeAsNumber > 0) {
        size = sizeAsNumber;
      }

      const options = {
        attributes: productAttributes,
        include: {
          model: ProductCategory,
          as: "productCategory",
          attributes: productCategoryAttributes,
        },
        distinct: true,
        limit: size,
        offset: page * size,
      };
      // Prepare Initialize Variables
      const keywords = request.query.keywords || null;
      const whereClause = {};
      // If Keywords Exists
      if (keywords && keywords.trim() !== "") {
        Object.assign(whereClause, {
          name: {
            [Op.like]: `%${data.keywords}%`,
          },
        });
        Object.assign(options, {
          where: whereClause,
        });
      }

      const products = await Product.findAndCountAll(options);
      if (!products) {
        return response.status(400).json({
          message: "Product Not Found!",
        });
      }
      // Send Response
      const totalItems = Number.parseInt(products.count);
      response.status(200).json({
        pagination: {
          totalItems: totalItems,
          perPage: size,
          currentPage: page + 1,
          lastPage: Math.ceil(totalItems / size),
        },
        products: products.rows,
      });
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "admin-api -> product-admin-controller -> getProducts -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
