// // // // test.js (ahora con Express)
// // // const qrcode = require('qrcode-terminal');
// // // const { Client, LocalAuth } = require('whatsapp-web.js');
// // // const express = require('express');
// // // const cors = require('cors');

// // // const app = express();
// // // const PORT = 3000;

// // // app.use(cors());
// // // app.use(express.json());

// // // app.get('/status', (req, res) => {
// // //   res.json({ status: 'Backend + WhatsApp corriendo' });
// // // });

// // // const client = new Client({
// // //   authStrategy: new LocalAuth(),
// // //   puppeteer: {
// // //     headless: true,
// // //     args: [
// // //       '--no-sandbox',
// // //       '--disable-setuid-sandbox',
// // //       '--disable-dev-shm-usage',
// // //       '--disable-gpu',
// // //       '--single-process',
// // //     ]
// // //   }
// // // });

// // // client.on('qr', qr => {
// // //   console.log('ESCANEÁ ESTE QR:');
// // //   qrcode.generate(qr, { small: true });
// // // });

// // // client.on('authenticated', () => console.log('Autenticado correctamente'));

// // // client.on('ready', () => {
// // //   console.log('WhatsApp conectado y listo');
// // // });

// // // client.on('disconnected', reason => console.log('Desconectado:', reason));

// // // client.initialize();

// // // app.listen(PORT, () => {
// // //   console.log(`Server corriendo en http://localhost:${PORT}`);
// // //   console.log(`Probá: http://localhost:${PORT}/status`);
// // // });



// // // server.js
// // require('dotenv').config();
// // const express = require('express');
// // const cors = require('cors');
// // const axios = require("axios");
// // const db = require("./firebase-admin");

// // // === ESTO INICIALIZA WHATSAPP (utils/whatsapp.js) ===
// // require('./utils/whatsapp'); 

// // const app = express();
// // const PORT = process.env.PORT || 3000;
// // const APP_ID = "ticket7-pro"; // ID consistente para que el front lo encuentre


// // app.use(cors());
// // app.use(express.json());


// // // --- NUEVA FUNCIÓN: SINCRONIZADOR DE IP ---
// // async function syncIP() {
// //   try {
// //     const response = await axios.get('https://ipv4.icanhazip.com/');
// //     const currentIP = response.data.trim();
// //     const serverUrl = `http://${currentIP}:${PORT}`;

// //     if (serverUrl){
// //       console.log("URL_IP:: ", serverUrl);
// //     }

// //     // Guardamos en la ruta que el Front de Vercel va a consultar
// //     // Usamos la estructura de rutas obligatoria para evitar errores de permisos
// //     await db.doc(`artifacts/${APP_ID}/public/settings`).set({
// //       url: serverUrl,
// //       lastUpdate: new Date().toISOString(),
// //       status: 'online'
// //     }, { merge: true });

// //     console.log(`[DNS Dinámico] IP Sincronizada: ${serverUrl}`);
// //   } catch (error) {
// //     console.error('Error sincronizando IP:', error.message);
// //   }
// // }





// // // Rutas
// // app.use('/api/turnos', require('./routes/turnos.routes'));
// // app.use('/api/comercio', require('./routes/comercios.routes')); // si lo tenés
// // // app.use('/api/auth', require('./routes/auth.routes'));

// // app.use('/api/vendedores', require('./routes/vendedores.routes'));

// // app.use('/api/admin', require('./routes/admin.routes'));

// // // app.get('/status', (req, res) => {
// // //   res.json({ status: 'Backend corriendo con WhatsApp conectado' });
// // // });
// // app.get('/status', (req, res) => {
// //   const whatsappStatus = require('./utils/whatsapp').getStatus();
// //   res.json({
// //     server: 'running',
// //     whatsapp: whatsappStatus,
// //     timestamp: new Date().toISOString(),
// //   });
// // });


// // app.listen(PORT, () => {


// //   console.log(`Server corriendo en puerto ${PORT}`);
  
// //   // Iniciar sincronización de IP
// //   syncIP(); 
// //   setInterval(syncIP, 300000); // Cada minuto
// // });


// // // Catch global para excepciones no manejadas (no mata el server)
// // process.on('uncaughtException', (err) => {
// //   console.error('Excepción no capturada:', err.message);
// //   console.error(err.stack);
// //   // NO process.exit() – el server sigue vivo
// // });

// // process.on('unhandledRejection', (reason) => {
// //   console.error('Promesa rechazada no manejada:', reason);
// // });




// // server.js

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');

