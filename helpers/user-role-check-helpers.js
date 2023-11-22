const Role = require("../models/role-model");
const UserRolePivot = require("../models/user-role-pivot");

exports.getRoleId = async (roleTitle) => {
  const userRole = await Role.findOne({
    where: {
      title: roleTitle,
    },
  });
  if (userRole) {
    return userRole.id;
  } else {
    return false;
  }
};
