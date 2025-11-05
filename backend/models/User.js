/**
 * User Model
 * Represents a user in the H5P system
 */
class User {
  constructor(id, name, email, role) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.type = "local";
  }
}

module.exports = User;
