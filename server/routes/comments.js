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


// Ruta protegida: Agregar un comentario a una publicación
app.post('/comments', authMiddleware, (req, res) => {
    const { post_id, content } = req.body;

    if (!post_id || !content) {
        return res.status(400).json({ error: 'El ID de la publicación y el contenido son obligatorios' });
    }

    db.query('INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
        [req.user.id, post_id, content],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al agregar el comentario' });

            res.json({ success: 'Comentario agregado correctamente' });
        }
    );
});

// Obtener los comentarios de una publicación
app.get('/comments/:post_id', (req, res) => {
    const postId = req.params.post_id;

    db.query(
        `SELECT comments.id, comments.content, comments.created_at, users.username, users.avatar 
         FROM comments 
         JOIN users ON comments.user_id = users.id
         WHERE post_id = ? 
         ORDER BY comments.created_at DESC`,
        [postId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener los comentarios' });

            res.json(results);
        }
    );
});

// Ruta protegida: Eliminar un comentario (solo el dueño puede hacerlo)
app.delete('/comments/:id', authMiddleware, (req, res) => {
    const commentId = req.params.id;

    // Verificar que el usuario es el dueño del comentario
    db.query('SELECT * FROM comments WHERE id = ? AND user_id = ?', [commentId, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });

        if (results.length === 0) {
            return res.status(403).json({ error: 'No puedes eliminar este comentario' });
        }

        // Eliminar el comentario
        db.query('DELETE FROM comments WHERE id = ?', [commentId], (err, deleteResults) => {
            if (err) return res.status(500).json({ error: 'Error al eliminar el comentario' });

            res.json({ success: 'Comentario eliminado correctamente' });
        });
    });
});

// Exportar el router para que `index.js` lo reconozca
module.exports = router;