const express = require('express');
const cors = require('cors');
const { guardarBusqueda, obtenerHistorial } = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.post('/api/busquedas', async (req, res) => {
    const { ciudad, temperatura, humedad, pais } = req.body;
    
    if (!ciudad) {
        return res.status(400).json({ error: 'Ciudad requerida' });
    }
    
    const resultado = await guardarBusqueda(ciudad, temperatura, humedad, pais);
    res.json({ success: true, data: resultado });
});

app.get('/api/historial', async (req, res) => {
    const historial = await obtenerHistorial(10);
    res.json({ success: true, data: historial });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
});