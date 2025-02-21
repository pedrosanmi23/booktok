const express = require('express');
const router = express.Router();
const cors = require('cors');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const app = express();
app.use(express.json());
app.use(cors());

// Ruta para obtener todos los usuarios
router.get('/users', (req, res) => {
    db.query('SELECT id, username, email, avatar, bio FROM users', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los usuarios' });
        }
        res.json(results);
    });
});

// Ruta protegida: Obtener el perfil del usuario autenticado
router.get('/profile', authMiddleware, (req, res) => {
    db.query('SELECT id, username, email, avatar, bio FROM users WHERE id = ?', 
    [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener el perfil' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(results[0]);
    });
});

// Buscar usuarios por nombre de usuario
router.get('/users/search/:query', (req, res) => {
    const searchQuery = `%${req.params.query}%`;

    db.query(
        `SELECT id, username, avatar FROM users WHERE username LIKE ? ORDER BY username ASC`,
        [searchQuery],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al buscar usuarios' });

            res.json(results);
        }
    );
});

// Exportar el router para que `index.js` lo reconozca
module.exports = router;