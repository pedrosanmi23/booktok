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

// Ruta protegida: Crear un nuevo libro
router.post('/books', authMiddleware, (req, res) => {
    const { title, author, cover } = req.body;

    if (!title || !author) {
        return res.status(400).json({ error: 'El título y el autor son obligatorios' });
    }

    db.query('INSERT INTO books (title, author, cover) VALUES (?, ?, ?)', 
        [title, author, cover || null], 
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al agregar el libro' });

            res.json({ success: 'Libro agregado correctamente', book_id: results.insertId });
        }
    );
});

// Obtener todos los libros
router.get('/books', (req, res) => {
    db.query('SELECT * FROM books ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener los libros' });

        res.json(results);
    });
});

// Obtener un libro por su ID
router.get('/books/:id', (req, res) => {
    const bookId = req.params.id;

    db.query('SELECT * FROM books WHERE id = ?', [bookId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener el libro' });

        if (results.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        res.json(results[0]);
    });
});

// Buscar libros por título o autor
router.get('/books/search/:query', (req, res) => {
    const searchQuery = `%${req.params.query}%`;

    db.query(
        `SELECT * FROM books WHERE title LIKE ? OR author LIKE ? ORDER BY created_at DESC`,
        [searchQuery, searchQuery],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al buscar libros' });

            res.json(results);
        }
    );
});

// Obtener libros más populares (más agregados a bibliotecas)
router.get('/books/popular', (req, res) => {
    db.query(
        `SELECT books.id, books.title, books.author, books.cover, COUNT(library.id) AS added_count
         FROM books
         JOIN library ON books.id = library.book_id
         GROUP BY books.id
         ORDER BY added_count DESC
         LIMIT 10`, // Limita a los 10 más populares
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener libros populares' });

            res.json(results);
        }
    );
});

// Sugerir libros basados en la biblioteca del usuario autenticado
router.get('/books/suggestions', authMiddleware, (req, res) => {
    db.query(
        `SELECT DISTINCT b.id, b.title, b.author, b.cover
         FROM books b
         JOIN library l ON b.id = l.book_id
         WHERE l.user_id != ? AND b.id NOT IN (
             SELECT book_id FROM library WHERE user_id = ?
         )
         ORDER BY RAND() 
         LIMIT 10`, // Selecciona 10 libros aleatorios no agregados aún
        [req.user.id, req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener sugerencias de libros' });

            res.json(results);
        }
    );
});

// Obtener los libros más recientes
router.get('/books/recent', (req, res) => {
    db.query(
        `SELECT * FROM books ORDER BY created_at DESC LIMIT 10`,
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener los libros recientes' });

            res.json(results);
        }
    );
});

// Exportar el router para que `index.js` lo reconozca
module.exports = router;