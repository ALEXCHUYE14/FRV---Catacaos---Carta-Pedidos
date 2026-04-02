// ═══════════════════════════════════════════════════════════════════════════════
// FIREBASE CLIENT - Conexión en tiempo real para FRV Catacaos
// Reemplaza Netlify Functions y Supabase
// ═══════════════════════════════════════════════════════════════════════════════

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7AniUOlaEngq9rFJBNudZVdAzxMqxOOg",
  authDomain: "frv-catacaos.firebaseapp.com",
  projectId: "frv-catacaos",
  storageBucket: "frv-catacaos.firebasestorage.app",
  messagingSenderId: "337954350829",
  appId: "1:337954350829:web:332af101a283426e3a0ee4",
  databaseURL: "https://frv-catacaos-default-rtdb.firebaseio.com"
};

// Variables globales
let firebaseApp = null;
let firebaseDatabase = null;
let ordersRef = null;
let ordersListener = null;

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

function initFirebase() {
  console.log('🔧 [FirebaseClient] Iniciando inicialización...');
  
  if (firebaseApp) {
    console.log('✅ [FirebaseClient] Firebase ya inicializado, retornando instancia existente');
    return firebaseDatabase;
  }
  
  // Verificar que Firebase esté cargado
  if (typeof firebase === 'undefined') {
    console.error('❌ [FirebaseClient] Firebase no está cargado');
    console.error('💡 [FirebaseClient] Solución: Verifica que los scripts de Firebase estén en el HTML:');
    console.error('   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>');
    console.error('   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>');
    return null;
  }
  
  try {
    // Verificar que la configuración sea válida
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('Dummy')) {
      console.error('❌ [FirebaseClient] Configuración de Firebase inválida');
      console.error('💡 [FirebaseClient] Solución: Actualiza firebaseConfig con credenciales reales');
      console.error('   1. Ve a https://console.firebase.google.com/');
      console.error('   2. Crea un proyecto o selecciona uno existente');
      console.error('   3. Ve a Configuración del proyecto → Tus apps → Web');
      console.error('   4. Copia la configuración y pégala en firebase-client.js');
      return null;
    }
    
    console.log('📦 [FirebaseClient] Inicializando Firebase con configuración:');
    console.log('   Proyecto:', firebaseConfig.projectId);
    console.log('   Database URL:', firebaseConfig.databaseURL);
    
    // Inicializar Firebase
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseDatabase = firebase.database();
    
    console.log('✅ [FirebaseClient] Firebase inicializado correctamente');
    console.log('📊 [FirebaseClient] Proyecto:', firebaseConfig.projectId);
    console.log('🔗 [FirebaseClient] Database URL:', firebaseConfig.databaseURL);
    return firebaseDatabase;
  } catch (error) {
    console.error('❌ [FirebaseClient] Error al inicializar Firebase:', error);
    console.error('💡 [FirebaseClient] Código de error:', error.code);
    console.error('💡 [FirebaseClient] Mensaje:', error.message);
    
    if (error.code === 'app/duplicate-app') {
      console.log('💡 [FirebaseClient] Firebase ya fue inicializado. Obteniendo instancia existente...');
      firebaseApp = firebase.app();
      firebaseDatabase = firebase.database();
      return firebaseDatabase;
    }
    
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPERACIONES DE PEDIDOS
// ═══════════════════════════════════════════════════════════════════════════════

// Obtener todos los pedidos
async function getOrders(filters = {}) {
  console.log('📥 [FirebaseClient] Obteniendo pedidos...');
  
  const db = initFirebase();
  if (!db) {
    console.error('❌ [FirebaseClient] Firebase no inicializado');
    return [];
  }

  try {
    const snapshot = await db.ref('orders').once('value');
    const ordersData = snapshot.val() || {};
    
    // Convertir objeto a array
    let orders = Object.keys(ordersData).map(key => ({
      id: key,
      ...ordersData[key]
    }));
    
    // Ordenar por fecha de creación (más reciente primero)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Aplicar filtros
    if (filters.status) {
      orders = orders.filter(o => o.status === filters.status);
    }
    
    if (filters.limit) {
      orders = orders.slice(0, filters.limit);
    }
    
    console.log(`✅ [FirebaseClient] ${orders.length} pedidos obtenidos`);
    return orders;
  } catch (error) {
    console.error('❌ [FirebaseClient] Error al obtener pedidos:', error);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.error('💡 [FirebaseClient] Las reglas de seguridad no permiten lectura');
      console.error('💡 [FirebaseClient] Solución: Ve a Firebase Console → Realtime Database → Reglas');
      console.error('   Configura: { "rules": { "orders": { ".read": true, ".write": true } } }');
    }
    
    return [];
  }
}

