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
app.get('/users', (req, res) => {
    db.query('SELECT id, username, email, avatar, bio FROM users', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los usuarios' });
        }
        res.json(results);
    });
});

// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Verificar que los datos no estén vacíos
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar el usuario en la base de datos
        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
            [username, email, hashedPassword], 
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al registrar usuario' });
                }
                res.json({ success: 'Usuario registrado correctamente' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Buscar al usuario en la base de datos
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = results[0];

        // Comparar la contraseña con la almacenada en la BD
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Crear el token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            process.env.SECRET_KEY, 
            { expiresIn: '3h' }
        );

        res.json({ success: 'Inicio de sesión exitoso', token });
    });
});

// Ruta protegida: Obtener el perfil del usuario autenticado
app.get('/profile', authMiddleware, (req, res) => {
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
app.get('/users/search/:query', (req, res) => {
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