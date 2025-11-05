const H5P = require("@lumieducation/h5p-server");

/**
 * Simple Permission System for H5P
 * Controls who can do what with H5P content
 */
class SimplePermissionSystem {
  async checkForUserData(actingUser, permission, contentId, affectedUserId) {
    if (!actingUser) return false;
    // Allow teachers and admins to manage user data
    return actingUser.role === 'teacher' || actingUser.role === 'admin';
  }

  async checkForContent(actingUser, permission, contentId) {
    if (!actingUser) return false;
    // Allow teachers to create, edit, delete, view content
    return actingUser.role === 'teacher' || actingUser.role === 'admin';
  }

  async checkForTemporaryFile(user, permission, filename) {
    if (!user || user.role === 'anonymous') return false;
    // Allow all authenticated users to upload temporary files
    return true;
  }

  async checkForGeneralAction(actingUser, permission) {
    if (!actingUser) return false;
    
    // Allow teachers to install libraries (important for the editor!)
    if (actingUser.role === 'teacher' || actingUser.role === 'admin') {
      // These permissions are needed for installing content types from H5P Hub
      return true;
    }
    
    return false;
  }
}

module.exports = SimplePermissionSystem;
