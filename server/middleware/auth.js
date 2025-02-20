const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token' });
    }

    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), process.env.SECRET_KEY);
        req.user = verified; // Guarda los datos del usuario en req.user
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = authMiddleware;
