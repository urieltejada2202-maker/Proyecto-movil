const express = require('express');
const cors = require('cors');

const tareasRoutes = require('./routes/tareas');


const app = express();


const PORT = 3000;


app.use(cors());

app.use(express.json());



app.get('/', (req, res) => {

  res.json({
    mensaje: 'Backend de Proyecto-movil funcionando correctamente',
    estado: 'online'
  });

});




app.use('/api/tareas', tareasRoutes);



app.use((req, res) => {

  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });

});



app.listen(PORT, '0.0.0.0', () => {

  console.log('');
  console.log('====================================');
  console.log('🚀 BACKEND INICIADO');
  console.log('====================================');
  console.log(`🌐 Puerto: ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api/tareas`);
  console.log('====================================');
  console.log('');

});