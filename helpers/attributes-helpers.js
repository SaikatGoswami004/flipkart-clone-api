const sequelize = require("../utilities/database");

exports.productCategoryAttributes = [
  ["id", "userId"],
  "name",
  "description",
  "createdAt",
  "updatedAt",
];

exports.productAttributes = [
  ["id", "userId"],
  [
    sequelize.literal(
      `IF(productImage IS NOT NULL, CONCAT("${process.env.IMAGE_URL}", productImage), productImage)`
    ),
    "productImage",
  ],
  "name",
  "description",
  "productCategoryId",
  "brand",
  "price",
  "inventory",
  "ratings",
  "numReviews",
  "isActive",
  "createdAt",
  "updatedAt",
];

exports.basicListPaginationDataPrepare = (page, size, keywords = undefined) => {
  return {
    page: Number.parseInt(page),
    size: Number.parseInt(size),
    keywords,
  };
};

exports.basicListPaginationValidationSchema = {
  page: {
    type: "number",
    optional: true,
    default: 1,
    min: 1,
  },
  size: {
    type: "number",
    optional: true,
    default: 30,
    min: 1,
    max: 256,
  },
  keywords: {
    type: "string",
    optional: true,
    default: null,
  },
};
exports.userAttributes = [
  ["id", "userId"],
  [
    sequelize.literal(
      `IF(profileImage IS NOT NULL, CONCAT("${process.env.IMAGE_URL}", profileImage), profileImage)`
    ),
    "profileImage",
  ],
  "firstName",
  "lastName",
  "emailAddress",
  "isEmailVerified",
  "phoneCountryCode",
  "phoneNumber",
  "isPhoneVerified",
  "userRole",
];
