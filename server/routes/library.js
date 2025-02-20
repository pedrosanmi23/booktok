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


// Ruta protegida: Agregar un libro a la biblioteca personal
app.post('/library', authMiddleware, (req, res) => {
    const { book_id, status } = req.body;

    if (!book_id) {
        return res.status(400).json({ error: 'El ID del libro es obligatorio' });
    }

    const bookStatus = status || 'pendiente'; // Si no se envía el estado, se pone "pendiente"

    // Verificar si el libro ya está en la biblioteca
    db.query('SELECT * FROM library WHERE user_id = ? AND book_id = ?', [req.user.id, book_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });

        if (results.length > 0) {
            return res.status(400).json({ error: 'Este libro ya está en tu biblioteca' });
        }

        // Insertar el libro en la biblioteca personal del usuario
        db.query('INSERT INTO library (user_id, book_id, status) VALUES (?, ?, ?)',
            [req.user.id, book_id, bookStatus],
            (err, insertResults) => {
                if (err) return res.status(500).json({ error: 'Error al agregar el libro a la biblioteca' });

                res.json({ success: 'Libro agregado a la biblioteca' });
            }
        );
    });
});

// Ruta protegida: Obtener la biblioteca personal del usuario autenticado
app.get('/library', authMiddleware, (req, res) => {
    db.query(
        `SELECT library.id, books.title, books.author, books.cover, library.status, library.created_at 
         FROM library 
         JOIN books ON library.book_id = books.id 
         WHERE library.user_id = ? 
         ORDER BY library.created_at DESC`,
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener la biblioteca' });

            res.json(results);
        }
    );
});

// Ruta protegida: Actualizar el estado de un libro en la biblioteca
app.put('/library/:id', authMiddleware, (req, res) => {
    const libraryId = req.params.id;
    const { status } = req.body;

    if (!status || !['leyendo', 'completado', 'pendiente'].includes(status)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }

    // Verificar que el usuario sea dueño del libro en la biblioteca
    db.query('SELECT * FROM library WHERE id = ? AND user_id = ?', [libraryId, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });

        if (results.length === 0) {
            return res.status(403).json({ error: 'No puedes modificar este libro' });
        }

        // Actualizar el estado del libro en la biblioteca
        db.query('UPDATE library SET status = ? WHERE id = ?', [status, libraryId], (err, updateResults) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar el estado del libro' });

            res.json({ success: 'Estado del libro actualizado' });
        });
    });
});

// Ruta protegida: Eliminar un libro de la biblioteca
app.delete('/library/:id', authMiddleware, (req, res) => {
    const libraryId = req.params.id;

    // Verificar que el usuario es dueño del libro en la biblioteca
    db.query('SELECT * FROM library WHERE id = ? AND user_id = ?', [libraryId, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });

        if (results.length === 0) {
            return res.status(403).json({ error: 'No puedes eliminar este libro de la biblioteca' });
        }

        // Eliminar el libro de la biblioteca
        db.query('DELETE FROM library WHERE id = ?', [libraryId], (err, deleteResults) => {
            if (err) return res.status(500).json({ error: 'Error al eliminar el libro de la biblioteca' });

            res.json({ success: 'Libro eliminado de la biblioteca' });
        });
    });
});

// Exportar el router para que `index.js` lo reconozca
module.exports = router;