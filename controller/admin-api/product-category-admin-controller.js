const Validator = require("fastest-validator");
const sequelize = require("../../utilities/database");
const ProductCategory = require("../../models/product-category-model");
const { Op } = require("sequelize");
const {
  productCategoryAttributes,
  basicListPaginationValidationSchema,
  basicListPaginationDataPrepare,
} = require("../../helpers/attributes-helpers");

exports.createProductCategory = async (request, response) => {
  try {
    // // Preparing Data
    let data = {
      name: request.body.name,
      description: request.body.description,
    };
    // // Preparing Validation Schema
    const schema = {
      name: {
        type: "string",
        optional: false,
      },
      description: {
        type: "string",
        optional: true,
        default: null,
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
        const productCategoryId = request.params.productCategoryId || null;
        let productCategory = null;

        // Duplicate Product Category Check Match Variable
        const duplicateMatchParam = {
          name: data.name,
        };

        // Check Whether Product Category ID Valid
        if (productCategoryId) {
          productCategory = await ProductCategory.findOne({
            where: {
              id: productCategoryId,
            },
          });

          if (!productCategory) {
            return response.status(404).json({
              message: "Product category does not exists!",
            });
          }
          // Add Exception For Current ID In Duplicate Check
          Object.assign(duplicateMatchParam, {
            id: {
              [Op.ne]: productCategoryId,
            },
          });
        }
        // Duplicate Name Checking
        const duplicateCategory = await ProductCategory.findOne({
          where: duplicateMatchParam,
        });
        if (duplicateCategory) {
          return response.status(409).json({
            message: "Product Category should not be duplicate!",
          });
        }
        // Prepare Data For Update Or Create
        const updateData = {
          name: data.name,
          description: data.description,
        };
        // Insert Or Update Product Category Into DB

        if (productCategory) {
          await ProductCategory.update(updateData, {
            where: { id: productCategoryId },
          });
          await transaction.commit();
        } else {
          await ProductCategory.create(updateData);
          await transaction.commit();
        }

        // Return Response
        return response.status(productCategoryId ? 200 : 201).json({
          message: "Product category successfully saved.",
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
      "admin-api -> product-category-admin-controller -> createProductCategory -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.deleteProductCategory = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      productCategoryId: request.params.productCategoryId,
    };

    // Preparing Validation Schema
    const schema = {
      productCategoryId: {
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
        const productCategory = await ProductCategory.findOne({
          where: {
            id: data.productCategoryId,
          },
        });
        if (!productCategory) {
          return response.status(404).json({
            message: "Product Category does not exists!",
          });
        }
        await ProductCategory.destroy({
          where: {
            id: data.productCategoryId,
          },
        });
        // Commit The DB Transaction
        transaction.commit();

        return response.status(200).json({
          message: "Product Category Delete Successfully!!",
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
      "admin-api -> product-category-admin-controller -> deleteProductCategory -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
exports.getProductCategory = async (request, response) => {
  try {
    // Preparing Data
    let data = {
      productCategoryId: request.params.productCategoryId,
    };

    // Preparing Validation Schema
    const schema = {
      productCategoryId: {
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
      const category = await ProductCategory.findOne({
        where: {
          id: data.productCategoryId,
        },
        attributes: productCategoryAttributes,
      });
      if (!category) {
        return response.status(400).json({
          message: "Product Category Not Found!",
        });
      }
      return response.status(200).json(category);
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "admin-api -> product-category-admin-controller -> getProductCatagory -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
exports.getProductCategorys = async (request, response) => {
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
        attributes: productCategoryAttributes,
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

      const categorys = await ProductCategory.findAndCountAll(options);
      if (!categorys) {
        return response.status(400).json({
          message: "Product Category Not Found!",
        });
      }
      // Send Response
      const totalItems = Number.parseInt(categorys.count);
      response.status(200).json({
        pagination: {
          totalItems: totalItems,
          perPage: size,
          currentPage: page + 1,
          lastPage: Math.ceil(totalItems / size),
        },
        categorys: categorys.rows,
      });
    }
  } catch (error) {
    // Log Error And Return Response
    console.log(
      "admin-api -> product-category-admin-controller -> getProductCatagorys -> ",
      error
    );
    return response.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
