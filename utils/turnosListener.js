// //utils/turnosListener.js

// const db = require('../firebase-admin');
// const { io } = require('../server'); // ← importamos io desde server.js

// const activeListeners = new Map(); // comercioId → unsubscribe function

// function startListening(comercioId) {
//   if (activeListeners.has(comercioId)) {
//     console.log(`[Listener] Ya escuchando commerce:${comercioId}`);
//     return;
//   }

//   console.log(`[Listener] Iniciando escucha para commerce:${comercioId}`);

//   const q = db.collection(`comercios/${comercioId}/turnos`);
//   const unsubscribe = q.onSnapshot((snapshot) => {
//     const turnos = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));

//     // Enviar a todos los clientes conectados a ese commerceId
//     io.to(`commerce:${comercioId}`).emit('turnosUpdated', turnos);
//     console.log(`[Listener] Enviado actualización a commerce:${comercioId} - ${turnos.length} turnos`);
//   }, (error) => {
//     console.error(`[Listener] Error en onSnapshot para ${comercioId}:`, error);
//   });

//   activeListeners.set(comercioId, unsubscribe);
// }

// function stopListening(comercioId) {
//   const unsubscribe = activeListeners.get(comercioId);
//   if (unsubscribe) {
//     unsubscribe();
//     activeListeners.delete(comercioId);
//     console.log(`[Listener] Detenida escucha para commerce:${comercioId}`);
//   }
// }

// module.exports = { startListening, stopListening };



//utils/turnosListener.js
const db = require('../firebase-admin');
const { io } = require('../server');

const activeListeners = new Map(); // comercioId → { unsubscribe, clientCount }

function startListening(comercioId) {
  if (activeListeners.has(comercioId)) {
    // Solo incrementamos contador de clientes
    const listener = activeListeners.get(comercioId);
    listener.clientCount += 1;
    console.log(`[Listener] Cliente adicional en ${comercioId} (total: ${listener.clientCount})`);
    return;
  }

  console.log(`[Listener] Iniciando escucha para ${comercioId}`);

  const q = db.collection(`comercios/${comercioId}/turnos`);
//   const q = db
//     .collection(`comercios/${comercioId}/turnos`)
//     .where("estado", "in", ["espera", "en_atencion"])
//     .orderBy("posicion");

  const unsubscribe = q.onSnapshot((snapshot) => {
    const turnos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    io.to(`commerce:${comercioId}`).emit('turnosUpdated', turnos);
    console.log(`[Listener] Actualización enviada a commerce:${comercioId} (${turnos.length} turnos)`);
  }, (error) => {
    console.error(`[Listener] Error en onSnapshot para ${comercioId}:`, error);
  });

  activeListeners.set(comercioId, { unsubscribe, clientCount: 1 });
}

function stopListening(comercioId) {
  if (!activeListeners.has(comercioId)) return;

  const listener = activeListeners.get(comercioId);
  listener.clientCount -= 1;

  if (listener.clientCount <= 0) {
    listener.unsubscribe();
    activeListeners.delete(comercioId);
    console.log(`[Listener] Detenida escucha para ${comercioId} (sin clientes)`);
  } else {
    console.log(`[Listener] Cliente salió de ${comercioId} (quedan ${listener.clientCount})`);
  }
}

module.exports = { startListening, stopListening };