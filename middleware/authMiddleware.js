const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Extract and sanitize token
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ error: "Invalid token format." });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    console.error("⚠️ Authentication Error:", err.message);

    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token. Authentication failed." });
    }

    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = authenticate;
