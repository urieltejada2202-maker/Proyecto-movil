const express = require('express');
const router = express.Router();
const db = require('../database');


router.get('/', (req, res) => {

  const sql = `
    SELECT
      id,
      texto,
      completada,
      fecha_actualizacion
    FROM tareas
    ORDER BY fecha_actualizacion DESC
  `;

  db.all(sql, [], (error, filas) => {

    if (error) {
      console.error('❌ Error al obtener tareas:', error.message);

      return res.status(500).json({
        mensaje: 'Error al obtener las tareas'
      });
    }

    const tareas = filas.map(tarea => ({
      id: tarea.id,
      texto: tarea.texto,
      completada: Boolean(tarea.completada),
      fecha_actualizacion: tarea.fecha_actualizacion
    }));

    res.json(tareas);
  });
});


router.get('/:id', (req, res) => {

  const id = Number(req.params.id);

  const sql = `
    SELECT
      id,
      texto,
      completada,
      fecha_actualizacion
    FROM tareas
    WHERE id = ?
  `;

  db.get(sql, [id], (error, tarea) => {

    if (error) {
      console.error('❌ Error:', error.message);

      return res.status(500).json({
        mensaje: 'Error al buscar la tarea'
      });
    }

    if (!tarea) {
      return res.status(404).json({
        mensaje: 'Tarea no encontrada'
      });
    }

    res.json({
      id: tarea.id,
      texto: tarea.texto,
      completada: Boolean(tarea.completada),
      fecha_actualizacion: tarea.fecha_actualizacion
    });
  });
});


router.post('/', (req, res) => {

  const {
    id,
    texto,
    completada
  } = req.body;

  if (!id || !texto) {
    return res.status(400).json({
      mensaje: 'El id y el texto son obligatorios'
    });
  }

  const tareaCompletada = completada ? 1 : 0;

  const sql = `
    INSERT INTO tareas
    (
      id,
      texto,
      completada,
      fecha_actualizacion
    )
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)

    ON CONFLICT(id)
    DO UPDATE SET
      texto = excluded.texto,
      completada = excluded.completada,
      fecha_actualizacion = CURRENT_TIMESTAMP
  `;

  db.run(
    sql,
    [
      id,
      texto,
      tareaCompletada
    ],
    function(error) {

      if (error) {

        console.error(
          '❌ Error al guardar tarea:',
          error.message
        );

        return res.status(500).json({
          mensaje: 'Error al guardar la tarea'
        });
      }

      res.status(200).json({
        mensaje: 'Tarea guardada correctamente',
        tarea: {
          id,
          texto,
          completada: Boolean(completada)
        }
      });
    }
  );
});



router.post('/sincronizar', (req, res) => {

  const tareas = req.body.tareas;

  if (!Array.isArray(tareas)) {
    return res.status(400).json({
      mensaje: 'Se esperaba un arreglo de tareas'
    });
  }

  if (tareas.length === 0) {
    return res.json({
      mensaje: 'No hay tareas para sincronizar',
      cantidad: 0
    });
  }

  db.serialize(() => {

    const sql = `
      INSERT INTO tareas
      (
        id,
        texto,
        completada,
        fecha_actualizacion
      )
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)

      ON CONFLICT(id)
      DO UPDATE SET
        texto = excluded.texto,
        completada = excluded.completada,
        fecha_actualizacion = CURRENT_TIMESTAMP
    `;

    const statement = db.prepare(sql);

    let errores = 0;

    tareas.forEach(tarea => {

      statement.run(
        [
          tarea.id,
          tarea.texto,
          tarea.completada ? 1 : 0
        ],
        (error) => {

          if (error) {
            errores++;

            console.error(
              `❌ Error con tarea ${tarea.id}:`,
              error.message
            );
          }
        }
      );
    });

    statement.finalize(() => {

      if (errores > 0) {

        return res.status(500).json({
          mensaje: 'Algunas tareas no pudieron sincronizarse',
          cantidad: tareas.length - errores
        });
      }

      res.json({
        mensaje: 'Tareas sincronizadas correctamente',
        cantidad: tareas.length
      });
    });
  });
});



router.put('/:id', (req, res) => {

  const id = Number(req.params.id);

  const {
    texto,
    completada
  } = req.body;

  const sql = `
    UPDATE tareas
    SET
      texto = ?,
      completada = ?,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(
    sql,
    [
      texto,
      completada ? 1 : 0,
      id
    ],
    function(error) {

      if (error) {

        console.error(
          '❌ Error al actualizar:',
          error.message
        );

        return res.status(500).json({
          mensaje: 'Error al actualizar la tarea'
        });
      }

      if (this.changes === 0) {

        return res.status(404).json({
          mensaje: 'Tarea no encontrada'
        });
      }

      res.json({
        mensaje: 'Tarea actualizada correctamente'
      });
    }
  );
});



router.delete('/:id', (req, res) => {

  const id = Number(req.params.id);

  const sql = `
    DELETE FROM tareas
    WHERE id = ?
  `;

  db.run(sql, [id], function(error) {

    if (error) {

      console.error(
        '❌ Error al eliminar:',
        error.message
      );

      return res.status(500).json({
        mensaje: 'Error al eliminar la tarea'
      });
    }

    if (this.changes === 0) {

      return res.status(404).json({
        mensaje: 'Tarea no encontrada'
      });
    }

    res.json({
      mensaje: 'Tarea eliminada correctamente'
    });
  });
});


module.exports = router;