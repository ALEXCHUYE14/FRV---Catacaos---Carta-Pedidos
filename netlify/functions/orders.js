// Netlify Function: /api/orders
// Almacena pedidos en Supabase (persistente) o en memoria (fallback)

const { getStore } = require('./utils/store');
const supabase = require('./utils/supabase');

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  const store = getStore();
  const useSupabase = supabase.isSupabaseConfigured();

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

      // Crear pedido con ID y timestamp
      const newOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let savedOrder;

      if (useSupabase) {
        // Guardar en Supabase
        savedOrder = await supabase.insertOrder(newOrder);
        if (!savedOrder) {
          console.error('Error al guardar en Supabase, usando fallback en memoria');
          savedOrder = store.addOrder(newOrder);
        }
      } else {
        // Guardar en memoria
        savedOrder = store.addOrder(newOrder);
      }

      console.log(`✅ Nuevo pedido recibido: ${savedOrder.id} - Mesa ${savedOrder.mesa}`);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(savedOrder)
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
    if (limit) filters.limit = parseInt(limit);

    let orders;
    let stats;

    if (useSupabase) {
      // Obtener de Supabase
      orders = await supabase.getOrders(filters);
      stats = await supabase.getStats();
    } else {
      // Obtener de memoria
      orders = store.getOrders(filters);
      stats = store.getStats();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orders,
        total: orders.length,
        stats,
        source: useSupabase ? 'supabase' : 'memory',
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

      let updatedOrder;

      if (useSupabase) {
        // Actualizar en Supabase
        updatedOrder = await supabase.updateOrderStatus(orderId, status);
        if (!updatedOrder) {
          console.error('Error al actualizar en Supabase, usando fallback en memoria');
          updatedOrder = store.updateOrderStatus(orderId, status);
        }
      } else {
        // Actualizar en memoria
        updatedOrder = store.updateOrderStatus(orderId, status);
      }
      
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
