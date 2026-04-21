// ═══════════════════════════════════════════════════════════════════════════════
// FIREBASE CLIENT - FRV Catacaos - Versión Simplificada y Robusta
// ═══════════════════════════════════════════════════════════════════════════════

console.log('📦 [Firebase] Iniciando...');

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

let firebaseDatabase = null;
let initialized = false;

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

async function initFirebase() {
  console.log('🔧 [Firebase] initFirebase() llamado...');
  
  if (initialized && firebaseDatabase) {
    console.log('✅ [Firebase] Ya inicializado, retornando db existente');
    return firebaseDatabase;
  }
  
  console.log('🔧 [Firebase] Verificando SDK...');
  
  if (typeof firebase === 'undefined') {
    console.error('❌ [Firebase] SDK no está cargado');
    throw new Error('Firebase SDK no cargado');
  }
  
  console.log('✅ [Firebase] SDK detectado');
  console.log('🔧 [Firebase] firebase:', typeof firebase);
  console.log('🔧 [Firebase] firebase.database:', typeof firebase.database);
  
  // Verificar que firebase.database exista
  if (typeof firebase.database !== 'function') {
    console.error('❌ [Firebase] firebase.database no disponible');
    throw new Error('firebase.database no disponible');
  }
  
  try {
    let app;
    try {
      app = firebase.getApp();
      console.log('📦 [Firebase] Usando app existente:', app ? app.name : 'sin nombre');
    } catch (e) {
      console.log('📦 [Firebase] Inicializando nueva app...');
      app = firebase.initializeApp(firebaseConfig);
      console.log('✅ [Firebase] App inicializada:', app.name);
    }
    
    console.log('🔧 [Firebase] Obteniendo database...');
    firebaseDatabase = firebase.database();
    console.log('✅ [Firebase] Database obtained:', !!firebaseDatabase);
    
    initialized = true;
    
    console.log('✅ [Firebase] Inicializado correctamente');
    return firebaseDatabase;
  } catch (error) {
    console.error('❌ [Firebase] Error de inicialización:', error.message);
    throw new Error('Error al inicializar Firebase: ' + error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPERACIONES DE PEDIDOS
// ═══════════════════════════════════════════════════════════════════════════════

async function getOrders() {
  console.log('📥 [Firebase] Obteniendo pedidos...');
  
  let db;
  try {
    db = await initFirebase();
  } catch (error) {
    console.error('❌ [Firebase] Error al inicializar:', error.message);
    throw error;
  }
  
  if (!db) {
    throw new Error('Firebase no inicializado');
  }
  
  try {
    const snapshot = await db.ref('orders').once('value');
    const data = snapshot.val() || {};
    
    const ordersList = Object.entries(data).map(([id, order]) => ({
      id: id,
      ...order
    }));
    
    console.log('📥 [Firebase] Pedidos obtenidos:', ordersList.length);
    return ordersList;
  } catch (error) {
    console.error('❌ [Firebase] Error al obtener pedidos:', error.message);
    throw error;
  }
}

async function createOrder(orderData) {
  console.log('📝 [Firebase] Creando pedido...');
  
  const db = await initFirebase();
  if (!db) return null;
  
  try {
    const newOrderRef = db.ref('orders').push();
    const order = {
      ...orderData,
      id: newOrderRef.key,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    await newOrderRef.set(order);
    console.log('✅ [Firebase] Pedido creado:', newOrderRef.key);
    return order;
  } catch (error) {
    console.error('❌ [Firebase] Error:', error.message);
    return null;
  }
}

async function updateOrderStatus(orderId, status) {
  console.log('📝 [Firebase] Actualizando pedido:', orderId, status);
  
  const db = await initFirebase();
  if (!db) return null;
  
  try {
    await db.ref(`orders/${orderId}`).update({
      status: status,
      updatedAt: new Date().toISOString()
    });
    
    const snapshot = await db.ref(`orders/${orderId}`).once('value');
    console.log('✅ [Firebase] Pedido actualizado');
    return snapshot.val();
  } catch (error) {
    console.error('❌ [Firebase] Error:', error.message);
    return null;
  }
}

async function getStats() {
  const db = await initFirebase();
  if (!db) return { pending: 0, preparing: 0, completed: 0 };
  
  try {
    const snapshot = await db.ref('orders').once('value');
    const data = snapshot.val() || {};
    
    const ordersList = Object.values(data);
    return {
      pending: ordersList.filter(o => o.status === 'pending').length,
      preparing: ordersList.filter(o => o.status === 'preparing').length,
      completed: ordersList.filter(o => o.status === 'completed' || o.status === 'ready').length
    };
  } catch (error) {
    return { pending: 0, preparing: 0, completed: 0 };
  }
}

function subscribeToOrders(callback) {
  console.log('📡 [Firebase] Suscribiendo a pedidos en tiempo real...');
  
  if (typeof firebase === 'undefined') {
    console.error('❌ [Firebase] SDK no está cargado');
    return () => {};
  }
  
  let db;
  try {
    db = firebase.database();
  } catch (e) {
    console.error('❌ [Firebase] Error al obtener database:', e);
    return () => {};
  }
  
  try {
    const ordersRef = db.ref('orders');
    
    const listener = ordersRef.on('value', (snapshot) => {
      const data = snapshot.val() || {};
      
      const ordersList = Object.entries(data).map(([id, order]) => ({
        id: id,
        ...order
      })).sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log('📡 [Firebase] Cambios detectados:', ordersList.length);
      callback({ orders: ordersList, source: 'firebase-realtime' });
    }, (error) => {
      console.error('❌ [Firebase] Error en listener:', error);
    });
    
    console.log('✅ [Firebase] Suscripción activa');
    
    return () => {
      console.log('📡 [Firebase] Cancelando suscripción...');
      ordersRef.off('value', listener);
    };
  } catch (error) {
    console.error('❌ [Firebase] Error en suscripción:', error.message);
    return () => {};
  }
}

function testConnection() {
  return new Promise(async (resolve) => {
    console.log('🔌 [Firebase] Probando conexión...');
    
    try {
      let db;
      try {
        db = await initFirebase();
      } catch (initError) {
        resolve({ success: false, error: initError.message, details: 'Firebase SDK o configuración incorrecta' });
        return;
      }
      
      if (!db) {
        resolve({ success: false, error: 'Firebase no inicializado', details: 'Verifica la configuración en Firebase Console' });
        return;
      }
      
      await db.ref('.info/connected').once('value');
      const orders = await getOrders();
      
      resolve({ 
        success: true, 
        message: 'Conectado a Firebase',
        ordersCount: orders.length,
        source: 'Firebase Realtime Database'
      });
    } catch (error) {
      resolve({ success: false, error: error.message, details: 'Verifica las reglas de Firebase y la conexión a internet' });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR A VARIABLES GLOBALES
// ═══════════════════════════════════════════════════════════════════════════════

window.getOrders = getOrders;
window.createOrder = createOrder;
window.updateOrderStatus = updateOrderStatus;
window.subscribeToOrders = subscribeToOrders;
window.testConnection = testConnection;

window.FirebaseClient = {
  init: initFirebase,
  getOrders,
  createOrder,
  updateOrderStatus,
  getStats,
  subscribeToOrders,
  testConnection
};

console.log('✅ [Firebase] Cliente listo');
console.log('📋 Funciones:', {
  getOrders: typeof getOrders,
  createOrder: typeof createOrder,
  subscribeToOrders: typeof subscribeToOrders
});