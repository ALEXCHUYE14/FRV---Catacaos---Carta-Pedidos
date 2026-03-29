// Netlify Function: /api/orders
// Almacena pedidos y permite consultarlos

const { getStore } = require('./utils/store');

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  const store = getStore();

  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST - Crear nuevo pedido
  if (event.httpMethod === 'POST') {
    try {
      const orderData = JSON.parse(event.body);
      
      // Validar datos requeridos
      if (!orderData.mesa || !orderData.items || orderData.items.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Datos de pedido incompletos' })
        };
      }

      // Crear pedido
      const newOrder = store.addOrder(orderData);

      console.log(`✅ Nuevo pedido recibido: ${newOrder.id} - Mesa ${newOrder.mesa}`);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newOrder)
      };
    } catch (error) {
      console.error('Error al procesar pedido:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al procesar pedido' })
      };
    }
  }

  // GET - Obtener pedidos
  if (event.httpMethod === 'GET') {
    const { status, limit } = event.queryStringParameters || {};
    
    const filters = {};
    if (status) filters.status = status;
    if (limit) filters.limit = limit;

    const orders = store.getOrders(filters);
    const stats = store.getStats();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orders,
        total: orders.length,
        stats,
        timestamp: new Date().toISOString()
      })
    };
  }

  // PUT - Actualizar estado de pedido
  if (event.httpMethod === 'PUT') {
    try {
      const { orderId, status } = JSON.parse(event.body);
      
      if (!orderId || !status) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Se requiere orderId y status' })
        };
      }

      const updatedOrder = store.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Pedido no encontrado' })
        };
      }

      console.log(`📝 Pedido ${orderId} actualizado a: ${status}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedOrder)
      };
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al actualizar pedido' })
      };
    }
  }

  // Método no permitido
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Método no permitido' })
  };
};
