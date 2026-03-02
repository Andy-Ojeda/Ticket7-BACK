
// controllers/turnos.controller.js
const admin = require('firebase-admin');
const db = require('../firebase-admin');

const { io } = require('../server');




exports.getTurnos = async (req, res) => {
  const { comercio } = req.query;
  if (!comercio) return res.status(400).json({ error: 'comercio requerido' });

  try {
    const snapshot = await db.collection(`comercios/${comercio}/turnos`)
      .orderBy('posicion')
      .get();

    const turnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(turnos);
  } catch (error) {
    console.error('Error getTurnos:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};




exports.agregarTurno = async (req, res) => {
  const { comercioId, nombre, telefono, especial } = req.body;

  if (!comercioId || !nombre || !telefono) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  try {
    // Obtener turnos actuales (con ID incluido)
    const turnosSnap = await db.collection(`comercios/${comercioId}/turnos`)
      .orderBy('posicion')
      .get();

    const turnos = turnosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const posiciones = turnos.filter(t => !t.sobreturno).map(t => t.posicion);
    const nuevaPosicion = posiciones.length ? Math.max(...posiciones) + 1 : 1;

    // Agregar el nuevo turno
    const nuevoRef = db.collection(`comercios/${comercioId}/turnos`).doc();
    await nuevoRef.set({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      posicion: nuevaPosicion,
      especial: !!especial,
      sobreturno: false,
      // ocupado: false,
      // cancelado: false,
      estado: "espera",
      atendidoEn: null,
      finalizadoEn: null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Regenerar sobreturnos
    const batch = db.batch();

    // Borrar sobreturnos libres (ahora con ID)
    const sobreturnosLibres = turnos.filter(t => t.sobreturno && !t.ocupado);
    sobreturnosLibres.forEach(t => {
      if (t.id) {
        batch.delete(db.collection(`comercios/${comercioId}/turnos`).doc(t.id));
      }
    });

    // Crear nuevos sobreturnos
    const clientes = turnos.filter(t => !t.sobreturno).sort((a, b) => a.posicion - b.posicion);
    for (let i = 0; i < clientes.length - 1; i++) {
      const pos = clientes[i].posicion + 0.5;
      const yaExiste = turnos.some(t => t.sobreturno && Math.abs(t.posicion - pos) < 0.01);
      if (!yaExiste) {
        const nuevoSobRef = db.collection(`comercios/${comercioId}/turnos`).doc();
        batch.set(nuevoSobRef, {
          nombre: `SOBRETURNO ${pos}`,
          telefono: "",
          posicion: pos,
          especial: false,
          sobreturno: true,
          // ocupado: false,
          // cancelado: false,
          estado: "espera",
          atendidoEn: null,
          finalizadoEn: null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();

    // Devolver nombre del comercio
    const comercioDoc = await db.collection('comercios').doc(comercioId).get();
    const nombreComercio = comercioDoc.exists ? comercioDoc.data().nombreComercio : null;

    res.json({ 
      success: true, 
      posicion: nuevaPosicion,
      nombreComercio 
    });
  } catch (error) {
    console.error("Error en POST /turnos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};





// exports.avanzarTurno = async (req, res) => {
//   const { comercioId } = req.body;

//   if (!comercioId) {
//     return res.status(400).json({ error: "comercioId requerido" });
//   }

//   try {
//     const turnosRef = db.collection(`comercios/${comercioId}/turnos`);

//     // 🔎 1️⃣ Buscar turno en atención (si existe)
//     const enAtencionSnap = await turnosRef
//       .where('estado', '==', 'en_atencion')
//       .limit(1)
//       .get();

//     // 🔎 2️⃣ Buscar siguiente en espera (ordenado por posición)
//     const siguienteSnap = await turnosRef
//       .where('estado', '==', 'espera')
//       .where('sobreturno', '==', false)
//       .orderBy('posicion')
//       .limit(1)
//       .get();

//     if (siguienteSnap.empty && enAtencionSnap.empty) {
//       return res.status(400).json({ error: "No hay turnos en espera" });
//     }

//     const batch = db.batch();

//     // ✅ Finalizar el que estaba en atención
//     if (!enAtencionSnap.empty) {
//       const actualDoc = enAtencionSnap.docs[0];
//       batch.update(actualDoc.ref, {
//         estado: "finalizado",
//         finalizadoEn: admin.firestore.FieldValue.serverTimestamp(),
//       });
//     }

//     // ✅ Pasar el siguiente a en_atencion
//     if (!siguienteSnap.empty) {
//       const siguienteDoc = siguienteSnap.docs[0];
//       batch.update(siguienteDoc.ref, {
//         estado: "en_atencion",
//         atendidoEn: admin.firestore.FieldValue.serverTimestamp(),
//       });
//     }

//     // await batch.commit();

//     // res.json({ success: true });

//     await batch.commit();

//     // 🔁 Volver a traer todos los turnos actualizados
//     const updatedSnap = await turnosRef
//       .orderBy('posicion')
//       .get();

//     const updatedTurnos = updatedSnap.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));

//     // 📡 Emitir a todos los sockets del comercio
//     // req.io.to(comercioId).emit('turnosUpdated', updatedTurnos);
    
//     // io.to(`commerce:${comercioId}`).emit('turnosUpdated', updatedTurnos);

//     res.json({ success: true });
exports.avanzarTurno = async (req, res) => {
  const { comercioId } = req.body;

  if (!comercioId) {
    return res.status(400).json({ error: "comercioId requerido" });
  }

  try {
    const turnosRef = db.collection(`comercios/${comercioId}/turnos`);

    // 1️⃣ Buscar turno actualmente en atención
    const enAtencionSnap = await turnosRef
      .where("estado", "==", "en_atencion")
      .limit(1)
      .get();

    // 2️⃣ Buscar siguiente turno en espera (ordenado por creación)
    const siguienteSnap = await turnosRef
      .where("estado", "==", "espera")
      .where("sobreturno", "==", false)
      .orderBy("timestamp") // ⚠️ IMPORTANTE: usar campo estable
      .limit(1)
      .get();

    if (siguienteSnap.empty && enAtencionSnap.empty) {
      return res.status(400).json({ error: "No hay turnos en espera" });
    }

    const batch = db.batch();

    // 3️⃣ Finalizar el actual si existe
    if (!enAtencionSnap.empty) {
      const actualDoc = enAtencionSnap.docs[0];
      // batch.update(actualDoc.ref, {
      //   estado: "finalizado",
      //   finalizadoEn: admin.firestore.FieldValue.serverTimestamp(),
      // });



      if (!enAtencionSnap.empty) {
        const actualDoc = enAtencionSnap.docs[0];
        const data = actualDoc.data();

        const historialRef = db
          .collection(`comercios/${comercioId}/historialTurnos`)
          .doc(actualDoc.id);

        batch.set(historialRef, {
          ...data,
          estado: "finalizado",
          finalizadoEn: admin.firestore.FieldValue.serverTimestamp(),
        });

        batch.delete(actualDoc.ref);
      }







    }

    // 4️⃣ Pasar siguiente a en_atencion
    if (!siguienteSnap.empty) {
      const siguienteDoc = siguienteSnap.docs[0];
      batch.update(siguienteDoc.ref, {
        estado: "en_atencion",
        atendidoEn: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    // 5️⃣ 🔁 Recalcular posiciones reales
    const activosSnap = await turnosRef
      .where("estado", "in", ["espera", "en_atencion"])
      .orderBy("timestamp")
      .get();

    const reorderBatch = db.batch();
    let nuevaPosicion = 1;

    activosSnap.docs.forEach(doc => {
      reorderBatch.update(doc.ref, {
        posicion: nuevaPosicion,
      });
      nuevaPosicion++;
    });

    await reorderBatch.commit();

    return res.json({ success: true });

  } catch (error) {
    console.error("Error avanzando turno:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};


exports.getHistorialTurnos = async (req, res) => {
  const { comercio } = req.query;

  if (!comercio) {
    return res.status(400).json({ error: "comercio requerido" });
  }

  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicioDelDia = admin.firestore.Timestamp.fromDate(hoy);

    const snap = await db
      .collection(`comercios/${comercio}/historialTurnos`)
      .where("finalizadoEn", ">=", inicioDelDia)
      .orderBy("finalizadoEn", "desc")
      .get();

    const turnos = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json({
      turnos,
      cantidadHoy: snap.size
    });

  } catch (error) {
    console.error("Error historial:", error);
    return res.status(500).json({ error: "Error interno" });
  }
};








// ... resto de funciones (avanzarTurno, cancelarTurno, ocuparSobreturno, limpiarTurnos) ...