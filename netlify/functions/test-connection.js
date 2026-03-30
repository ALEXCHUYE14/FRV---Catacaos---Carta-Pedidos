// Netlify Function: /api/test-connection
// Prueba la conexión a Supabase y devuelve el estado

const supabase = require('./utils/supabase');
const { getStore } = require('./utils/store');

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const store = getStore();
    const useSupabase = supabase.isSupabaseConfigured();
    
    let connectionResult;
    let ordersCount = 0;
    let stats = { pending: 0, preparing: 0, completed: 0, revenue: 0 };
    
    if (useSupabase) {
      // Probar conexión a Supabase
      connectionResult = await supabase.testConnection();
      
      if (connectionResult.success) {
        // Obtener pedidos y estadísticas
        const orders = await supabase.getOrders({ limit: 100 });
        ordersCount = orders.length;
        stats = await supabase.getStats();
      }
    } else {
      // Modo memoria
      const orders = store.getOrders();
      ordersCount = orders.length;
      stats = store.getStats();
      
      connectionResult = {
        success: true,
        message: 'Usando almacenamiento en memoria',
        source: 'memory'
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...connectionResult,
        ordersCount,
        stats,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error al probar conexión:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        source: 'unknown'
      })
    };
  }
};
