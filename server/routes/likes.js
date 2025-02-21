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


// Ruta protegida: Dar o quitar "me gusta" a una publicación
router.post('/likes', authMiddleware, (req, res) => {
    const { post_id } = req.body;

    if (!post_id) {
        return res.status(400).json({ error: 'El ID de la publicación es obligatorio' });
    }

    // Verificar si el usuario ya ha dado "me gusta"
    db.query('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, post_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });

        if (results.length > 0) {
            // Si ya dio "me gusta", lo elimina (quitando el like)
            db.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, post_id], (err, deleteResults) => {
                if (err) return res.status(500).json({ error: 'Error al quitar "me gusta"' });

                return res.json({ success: 'Me gusta eliminado' });
            });
        } else {
            // Si no ha dado "me gusta", lo agrega
            db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, post_id], (err, insertResults) => {
                if (err) return res.status(500).json({ error: 'Error al dar "me gusta"' });

                return res.json({ success: 'Me gusta agregado' });
            });
        }
    });
});

// Obtener el número de "me gusta" de una publicación
router.get('/likes/:post_id', (req, res) => {
    const postId = req.params.post_id;

    db.query('SELECT COUNT(*) AS total_likes FROM likes WHERE post_id = ?', [postId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener los "me gusta"' });

        res.json(results[0]);
    });
});

// Verificar si el usuario autenticado ha dado "me gusta" a una publicación (PARA EN EL FRONT MOSTRAR EL BOTON DE ME GUSTA ACTIVADO O NO)
router.get('/likes/:post_id/check', authMiddleware, (req, res) => {
    const postId = req.params.post_id;

    db.query('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });

        res.json({ liked: results.length > 0 }); // true si ha dado "me gusta", false si no
    });
});

// Exportar el router para que `index.js` lo reconozca
module.exports = router;