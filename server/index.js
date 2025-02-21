require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authMiddleware = require('./middleware/auth');


const app = express();
app.use(express.json());
app.use(cors());

// Importar rutas
app.use('/', require('./routes/users'));
app.use('/', require('./routes/login'));
app.use('/', require('./routes/posts'));
app.use('/', require('./routes/comments'));
app.use('/', require('./routes/likes'));
app.use('/', require('./routes/books'));
app.use('/', require('./routes/library'));

// Ruta principal
app.get('/', (req, res) => {
    res.send('Bienvenido a BookTok API 📚');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