// Crear nuevo pedido
async function createOrder(orderData) {
  console.log('📤 [FirebaseClient] Creando nuevo pedido...');
  
  const db = initFirebase();
  if (!db) {
    console.error('❌ [FirebaseClient] Firebase no inicializado');
    return null;
  }

  try {
    const newOrder = {
      mesa: orderData.mesa,
      items: orderData.items,
      note: orderData.note || null,
      paymentMethod: orderData.paymentMethod || null,
      total: orderData.total,
      anfitriona: orderData.anfitriona || null,
      anfitrionaPhone: orderData.anfitrionaPhone || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Generar ID único
    const newOrderRef = db.ref('orders').push();
    await newOrderRef.set(newOrder);
    
    const savedOrder = {
      id: newOrderRef.key,
      ...newOrder
    };
    
    console.log('✅ [FirebaseClient] Pedido creado:', savedOrder.id);
    return savedOrder;
  } catch (error) {
    console.error('❌ [FirebaseClient] Error al crear pedido:', error);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.error('💡 [FirebaseClient] Las reglas de seguridad no permiten escritura');
      console.error('💡 [FirebaseClient] Solución: Ve a Firebase Console → Realtime Database → Reglas');
      console.error('   Configura: { "rules": { "orders": { ".read": true, ".write": true } } }');
    }
    
    return null;
  }
}

// Actualizar estado de pedido
async function updateOrderStatus(orderId, status) {
  console.log(`🔄 [FirebaseClient] Actualizando pedido ${orderId} a estado: ${status}`);
  
  const db = initFirebase();
  if (!db) {
    console.error('❌ [FirebaseClient] Firebase no inicializado');
    return null;
  }

  try {
    const updates = {
      status: status,
      updatedAt: new Date().toISOString()
    };
    
    await db.ref(`orders/${orderId}`).update(updates);
    
    // Obtener pedido actualizado
    const snapshot = await db.ref(`orders/${orderId}`).once('value');
    const updatedOrder = {
      id: orderId,
      ...snapshot.val()
    };
    
    console.log('✅ [FirebaseClient] Pedido actualizado:', orderId, '→', status);
    return updatedOrder;
  } catch (error) {
    console.error('❌ [FirebaseClient] Error al actualizar pedido:', error);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.error('💡 [FirebaseClient] Las reglas de seguridad no permiten escritura');
      console.error('💡 [FirebaseClient] Solución: Ve a Firebase Console → Realtime Database → Reglas');
      console.error('   Configura: { "rules": { "orders": { ".read": true, ".write": true } } }');
    }
    
    return null;
  }
}

