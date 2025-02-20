require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authMiddleware = require('./middleware/auth');


const app = express();
app.use(express.json());
app.use(cors());

// Importar rutas
app.use('/users', require('./routes/users'));
app.use('/posts', require('./routes/posts'));
app.use('/comments', require('./routes/comments'));
app.use('/likes', require('./routes/likes'));
app.use('/books', require('./routes/books'));
app.use('/library', require('./routes/library'));

// Ruta principal
app.get('/', (req, res) => {
    res.send('Bienvenido a BookTok API 📚');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
