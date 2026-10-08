const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const rutaBaseDatos = path.join(__dirname, 'tareas.db');

const db = new sqlite3.Database(rutaBaseDatos, (error) => {
  if (error) {
    console.error('❌ Error al abrir la base de datos:', error.message);
  } else {
    console.log('✅ Base de datos SQLite conectada');
    console.log(`📁 Ubicación: ${rutaBaseDatos}`);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tareas (
      id INTEGER PRIMARY KEY,
      texto TEXT NOT NULL,
      completada INTEGER NOT NULL DEFAULT 0,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (error) => {
    if (error) {
      console.error('❌ Error al crear la tabla:', error.message);
    } else {
      console.log('✅ Tabla "tareas" lista');
    }
  });
});

module.exports = db;