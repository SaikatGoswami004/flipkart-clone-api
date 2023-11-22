const User = require("../models/user-model");
const Role = require("../models/role-model");
const UserRolePivot = require("../models/user-role-pivot");
const UserToken = require("../models/user-token-model");

class DatabaseRelation {
  static async initializeRelation() {
    // User Relations
    User.belongsToMany(Role, {
      through: UserRolePivot,
      as: "roles",
      key: "id",
      foreignKey: "userId",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    User.hasMany(UserToken, {
      as: "tokens",
      key: "id",
      foreignKey: "userId",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    // Role Relations
    Role.belongsToMany(User, {
      through: UserRolePivot,
      as: "users",
      key: "id",
      foreignKey: "roleId",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // User Token Relations
    UserToken.belongsTo(User, {
      key: "id",
      foreignKey: "userId",
      as: "user",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  }
}
module.exports = DatabaseRelation;
