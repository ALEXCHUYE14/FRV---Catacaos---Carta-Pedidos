// Configuración de Supabase
// Para usar Supabase:
// 1. Crea una cuenta en https://supabase.com
// 2. Crea un nuevo proyecto
// 3. Ve a Settings > API para obtener las credenciales
// 4. Agrega las variables de entorno en Netlify

const { createClient } = require('@supabase/supabase-js');

// Variables de entorno (configurar en Netlify)
// Credenciales de Supabase proporcionadas por el usuario
const supabaseUrl = process.env.SUPABASE_URL || 'https://vxtfzjqfqppikfikznvp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGZ6anFmcXBwaWtmaWt6bnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MzE0NDUsImV4cCI6MjA5MDQwNzQ0NX0.s0LXO-2XQjQLsaIMoZnWh1QSG7BNvmWJl71uJ4_eP2U';

// Crear cliente de Supabase
let supabase = null;

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Verificar si Supabase está configurado
function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseKey);
}

// Crear tabla de pedidos (ejecutar una vez)
async function createOrdersTable() {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // La tabla se crea desde el dashboard de Supabase
    // Este es solo un ejemplo de la estructura esperada
    console.log('📋 Tabla orders debe existir en Supabase con esta estructura:');
    console.log(`
      CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        mesa TEXT NOT NULL,
        items JSONB NOT NULL,
        note TEXT,
        payment_method TEXT,
        total DECIMAL(10,2) NOT NULL,
        anfitriona TEXT,
        anfitriona_phone TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    return true;
  } catch (error) {
    console.error('Error al verificar tabla:', error);
    return false;
  }
}

// Insertar pedido
async function insertOrder(orderData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('orders')
      .insert([{
        id: orderData.id,
        mesa: orderData.mesa,
        items: orderData.items,
        note: orderData.note,
        payment_method: orderData.paymentMethod,
        total: orderData.total,
        anfitriona: orderData.anfitriona,
        anfitriona_phone: orderData.anfitrionaPhone,
        status: orderData.status || 'pending',
        created_at: orderData.createdAt,
        updated_at: orderData.updatedAt
      }])
      .select();

    if (error) {
      console.error('Error al insertar pedido:', error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Error al insertar pedido:', error);
    return null;
  }
}

// Obtener pedidos
async function getOrders(filters = {}) {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    let query = client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener pedidos:', error);
      return [];
    }

    // Transformar datos al formato esperado
    return data.map(row => ({
      id: row.id,
      mesa: row.mesa,
      items: row.items,
      note: row.note,
      paymentMethod: row.payment_method,
      total: row.total,
      anfitriona: row.anfitriona,
      anfitrionaPhone: row.anfitriona_phone,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return [];
  }
}

// Actualizar estado de pedido
async function updateOrderStatus(orderId, status) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('Error al actualizar pedido:', error);
      return null;
    }

    if (data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      id: row.id,
      mesa: row.mesa,
      items: row.items,
      note: row.note,
      paymentMethod: row.payment_method,
      total: row.total,
      anfitriona: row.anfitriona,
      anfitrionaPhone: row.anfitriona_phone,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    return null;
  }
}

// Obtener estadísticas
async function getStats() {
  const client = getSupabaseClient();
  if (!client) return { pending: 0, preparing: 0, completed: 0, revenue: 0 };

  try {
    const { data, error } = await client
      .from('orders')
      .select('status, total');

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      return { pending: 0, preparing: 0, completed: 0, revenue: 0 };
    }

    const stats = {
      pending: data.filter(o => o.status === 'pending').length,
      preparing: data.filter(o => o.status === 'preparing').length,
      completed: data.filter(o => o.status === 'completed').length,
      revenue: data
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { pending: 0, preparing: 0, completed: 0, revenue: 0 };
  }
}

// Verificar conexión a Supabase
async function testConnection() {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase no configurado',
      source: 'memory'
    };
  }

  try {
    // Intentar obtener pedidos para verificar conexión
    const { data, error } = await client
      .from('orders')
      .select('id')
      .limit(1);

    if (error) {
      return {
        success: false,
        error: error.message,
        source: 'supabase'
      };
    }

    return {
      success: true,
      message: 'Conexión exitosa a Supabase',
      source: 'supabase',
      ordersCount: data ? data.length : 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      source: 'supabase'
    };
  }
}

module.exports = {
  getSupabaseClient,
  isSupabaseConfigured,
  createOrdersTable,
  insertOrder,
  getOrders,
  updateOrderStatus,
  getStats,
  testConnection
};