// const http = require('http');                
// const { Server } = require('socket.io');     



// // Inicializamos la app
// const app = express();
// const PORT = process.env.PORT || 8080; // Railway usa 8080 por defecto



// // Creamos servidor HTTP para Express + Socket.io
// const server = http.createServer(app);

// // Configuramos Socket.io
// const io = new Server(server, {
//   cors: {
//     origin: "*",                      //! ← en producción poner dominio real (ej: http://localhost:5173)
//     methods: ["GET", "POST"]
//   }
// });









// // Middleware
// app.use(cors());
// app.use(express.json());

// // Logs básicos de peticiones
// app.use((req, res, next) => {
//   console.log(`[${new Date().toLocaleTimeString()}] 📡 ${req.method} ${req.url}`);
//   next();
// });

// // Rutas (Asegúrate de que estos archivos existan en tu repo)
// try {
//   app.use('/api/turnos', require('./routes/turnos.routes'));
//   app.use('/api/comercio', require('./routes/comercios.routes'));
//   app.use('/api/vendedores', require('./routes/vendedores.routes'));
//   app.use('/api/admin', require('./routes/admin.routes'));
// } catch (error) {
//   console.error('⚠️ Error cargando algunas rutas:', error.message);
// }

// // Endpoint de salud del servidor
// app.get('/status', (req, res) => {
//   res.json({
//     server: 'online',
//     platform: 'Ticket7',
//     mode: 'cloud',
//     timestamp: new Date().toISOString()
//   });
// });











// // Socket.io: conexión y manejo de eventos
// io.on('connection', (socket) => {
//   console.log(`[Socket] Nuevo cliente conectado: ${socket.id}`);

//   // Cliente se une a un comercio (dashboard o vista cliente)
//   socket.on('joinCommerce', (comercioId) => {
//     if (!comercioId) return;
//     socket.join(`commerce:${comercioId}`);
//     console.log(`[Socket] ${socket.id} se unió a commerce:${comercioId}`);

//     // Iniciar escucha si no está activa
//     require('./utils/turnosListener').startListening(comercioId);
//   });

//   socket.on('disconnect', () => {
//     console.log(`[Socket] Cliente desconectado: ${socket.id}`);
//     // Opcional: si querés detener cuando nadie esté conectado, tendrías que contar conexiones por room
//   });
// });

// // Exportamos io para usarlo en otros archivos (controladores)
// module.exports.io = io;















// // Iniciar el servidor
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
//   // console.log(`🔗 URL pública esperada: https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'tu-url-de-railway'}`);
// });

// // Captura de errores para evitar caídas
// process.on('uncaughtException', (err) => {
//   console.error('❌ Excepción no capturada:', err.message);
// });

// process.on('unhandledRejection', (reason) => {
//   console.error('❌ Promesa rechazada:', reason);
// });




//server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// Servidor HTTP para Express + Socket.io
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // ← CAMBIAR en producción: "https://tu-dominio.com" o ["http://localhost:5173"]
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Logs
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] 📡 ${req.method} ${req.url}`);
  next();
});

// Rutas
try {
  app.use('/api/turnos', require('./routes/turnos.routes'));
  app.use('/api/comercio', require('./routes/comercios.routes'));
  app.use('/api/vendedores', require('./routes/vendedores.routes'));
  app.use('/api/admin', require('./routes/admin.routes'));
} catch (error) {
  console.error('⚠️ Error cargando rutas:', error.message);
}

// Salud
app.get('/status', (req, res) => {
  res.json({ server: 'online', timestamp: new Date().toISOString() });
});

// Socket.io
io.on('connection', (socket) => {
  console.log(`[Socket] Cliente conectado: ${socket.id}`);

  socket.on('joinCommerce', (comercioId) => {
    if (!comercioId) return;
    socket.join(`commerce:${comercioId}`);
    console.log(`[Socket] ${socket.id} se unió a commerce:${comercioId}`);

    // Iniciar escucha solo si es necesario
    require('./utils/turnosListener').startListening(comercioId);
  });

  socket.on('leaveCommerce', (comercioId) => {
    if (!comercioId) return;
    socket.leave(`commerce:${comercioId}`);
    require('./utils/turnosListener').stopListening(comercioId);
    console.log(`[Socket] ${socket.id} dejó commerce:${comercioId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    console.log(`[Socket] Rooms al desconectar:`, socket.rooms);
  });
});

// Exportar io
module.exports.io = io;

// Iniciar servidor (USAR server.listen, NO app.listen)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

// Errores globales
process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada:', reason);
});