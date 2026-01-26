const jwt = require('jsonwebtoken');

// Ensure a secret exists to prevent server crashes
const JWT_SECRET = process.env.JWT_SECRET || 'project_a_secure_dev_key_2026';

/**
 * Authorization Middleware
 * @param {Array} roles - Allowed roles (e.g., ['VISITOR', 'OWNER'])
 * Supports: VISITOR, OWNER, CARRIER, BUSINESS, GOV
 */
const authorize = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Access Denied. Please provide a Bearer token." });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Injects user context {id, role} into req.user for use in controllers
            req.user = decoded; 

            // Role Validation Logic
            if (roles.length > 0) {
                const hasPermission = roles.includes(decoded.role);
                
                if (!hasPermission) {
                    return res.status(403).json({ 
                        error: `Access Restricted. Required Role: [${roles.join(' or ')}]`,
                        your_role: decoded.role 
                    });
                }
            }

            next();
        } catch (err) {
            // Distinguish between expired and malformed tokens for better frontend UX
            const errorMessage = err.name === 'TokenExpiredError' 
                ? "Token has expired. Please log in again." 
                : "Invalid token authentication.";
                
            return res.status(401).json({ error: errorMessage });
        }
    };
};

module.exports = { authorize };