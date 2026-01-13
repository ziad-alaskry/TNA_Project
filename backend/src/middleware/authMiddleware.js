const jwt = require('jsonwebtoken');
// Fallback secret for development stability
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const authorize = (roles = []) => {
    return (req, res, next) => {
        // Support both lowercase and CamelCase header keys
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Access Denied. No token provided." });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Injects {id, role, name} into the rest of the request chain
            req.user = decoded; 

            // Role Check
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: `Unauthorized. Requires: ${roles.join(',')}` });
            }

            next();
        } catch (err) {
            console.error("JWT Verify Error:", err.message);
            return res.status(401).json({ error: "Invalid or Expired Token." });
        }
    };
};

module.exports = { authorize };