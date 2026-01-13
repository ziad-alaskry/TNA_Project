const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authorize = (roles = []) => {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded; // Adds {id, role} to the request object

            // Role Check
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: "Unauthorized. Role mismatch." });
            }

            next();
        } catch (err) {
            res.status(400).json({ error: "Invalid Token." });
        }
    };
};

module.exports = { authorize };