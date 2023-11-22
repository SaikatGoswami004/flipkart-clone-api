const Role = require("../models/role-model");
const User = require("../models/user-model");

// Initialize Model Relations
exports.initialSeeding = async () => {
  //Administrator Role
  const administratorRole = await Role.findOne({
    where: { title: "Administrator" },
  });
  if (!administratorRole) {
    await Role.create({
      title: "Administrator",
      description: "Administrator",
    });
    console.log("Default Administrator Role Created Successfully");
  }
  // Consumer Role
  const consumerRole = await Role.findOne({
    where: { title: "Consumer" },
  });
  if (!consumerRole) {
    await Role.create({
      title: "Consumer",
      description: "Consumer",
    });
    console.log("Default Consumer Role Created Successfully");
  }
  // Saler Role
  const salerRole = await Role.findOne({
    where: { title: "Saler" },
  });
  if (!salerRole) {
    await Role.create({
      title: "Saler",
      description: "Saler",
    });
    console.log("Default Saler Role Created Successfully");
  }
};
