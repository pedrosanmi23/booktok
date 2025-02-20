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


// Ruta protegida: Crear una publicación
app.post('/posts', authMiddleware, (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'El contenido no puede estar vacío' });
    }

    db.query('INSERT INTO posts (user_id, content) VALUES (?, ?)', 
    [req.user.id, content], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al crear la publicación' });
        }
        res.json({ success: 'Publicación creada correctamente' });
    });
});

// Ruta protegida: Editar una publicación (solo el dueño puede hacerlo)
app.put('/posts/:id', authMiddleware, (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'El contenido no puede estar vacío' });
    }

    // Verificar que el usuario es el dueño de la publicación
    db.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });

        if (results.length === 0) {
            return res.status(403).json({ error: 'No puedes editar esta publicación' });
        }

        // Actualizar la publicación
        db.query('UPDATE posts SET content = ? WHERE id = ?', [content, postId], (err, updateResults) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar la publicación' });

            res.json({ success: 'Publicación actualizada correctamente' });
        });
    });
});

// Ruta protegida: Eliminar una publicación (solo el dueño puede hacerlo)
app.delete('/posts/:id', authMiddleware, (req, res) => {
    const postId = req.params.id;

    // Verificar que el usuario es el dueño de la publicación
    db.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });

        if (results.length === 0) {
            return res.status(403).json({ error: 'No puedes eliminar esta publicación' });
        }

        // Eliminar la publicación
        db.query('DELETE FROM posts WHERE id = ?', [postId], (err, deleteResults) => {
            if (err) return res.status(500).json({ error: 'Error al eliminar la publicación' });

            res.json({ success: 'Publicación eliminada correctamente' });
        });
    });
});

// Exportar el router para que `index.js` lo reconozca
module.exports = router;