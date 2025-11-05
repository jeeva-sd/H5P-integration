const User = require("../models/User");

/**
 * Demo user data (replace with real auth in production)
 */
const DEMO_USERS = {
  teacher: { id: "teacher", name: "Teacher", email: "teacher@example.com", role: "teacher" },
  student: { id: "student", name: "Student", email: "student@example.com", role: "student" },
  anonymous: { id: "anonymous", name: "Anonymous", email: "", role: "anonymous" },
};

/**
 * Simple user authentication middleware
 * In production, replace this with proper JWT/session auth
 */
function authMiddleware(req, res, next) {
  const userId = req.headers["x-user-id"] || "teacher";
  const userData = DEMO_USERS[userId] || DEMO_USERS.anonymous;
  
  req.user = new User(
    userData.id,
    userData.name,
    userData.email,
    userData.role
  );
  
  next();
}

module.exports = authMiddleware;
