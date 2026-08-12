import express from 'express';
import cors from 'cors';
import db from './db.js'; // Tu archivo de conexión a la base de datos
import parametricasRouter from '../src/routes/parametricas.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para todas las rutas
app.use(cors());

// Middleware para procesar respuestas en formato JSON
app.use(express.json());

// Montar las rutas dinámicas para las tablas paramétricas
app.use(parametricasRouter);

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('Servidor ejecutándose correctamente 🚀');
});

// 📍 Endpoint GET: Obtener todas las ciudades
app.get('/api/ciudades', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ciudad');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener ciudades:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al consultar la base de datos' 
    });
  }
});

// 📍 Endpoint GET: Obtener todos los tipos de servicio
app.get('/api/tipos-servicio', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tipo_servicio');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener tipos de servicio:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al consultar la base de datos' 
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Servidor backend corriendo en http://localhost:${PORT}`);
});