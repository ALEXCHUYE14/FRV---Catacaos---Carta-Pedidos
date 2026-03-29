// Netlify Function: /api/orders/stream
// Server-Sent Events para actualizaciones en tiempo real

const { getStore } = require('./utils/store');

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Last-Event-ID',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
};

exports.handler = async (event, context) => {
  const store = getStore();

  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  // Solo permitir GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  // Configurar SSE
  const responseStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Función para enviar mensajes SSE
      const sendMessage = (data) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error enviando mensaje SSE:', error);
        }
      };

      // Enviar mensaje inicial
      sendMessage({
        type: 'connected',
        message: 'Conectado al stream de pedidos FRV Catacaos',
        timestamp: new Date().toISOString()
      });

      // Enviar estadísticas iniciales
      const initialStats = store.getStats();
      sendMessage({
        type: 'stats',
        stats: initialStats,
        timestamp: new Date().toISOString()
      });

      // Suscribirse a cambios en el store
      const unsubscribe = store.addListener((eventType, data) => {
        if (eventType === 'new_order') {
          sendMessage({
            type: 'new_order',
            order: data,
            timestamp: new Date().toISOString()
          });
          
          // También enviar estadísticas actualizadas
          const stats = store.getStats();
          sendMessage({
            type: 'stats',
            stats: stats,
            timestamp: new Date().toISOString()
          });
        } else if (eventType === 'order_updated') {
          sendMessage({
            type: 'order_updated',
            order: data,
            timestamp: new Date().toISOString()
          });
          
          // También enviar estadísticas actualizadas
          const stats = store.getStats();
          sendMessage({
            type: 'stats',
            stats: stats,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Enviar ping cada 30 segundos para mantener conexión viva
      const pingInterval = setInterval(() => {
        try {
          sendMessage({
            type: 'ping',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 30000);

      // Limpiar al desconectar
      event.rawRequest.on('close', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch (error) {
          // Stream ya cerrado
        }
      });

      event.rawRequest.on('error', (error) => {
        console.error('Error en conexión SSE:', error);
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch (e) {
          // Stream ya cerrado
        }
      });
    }
  });

  return {
    statusCode: 200,
    headers,
    body: responseStream
  };
};
