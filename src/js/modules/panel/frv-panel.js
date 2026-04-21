/* ═══════════════════════════════════════════════════════════════════════════════
   FRV PANEL BAR — SISTEMA DE GESTIÓN COMPLETO
   Versión: 2.0 Pro
   ═══════════════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN INICIAL
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Firebase
  firebaseConfig: {
    apiKey: "AIzaSyC7AniUOlaEngq9rFJBNudZVdAzxMqxOOg",
    authDomain: "frv-catacaos.firebaseapp.com",
    projectId: "frv-catacaos",
    storageBucket: "frv-catacaos.firebasestorage.app",
    messagingSenderId: "337954350829",
    appId: "1:337954350829:web:332af101a283426e3a0ee4",
    databaseURL: "https://frv-catacaos-default-rtdb.firebaseio.com"
  },
  
  // Credenciales deadmin (en producción usar backend)
  adminCredentials: {
    username: 'admin',
    // Hash simple para demo (en producción usar bcrypt en backend)
    passwordHash: 'frv2026'
  },
  
  // Configuración del local
  local: {
    name: 'FRV Catacaos',
    address: 'Fundo Rio Verde, Catacaos',
    phone: '+51 924 996 961',
    timezone: 'America/Lima'
  },
  
  // Estados de pedido
  STATUS: {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  // Roles de personal
  ROLES: {
    BARTENDER: 'bartender',
    MESERO: 'mesero',
    ANFITRIONA: 'anfitriona',
    SUPERVISOR: 'supervisor'
  },
  
  // Categorías
  CATEGORIES: {
    CERVEZAS: 'cervezas',
    TRAGOS: 'tragos',
    SHOTS: 'shots',
    SIN_ALCOHOL: 'sin-alcohol'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VARIABLES GLOBALES
// ═══════════════════════════════════════════════════════════════════════════════

let firebaseApp = null;
let firebaseDb = null;
let currentUser = null;
let soundEnabled = true;
let currentView = 'orders';
let orderFilter = 'all';
let inventoryFilter = 'all';
let searchQuery = '';
let audioContext = null;
let notificationSound = null;
let broadcastChannel = null;

// Datos en memoria
let orders = [];
let inventory = [];
let staff = [];
let tables = [];
let salesReport = {};

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🍹 FRV Panel Bar — Inicializando...');
  
  // Cargar preferencias de sonido
  const soundPref = localStorage.getItem('frv_sound_enabled');
  if (soundPref !== null) {
    soundEnabled = soundPref === 'true';
  }
  
  // Inicializar audio
  initAudio();
  
  // 1. Verificar autenticación PRIMERO (antes de Firebase)
  const isAuthenticated = await checkAuth();
  
  if (!isAuthenticated) {
    // No está autenticado - redirigir a login
    console.log('🔒 Redirigiendo a login...');
    window.location.href = 'login.html';
    return; // No continuar
  }
  
  // 2. Inicializar datos
  await initializeData();
  
  // 3. Conectar a Firebase
  await connectFirebase();
  
  // 4. Inicializar UI básica (reloj y eventos)
  initClock();
  initEventListeners();
  initBroadcast();
  
  // 5. Mostrar dashboard
  const dashboard = document.getElementById('dashboard');
  dashboard.style.display = 'flex';
  
  // Ocultar pantalla de carga
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }

  renderCurrentView();
  // Refresh más frecuente para detectar pedidos nuevos
  setInterval(refreshData, 15000);
  setInterval(checkNewOrders, 3000);
  // Polling adicional como backup para Firebase
  setInterval(pollOrdersFromFirebase, 10000);
  console.log('✅ Panel iniciado - Sesión activa');
  
  console.log('✅ Inicialización completa');
});

// ═══════════════════════════════════════════════════════════════════════════════
// ACTUALIZAR PEDIDOS DESDE FIREBASE (Tiempo Real)
// ═══════════════════════════════════════════════════════════════════════════════

function updateOrdersFromFirebase(newOrders) {
  console.log('📡 Actualizando pedidos desde Firebase:', newOrders.length);
  
  // Verificar si hay nuevos pedidos
  const oldCount = orders.length;
  orders = newOrders;
  
  // Renderizar pedidos
  if (typeof renderOrders === 'function') {
    renderOrders();
  }
  
  // Actualizar estadísticas
  if (typeof updateStats === 'function') {
    updateStats();
  }
  
  // Actualizar estado de mesas
  if (typeof updateTablesStatus === 'function') {
    updateTablesStatus();
  }
  
  // Notificar si hay nuevos pedidos
  if (newOrders.length > oldCount) {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length > 0 && soundEnabled) {
      playNotificationSound('new-order');
      showNotification('🔔 Nuevo pedido - Mesa ' + pendingOrders[0].mesa, 'success');
    }
  }
  
  console.log('✅ Pedidos actualizados:', orders.length);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

async function checkAuth() {
  console.log('🔐 Verificando autenticación...');
  const auth = localStorage.getItem('frv_admin_auth');
  const user = localStorage.getItem('frv_admin_user');
  const loginTime = localStorage.getItem('frv_login_time');
  
  console.log('📋 Auth:', auth, 'User:', user, 'Time:', loginTime);
  
  // Verificar si hay sesión activa (24 horas máximo)
  if (auth === 'true' && user && loginTime) {
    const hoursSinceLogin = (Date.now() - new Date(loginTime)) / (1000 * 60 * 60);
    console.log('⏱️ Horas desde login:', hoursSinceLogin);
    
    if (hoursSinceLogin < 24) {
      currentUser = user;
      const userEl = document.getElementById('currentUser');
      if (userEl) userEl.textContent = user;
      console.log('✅ Autenticación exitosa');
      return true;
    } else {
      // Sesión expirada
      logout();
    }
  }
  
  // No hay sesión - redireccionar al login
  console.log('🔒 No autenticado - Redirigiendo a login.html');
  window.location.href = 'login.html';
  return false;
}

function logout() {
  if (!confirm('¿Cerrar sesión?')) return;
  
  // Limpiar datos de sesión
  localStorage.removeItem('frv_admin_auth');
  localStorage.removeItem('frv_admin_user');
  localStorage.removeItem('frv_login_time');
  currentUser = null;
  
  // Redirigir al login
  window.location.href = 'login.html';
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIREBASE CONNECTION
// ═══════════════════════════════════════════════════════════════════════════════

let firebaseInitRetry = 0;
const MAX_FIREBASE_RETRIES = 3;

async function connectFirebase() {
  console.log('🔌 Iniciando conexión Firebase...');
  
  // Si FirebaseClient está disponible, usarlo
  if (typeof FirebaseClient !== 'undefined') {
    console.log('📦 Usando FirebaseClient...');
    try {
      await FirebaseClient.init();
      console.log('✅ FirebaseClient inicializado');
      
      // Suscribirse a pedidos en tiempo real usando FirebaseClient
      if (typeof firebase !== 'undefined' && firebase.database) {
        firebaseDb = firebase.database();
        subscribeToRealtimeUpdates();
        updateConnectionStatus('🟢 En tiempo real', true);
        loadFromFirebase();
      } else {
        // Usar loadFromLocalStorage como backup
        loadFromLocalStorage();
        updateConnectionStatus('🟡 Modo local', true);
      }
      return;
    } catch (error) {
      console.error('❌ Error con FirebaseClient:', error.message);
    }
  }
  
  // Fallback: usar Firebase nativo
  console.log('📦 Usando Firebase nativo...');
  try {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK no disponible');
      updateConnectionStatus('⚠️ Firebase no cargado', false);
      loadFromLocalStorage();
      return;
    }
    
    // Inicializar Firebase si no está inicializado
    try {
      firebaseApp = firebase.initializeApp(CONFIG.firebaseConfig);
    } catch (e) {
      // Ya inicializado, obtener la app
      const apps = firebase.getApps();
      if (apps.length > 0) {
        firebaseApp = apps[0];
      } else {
        throw e;
      }
    }
    
    firebaseDb = firebase.database();
    console.log('✅ Firebase inicializado');
    
    // Suscribirse directamente a updates en tiempo real
    subscribeToRealtimeUpdates();
    loadFromFirebase();
    updateConnectionStatus('🟢 En tiempo real', true);
    
  } catch (error) {
    console.error('Error Firebase:', error.message);
    updateConnectionStatus('🟡 Modo local', true);
    loadFromLocalStorage();
  }
}

async function verifyFirebaseConnection() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn('Timeout verificando conexión Firebase');
      resolve(false); // No rechazamos, continuamos en modo local
    }, 5000);
    
    firebaseDb.ref('.info/connected').once('value')
      .then(snap => {
        clearTimeout(timeout);
        if (snap.val() === true) {
          console.log('✅ Conexión Firebase verificada');
          resolve(true);
        } else {
          console.warn('Firebase no conectado');
          resolve(false);
        }
      })
      .catch(err => {
        clearTimeout(timeout);
        console.warn('Error verificando conexión:', err.message);
        resolve(false);
      });
  });
}

async function loadFirebaseSDK() {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="firebase"]')) {
      setTimeout(resolve, 1000);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    script.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
      script2.onload = resolve;
      document.head.appendChild(script2);
    };
    document.head.appendChild(script);
  });
}

function loadFromLocalStorage() {
  // Cargar pedidos desde localStorage
  const savedOrders = localStorage.getItem('frv_orders');
  if (savedOrders) {
    orders = JSON.parse(savedOrders);
    renderOrders();
    updateStats();
  }
  
  // Guardar pedidos localmente cuando hay cambios
  saveToLocalStorage = (orderData) => {
    localStorage.setItem('frv_orders', JSON.stringify(orders));
  };
}

function updateConnectionStatus(text, isConnected) {
  const el = document.getElementById('connectionText');
  const container = document.getElementById('connectionStatus');
  const liveDot = document.querySelector('.live-dot');
  const liveText = document.querySelector('.live-text');
  
  if (el) el.textContent = text;
  if (container) {
    container.className = 'connection-status' + (isConnected ? ' connected' : ' disconnected');
  }
  
  // Actualizar indicador EN TIEMPO REAL
  if (isConnected) {
    if (liveDot) liveDot.style.background = '#00ff88';
    if (liveText) {
      liveText.textContent = 'EN TIEMPO REAL';
      liveText.style.color = '#00ff88';
    }
  } else {
    if (liveDot) liveDot.style.background = '#ff4444';
    if (liveText) {
      liveText.textContent = 'SIN CONEXIÓN';
      liveText.style.color = '#ff4444';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARGA DE DATOS
// ═══════════════════════════════════════════════════════════════════════════════

async function initializeData() {
  // Cargar inventario desde localStorage o crear por defecto
  const savedInventory = localStorage.getItem('frv_inventory');
  if (savedInventory) {
    inventory = JSON.parse(savedInventory);
  } else {
    inventory = getDefaultInventory();
    saveInventory();
  }
  
  // Cargar personal
  const savedStaff = localStorage.getItem('frv_staff');
  if (savedStaff) {
    staff = JSON.parse(savedStaff);
  } else {
    staff = getDefaultStaff();
    saveStaff();
  }
  
  // Cargar mesas
  const savedTables = localStorage.getItem('frv_tables');
  if (savedTables) {
    tables = JSON.parse(savedTables);
  } else {
    tables = generateTables(50); // 50 mesas por defecto
    saveTables();
  }
  
  // Cargar reporte de ventas
  const savedReport = localStorage.getItem('frv_sales_report');
  if (savedReport) {
    salesReport = JSON.parse(savedReport);
  }
}

function getDefaultInventory() {
  return [
    // Cervezas
    { id: 1, name: 'Cristal', category: 'cervezas', stock: 100, minStock: 20, price: 8.00, emoji: '🍺' },
    { id: 2, name: 'Pilsen', category: 'cervezas', stock: 80, minStock: 15, price: 8.00, emoji: '🍻' },
    { id: 3, name: 'Cusqueña', category: 'cervezas', stock: 60, minStock: 10, price: 10.00, emoji: '🍺' },
    { id: 4, name: 'Corona', category: 'cervezas', stock: 40, minStock: 8, price: 12.00, emoji: '🍺' },
    
    // Tragos
    { id: 5, name: 'Pisco Sour', category: 'tragos', stock: 50, minStock: 10, price: 18.00, emoji: '🍋' },
    { id: 6, name: 'Chilcano', category: 'tragos', stock: 60, minStock: 12, price: 15.00, emoji: '🍸' },
    { id: 7, name: 'Mojito', category: 'tragos', stock: 45, minStock: 9, price: 16.00, emoji: '🌿' },
    { id: 8, name: 'Margarita', category: 'tragos', stock: 40, minStock: 8, price: 17.00, emoji: '🍊' },
    { id: 9, name: 'Piña Colada', category: 'tragos', stock: 35, minStock: 7, price: 16.00, emoji: '🍍' },
    { id: 10, name: 'Sex on the Beach', category: 'tragos', stock: 30, minStock: 6, price: 16.00, emoji: '🏖️' },
    
    // Shots
    { id: 11, name: 'Tequila Shot', category: 'shots', stock: 70, minStock: 15, price: 10.00, emoji: '🥃' },
    { id: 12, name: 'Jäger Shot', category: 'shots', stock: 65, minStock: 12, price: 10.00, emoji: '🌿' },
    { id: 13, name: 'Ron con Cola', category: 'shots', stock: 55, minStock: 10, price: 12.00, emoji: '🫙' },
    
    // Sin Alcohol
    { id: 14, name: 'Agua Mineral', category: 'sin-alcohol', stock: 100, minStock: 20, price: 3.00, emoji: '💧' },
    { id: 15, name: 'Coca Cola', category: 'sin-alcohol', stock: 80, minStock: 15, price: 4.00, emoji: '🥤' },
    { id: 16, name: 'Frugos', category: 'sin-alcohol', stock: 90, minStock: 18, price: 4.00, emoji: '🧃' }
  ];
}

function getDefaultStaff() {
  return [
    {
      id: 'staff_1',
      name: 'María García',
      role: CONFIG.ROLES.ANFITRIONA,
      phone: '51924996961',
      tables: [1, 2, 3, 4, 5],
      status: 'active',
      avatar: '👩'
    },
    {
      id: 'staff_2',
      name: 'Ana Rodríguez',
      role: CONFIG.ROLES.ANFITRIONA,
      phone: '51924996962',
      tables: [6, 7, 8, 9, 10],
      status: 'active',
      avatar: '👩'
    },
    {
      id: 'staff_3',
      name: 'Carlos Mendoza',
      role: CONFIG.ROLES.BARTENDER,
      phone: '51924996963',
      tables: [],
      status: 'active',
      avatar: '👨'
    },
    {
      id: 'staff_4',
      name: 'Luis Torres',
      role: CONFIG.ROLES.MESERO,
      phone: '51924996964',
      tables: [11, 12, 13, 14, 15, 16],
      status: 'active',
      avatar: '👨'
    }
  ];
}

function generateTables(count) {
  const tables = [];
  for (let i = 1; i <= count; i++) {
    tables.push({
      id: i,
      number: i,
      status: 'free', // free, occupied, busy
      currentOrder: null,
      assignedStaff: [],
      capacity: 4
    });
  }
  return tables;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIREBASE SYNC
// ═══════════════════════════════════════════════════════════════════════════════

let unsubscribeRealtime = null;

function loadFromFirebase() {
  if (!firebaseDb) return;
  
  // Cargar pedidos
  firebaseDb.ref('orders').once('value').then(snapshot => {
    const data = snapshot.val();
    if (data) {
      orders = Object.entries(data).map(([id, order]) => ({ id, ...order }));
      console.log('📥 Pedidos cargados desde Firebase:', orders.length);
      renderOrders();
      updateStats();
    }
  });
}

function subscribeToRealtimeUpdates() {
  if (!firebaseDb) {
    console.warn('⚠️ Firebase database no disponible para suscripción en tiempo real');
    return;
  }
  
  console.log('📡 Suscribiendo aUpdates en tiempo real de Firebase...');
  
  // Cancelar suscripción anterior si existe
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
    unsubscribeRealtime = null;
  }
  
  const ordersRef = firebaseDb.ref('orders');
  
  // Usar on para escuchar cambios en tiempo real
  const listener = ordersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    console.log('📡 Cambio detectado en Firebase, datos:', data ? Object.keys(data).length : 0);
    
    if (data) {
      const newOrders = Object.entries(data).map(([id, order]) => ({ id, ...order }));
      
      // Detectar nuevos pedidos
      const oldCount = orders.length;
      const newOrderIds = newOrders.map(o => o.id);
      
      // Comparar con pedidos actuales para detectar cambios reales
      let hasNewOrder = false;
      if (oldCount === 0) {
        hasNewOrder = newOrders.length > 0;
      } else {
        const currentIds = orders.map(o => o.id);
        hasNewOrder = newOrderIds.some(id => !currentIds.includes(id));
      }
      
      orders = newOrders;
      renderOrders();
      updateStats();
      updateTablesStatus();
      
      // Reproducir sonido si hay nuevos pedidos
      if (hasNewOrder) {
        console.log('🔔 Nuevo pedido detectado!');
        const pendingOrders = orders.filter(o => o.status === 'pending');
        if (pendingOrders.length > 0 && soundEnabled) {
          playNotificationSound('new-order');
          showNotification(`🔔 Nuevo pedido - Mesa ${pendingOrders[0].mesa}`, 'success');
        } else if (soundEnabled) {
          playNotificationSound('new-order');
          showNotification(`🔔 Nuevo pedido recibido`, 'success');
        }
      }
    }
  }, (error) => {
    console.error('❌ Error en suscripción Firebase:', error.message);
  });
  
  // Guardar referencia para cancelar después
  unsubscribeRealtime = () => {
    console.log('📡 Cancelando suscripción a Firebase...');
    ordersRef.off('value', listener);
  };
  
  console.log('✅ Suscripción a времени real activa');
}

function sendToFirebase(orderData) {
  return new Promise((resolve, reject) => {
    if (!firebaseDb) {
      reject(new Error('Firebase no disponible'));
      return;
    }
    
    const newRef = firebaseDb.ref('orders').push();
    newRef.set(orderData)
      .then(() => {
        console.log('✅ Pedido guardado en Firebase:', newRef.key);
        resolve(newRef.key);
      })
      .catch(reject);
  });
}

function updateOrderStatus(orderId, status) {
  if (!firebaseDb) return false;
  
  const updates = {
    status: status,
    updatedAt: new Date().toISOString()
  };
  
  if (status === CONFIG.STATUS.COMPLETED) {
    updates.completedAt = new Date().toISOString();
  }
  
  return firebaseDb.ref('orders/' + orderId).update(updates);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ACTUALIZAR PEDIDOS DESDE FIREBASE (Tiempo Real)
// ═══════════════════════════════════════════════════════════════════════════════

function updateOrdersFromFirebase(newOrders) {
  console.log('📡 Actualizando pedidos desde Firebase:', newOrders.length);
  
  // Verificar si hay nuevos pedidos
  const oldCount = orders.length;
  orders = newOrders;
  
  // Renderizar pedidos
  if (typeof renderOrders === 'function') {
    renderOrders();
  }
  
  // Actualizar estadísticas
  if (typeof updateStats === 'function') {
    updateStats();
  }
  
  // Actualizar estado de mesas
  if (typeof updateTablesStatus === 'function') {
    updateTablesStatus();
  }
  
  // Notificar si hay nuevos pedidos
  if (newOrders.length > oldCount) {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length > 0 && soundEnabled) {
      playNotificationSound('new-order');
      showNotification('🔔 Nuevo pedido - Mesa ' + pendingOrders[0].mesa, 'success');
    }
  }
  
  console.log('✅ Pedidos actualizados:', orders.length);
}

// Polling para cargar pedidos desde Firebase como backup
async function pollOrdersFromFirebase() {
  if (!firebaseDb) return;
  
  try {
    const snapshot = await firebaseDb.ref('orders').once('value');
    const data = snapshot.val();
    if (data) {
      const newOrders = Object.entries(data).map(([id, order]) => ({ id, ...order }));
      
      // Solo actualizar si hay cambios
      const oldIds = orders.map(o => o.id).sort();
      const newIds = newOrders.map(o => o.id).sort();
      
      const hasChanges = JSON.stringify(oldIds) !== JSON.stringify(newIds);
      
      if (hasChanges) {
        console.log('📡 Pedidos actualizados por polling:', newOrders.length);
        updateOrdersFromFirebase(newOrders);
      }
    }
  } catch (error) {
    console.warn('⚠️ Error en polling:', error.message);
  }
}
          showNotification(`🔔 Nuevo pedido - Mesa ${newOrder.mesa}`, 'success');
        }
      };
      console.log('✅ BroadcastChannel inicializado');
    }
  } catch (e) {
    console.warn('BroadcastChannel no soportado:', e);
  }
}

function notifyNewOrder(orderData) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'new_order', order: orderData });
  }
}

function initClock() {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;
  
  function updateClock() {
    const now = new Date();
    const timezone = CONFIG.local.timezone;
    const options = { 
      timeZone: timezone, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    };
    clockEl.textContent = now.toLocaleTimeString('es-PE', options);
  }
  
  updateClock();
  setInterval(updateClock, 1000);
}

function formatCurrency(amount) {
  return `S/ ${amount.toFixed(2)}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE');
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getStatusLabel(status) {
  const labels = {
    [CONFIG.STATUS.PENDING]: '⏳ Pendiente',
    [CONFIG.STATUS.PREPARING]: '⚡ Preparando',
    [CONFIG.STATUS.READY]: '✅ Listo',
    [CONFIG.STATUS.COMPLETED]: '✔️ Entregado',
    [CONFIG.STATUS.CANCELLED]: '❌ Cancelado'
  };
  return labels[status] || 'Desconocido';
}

function getStatusClass(status) {
  return `status-${status}`;
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const icon = notification.querySelector('.notification-icon i');
  const title = notification.querySelector('.notification-title');
  const msg = notification.querySelector('.notification-message');
  
  // Configurar según tipo
  notification.className = 'notification ' + type;
  
  if (type === 'success') {
    icon.className = 'fas fa-check-circle';
    title.textContent = 'Éxito';
  } else if (type === 'error') {
    icon.className = 'fas fa-exclamation-circle';
    title.textContent = 'Error';
  } else if (type === 'warning') {
    icon.className = 'fas fa-exclamation-triangle';
    title.textContent = 'Atención';
  }
  
  msg.textContent = message;
  notification.classList.add('show');
  
  // Sonido
  if (soundEnabled) {
    playNotificationSound(type === 'error' ? 'error' : 'success');
  }
  
  // Auto-cerrar
  setTimeout(() => {
    closeNotification();
  }, 4000);
}

function closeNotification() {
  const notification = document.getElementById('notification');
  notification.classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SONIDOS Y NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════════════════════

let lastOrderCount = 0;

function initAudio() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('✅ AudioContext inicializado');
    } catch (e) {
      console.warn('Audio no soportado:', e);
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
}

function playNotificationSound(type = 'success') {
  try {
    initAudio();
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    
    switch (type) {
      case 'success':
        // Sonido positivo - dos notas ascendentes
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
        
      case 'error':
        // Sonido error -下降
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
        
      case 'new-order':
        // sonido de nuevo pedido - triple beep
        oscillator.frequency.setValueAtTime(880, now);
        gainNode.gain.setValueAtTime(0.1, now);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.setValueAtTime(880, now + 0.15);
        gain2.gain.setValueAtTime(0.1, now + 0.15);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.25);
        
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.setValueAtTime(1100, now + 0.3);
        gain3.gain.setValueAtTime(0.12, now + 0.3);
        osc3.start(now + 0.3);
        osc3.stop(now + 0.45);
        break;
        
      case 'warning':
        // Advertencia - tono sostenidous
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.setValueAtTime(440, now + 0.2);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.setValueAtTime(0, now + 0.1);
        gainNode.gain.setValueAtTime(0.12, now + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
        
      case 'login':
        // Login exitoso - melodía pleasant
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.15); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.3); // G5
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
        
      case 'logout':
        // Cierre de sesión - tono descendente suave
        oscillator.frequency.setValueAtTime(659.25, now);
        oscillator.frequency.exponentialRampToValueAtTime(329.63, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
    }
  } catch (error) {
    console.warn('Error reproduciendo sonido:', error);
  }
}

function checkNewOrders() {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const currentCount = pendingOrders.length;
  
  // Solo notificar si hay nuevos pedidos (comparando con el conteo anterior)
  if (currentCount > lastOrderCount && lastOrderCount > 0) {
    playNotificationSound('new-order');
    showNotification(`🔔 Nuevo pedido - Mesa ${pendingOrders[0].mesa}`, 'success');
  }
  
  // También verificar si hay pedidos que vinieron por primera vez
  if (lastOrderCount === 0 && currentCount > 0) {
    playNotificationSound('new-order');
    showNotification(`🔔 Nuevo pedido(s) recibido(s)`, 'success');
  }
  
  lastOrderCount = currentCount;
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const soundBtn = document.getElementById('soundBtn');
  if (soundBtn) {
    soundBtn.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    soundBtn.parentElement.title = soundEnabled ? 'Silenciar' : 'Activar sonido';
  }
  localStorage.setItem('frv_sound_enabled', soundEnabled);
  showNotification(soundEnabled ? '🔊 Sonido activado' : '🔇 Sonido silenciado', 'success');
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

function initEventListeners() {
  // Navegación
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });
  
  // Filtros de pedidos
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      orderFilter = btn.getAttribute('data-filter');
      renderOrders();
    });
  });
  
  // Filtros de inventario
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      inventoryFilter = tab.getAttribute('data-filter');
      renderInventory();
    });
  });
  
  // Búsqueda de inventario
  const inventorySearch = document.getElementById('inventorySearch');
  if (inventorySearch) {
    inventorySearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderInventory();
    });
  }
  
  // Búsqueda de historial
  const historySearch = document.getElementById('historySearch');
  if (historySearch) {
    historySearch.addEventListener('input', () => {
      renderHistory();
    });
  }
  
  // Preferencias de usuario
  const soundEnabledPref = localStorage.getItem('frv_sound_enabled');
  if (soundEnabledPref !== null) {
    soundEnabled = soundEnabledPref === 'true';
  }
  
  // Cerrar modal al hacer clic fuera
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
  
  // Teclas rápidas
  document.addEventListener('keydown', (e) => {
    // Ctrl + R para refrescar
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      refreshData();
    }
    // Escape para cerrar modales
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

function switchView(viewName) {
  // Actualizar navegación
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === viewName);
  });
  
  // Cambiar vista
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  const targetView = document.getElementById(viewName + 'View');
  if (targetView) {
    targetView.classList.add('active');
    currentView = viewName;
    
    // Actualizar título
    const titleEl = document.getElementById('pageTitle');
    const titles = {
      orders: 'Pedidos en Vivo',
      tables: 'Mapa de Mesas',
      inventory: 'Inventario',
      staff: 'Personal',
      sales: 'Reporte de Ventas',
      history: 'Historial',
      export: 'Exportar',
      settings: 'Configuración'
    };
    if (titleEl && titles[viewName]) {
      titleEl.innerHTML = `<i class="fas fa-${getViewIcon(viewName)}"></i> ${titles[viewName]}`;
    }
    
    // Renderizar vista específica
    renderCurrentView();
  }
}

function getViewIcon(viewName) {
  const icons = {
    orders: 'receipt',
    tables: 'th-large',
    inventory: 'boxes',
    staff: 'users',
    sales: 'chart-line',
    history: 'history',
    export: 'file-export',
    settings: 'cog'
  };
  return icons[viewName] || 'square';
}

function renderCurrentView() {
  switch (currentView) {
    case 'orders':
      renderOrders();
      break;
    case 'tables':
      renderTables();
      break;
    case 'inventory':
      renderInventory();
      break;
    case 'staff':
      renderStaff();
      break;
    case 'sales':
      renderSales();
      break;
    case 'history':
      renderHistory();
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function renderOrders() {
  const container = document.getElementById('ordersBoard');
  if (!container) return;
  
  // Filtrar pedidos
  let filteredOrders = orders;
  if (orderFilter !== 'all') {
    filteredOrders = orders.filter(o => o.status === orderFilter);
  }
  
  // Ordenar por fecha (más reciente primero)
  filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Actualizar contador
  const countEl = document.getElementById('ordersCount');
  if (countEl) {
    countEl.textContent = `${filteredOrders.length} pedido${filteredOrders.length !== 1 ? 's' : ''}`;
  }
  
  // Badge en navegación
  const pendingCount = orders.filter(o => o.status === CONFIG.STATUS.PENDING).length;
  const badgeEl = document.getElementById('navPendingCount');
  if (badgeEl) {
    badgeEl.textContent = pendingCount;
    badgeEl.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
  }
  
  if (filteredOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">No hay pedidos ${orderFilter !== 'all' ? `en estado "${getStatusLabel(orderFilter)}"` : 'pendientes'}</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredOrders.map(order => createOrderCard(order)).join('');
}

function createOrderCard(order) {
  const statusClass = getStatusClass(order.status);
  const itemsHtml = (order.items || []).map(item => `
    <div class="order-item">
      <span class="item-emoji">${item.emoji || ''}</span>
      <span class="item-name">${item.name}</span>
      <span class="item-qty">x${item.qty}</span>
      <span class="item-price">S/ ${(item.price * item.qty).toFixed(2)}</span>
    </div>
  `).join('');
  
  const noteHtml = order.note ? `
    <div class="order-note">
      <span class="note-label">Nota:</span>
      <span class="note-text">${order.note}</span>
    </div>
  ` : '';
  
  const actions = getActionButtons(order);
  
  // Timeline simplificado
  const timeline = getTimelineStatus(order.status);
  
  return `
    <div class="order-card ${statusClass}" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-mesa">
          <span class="mesa-number">${order.mesa || '?'}</span>
          <span class="mesa-label">MESA</span>
        </div>
        <div class="order-meta">
          <span class="order-time">${formatTime(order.createdAt)}</span>
          <span class="order-status-badge">${getStatusLabel(order.status)}</span>
        </div>
      </div>
      
      <div class="order-items">
        ${itemsHtml}
      </div>
      
      ${noteHtml}
      
      <div class="order-timeline">
        ${timeline.map(step => `
          <div class="timeline-step ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''}">
            <div class="timeline-icon">
              <i class="fas fa-${step.icon}"></i>
            </div>
            <span class="timeline-label">${step.label}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="order-footer">
        <div class="order-total">
          <span class="total-label">TOTAL</span>
          <span class="total-value">${formatCurrency(order.total)}</span>
        </div>
      </div>
      
      <div class="order-actions">
        ${actions}
      </div>
    </div>
  `;
}

function getActionButtons(order) {
  const actions = [];
  
  switch (order.status) {
    case CONFIG.STATUS.PENDING:
      actions.push(`
        <button class="action-btn preparing" onclick="changeOrderStatus('${order.id}', '${CONFIG.STATUS.PREPARING}')">
          <i class="fas fa-fire"></i> Preparar
        </button>
        <button class="action-btn cancel" onclick="changeOrderStatus('${order.id}', '${CONFIG.STATUS.CANCELLED}')">
          <i class="fas fa-times"></i> Cancelar
        </button>
      `);
      break;
      
    case CONFIG.STATUS.PREPARING:
      actions.push(`
        <button class="action-btn ready" onclick="changeOrderStatus('${order.id}', '${CONFIG.STATUS.READY}')">
          <i class="fas fa-check"></i> Listo
        </button>
        <button class="action-btn cancel" onclick="changeOrderStatus('${order.id}', '${CONFIG.STATUS.CANCELLED}')">
          <i class="fas fa-times"></i> Cancelar
        </button>
      `);
      break;
      
    case CONFIG.STATUS.READY:
      actions.push(`
        <button class="action-btn completed" onclick="changeOrderStatus('${order.id}', '${CONFIG.STATUS.COMPLETED}')">
          <i class="fas fa-box-open"></i> Entregar
        </button>
      `);
      break;
      
    case CONFIG.STATUS.COMPLETED:
      actions.push(`
        <button class="action-btn redo" onclick="reorder('${order.id}')">
          <i class="fas fa-redo"></i> Repetir
        </button>
      `);
      break;
  }
  
  // Botón ver detalles siempre presente
  actions.push(`
    <button class="action-btn" style="background: var(--surface2);" onclick="openOrderDetail('${order.id}')">
      <i class="fas fa-eye"></i> Detalles
    </button>
  `);
  
  return actions.join('');
}

function getTimelineStatus(status) {
  const steps = [
    { icon: 'receipt', label: 'Recibido' },
    { icon: 'fire', label: 'Preparando' },
    { icon: 'check-circle', label: 'Listo' },
    { icon: 'box-open', label: 'Entregado' }
  ];
  
  const statusOrder = ['pending', 'preparing', 'ready', 'completed'];
  const currentIndex = statusOrder.indexOf(status);
  
  return steps.map((step, index) => ({
    ...step,
    active: index === currentIndex,
    completed: index < currentIndex
  }));
}

function changeOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  // Actualizar estado
  order.status = newStatus;
  order.updatedAt = new Date().toISOString();
  
  if (newStatus === CONFIG.STATUS.COMPLETED) {
    order.completedAt = new Date().toISOString();
    decrementInventory(order.items);
    registerSale(order);
  }
  
  // Guardar en Firebase
  updateOrderStatus(orderId, newStatus);
  
  // Actualizar UI
  renderOrders();
  updateStats();
  
  showNotification(`Pedido #${order.mesa} actualizado a "${getStatusLabel(newStatus)}"`);
  
  // Sonido según estado
  if (window.soundEnabled !== false) {
    const soundType = newStatus === 'cancelled' ? 'error' : 'success';
    playNotificationSound(soundType);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLES VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function renderTables() {
  const grid = document.getElementById('tablesGrid');
  if (!grid) return;
  
  grid.innerHTML = tables.map(table => createTableCard(table)).join('');
}

function createTableCard(table) {
  const statusClass = table.status;
  const statusLabel = {
    free: 'Disponible',
    occupied: 'Ocupada',
    busy: 'En uso'
  }[table.status] || 'Desconocido';
  
  const ordersCount = table.currentOrder ? 1 : 0;
  const staffNames = staff
    .filter(s => table.assignedStaff.includes(s.id))
    .map(s => s.name.split(' ')[0])
    .join(', ');
  
  return `
    <div class="table-card ${statusClass}" onclick="openTableDetail(${table.id})">
      ${ordersCount > 0 ? `<span class="table-orders">${ordersCount}</span>` : ''}
      <div class="table-number">${table.number}</div>
      <div class="table-status">${statusLabel}</div>
      ${staffNames ? `<div class="table-staff" style="font-size: 10px; color: var(--muted); margin-top: 4px;">${staffNames}</div>` : ''}
    </div>
  `;
}

function updateTablesStatus() {
  // Recalcular estado de mesas basado en pedidos activos
  tables.forEach(table => {
    const activeOrder = orders.find(o => 
      o.mesa == table.number && 
      !['completed', 'cancelled'].includes(o.status)
    );
    
    if (activeOrder) {
      table.currentOrder = activeOrder.id;
      if (activeOrder.status === CONFIG.STATUS.PREPARING || activeOrder.status === CONFIG.STATUS.READY) {
        table.status = 'busy';
      } else {
        table.status = 'occupied';
      }
    } else {
      table.currentOrder = null;
      table.status = 'free';
    }
  });
  
  if (currentView === 'tables') {
    renderTables();
  }
}

function openTableDetail(tableId) {
  const table = tables.find(t => t.id === tableId);
  if (!table) return;
  
  // Aquí se podría abrir un modal con detalles de la mesa
  console.log('Mesa:', table);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function renderInventory() {
  const tbody = document.getElementById('inventoryBody');
  if (!tbody) return;
  
  // Filtrar
  let filtered = inventory;
  if (inventoryFilter !== 'all') {
    filtered = inventory.filter(item => item.category === inventoryFilter);
  }
  if (searchQuery) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchQuery)
    );
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-text">No hay productos encontrados</div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filtered.map(item => {
    const stockClass = item.stock <= item.minStock ? 'stock-low' : 
                      item.stock <= item.minStock * 2 ? 'stock-medium' : 'stock-high';
    
    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${item.emoji}</span>
            <span style="font-weight: 600;">${item.name}</span>
          </div>
        </td>
        <td>
          <span class="badge badge-teal">${item.category}</span>
        </td>
        <td class="${stockClass}">
          <strong>${item.stock}</strong> unidades
          ${item.stock <= item.minStock ? '<br><small style="color: var(--error);">⚠️ Stock bajo</small>' : ''}
        </td>
        <td>${item.minStock}</td>
        <td><strong>${formatCurrency(item.price)}</strong></td>
        <td>
          <div class="inv-actions">
            <button class="inv-btn-sm" onclick="editInventory(${item.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="inv-btn-sm delete" onclick="deleteInventory(${item.id})" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  // Actualizar contador de stock bajo
  const lowStockCount = inventory.filter(i => i.stock <= i.minStock).length;
  const badge = document.getElementById('navLowStock');
  if (badge) {
    badge.textContent = lowStockCount;
    badge.style.display = lowStockCount > 0 ? 'inline-flex' : 'none';
  }
}

function saveInventory() {
  localStorage.setItem('frv_inventory', JSON.stringify(inventory));
}

function openInventoryModal(itemId = null) {
  const modal = document.getElementById('inventoryModal');
  const title = document.getElementById('inventoryModalTitle');
  const form = document.getElementById('inventoryForm');
  
  if (itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    title.textContent = 'Editar Producto';
    document.getElementById('invId').value = item.id;
    document.getElementById('invName').value = item.name;
    document.getElementById('invCategory').value = item.category;
    document.getElementById('invStock').value = item.stock;
    document.getElementById('invMinStock').value = item.minStock;
    document.getElementById('invPrice').value = item.price;
  } else {
    title.textContent = 'Nuevo Producto';
    form.reset();
    document.getElementById('invId').value = '';
  }
  
  modal.classList.add('show');
}

function closeInventoryModal() {
  document.getElementById('inventoryModal').classList.remove('show');
}

function saveInventoryItem() {
  const id = document.getElementById('invId').value;
  const name = document.getElementById('invName').value;
  const category = document.getElementById('invCategory').value;
  const stock = parseInt(document.getElementById('invStock').value);
  const minStock = parseInt(document.getElementById('invMinStock').value);
  const price = parseFloat(document.getElementById('invPrice').value);
  
  if (!name || !category || isNaN(stock) || isNaN(minStock) || isNaN(price)) {
    showNotification('Por favor complete todos los campos correctamente', 'error');
    return;
  }
  
  if (id) {
    // Editar existente
    const index = inventory.findIndex(i => i.id == id);
    if (index !== -1) {
      inventory[index] = { ...inventory[index], name, category, stock, minStock, price };
    }
  } else {
    // Crear nuevo
    const newItem = {
      id: generateId(),
      name,
      category,
      stock,
      minStock,
      price,
      emoji: getEmojiForCategory(category)
    };
    inventory.push(newItem);
  }
  
  saveInventory();
  renderInventory();
  closeInventoryModal();
  showNotification('Producto guardado correctamente');
}

function editInventory(id) {
  openInventoryModal(id);
}

function deleteInventory(id) {
  if (!confirm('¿Estás seguro de eliminar este producto?')) return;
  
  inventory = inventory.filter(i => i.id != id);
  saveInventory();
  renderInventory();
  showNotification('Producto eliminado');
}

function getEmojiForCategory(category) {
  const emojis = {
    'cervezas': '🍺',
    'tragos': '🍹',
    'shots': '🥃',
    'sin-alcohol': '🧃'
  };
  return emojis[category] || '📦';
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function decrementInventory(items) {
  items.forEach(item => {
    const inventoryItem = inventory.find(i => i.name === item.name);
    if (inventoryItem && inventoryItem.stock > 0) {
      inventoryItem.stock = Math.max(0, inventoryItem.stock - item.qty);
      
      // Alertar si stock bajo
      if (inventoryItem.stock <= inventoryItem.minStock) {
        showNotification(`⚠️ Stock bajo: ${item.name} (${inventoryItem.stock} restantes)`, 'warning');
      }
    }
  });
  saveInventory();
  renderInventory();
}

function updateInventoryAfterCancel(order) {
  // Restaurar stock si se cancela un pedido
  if (order.items) {
    order.items.forEach(item => {
      const inventoryItem = inventory.find(i => i.name === item.name);
      if (inventoryItem) {
        inventoryItem.stock += item.qty;
      }
    });
  }
  saveInventory();
  renderInventory();
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function renderStaff() {
  const grid = document.getElementById('staffGrid');
  if (!grid) return;
  
  grid.innerHTML = staff.map(member => createStaffCard(member)).join('');
}

function createStaffCard(member) {
  const roleLabels = {
    bartender: 'Bartender',
    mesero: 'Mesero',
    anfitriona: 'Anfitriona',
    supervisor: 'Supervisor'
  };
  
  const statusClass = member.status === 'active' ? '' : 'inactive';
  const statusTitle = member.status === 'active' ? 'Activo' : 'Inactivo';
  
  return `
    <div class="staff-card">
      <div class="staff-header">
        <div class="staff-avatar">${member.avatar || '👤'}</div>
        <div style="flex: 1;">
          <div class="staff-name">${member.name}</div>
          <span class="staff-role-badge">${roleLabels[member.role] || member.role}</span>
        </div>
        <div class="staff-status ${statusClass}" title="${statusTitle}"></div>
      </div>
      <div class="staff-details">
        ${member.phone ? `
          <div class="detail-row">
            <i class="fas fa-phone"></i>
            <span>${member.phone}</span>
          </div>
        ` : ''}
        ${member.tables && member.tables.length > 0 ? `
          <div class="detail-row">
            <i class="fas fa-table"></i>
            <span>Mesas: ${member.tables.join(', ')}</span>
          </div>
        ` : ''}
      </div>
      <div class="staff-actions">
        <button class="staff-btn" onclick="editStaff('${member.id}')">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="staff-btn delete" onclick="deleteStaff('${member.id}')">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    </div>
  `;
}

function openStaffModal(staffId = null) {
  const modal = document.getElementById('staffModal');
  const title = document.getElementById('staffModalTitle');
  const form = document.getElementById('staffForm');
  
  if (staffId) {
    const member = staff.find(s => s.id === staffId);
    if (!member) return;
    
    title.textContent = 'Editar Personal';
    document.getElementById('staffId').value = member.id;
    document.getElementById('staffName').value = member.name;
    document.getElementById('staffRole').value = member.role;
    document.getElementById('staffPhone').value = member.phone || '';
    document.getElementById('staffTables').value = member.tables ? member.tables.join(', ') : '';
    document.getElementById('staffStatus').value = member.status;
  } else {
    title.textContent = 'Agregar Personal';
    form.reset();
    document.getElementById('staffId').value = '';
    document.getElementById('staffStatus').value = 'active';
  }
  
  modal.classList.add('show');
}

function closeStaffModal() {
  document.getElementById('staffModal').classList.remove('show');
}

function saveStaff() {
  const id = document.getElementById('staffId').value;
  const name = document.getElementById('staffName').value;
  const role = document.getElementById('staffRole').value;
  const phone = document.getElementById('staffPhone').value;
  const tablesStr = document.getElementById('staffTables').value;
  const status = document.getElementById('staffStatus').value;
  
  if (!name || !role) {
    showNotification('Nombre y rol son obligatorios', 'error');
    return;
  }
  
  // Parsear mesas
  const tables = [];
  if (tablesStr) {
    const parts = tablesStr.split(',').map(p => p.trim());
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          if (!isNaN(i) && i >= 1 && i <= 100) tables.push(i);
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= 100) tables.push(num);
      }
    });
  }
  
  if (id) {
    const index = staff.findIndex(s => s.id === id);
    if (index !== -1) {
      staff[index] = { 
        ...staff[index], 
        name, role, phone, tables, status 
      };
    }
  } else {
    staff.push({
      id: generateId(),
      name,
      role,
      phone,
      tables,
      status,
      avatar: role === 'anfitriona' ? '👩' : role === 'bartender' ? '👨' : '👤'
    });
  }
  
  saveStaff();
  renderStaff();
  closeStaffModal();
  showNotification('Personal guardado correctamente');
}

function editStaff(id) {
  openStaffModal(id);
}

function deleteStaff(id) {
  if (!confirm('¿Eliminar este miembro del personal?')) return;
  
  staff = staff.filter(s => s.id != id);
  saveStaff();
  renderStaff();
  showNotification('Personal eliminado');
}

function saveStaff() {
  localStorage.setItem('frv_staff', JSON.stringify(staff));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SALES & REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

function registerSale(order) {
  const date = new Date(order.completedAt || order.updatedAt).toISOString().split('T')[0];
  
  if (!salesReport[date]) {
    salesReport[date] = {
      total: 0,
      ordersCount: 0,
      items: {},
      byHour: {}
    };
  }
  
  const dayReport = salesReport[date];
  dayReport.total += order.total;
  dayReport.ordersCount += 1;
  
  // Por producto
  order.items.forEach(item => {
    if (!dayReport.items[item.name]) {
      dayReport.items[item.name] = { qty: 0, revenue: 0 };
    }
    dayReport.items[item.name].qty += item.qty;
    dayReport.items[item.name].revenue += item.price * item.qty;
  });
  
  // Por hora
  const hour = new Date(order.completedAt).getHours();
  const hourKey = `${hour}:00`;
  if (!dayReport.byHour[hourKey]) {
    dayReport.byHour[hourKey] = { count: 0, revenue: 0 };
  }
  dayReport.byHour[hourKey].count += 1;
  dayReport.byHour[hourKey].revenue += order.total;
  
  localStorage.setItem('frv_sales_report', JSON.stringify(salesReport));
}

function renderSales() {
  // Calcular estadísticas del período actual (hoy)
  const today = new Date().toISOString().split('T')[0];
  const todayData = salesReport[today] || {
    total: 0,
    ordersCount: 0,
    items: {}
  };
  
  // Actualizar summary cards
  document.getElementById('totalSales').textContent = formatCurrency(todayData.total);
  document.getElementById('totalOrders').textContent = todayData.ordersCount;
  
  // Calcular clientes únicos (aproximado)
  const uniqueCustomers = new Set(orders
    .filter(o => o.createdAt && o.createdAt.startsWith(today))
    .map(o => o.mesa)
  ).size;
  document.getElementById('totalCustomers').textContent = uniqueCustomers;
  
  // Ticket promedio
  const avgTicket = todayData.ordersCount > 0 ? todayData.total / todayData.ordersCount : 0;
  document.getElementById('avgTicket').textContent = formatCurrency(avgTicket);
  
  // Renderizar top productos
  renderTopProducts(todayData.items);
  
  // Renderizar tabla de ventas detallada
  renderSalesTable(today);
  
  // Renderizar gráfico
  renderSalesChart(todayData.byHour);
}

function renderTopProducts(items) {
  const container = document.getElementById('topProductsList');
  if (!container) return;
  
  // Convertir a array y ordenar
  const productList = Object.entries(items || {})
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);
  
  if (productList.length === 0) {
    container.innerHTML = '<div class="empty-state-text">No hay ventas registradas hoy</div>';
    return;
  }
  
  container.innerHTML = productList.map((product, index) => `
    <div class="product-rank">
      <span class="product-rank-number">#${index + 1}</span>
      <div class="product-rank-info">
        <div class="product-rank-name">${product.name}</div>
        <div class="product-rank-qty">${product.qty} unidades</div>
      </div>
      <span class="product-rank-revenue">${formatCurrency(product.revenue)}</span>
    </div>
  `).join('');
}

function renderSalesTable(ordersList = null) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;
  
  let displayOrders;
  if (ordersList) {
    displayOrders = ordersList;
  } else {
    const today = new Date().toISOString().split('T')[0];
    displayOrders = orders.filter(o => {
      const orderDate = new Date(o.completedAt || o.updatedAt).toISOString().split('T')[0];
      return orderDate === today && o.status === CONFIG.STATUS.COMPLETED;
    });
  }
  
  if (displayOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-text">No hay ventas en este período</div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = displayOrders
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .map(order => `
      <tr>
        <td><strong>${formatTime(order.completedAt || order.updatedAt)}</strong></td>
        <td><span class="badge badge-yellow">Mesa ${order.mesa}</span></td>
        <td>${order.items.map(i => `${i.emoji} ${i.name}`).join(', ')}</td>
        <td>${order.anfitriona || '—'}</td>
        <td><strong class="text-success">${formatCurrency(order.total)}</strong></td>
        <td>${order.paymentMethod || '—'}</td>
      </tr>
    `).join('');
}

function renderSalesChart(byHour) {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const data = hours.map(hour => byHour[hour]?.revenue || 0);
  const max = Math.max(...data, 1);
  
  // Configurar canvas
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 250;
  
  // Dibujar gráfico de barras simple
  const barWidth = canvas.width / hours.length;
  const chartHeight = canvas.height - 40;
  const bottomMargin = 30;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Dibujar barras
  hours.forEach((hour, index) => {
    const value = data[index];
    const barHeight = (value / max) * chartHeight;
    const x = index * barWidth;
    const y = canvas.height - bottomMargin - barHeight;
    
    // Color de barra según monto
    const intensity = value / max;
    ctx.fillStyle = `rgba(245, 200, 0, ${0.2 + intensity * 0.8})`;
    ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
    
    // Etiqueta de hora (solo cada 3 horas para no saturar)
    if (index % 3 === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(hour, x + barWidth/2, canvas.height - 10);
    }
    
    // Valor en tooltip (hover simulado)
    if (value > 0 && barHeight > 20) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`S/ ${value.toFixed(0)}`, x + barWidth/2, y - 5);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORY VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function renderHistory() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  
  const searchQuery = document.getElementById('historySearch')?.value.toLowerCase() || '';
  
  const filteredOrders = orders.filter(o => {
    const matchesSearch = !searchQuery || 
      o.mesa.toString().includes(searchQuery) ||
      o.items?.some(i => i.name.toLowerCase().includes(searchQuery));
    return matchesSearch;
  });
  
  if (filteredOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">No hay pedidos en el historial</div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filteredOrders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 100) // Limitar a 100 pedidos
    .map(order => `
      <tr>
        <td>${order.id ? order.id.substr(-6).toUpperCase() : '—'}</td>
        <td>${formatTime(order.createdAt)}</td>
        <td><span class="badge badge-yellow">${order.mesa}</span></td>
        <td>${order.items?.map(i => `${i.emoji} ${i.name}`).join(', ') || '—'}</td>
        <td>${order.anfitriona || '—'}</td>
        <td><strong>${formatCurrency(order.total)}</strong></td>
        <td>${order.paymentMethod || '—'}</td>
        <td>
          <span class="badge ${getStatusBadgeClass(order.status)}">
            ${getStatusLabel(order.status)}
          </span>
        </td>
      </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
  const classes = {
    'pending': 'badge-yellow',
    'preparing': 'badge-magenta',
    'ready': 'badge-teal',
    'completed': 'badge-success',
    'cancelled': 'badge-error'
  };
  return classes[status] || 'badge-teal';
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT & REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

function exportToCSV(type) {
  let csv = '';
  let filename = '';
  
  switch (type) {
    case 'orders':
      filename = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
      csv = 'ID,Mesa,Hora,Productos,Anfitriona,Total,Estado\n';
      orders.forEach(o => {
        const products = o.items?.map(i => `${i.name} x${i.qty}`).join('; ') || '';
        csv += `${o.id || ''},${o.mesa || ''},"${formatTime(o.createdAt)}","${products}",${o.anfitriona || ''},${o.total},${o.status}\n`;
      });
      break;
      
    case 'sales':
      filename = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
      csv = 'Fecha,Ticket Promedio,Total,Órdenes\n';
      Object.entries(salesReport).forEach(([date, data]) => {
        csv += `${date},${data.ordersCount > 0 ? data.total / data.ordersCount : 0},${data.total},${data.ordersCount}\n`;
      });
      break;
      
    case 'inventory':
      filename = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
      csv = 'ID,Nombre,Categoría,Stock,Mínimo,Precio,Emoji\n';
      inventory.forEach(i => {
        csv += `${i.id},${i.name},${i.category},${i.stock},${i.minStock},${i.price},${i.emoji}\n`;
      });
      break;
  }
  
  downloadCSV(csv, filename);
  showNotification(`✅ Exportado: ${filename}`);
}

function exportToExcel(type) {
  exportToCSV(type);
}

function exportToPDF(type) {
  showNotification('📄 Generando PDF... (función en desarrollo)', 'warning');
}

function printView(type) {
  window.print();
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

function backupDatabase() {
  const data = {
    inventory,
    staff,
    tables,
    salesReport,
    backupDate: new Date().toISOString(),
    version: '2.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `frv_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  showNotification('✅ Respaldo creado exitosamente');
}

function restoreDatabase() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        inventory = data.inventory || inventory;
        staff = data.staff || staff;
        tables = data.tables || tables;
        salesReport = data.salesReport || salesReport;
        
        saveInventory();
        saveStaff();
        saveTables();
        localStorage.setItem('frv_sales_report', JSON.stringify(salesReport));
        
        showNotification('✅ Restauración completada');
        renderCurrentView();
      } catch (error) {
        showNotification('❌ Error al restaurar archivo', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAllData() {
  if (!confirm('⚠️ ¿Estás SEGURO de eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
    return;
  }
  
  if (!confirm('✅ Confirma nuevamente: Se borrarán pedidos, inventario y configuraciones.')) {
    return;
  }
  
  // Limpiar todo
  orders = [];
  inventory = getDefaultInventory();
  staff = getDefaultStaff();
  tables = generateTables(50);
  salesReport = {};
  
  // Guardar
  saveInventory();
  saveStaff();
  saveTables();
  localStorage.removeItem('frv_orders');
  localStorage.removeItem('frv_sales_report');
  
  // Refrescar UI
  renderCurrentView();
  updateStats();
  
  showNotification('🧹 Sistema limpiado', 'warning');
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function refreshData() {
  const btn = document.querySelector('.refresh-btn i');
  if (btn) btn.classList.add('fa-spin');
  
  // Recargar desde Firebase
  if (firebaseDb) {
    firebaseDb.ref('orders').once('value').then(snapshot => {
      const data = snapshot.val();
      if (data) {
        orders = Object.entries(data).map(([id, order]) => ({ id, ...order }));
        renderOrders();
        updateStats();
      }
    }).finally(() => {
      setTimeout(() => { if (btn) btn.classList.remove('fa-spin'); }, 500);
    });
  }
}

function updateStats() {
  const stats = {
    pending: orders.filter(o => o.status === CONFIG.STATUS.PENDING).length,
    preparing: orders.filter(o => o.status === CONFIG.STATUS.PREPARING).length,
    completed: orders.filter(o => o.status === CONFIG.STATUS.COMPLETED).length,
    revenue: orders
      .filter(o => o.status === CONFIG.STATUS.COMPLETED)
      .reduce((sum, o) => sum + (o.total || 0), 0)
  };
  
  document.getElementById('s-pending').textContent = stats.pending;
  document.getElementById('s-preparing').textContent = stats.preparing;
  document.getElementById('s-done').textContent = stats.completed;
  document.getElementById('s-revenue').textContent = formatCurrency(stats.revenue);
}

function openOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const modal = document.getElementById('orderModal');
  const body = document.getElementById('orderModalBody');
  const timeline = document.getElementById('orderTimeline');
  
  body.innerHTML = `
    <div class="order-detail">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700;">Pedido Mesa #${order.mesa}</h3>
          <p style="color: var(--muted); font-size: 12px;">${formatDate(order.createdAt)} ${formatTime(order.createdAt)}</p>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-${order.status === 'pending' ? 'yellow' : order.status === 'preparing' ? 'magenta' : order.status === 'ready' ? 'teal' : 'success'}">
            ${getStatusLabel(order.status)}
          </span>
          <div style="font-size: 24px; font-weight: 700; color: var(--yellow); margin-top: 8px;">
            ${formatCurrency(order.total)}
          </div>
        </div>
      </div>
      
      <div class="order-items">
        <h4 style="margin-bottom: 8px; font-size: 13px; color: var(--muted); text-transform: uppercase;">Productos</h4>
        ${(order.items || []).map(item => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-light);">
            <div>
              <span style="margin-right: 8px;">${item.emoji}</span>
              <span>${item.name}</span>
              <span style="color: var(--muted); font-size: 12px;"> x${item.qty}</span>
            </div>
            <span style="font-weight: 600;">${formatCurrency(item.price * item.qty)}</span>
          </div>
        `).join('')}
      </div>
      
      ${order.note ? `
        <div class="order-note" style="margin-top: 16px;">
          <span class="note-label">Nota para el bar:</span>
          <span class="note-text">${order.note}</span>
        </div>
      ` : ''}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
        <div class="detail-box">
          <span style="display: block; font-size: 11px; color: var(--muted); text-transform: uppercase;">Anfitriona</span>
          <span style="font-weight: 600;">${order.anfitriona || 'No asignada'}</span>
        </div>
        <div class="detail-box">
          <span style="display: block; font-size: 11px; color: var(--muted); text-transform: uppercase;">Método de Pago</span>
          <span style="font-weight: 600;">${order.paymentMethod || '—'}</span>
        </div>
      </div>
    </div>
  `;
  
  timeline.innerHTML = getTimelineStatus(order.status).map(step => `
    <div class="timeline-step ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''}">
      <div class="timeline-icon">
        <i class="fas fa-${step.icon}"></i>
      </div>
      <span class="timeline-label">${step.label}</span>
    </div>
  `).join('');
  
  modal.classList.add('show');
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('show');
}

function printOrder() {
  // Imprimir order detail (simplificado)
  window.print();
}

function cancelOrderFromModal() {
  // Lógica para cancelar pedido desde modal
  closeOrderModal();
  showNotification('Función de cancelar desde detalle en desarrollo');
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCIA LOCAL
// ═══════════════════════════════════════════════════════════════════════════════

function saveTables() {
  localStorage.setItem('frv_tables', JSON.stringify(tables));
}

function clearCompletedOrders() {
  if (!confirm('¿Eliminar todos los pedidos completados y cancelados?')) return;
  
  orders = orders.filter(o => 
    o.status === CONFIG.STATUS.PENDING || 
    o.status === CONFIG.STATUS.PREPARING || 
    o.status === CONFIG.STATUS.READY
  );
  
  if (firebaseDb) {
    const updates = {};
    orders.forEach(o => {
      updates[`orders/${o.id}`] = o;
    });
    firebaseDb.ref().update(updates);
  }
  
  renderOrders();
  updateStats();
  playNotificationSound('success');
  showNotification('✅ Pedidos antiguos eliminados');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE
// ═══════════════════════════════════════════════════════════════════════════════

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

function closeAllModals() {
  document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS (expose to window)
// ═══════════════════════════════════════════════════════════════════════════════

window.changeOrderStatus = changeOrderStatus;
window.openOrderDetail = openOrderDetail;
window.closeOrderModal = closeOrderModal;
window.printOrder = printOrder;
window.cancelOrderFromModal = cancelOrderFromModal;

// Inventory
window.openInventoryModal = openInventoryModal;
window.closeInventoryModal = closeInventoryModal;
window.saveInventory = saveInventoryItem;
window.editInventory = editInventory;
window.deleteInventory = deleteInventory;

// Staff
window.openStaffModal = openStaffModal;
window.closeStaffModal = closeStaffModal;
window.saveStaff = saveStaff;
window.editStaff = editStaff;
window.deleteStaff = deleteStaff;

// Tables
window.openTableDetail = openTableDetail;

// Navigation
window.switchView = switchView;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;

// Actions
window.refreshData = refreshData;
window.clearCompleted = clearCompletedOrders;
window.toggleSound = toggleSound;

// Settings
window.backupDatabase = backupDatabase;
window.restoreDatabase = restoreDatabase;
window.clearAllData = clearAllData;

// Export
window.exportCSV = exportToCSV;
window.exportSalesToExcel = exportToExcel;
window.exportInventory = () => exportToCSV('inventory');
window.generatePDF = (type) => exportToPDF(type);
window.printView = printView;

// Login
window.togglePassword = togglePassword;
window.login = login;
window.logout = logout;

// Notification
window.closeNotification = closeNotification;

console.log('✅ FRV Panel Bar v2.0 cargado');

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES GLOBALES EXPUESTAS
// ═══════════════════════════════════════════════════════════════════════════════

// Exponer todas las funciones necesarias para los eventos inline
window.changeOrderStatus = changeOrderStatus;
window.openOrderDetail = openOrderDetail;
window.closeOrderModal = closeOrderModal;
window.printOrder = printOrder;
window.cancelOrderFromModal = cancelOrderFromModal;
window.openInventoryModal = openInventoryModal;
window.closeInventoryModal = closeInventoryModal;
window.saveInventoryItem = saveInventoryItem;
window.editInventory = editInventory;
window.deleteInventory = deleteInventory;
window.openStaffModal = openStaffModal;
window.closeStaffModal = closeStaffModal;
window.saveStaff = saveStaff;
window.editStaff = editStaff;
window.deleteStaff = deleteStaff;
window.openTableDetail = openTableDetail;
window.switchView = switchView;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.refreshData = refreshData;
window.clearCompleted = clearCompletedOrders;
window.toggleSound = toggleSound;
window.backupDatabase = backupDatabase;
window.restoreDatabase = restoreDatabase;
window.clearAllData = clearAllData;
window.exportCSV = exportToCSV;
window.exportSalesToExcel = exportToExcel;
window.exportInventory = () => exportToCSV('inventory');
window.generatePDF = (type) => exportToPDF(type);
window.printView = printView;
window.applyDateFilter = applyDateFilter;
window.closeNotification = closeNotification;
window.logout = logout;
window.openTableModal = openTableModal;
window.resetAllTables = resetAllTables;
window.reorder = reorder;
window.closeAllModals = closeAllModals;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES ADICIONALES
// ═══════════════════════════════════════════════════════════════════════════════

function reorder(orderId) {
  const original = orders.find(o => o.id === orderId);
  if (!original) return;
  
  // Crear nuevo pedido idéntico pero pendiente
  const newOrder = {
    ...JSON.parse(JSON.stringify(original)),
    id: generateId(),
    status: CONFIG.STATUS.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null
  };
  
  orders.unshift(newOrder);
  
  // Guardar en Firebase
  if (firebaseDb) {
    firebaseDb.ref('orders/' + newOrder.id).set(newOrder);
  }
  
  renderOrders();
  updateStats();
  showNotification(`✅ Pedido repetido — Mesa ${newOrder.mesa}`);
}

function closeAllModals() {
  document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
}

function applyDateFilter() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (!startDate || !endDate) {
    showNotification('Seleccione rango de fechas', 'warning');
    return;
  }
  
  // Filtrar reporte por fecha
  const filtered = {};
  Object.entries(salesReport).forEach(([date, data]) => {
    if (date >= startDate && date <= endDate) {
      filtered[date] = data;
    }
  });
  
  // Actualizar vista (simplificado)
  showNotification(`Mostrando ${Object.keys(filtered).length} días`);
}

function openTableModal() {
  showNotification('Función agregar mesa en desarrollo', 'warning');
}

function resetAllTables() {
  if (!confirm('¿Reiniciar estado de todas las mesas?')) return;
  
  tables.forEach(t => {
    t.status = 'free';
    t.currentOrder = null;
    t.assignedStaff = [];
  });
  
  saveTables();
  renderTables();
  updateTablesStatus();
  showNotification('✅ Mesas reiniciadas');
}