// Obtener estadísticas
async function getStats() {
  console.log('📊 [FirebaseClient] Obteniendo estadísticas...');
  
  const db = initFirebase();
  if (!db) {
    console.error('❌ [FirebaseClient] Firebase no inicializado');
    return { pending: 0, preparing: 0, completed: 0, revenue: 0 };
  }

  try {
    const snapshot = await db.ref('orders').once('value');
    const ordersData = snapshot.val() || {};
    
    const orders = Object.values(ordersData);
    
    const stats = {
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      revenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
    };
    
    console.log('✅ [FirebaseClient] Estadísticas obtenidas:', stats);
    return stats;
  } catch (error) {
    console.error('❌ [FirebaseClient] Error al obtener estadísticas:', error);
    return { pending: 0, preparing: 0, completed: 0, revenue: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIEMPO REAL - Suscripciones
// ═══════════════════════════════════════════════════════════════════════════════

// Suscribirse a cambios en tiempo real
function subscribeToOrders(callback) {
  console.log('🔌 [FirebaseClient] Suscribiéndose a cambios en tiempo real...');
  
  const db = initFirebase();
  if (!db) {
    console.error('❌ [FirebaseClient] Firebase no inicializado');
    return null;
  }

  // Cancelar suscripción anterior si existe
  if (ordersListener) {
    console.log('🔄 [FirebaseClient] Cancelando suscripción anterior...');
    ordersRef.off('value', ordersListener);
  }

  ordersRef = db.ref('orders');
  
  // Escuchar cambios en tiempo real
  ordersListener = ordersRef.on('value', (snapshot) => {
    console.log('📡 [FirebaseClient] Cambio detectado en tiempo real');
    
    const ordersData = snapshot.val() || {};
    
    // Convertir objeto a array
    const orders = Object.keys(ordersData).map(key => ({
      id: key,
      ...ordersData[key]
    }));
    
    // Ordenar por fecha de creación (más reciente primero)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`📡 [FirebaseClient] ${orders.length} pedidos actualizados`);
    
    // Llamar al callback con los pedidos actualizados
    callback({
      eventType: 'update',
      orders: orders,
      timestamp: new Date().toISOString()
    });
  }, (error) => {
    console.error('❌ [FirebaseClient] Error en suscripción en tiempo real:', error);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.error('💡 [FirebaseClient] Las reglas de seguridad no permiten lectura');
      console.error('💡 [FirebaseClient] Solución: Ve a Firebase Console → Realtime Database → Reglas');
      console.error('   Configura: { "rules": { "orders": { ".read": true, ".write": true } } }');
    }
  });

  console.log('✅ [FirebaseClient] Suscrito a cambios en tiempo real');
  return ordersListener;
}

// Cancelar suscripción
function unsubscribeFromOrders() {
  if (ordersListener && ordersRef) {
    ordersRef.off('value', ordersListener);
    ordersListener = null;
    console.log('🔌 [FirebaseClient] Suscripción cancelada');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICACIÓN DE CONEXIÓN
// ═══════════════════════════════════════════════════════════════════════════════

async function testConnection() {
  console.log('🔌 [FirebaseClient] Iniciando prueba de conexión...');
  
  const db = initFirebase();
  if (!db) {
    console.error('❌ [FirebaseClient] Firebase no inicializado');
    return {
      success: false,
      error: 'Firebase no inicializado. Verifica la configuración.',
      source: 'none',
      details: 'El cliente Firebase no se pudo inicializar. Revisa la consola para más detalles.'
    };
  }

  try {
    console.log('📡 [FirebaseClient] Intentando conectar a Firebase Realtime Database...');
    
    // Intentar leer un pedido para verificar conexión
    const snapshot = await db.ref('orders').limitToLast(1).once('value');
    const ordersCount = snapshot.numChildren();
    
    console.log('✅ [FirebaseClient] Conexión exitosa a Firebase');
    console.log('📊 [FirebaseClient] Pedidos encontrados:', ordersCount);
    
    return {
      success: true,
      message: 'Conexión exitosa a Firebase',
      source: 'firebase',
      ordersCount: ordersCount,
      details: `Base de datos accesible. ${ordersCount} pedidos encontrados.`
    };
  } catch (error) {
    console.error('❌ [FirebaseClient] Error de conexión a Firebase:', error);
    console.error('💡 [FirebaseClient] Código de error:', error.code);
    console.error('💡 [FirebaseClient] Mensaje:', error.message);
    
    let errorMessage = error.message;
    let details = '';
    
    if (error.code === 'PERMISSION_DENIED') {
      errorMessage = 'Permiso denegado';
      details = 'Las reglas de seguridad de Firebase no permiten acceso. Ve a Firebase Console → Realtime Database → Reglas y configura permisos de lectura/escritura.';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Error de red';
      details = 'No se pudo conectar a Firebase. Verifica tu conexión a internet.';
    } else if (error.code === 'UNAVAILABLE') {
      errorMessage = 'Servicio no disponible';
      details = 'Firebase Realtime Database no está disponible. Intenta de nuevo en unos minutos.';
    }
    
    return {
      success: false,
      error: errorMessage,
      source: 'firebase',
      details: details
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR FUNCIONES
// ═══════════════════════════════════════════════════════════════════════════════

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  // Exponer directamente en window también
  window.getOrders = getOrders;
  window.createOrder = createOrder;
  window.updateOrderStatus = updateOrderStatus;
  window.subscribeToOrders = subscribeToOrders;
  window.unsubscribeFromOrders = unsubscribeFromOrders;
  window.testConnection = testConnection;
  
  // Exponer a través del objeto FirebaseClient
  window.FirebaseClient = {
    init: initFirebase,
    getOrders,
    createOrder,
    updateOrderStatus,
    getStats,
    subscribeToOrders,
    unsubscribeFromOrders,
    testConnection
  };
  
  console.log('✅ [FirebaseClient] Cliente Firebase cargado y disponible globalmente');
  console.log('📦 Funciones disponibles directamente:', typeof getOrders, typeof subscribeToOrders);
}
