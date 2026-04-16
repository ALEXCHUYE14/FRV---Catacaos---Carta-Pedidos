// ── CONFIG ──────────────────────────────────────
let orders = [];
let currentFilter = 'all';
let soundEnabled = true;
let firebaseUnsubscribe = null;
let revenueVisible = true;
let expandedOrders = new Set();
let searchQuery = '';
let inventory = [];
let cashTransactions = [];
let tablesStatus = {};

// ── DATA FROM MENU SYSTEM ───────────────────────────
const menuProducts = [
  { id:10, name:'Cristal', price:12, emoji:'🍺', cat:'cervezas' },
  { id:11, name:'Pilsen', price:12, emoji:'🍻', cat:'cervezas' },
  { id:12, name:'Cusqueña', price:13, emoji:'🍺', cat:'cervezas' },
  { id:1, name:'Pisco Sour', price:18, emoji:'🍋', cat:'tragos' },
  { id:2, name:'Chilcano', price:15, emoji:'🍸', cat:'tragos' },
  { id:3, name:'Mojito', price:16, emoji:'🌿', cat:'tragos' },
  { id:4, name:'Margarita', price:17, emoji:'🍊', cat:'tragos' },
  { id:5, name:'Piña Colada', price:16, emoji:'🍍', cat:'tragos' },
  { id:6, name:'Sex on the Beach', price:16, emoji:'🏖️', cat:'tragos' },
  { id:16, name:"Mike's", price:12, emoji:'🍋', cat:'tragos' },
  { id:7, name:'Tequila Shot', price:10, emoji:'🥃', cat:'shots' },
  { id:8, name:'Jäger Shot', price:10, emoji:'🌿', cat:'shots' },
  { id:9, name:'Ron con Cola', price:12, emoji:'🫙', cat:'shots' },
  { id:13, name:'Agua Mineral', price:3, emoji:'💧', cat:'sin-alcohol' },
  { id:14, name:'Coca Cola', price:4, emoji:'⭐', cat:'sin-alcohol' },
  { id:15, name:'Frugos', price:4, emoji:'🧃', cat:'sin-alcohol' },
];

const anfitrionasList = [
  { name: 'María García', phone: '51924996961' },
  { name: 'Ana Rodríguez', phone: '51924996961' },
  { name: 'Laura Martínez', phone: '51924996961' },
  { name: 'Sofía López', phone: '51924996961' },
  { name: 'Carmen Torres', phone: '51924996961' },
];

// ── INICIALIZACIÓN ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('📝 DOM Content Loaded');
  
  if (localStorage.getItem('frv_admin_auth') !== 'true') {
    console.log('🔒 No autenticado, redirigiendo...');
    window.location.href = 'login.html';
    return;
  }
  
  console.log('🚀 Panel iniciándose...');
  initClock();
  
  // Verificar que los elementos de conexión existan
  const statusEl = document.getElementById('connectionStatus');
  const textEl = document.getElementById('connectionText');
  console.log('📊 Elementos de conexión encontrados:', !!statusEl, !!textEl);
  
  // Intentar conexión inmediata
  console.log('📡 Ejecutando tryConnection...');
  setTimeout(() => {
    tryConnection();
  }, 500);
});

async function tryConnection() {
  console.log('🔌 tryConnection() iniciada...');
  
  // Actualizar UI directamente
  const statusEl = document.getElementById('connectionStatus');
  const textEl = document.getElementById('connectionText');
  if (statusEl && textEl) {
    statusEl.className = 'connection-status connecting';
    textEl.textContent = 'Conectando...';
    console.log('📊 UI actualizado a: Conectando...');
  }
  
  // Timeout de 15 segundos para toda la conexión
  const connectionTimeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout de conexión (15s)')), 15000)
  );
  
  try {
    // Verificar que firebase esté cargado
    console.log('🔍 Verificando firebase SDK...');
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK no cargado');
    }
    console.log('✅ Firebase SDK encontrado');
    
    // Verificar FirebaseClient
    console.log('🔍 Verificando FirebaseClient...');
    if (typeof FirebaseClient === 'undefined') {
      throw new Error('FirebaseClient no definido');
    }
    console.log('✅ FirebaseClient encontrado');
    
    // Inicializar
    console.log('🚀 Iniciando Firebase...');
    const initPromise = FirebaseClient.init();
    const db = await Promise.race([initPromise, connectionTimeout]);
    
    if (!db) {
      throw new Error('No se pudo inicializar Firebase');
    }
    console.log('✅ Firebase inicializado, db:', !!db);
    
    console.log('📥 Cargando pedidos...');
    
    // Cargar pedidos con timeout
    const ordersPromise = FirebaseClient.getOrders();
    orders = await Promise.race([ordersPromise, connectionTimeout]);
    
    console.log('📦 Pedidos obtenidos:', orders?.length || 0);
    renderOrders();
    updateStatsFromOrders();
    
    // Cargar inventario
    console.log('📦 Cargando inventario...');
    try {
      const invPromise = loadInventoryFromFirebase();
      inventory = await Promise.race([invPromise, connectionTimeout]);
    } catch (invError) {
      console.warn('⚠️ Inventario no cargado:', invError.message);
    }
    
    // Conexión exitosa - actualizar UI directamente
    console.log('📊 Actualizando UI a: En vivo');
    if (statusEl && textEl) {
      statusEl.className = 'connection-status connected';
      textEl.textContent = 'En vivo';
      console.log('✅ UI actualizado a: En vivo');
    }
    console.log('✅ ¡Conectado! Pedidos:', orders?.length || 0);
    
    // Suscribirse a actualizaciones en tiempo real
    console.log('📡 Iniciando suscripción en tiempo real...');
    subscribeToOrdersUpdates();
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Actualizar UI a error
    if (statusEl && textEl) {
      statusEl.className = 'connection-status disconnected';
      textEl.textContent = 'Error: ' + error.message.substring(0, 30);
      console.log('📊 UI actualizado a error:', error.message);
    }
    showOfflineMode();
  }
}

function showOfflineMode() {
  // Cargar desde localStorage
  const saved = localStorage.getItem('frv_orders');
  if (saved) orders = JSON.parse(saved);
  
  const inv = localStorage.getItem('frv_inventory');
  if (inv) inventory = JSON.parse(inv);
  
  renderOrders();
  updateStatsFromOrders();
  console.log('📱 Modo offline cargado');
}

async function loadInventoryFromFirebase() {
  try {
    const db = FirebaseClient.init();
    if (!db) return [];
    
    const snap = await db.ref('inventory').once('value');
    const data = snap.val() || {};
    return Object.entries(data).map(([id, item]) => ({ id, ...item }));
  } catch (e) {
    return [];
  }
}

let inventoryUnsubscribe = null;

async function subscribeToInventoryChanges() {
  // Esta función se llama después de que la conexión esté establecida
  // No hace falta por ahora - el inventario se carga al inicio
}

function updateAllOrdersPrices() {
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const invItem = inventory.find(i => i.name === item.name);
        if (invItem) {
          item.price = invItem.price;
          item.emoji = invItem.emoji;
        }
      });
    }
  });
  
  renderOrders();
  updateStatsFromOrders();
}

// ── LOGOUT ──────────────────────────────────────
function logout() {
  localStorage.removeItem('frv_admin_auth');
  localStorage.removeItem('frv_admin_user');
  localStorage.removeItem('frv_login_time');
  window.location.href = 'login.html';
}

// ── CONEXIÓN FIREBASE (TIEMPO REAL) ─────────────
let firebaseConnected = false;

function loadFromLocalStorage() {
  const saved = localStorage.getItem('frv_orders');
  if (saved) {
    orders = JSON.parse(saved);
    renderOrders();
    updateStatsFromOrders();
  }
  
  const inv = localStorage.getItem('frv_inventory');
  if (inv) inventory = JSON.parse(inv);
  
  addFeedItem('Sistema', '📱 Modo offline');
}

function loadFromLocalStorage() {
  // Cargar pedidos desde localStorage como respaldo
  const savedOrders = localStorage.getItem('frv_orders');
  if (savedOrders) {
    try {
      orders = JSON.parse(savedOrders);
      renderOrders();
      updateStatsFromOrders();
      console.log('📥 Pedidos cargados desde localStorage:', orders.length);
      addFeedItem('Sistema', '📱 Modo local: ' + orders.length + ' pedidos');
    } catch (e) {
      console.error('Error parseando pedidos locales:', e);
      orders = [];
    }
  } else {
    addFeedItem('Sistema', '📱 Modo local: Sin pedidos guardados');
  }
  
  // También cargar inventario local
  const savedInventory = localStorage.getItem('frv_inventory');
  if (savedInventory) {
    try {
      inventory = JSON.parse(savedInventory);
      console.log('📦 Inventario cargado desde local:', inventory.length);
    } catch (e) {
      inventory = [];
    }
  }
  
  renderOrders();
  updateStatsFromOrders();
  
  // Intentar reconexión cada 30 segundos
  setInterval(tryReconnect, 30000);
}

async function tryReconnect() {
  if (firebaseConnected) return;
  
  console.log('🔄 Intentando reconexión a Firebase...');
  try {
    const db = FirebaseClient.init();
    if (db) {
      firebaseConnected = true;
      updateConnectionStatus('connected', 'Reconectado');
      addFeedItem('Sistema', '🟢 Firebase reconectado');
      loadOrders();
    }
  } catch (e) {
    console.log('❌ Reconexión fallida:', e);
  }
}

// ── SUSCRIBIRSE A CAMBIOS EN TIEMPO REAL ────────
let realtimePollingInterval = null;

function subscribeToOrdersUpdates() {
  if (firebaseUnsubscribe) {
    console.log('🔄 Cancelando suscripción anterior...');
    if (typeof unsubscribeFromOrders === 'function') {
      unsubscribeFromOrders();
    }
  }
  
  // Detener cualquier polling anterior
  if (realtimePollingInterval) {
    clearInterval(realtimePollingInterval);
    realtimePollingInterval = null;
  }
  
  // Intentar usar la función directa de Firebase
  console.log('📡 Intentando suscripción en tiempo real...');
  
  if (typeof subscribeToOrders === 'function') {
    console.log('✅ Función subscribeToOrders encontrada');
    try {
      firebaseUnsubscribe = subscribeToOrders((data) => {
        console.log('📡 Cambio detectado en Firebase:', data);
        console.log('📡 Datos recibidos:', JSON.stringify(data));
        
        if (data && data.orders && Array.isArray(data.orders)) {
          // Detectar nuevos pedidos
          const previousOrderIds = orders.map(o => o.id);
          const newOrders = data.orders.filter(o => !previousOrderIds.includes(o.id));
          
          console.log(`📡 Pedidos anteriores: ${previousOrderIds.length}, Nuevos: ${newOrders.length}`);
          
          // Notificar nuevos pedidos
          newOrders.forEach(order => {
            if (!previousOrderIds.includes(order.id)) {
              handleNewOrder(order);
            }
          });
          
          // Actualizar lista completa
          orders = data.orders;
          console.log(`📡 Actualizando UI con ${orders.length} pedidos`);
          
          renderOrders();
          updateStatsFromOrders();
          
          // Mostrar stats en consola para debug
          const stats = {
            pending: orders.filter(o => o.status === 'pending').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            completed: orders.filter(o => o.status === 'completed').length
          };
          console.log('📡 Stats actualizados:', stats);
        } else {
          console.warn('📡 Datos recibidos sin orders:', data);
        }
      });
      console.log('✅ Suscripción establecida');
    } catch (error) {
      console.error('❌ Error al establecer suscripción:', error);
    }
  } else {
    console.error('❌ subscribeToOrders no está disponible');
    console.error('❌ Funciones disponibles:', typeof subscribeToOrders, typeof FirebaseClient?.subscribeToOrders);
  }
  
  // Como respaldo, agregar polling cada 5 segundos
  console.log('📡 Agregando respaldo de polling cada 5 segundos...');
  realtimePollingInterval = setInterval(async () => {
    console.log('🔄 Verificando pedidos...');
    try {
      if (typeof getOrders === 'function') {
        const freshOrders = await getOrders();
        if (freshOrders && Array.isArray(freshOrders)) {
          orders = freshOrders;
          renderOrders();
          updateStatsFromOrders();
          console.log(`🔄 Pedidos recargados: ${orders.length}`);
        }
      }
    } catch (error) {
      console.error('❌ Error en polling:', error);
    }
  }, 5000);
  
  // Forzar recarga inicial
  console.log('📡 Forzando recarga inicial...');
  setTimeout(() => {
    loadOrders();
  }, 1000);
}

// Manejar nuevo pedido
function handleNewOrder(order) {
  console.log('🆕 Nuevo pedido recibido:', order);
  
  // Mostrar notificación
  const total = order.total || 0;
  showNotification('🆕 Nuevo Pedido', `Mesa ${order.mesa} - ${order.items?.length || 0} productos`, 'success');
  
  // Reproducir sonido
  if (soundEnabled) {
    playNotificationSound();
  }
  
  // Agregar al feed solo si es un nuevo pedido
  addFeedItem('Pedido', `🆕 Mesa ${order.mesa} - S/ ${total.toFixed(2)}`);
}

// ── CARGAR PEDIDOS ──────────────────────────────
async function loadOrders() {
  try {
    console.log('📥 Cargando pedidos desde Firebase...');
    
    let loadedOrders = [];
    
    // Intentar primero con función directa
    if (typeof getOrders === 'function') {
      console.log('📥 Usando getOrders directo...');
      loadedOrders = await getOrders();
    } else if (typeof FirebaseClient !== 'undefined' && FirebaseClient.getOrders) {
      // Usar FirebaseClient como respaldo
      console.log('📥 Usando FirebaseClient.getOrders...');
      loadedOrders = await FirebaseClient.getOrders();
    } else {
      console.error('❌ No hay función para obtener pedidos');
      addFeedItem('Sistema', '❌ Error: No se puede cargar pedidos');
      return;
    }
    
    orders = loadedOrders || [];
    
    console.log(`✅ ${orders.length} pedidos cargados`);
    console.log('📋 Primer pedido:', orders[0] ? JSON.stringify(orders[0]) : 'NINGUNO');
    
    // Guardar en localStorage como respaldo offline
    try {
      localStorage.setItem('frv_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
    
    // Actualizar estadísticas
    updateStatsFromOrders();
    
    // Renderizar pedidos
    renderOrders();
    
    addFeedItem('Sistema', `📥 ${orders.length} pedidos`);
  } catch (error) {
    console.error('❌ Error al cargar pedidos:', error);
    addFeedItem('Sistema', `❌ Error: ${error.message}`);
  }
}

// ── ACTUALIZAR ESTADÍSTICAS ─────────────────────
function updateStatsFromOrders() {
  // Sumar TODOS los pedidos (pendientes, preparando, completados)
  const allRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: allRevenue  // Todos los pedidos
  };
  
  updateStats(stats);
}

function updateStats(stats) {
  const pendingEl = document.getElementById('s-pending');
  if (pendingEl) pendingEl.textContent = stats.pending || 0;
  
  const preparingEl = document.getElementById('s-preparing');
  if (preparingEl) preparingEl.textContent = stats.preparing || 0;
  
  const doneEl = document.getElementById('s-done');
  if (doneEl) doneEl.textContent = stats.completed || 0;
  
  const revenueEl = document.getElementById('s-revenue');
  if (revenueEl) {
    if (revenueVisible) {
      revenueEl.textContent = `S/ ${(stats.revenue || 0).toFixed(0)}`;
    } else {
      revenueEl.textContent = 'S/ ***';
    }
  }
}

// ── TOGGLE REVENUE VISIBILITY ───────────────────
function toggleRevenue() {
  revenueVisible = !revenueVisible;
  const btn = document.querySelector('.revenue-toggle');
  
  if (revenueVisible) {
    btn.textContent = '👁️ Ocultar';
    updateStatsFromOrders();
  } else {
    btn.textContent = '👁️ Mostrar';
    document.getElementById('s-revenue').textContent = 'S/ ***';
  }
}

// ── RENDERIZAR PEDIDOS ──────────────────────────
function renderOrders() {
  const grid = document.getElementById('grid');
  
  // Filtrar pedidos
  let filteredOrders = orders;
  if (currentFilter !== 'all') {
    filteredOrders = orders.filter(o => o.status === currentFilter);
  }
  
  if (filteredOrders.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--muted);">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <div style="font-size: 16px; font-weight: 600;">No hay pedidos ${currentFilter === 'all' ? '' : 'con este estado'}</div>
        <div style="font-size: 13px; margin-top: 8px;">Los pedidos aparecerán aquí en tiempo real</div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filteredOrders.map(order => createOrderCard(order)).join('');
}

// Crear tarjeta de pedido
function createOrderCard(order) {
  const statusColors = {
    pending: '#ffc800',
    preparing: '#ff6b6b',
    ready: '#00ff88',
    completed: '#888888'
  };
  
  const statusLabels = {
    pending: '⏳ Pendiente',
    preparing: '⚡ Preparando',
    ready: '✅ Listo',
    completed: '✔️ Completado'
  };
  
  const timeAgo = getTimeAgo(order.createdAt);
  const isExpanded = expandedOrders.has(order.id);
  const itemsToShow = isExpanded ? order.items : order.items.slice(0, 3);
  const hasMoreItems = order.items.length > 3;
  
  return `
    <div class="order-card" style="border-left: 4px solid ${statusColors[order.status] || '#888'}">
      <div class="order-header">
        <div class="order-mesa">
          <span class="mesa-num">${order.mesa}</span>
          <span class="mesa-label">MESA</span>
        </div>
        <div class="order-time">${timeAgo}</div>
      </div>
      
      <div class="order-items">
        ${itemsToShow.map(item => `
          <div class="order-item">
            <span class="item-name">${item.name}</span>
            <span class="item-qty">x${item.qty}</span>
            <span class="item-price">S/ ${(item.price * item.qty).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
      ${hasMoreItems ? `
        <button class="expand-btn" onclick="toggleExpandOrder('${order.id}')">
          ${isExpanded ? '▲ Ver menos' : `▼ Ver ${order.items.length - 3} más`}
        </button>
      ` : ''}
      
      ${order.note ? `
        <div class="order-note">
          <span class="note-label">📝 Nota:</span>
          <span class="note-text">${order.note}</span>
        </div>
      ` : ''}
      
      <div class="order-footer">
        <div class="order-total">
          <span class="total-label">Total:</span>
          <span class="total-value">S/ ${order.total.toFixed(2)}</span>
        </div>
        <div class="order-status" style="color: ${statusColors[order.status]}">
          ${statusLabels[order.status]}
        </div>
      </div>
      
      <div class="order-actions">
        ${order.status === 'pending' ? `
          <button class="action-btn preparing" onclick="updateOrderStatus('${order.id}', 'preparing')">
            ⚡ Iniciar Preparación
          </button>
          <button class="action-btn cancel" onclick="cancelOrder('${order.id}')">
            ❌ Cancelar
          </button>
        ` : ''}
        ${order.status === 'preparing' ? `
          <button class="action-btn ready" onclick="updateOrderStatus('${order.id}', 'ready')">
            ✅ Marcar como Listo
          </button>
          <button class="action-btn cancel" onclick="cancelOrder('${order.id}')">
            ❌ Cancelar
          </button>
        ` : ''}
        ${order.status === 'ready' ? `
          <button class="action-btn completed" onclick="updateOrderStatus('${order.id}', 'completed')">
            ✔️ Completar Pedido
          </button>
        ` : ''}
        ${order.status === 'completed' ? `
          <button class="action-btn preparing" onclick="updateOrderStatus('${order.id}', 'pending')">
            🔄 Rehacer Pedido
          </button>
        ` : ''}
        <button class="action-btn delete" onclick="deleteOrder('${order.id}')">
          🗑️ Eliminar
        </button>
      </div>
    </div>
  `;
}

// ── TOGGLE EXPAND ORDER ─────────────────────────
function toggleExpandOrder(orderId) {
  if (expandedOrders.has(orderId)) {
    expandedOrders.delete(orderId);
  } else {
    expandedOrders.add(orderId);
  }
  renderOrders();
}

// ── ACTUALIZAR ESTADO DE PEDIDO ─────────────────
async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log(`🔄 Actualizando pedido ${orderId} a ${newStatus}...`);
    
    if (typeof FirebaseClient === 'undefined') {
      showNotification('❌ Error', 'Firebase no está disponible', 'error');
      return;
    }
    
    const updatedOrder = await FirebaseClient.updateOrderStatus(orderId, newStatus);
    
    if (updatedOrder) {
      console.log('✅ Pedido actualizado:', updatedOrder);
      
      // Actualizar en la lista local
      const index = orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        orders[index] = updatedOrder;
      }
      
      renderOrders();
      updateStatsFromOrders();
      
      addFeedItem('Actualización', `📝 Pedido ${orderId} actualizado a: ${newStatus}`);
      showNotification('✅ Actualizado', `Pedido actualizado a ${newStatus}`, 'success');
    } else {
      console.error('❌ No se pudo actualizar el pedido');
      showNotification('❌ Error', 'No se pudo actualizar el pedido', 'error');
    }
  } catch (error) {
    console.error('❌ Error al actualizar pedido:', error);
    showNotification('❌ Error', `Error: ${error.message}`, 'error');
  }
}

// ── CANCELAR PEDIDO ─────────────────────────────
async function cancelOrder(orderId) {
  try {
    console.log(`❌ Cancelando pedido ${orderId}...`);
    
    if (typeof FirebaseClient === 'undefined') {
      showNotification('❌ Error', 'Firebase no está disponible', 'error');
      return;
    }
    
    const updatedOrder = await FirebaseClient.updateOrderStatus(orderId, 'cancelled');
    
    if (updatedOrder) {
      console.log('✅ Pedido cancelado:', updatedOrder);
      
      // Actualizar en la lista local
      const index = orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        orders[index] = updatedOrder;
      }
      
      renderOrders();
      updateStatsFromOrders();
      
      addFeedItem('Cancelación', `❌ Pedido ${orderId} cancelado`);
      showNotification('❌ Cancelado', 'Pedido cancelado', 'error');
    } else {
      console.error('❌ No se pudo cancelar el pedido');
      showNotification('❌ Error', 'No se pudo cancelar el pedido', 'error');
    }
  } catch (error) {
    console.error('❌ Error al cancelar pedido:', error);
    showNotification('❌ Error', `Error: ${error.message}`, 'error');
  }
}

// ── ELIMINAR PEDIDO ─────────────────────────────
async function deleteOrder(orderId) {
  if (!confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    console.log(`🗑️ Eliminando pedido ${orderId}...`);
    
    if (typeof FirebaseClient === 'undefined') {
      showNotification('❌ Error', 'Firebase no está disponible', 'error');
      return;
    }
    
    // Eliminar de Firebase
    const db = FirebaseClient.init();
    if (db) {
      await db.ref(`orders/${orderId}`).remove();
    }
    
    // Eliminar de la lista local
    orders = orders.filter(o => o.id !== orderId);
    
    renderOrders();
    updateStatsFromOrders();
    
    addFeedItem('Eliminación', `🗑️ Pedido ${orderId} eliminado`);
    showNotification('🗑️ Eliminado', 'Pedido eliminado permanentemente', 'error');
  } catch (error) {
    console.error('❌ Error al eliminar pedido:', error);
    showNotification('❌ Error', `Error: ${error.message}`, 'error');
  }
}

// ── LIMPIAR TODOS LOS PEDIDOS ───────────────────
function showClearModal() {
  document.getElementById('clearModal').classList.add('show');
  document.getElementById('clearPassword').value = '';
  document.getElementById('clearPassword').focus();
}

function closeClearModal() {
  document.getElementById('clearModal').classList.remove('show');
}

async function confirmClear() {
  const password = document.getElementById('clearPassword').value;
  
  if (password !== 'frv2026') {
    showNotification('❌ Error', 'Contraseña incorrecta', 'error');
    return;
  }
  
  try {
    console.log('🗑️ Limpiando todos los pedidos...');
    
    if (typeof FirebaseClient === 'undefined') {
      showNotification('❌ Error', 'Firebase no está disponible', 'error');
      return;
    }
    
    // Eliminar todos los pedidos de Firebase
    const db = FirebaseClient.init();
    if (db) {
      await db.ref('orders').remove();
    }
    
    // Limpiar lista local
    orders = [];
    
    renderOrders();
    updateStatsFromOrders();
    
    closeClearModal();
    
    addFeedItem('Limpieza', '🗑️ Todos los pedidos han sido eliminados');
    showNotification('✅ Limpieza', 'Todos los pedidos han sido eliminados', 'success');
  } catch (error) {
    console.error('❌ Error al limpiar pedidos:', error);
    showNotification('❌ Error', `Error: ${error.message}`, 'error');
  }
}

// ── FILTRAR PEDIDOS ─────────────────────────────
function setFilter(filter, element) {
  currentFilter = filter;
  
  // Actualizar tabs activos
  document.querySelectorAll('.ftab').forEach(tab => tab.classList.remove('active'));
  element.classList.add('active');
  
  renderOrders();
}

// ── FEED DE ACTIVIDAD ───────────────────────────
function addFeedItem(source, message) {
  const feed = document.getElementById('feed');
  if (!feed) return;
  
  const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  
  // Limpiar message de caracteres especiales problemáticos
  const cleanMessage = String(message).replace(/[<>]/g, '');
  
  const feedItem = document.createElement('div');
  feedItem.className = 'feed-item';
  feedItem.innerHTML = `
    <div class="fi-top"><span>${source}</span><span>${time}</span></div>
    <div class="fi-msg">${cleanMessage}</div>
  `;
  
  // Insertar al inicio
  feed.insertBefore(feedItem, feed.firstChild);
  
  // Mantener solo los últimos 15 items (mucho más limpio)
  while (feed.children.length > 15) {
    feed.removeChild(feed.lastChild);
  }
}

// ── NOTIFICACIONES ──────────────────────────────
function showNotification(title, message, type = 'success') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    <div class="notification-title">${title}</div>
    <div class="notification-message">${message}</div>
  `;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Remover después de 5 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// ── SONIDO DE NOTIFICACIÓN ──────────────────────
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('No se pudo reproducir sonido:', error);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  document.getElementById('sndLabel').textContent = soundEnabled ? 'Sonido activo' : 'Sonido silenciado';
}

// ── PROBAR CONEXIÓN ─────────────────────────────
async function testConnection() {
  addFeedItem('Sistema', '🔌 Probando conexión con Firebase...');
  
  try {
    if (typeof FirebaseClient === 'undefined') {
      addFeedItem('Sistema', '❌ FirebaseClient no está cargado');
      showNotification('❌ Error', 'Firebase no está cargado', 'error');
      return;
    }
    
    const result = await FirebaseClient.testConnection();
    
    if (result.success) {
      addFeedItem('Sistema', `✅ ${result.message} - ${result.ordersCount || 0} pedidos en sistema`);
      showNotification('✅ Conexión Exitosa', result.message, 'success');
    } else {
      addFeedItem('Sistema', `❌ Error: ${result.error}`);
      showNotification('❌ Error de Conexión', result.error, 'error');
    }
  } catch (error) {
    addFeedItem('Sistema', `❌ Error de conexión: ${error.message}`);
    showNotification('❌ Error', 'No se pudo conectar a Firebase', 'error');
  }
}

// ── DEMO - SIMULAR PEDIDO ───────────────────────
async function newDemoOrder() {
  const demoOrder = {
    mesa: Math.floor(Math.random() * 20) + 1,
    items: [
      { name: 'Pisco Sour', emoji: '🍋', qty: 2, price: 18, total: 36, cat: 'tragos' },
      { name: 'Cristal', emoji: '🍺', qty: 1, price: 8, total: 8, cat: 'cervezas' }
    ],
    note: 'Pedido de demostración',
    paymentMethod: '💳 TARJETA',
    total: 44,
    anfitriona: 'María García',
    anfitrionaPhone: '51924996961'
  };
  
  try {
    if (typeof FirebaseClient === 'undefined') {
      addFeedItem('Demo', '❌ Firebase no está disponible');
      return;
    }
    
    const savedOrder = await FirebaseClient.createOrder(demoOrder);
    
    if (savedOrder) {
      console.log('✅ Pedido demo creado:', savedOrder);
      addFeedItem('Demo', `🆕 Pedido demo creado para Mesa ${demoOrder.mesa}`);
      showNotification('✅ Demo', 'Pedido demo creado exitosamente', 'success');
    } else {
      console.error('❌ Error al crear pedido demo');
      addFeedItem('Demo', `❌ Error al crear pedido demo`);
    }
  } catch (error) {
    console.error('❌ Error al crear pedido demo:', error);
    addFeedItem('Demo', `❌ Error de conexión`);
  }
}

// ── REPORTES ────────────────────────────────────
function showReports() {
  document.getElementById('reportsModal').classList.add('show');
  generateReports();
}

function closeReports() {
  document.getElementById('reportsModal').classList.remove('show');
}

function generateReports() {
  // Usar todos los pedidos (excepto cancelados)
  const allOrders = orders.filter(o => o.status !== 'cancelled');
  
  // Validar que haya pedidos
  if (allOrders.length === 0) {
    document.getElementById('mesasReport').innerHTML = '<div class="report-row"><span>No hay pedidos</span></div>';
    document.getElementById('anfitrionasReport').innerHTML = '<div class="report-row"><span>No hay pedidos</span></div>';
    document.getElementById('paymentReport').innerHTML = '<div class="report-row"><span>No hay pedidos</span></div>';
    document.getElementById('productsReport').innerHTML = '<div class="report-row"><span>No hay pedidos</span></div>';
    document.getElementById('mesasTotal').textContent = 'S/ 0.00';
    document.getElementById('productsTotal').textContent = 'S/ 0.00';
    document.getElementById('generalTotal').textContent = 'S/ 0.00';
    return;
  }
  
  // Reporte por mesas
  const mesas = {};
  allOrders.forEach(order => {
    if (!mesas[order.mesa]) {
      mesas[order.mesa] = { count: 0, total: 0 };
    }
    mesas[order.mesa].count++;
    mesas[order.mesa].total += order.total || 0;
  });
  
  const mesasReport = document.getElementById('mesasReport');
  mesasReport.innerHTML = Object.entries(mesas)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([mesa, data]) => `
      <div class="report-row">
        <span>Mesa ${mesa}</span>
        <span>${data.count} pedidos</span>
        <span>S/ ${data.total.toFixed(2)}</span>
      </div>
    `).join('');
  
  document.getElementById('mesasTotal').textContent = `S/ ${Object.values(mesas).reduce((sum, m) => sum + m.total, 0).toFixed(2)}`;
  
  // Reporte por anfitrionas
  const anfitrionas = {};
  allOrders.forEach(order => {
    if (order.anfitriona) {
      if (!anfitrionas[order.anfitriona]) {
        anfitrionas[order.anfitriona] = { count: 0, total: 0 };
      }
      anfitrionas[order.anfitriona].count++;
      anfitrionas[order.anfitriona].total += order.total || 0;
    }
  });
  
  const anfitrionasReport = document.getElementById('anfitrionasReport');
  anfitrionasReport.innerHTML = Object.entries(anfitrionas)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([anfitriona, data]) => `
      <div class="report-row">
        <span>${anfitriona}</span>
        <span>${data.count} pedidos</span>
        <span>S/ ${data.total.toFixed(2)}</span>
      </div>
    `).join('');
  
  // Reporte por métodos de pago
  const payments = {};
  allOrders.forEach(order => {
    if (order.paymentMethod) {
      if (!payments[order.paymentMethod]) {
        payments[order.paymentMethod] = { count: 0, total: 0 };
      }
      payments[order.paymentMethod].count++;
      payments[order.paymentMethod].total += order.total || 0;
    }
  });
  
  const paymentReport = document.getElementById('paymentReport');
  paymentReport.innerHTML = Object.entries(payments)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([method, data]) => `
      <div class="report-row">
        <span>${method}</span>
        <span>${data.count} pedidos</span>
        <span>S/ ${data.total.toFixed(2)}</span>
      </div>
    `).join('');
  
  // Reporte por productos
  const products = {};
  allOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (!products[item.name]) {
          products[item.name] = { qty: 0, total: 0 };
        }
        products[item.name].qty += item.qty || 0;
        products[item.name].total += (item.price || 0) * (item.qty || 0);
      });
    }
  });
  
  const productsReport = document.getElementById('productsReport');
  productsReport.innerHTML = Object.entries(products)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([product, data]) => `
      <div class="report-row">
        <span>${product}</span>
        <span>${data.qty} uds</span>
        <span>S/ ${data.total.toFixed(2)}</span>
      </div>
    `).join('');
  
  document.getElementById('productsTotal').textContent = `S/ ${Object.values(products).reduce((sum, p) => sum + p.total, 0).toFixed(2)}`;
  
  // Total general
  const generalTotal = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  document.getElementById('generalTotal').textContent = `S/ ${generalTotal.toFixed(2)}`;
}

// ── GENERAR PDF REAL CON JSPDF ─────────────────────
async function generatePDF() {
  // Verificar jsPDF
  if (typeof window.jspdf === 'undefined') {
    showNotification('❌ Error', ' libreria PDF no cargó. Recarga la página.', 'error');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    showNotification('❌ Error', 'No se pudo generar PDF', 'error');
    return;
  }
  
  const allOrders = orders.filter(o => o.status !== 'cancelled');
  
  if (allOrders.length === 0) {
    showNotification('❌ Sin pedidos', 'No hay pedidos para generar reporte', 'error');
    addFeedItem('Reporte', '❌ No hay pedidos para generar reporte');
    return;
  }
  
  const doc = new jsPDF();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentDate = today.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentTime = today.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = allOrders.length;
  const uniqueMesas = [...new Set(allOrders.map(o => o.mesa))].length;
  const uniqueAnfitrionas = [...new Set(allOrders.map(o => o.anfitriona).filter(Boolean))].length;
  
  const mesas = {};
  allOrders.forEach(order => {
    if (!mesas[order.mesa]) mesas[order.mesa] = { count: 0, total: 0 };
    mesas[order.mesa].count++;
    mesas[order.mesa].total += order.total || 0;
  });
  
  const anfitrionas = {};
  allOrders.forEach(order => {
    if (order.anfitriona) {
      if (!anfitrionas[order.anfitriona]) anfitrionas[order.anfitriona] = { count: 0, total: 0 };
      anfitrionas[order.anfitriona].count++;
      anfitrionas[order.anfitriona].total += order.total || 0;
    }
  });
  
  const products = {};
  allOrders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        if (!products[item.name]) products[item.name] = { qty: 0, total: 0 };
        products[item.name].qty += item.qty || 0;
        products[item.name].total += (item.price || 0) * (item.qty || 0);
      });
    }
  });
  
  const payments = {};
  allOrders.forEach(order => {
    const method = order.paymentMethod || 'Efectivo';
    if (!payments[method]) payments[method] = { count: 0, total: 0 };
    payments[method].count++;
    payments[method].total += order.total || 0;
  });
  
  let y = 20;
  
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(245, 200, 0);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('F RV', 105, 22, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('CATACAOS', 105, 32, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('REPORTE DE VENTAS', 105, 40, { align: 'center' });
  
  y = 55;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.text(`Fecha: ${currentDate} - ${currentTime}`, 105, y, { align: 'center' });
  
  y = 65;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, 180, 25, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`${totalOrders}`, 45, y + 5, { align: 'center' });
  doc.text(`S/ ${totalRevenue.toFixed(2)}`, 105, y + 5, { align: 'center' });
  doc.text(`${uniqueMesas}`, 155, y + 5, { align: 'center' });
  doc.text(`${uniqueAnfitrionas}`, 195, y + 5, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('PEDIDOS', 45, y + 15, { align: 'center' });
  doc.text('TOTAL', 105, y + 15, { align: 'center' });
  doc.text('MESAS', 155, y + 15, { align: 'center' });
  doc.text('ANFIT.', 195, y + 15, { align: 'center' });
  
  y = 100;
  
  doc.setFontSize(12);
  doc.setTextColor(245, 200, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('VENTAS POR MESA', 15, y);
  doc.setDrawColor(245, 200, 0);
  doc.setLineWidth(0.5);
  doc.line(15, y + 2, 195, y + 2);
  
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  
  const sortedMesas = Object.entries(mesas).sort((a, b) => b[1].total - a[1].total);
  sortedMesas.forEach(([mesa, data]) => {
    doc.text(`Mesa ${mesa}`, 20, y);
    doc.text(`${data.count}`, 80, y, { align: 'center' });
    doc.text(`S/ ${data.total.toFixed(2)}`, 190, y, { align: 'right' });
    y += 7;
  });
  
  const totalMesas = Object.values(mesas).reduce((s, m) => s + m.total, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', 20, y);
  doc.text(`S/ ${totalMesas.toFixed(2)}`, 190, y, { align: 'right' });
  
  y += 15;
  doc.setFontSize(12);
  doc.setTextColor(245, 200, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('VENTAS POR ANFITRIONA', 15, y);
  doc.line(15, y + 2, 195, y + 2);
  
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  
  const sortedAnfitrionas = Object.entries(anfitrionas).sort((a, b) => b[1].total - a[1].total);
  sortedAnfitrionas.forEach(([anfitriona, data]) => {
    doc.text(anfitriona.substring(0, 20), 20, y);
    doc.text(`${data.count}`, 80, y, { align: 'center' });
    doc.text(`S/ ${data.total.toFixed(2)}`, 190, y, { align: 'right' });
    y += 7;
  });
  
  y += 15;
  doc.setFontSize(12);
  doc.setTextColor(245, 200, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTOS VENDIDOS', 15, y);
  doc.line(15, y + 2, 195, y + 2);
  
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  
  const sortedProducts = Object.entries(products).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  sortedProducts.forEach(([product, data]) => {
    doc.text(product.substring(0, 25), 20, y);
    doc.text(`${data.qty}`, 80, y, { align: 'center' });
    doc.text(`S/ ${data.total.toFixed(2)}`, 190, y, { align: 'right' });
    y += 7;
  });
  
  const totalProducts = Object.values(products).reduce((s, p) => s + p.total, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', 20, y);
  doc.text(`S/ ${totalProducts.toFixed(2)}`, 190, y, { align: 'right' });
  
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  
  y += 15;
  doc.setFontSize(12);
  doc.setTextColor(245, 200, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('METODOS DE PAGO', 15, y);
  doc.line(15, y + 2, 195, y + 2);
  
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  
  Object.entries(payments).forEach(([method, data]) => {
    doc.text(method, 20, y);
    doc.text(`${data.count}`, 80, y, { align: 'center' });
    doc.text(`S/ ${data.total.toFixed(2)}`, 190, y, { align: 'right' });
    y += 7;
  });
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Reporte generado el ${currentDate} a las ${currentTime} | FRV Catacaos`, 105, 290, { align: 'center' });
  
  doc.save(`FRV_Reporte_${todayStr}.pdf`);
  
  showNotification('✅ PDF descargado', `FRV_Reporte_${todayStr}.pdf`, 'success');
  addFeedItem('Reporte', `📄 PDF descargado: FRV_Reporte_${todayStr}.pdf`);
}

// ── ALERTA DE SEGURIDAD ────────────────────────
function sendSafetyAlert() {
  const message = `🚨 *ALERTA DE SEGURIDAD - FRV Catacaos*\n\n⚠️ Se necesita asistencia inmediata en el bar\n\n⏰ *Hora:* ${new Date().toLocaleTimeString('es-PE')}\n\nPor favor, acudir lo antes posible.`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/51924996961?text=${encodedMessage}`;
  
  if (confirm('¿Enviar alerta de seguridad al equipo de seguridad?')) {
    window.open(whatsappUrl, '_blank');
    addFeedItem('Alerta', '🚨 Alerta de seguridad enviada');
    showNotification('🚨 Alerta', 'Alerta de seguridad enviada', 'error');
  }
}

// ── UTILIDADES ──────────────────────────────────
function initClock() {
  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock').textContent = time;
  }
  
  updateClock();
  setInterval(updateClock, 1000);
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Ahora mismo';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  return `Hace ${Math.floor(seconds / 86400)} días`;
}

function updateConnectionStatus(status, text) {
  console.log('📊 UpdateConnectionStatus called:', status, text);
  const statusEl = document.getElementById('connectionStatus');
  const textEl = document.getElementById('connectionText');
  
  if (statusEl && textEl) {
    console.log('📊 Updating DOM elements...');
    statusEl.className = `connection-status ${status}`;
    textEl.textContent = text;
    console.log('📊 DOM updated - class:', statusEl.className, 'text:', textEl.textContent);
  } else {
    console.warn('📊 DOM elements NOT found:', !!statusEl, !!textEl);
  }
}

// ── BÚSQUEDA DE PEDIDOS ───────────────────────────
function searchOrders(query) {
  searchQuery = query.toLowerCase();
  const grid = document.getElementById('grid');
  
  if (!searchQuery) {
    renderOrders();
    return;
  }
  
  let filteredOrders = orders.filter(o => {
    const mesaMatch = String(o.mesa).includes(searchQuery);
    const anfitrionaMatch = o.anfitriona?.toLowerCase().includes(searchQuery);
    const itemsMatch = o.items?.some(item => item.name.toLowerCase().includes(searchQuery));
    const idMatch = o.id?.toLowerCase().includes(searchQuery);
    return mesaMatch || anfitrionaMatch || itemsMatch || idMatch;
  });
  
  if (filteredOrders.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--muted);">
        <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
        <div style="font-size: 16px; font-weight: 600;">No se encontraron pedidos</div>
        <div style="font-size: 13px; margin-top: 8px;">Prueba con otros términos de búsqueda</div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filteredOrders.map(order => createOrderCard(order)).join('');
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  searchQuery = '';
  renderOrders();
}

// ── PANEL DE BAR ─────────────────────────────
function showKitchenView() {
  document.getElementById('kitchenModal').classList.add('show');
  renderKitchenOrders();
}

function closeKitchenView() {
  document.getElementById('kitchenModal').classList.remove('show');
}

function renderKitchenOrders() {
  const grid = document.getElementById('kitchenGrid');
  const kitchenOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');
  
  if (kitchenOrders.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">
        <div style="font-size: 32px;">🍳</div>
        <div>No hay pedidos para cocina</div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = kitchenOrders.map(order => {
    const isPreparing = order.status === 'preparing';
    const isReady = order.status === 'ready';
    
    return `
      <div class="kitchen-card ${order.status}">
        <div class="kitchen-mesa">Mesa ${order.mesa}</div>
        <div class="kitchen-items">
          ${order.items.map(item => `
            <div class="kitchen-item">
              <span class="kitchen-qty">${item.qty}x</span>${item.name}
            </div>
          `).join('')}
        </div>
        ${order.note ? `<div style="font-size:11px;color:#ffc800;margin-bottom:8px;">📝 ${order.note}</div>` : ''}
        <div class="kitchen-actions">
          ${!isReady ? `<button class="kitchen-btn bell" onclick="kitchenBell('${order.id}')">🔔 Llamar</button>` : ''}
          ${isPreparing ? `<button class="kitchen-btn done" onclick="updateOrderStatus('${order.id}', 'ready')">✅ Listo</button>` : ''}
          ${!isPreparing && !isReady ? `<button class="kitchen-btn done" onclick="updateOrderStatus('${order.id}', 'preparing')">⚡ Prep.</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function kitchenBell(orderId) {
  showNotification('🔔 Llamando', `Llamando a mesa del pedido`, 'success');
}

// ── INVENTARIO CON FIREBASE ─────────────────────────────
function showInventory() {
  document.getElementById('inventoryModal').classList.add('show');
  loadInventory();
}

function closeInventory() {
  document.getElementById('inventoryModal').classList.remove('show');
}

async function loadInventory() {
  try {
    const db = FirebaseClient.init();
    if (!db) {
      loadLocalInventory();
      return;
    }
    
    const snapshot = await db.ref('inventory').once('value');
    const data = snapshot.val();
    
    if (data) {
      inventory = Object.entries(data).map(([id, item]) => ({
        id: id,
        ...item
      }));
    } else {
      inventory = getDefaultInventory();
      await saveInventoryToFirebase();
    }
  } catch (error) {
    console.error('Error loading inventory:', error);
    loadLocalInventory();
  }
  
  renderInventoryTable();
}

function getDefaultInventory() {
  const categoryMap = {
    'cervezas': 'Cervezas',
    'tragos': 'Tragos',
    'shots': 'Shots',
    'sin-alcohol': 'Bebidas'
  };
  
  return menuProducts.map((p, idx) => ({
    id: String(idx + 1),
    name: p.name,
    category: categoryMap[p.cat] || 'Bebidas',
    price: p.price,
    stock: 50,
    minStock: 10,
    emoji: p.emoji
  }));
}

function loadLocalInventory() {
  const saved = localStorage.getItem('frv_inventory');
  inventory = saved ? JSON.parse(saved) : getDefaultInventory();
}

async function saveInventoryToFirebase() {
  try {
    const db = FirebaseClient.init();
    if (db && inventory.length > 0) {
      const obj = {};
      inventory.forEach(item => {
        obj[item.id] = item;
      });
      await db.ref('inventory').set(obj);
      localStorage.setItem('frv_inventory', JSON.stringify(inventory));
    }
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    localStorage.setItem('frv_inventory', JSON.stringify(inventory));
  }
}

function renderInventoryTable() {
  const tbody = document.getElementById('inventoryBody');
  if (!tbody) return;
  
  tbody.innerHTML = inventory.map(item => {
    let statusClass = 'good';
    let statusText = 'Normal';
    
    if (item.stock <= 0) {
      statusClass = 'out';
      statusText = 'Agotado';
    } else if (item.stock <= item.minStock) {
      statusClass = 'low';
      statusText = 'Bajo';
    }
    
    const rowClass = item.stock <= 0 ? 'out-of-stock' : (item.stock <= item.minStock ? 'low-stock' : '');
    
    return `
      <tr class="${rowClass}">
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>
          <input type="number" class="inv-input price" value="${item.price}" step="0.5" min="0" 
            onchange="updatePrice('${item.id}', this.value)" onblur="saveInventoryToFirebase()">
        </td>
        <td>
          <input type="number" class="inv-input stock" value="${item.stock}" min="0"
            onchange="updateStock('${item.id}', this.value)" onblur="saveInventoryToFirebase()">
        </td>
        <td>${item.minStock}</td>
        <td><span class="stock-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button style="background:rgba(255,68,68,0.2);color:#ff4444;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;" onclick="deleteInventory('${item.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updatePrice(id, newPrice) {
  const item = inventory.find(i => i.id === id);
  if (item) {
    item.price = parseFloat(newPrice) || 0;
    await saveInventoryToFirebase();
    showNotification('💰 Precio actualizado', `${item.name}: S/ ${item.price}`, 'success');
    updateProductPricesInOrders(item);
  }
}

async function updateStock(id, newStock) {
  const item = inventory.find(i => i.id === id);
  if (item) {
    item.stock = parseInt(newStock) || 0;
    await saveInventoryToFirebase();
    renderInventoryTable();
    if (item.stock <= item.minStock) {
      showNotification('⚠️ Stock bajo', `${item.name}: ${item.stock} unidades`, 'error');
    }
  }
}

function updateProductPricesInOrders(updatedItem) {
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (item.name === updatedItem.name) {
          item.price = updatedItem.price;
        }
      });
    }
  });
  renderOrders();
  addFeedItem('Sistema', `💰 Precio de ${updatedItem.name} actualizado en pedidos`);
}

async function addInventoryItem() {
  const name = prompt('Nombre del producto:');
  if (!name) return;
  
  const category = prompt('Categoría (Tragos/Cervezas/Bebidas/Platos/Vinos):') || 'General';
  const price = parseFloat(prompt('Precio (S/):') || '10');
  const stock = parseInt(prompt('Stock inicial:') || '50');
  const minStock = parseInt(prompt('Stock mínimo:') || '10');
  const emoji = prompt('Emoji (opcional):') || '📦';
  
  const newItem = {
    id: 'prod_' + Date.now(),
    name,
    category,
    price,
    stock,
    minStock,
    emoji
  };
  
  inventory.push(newItem);
  await saveInventoryToFirebase();
  renderInventoryTable();
  showNotification('✅ Agregado', `${name} agregado al inventario`, 'success');
}

async function deleteInventory(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  
  inventory = inventory.filter(i => i.id !== id);
  await saveInventoryToFirebase();
  renderInventoryTable();
}

function alertLowStock() {
  const lowItems = inventory.filter(i => i.stock <= i.minStock);
  
  if (lowItems.length === 0) {
    showNotification('✅ OK', 'Todos los productos tienen stock suficiente', 'success');
    return;
  }
  
  const message = lowItems.map(i => `• ${i.name}: ${i.stock}/${i.minStock}`).join('\n');
  alert(`⚠️ Productos con stock bajo:\n\n${message}`);
}

async function syncInventoryFromFirebase() {
  await loadInventory();
  showNotification('🔄 Sincronizado', 'Inventario actualizado desde Firebase', 'success');
}

// ── CAJA DIARIA ─────────────────────────────
function showCashBox() {
  document.getElementById('cashModal').classList.add('show');
  loadCashBox();
}

function closeCashBox() {
  document.getElementById('cashModal').classList.remove('show');
}

let currentCashTab = 'all';

function showCashBox() {
  document.getElementById('cashModal').classList.add('show');
  loadCashBox();
}

function loadCashBox() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('cashDate').textContent = dateStr;
  
  const saved = localStorage.getItem(`frv_cash_${today.toDateString()}`);
  cashTransactions = saved ? JSON.parse(saved) : [];
  
  const cashData = JSON.parse(localStorage.getItem('frv_current_cash') || '{}');
  document.getElementById('cashOpenTime').textContent = cashData.openTime || '--:--';
  document.getElementById('cashUser').textContent = cashData.user || localStorage.getItem('frv_admin_user') || 'Admin';
  
  const ordersToday = orders.filter(o => o.status !== 'cancelled' && o.status !== 'completed');
  const incomeFromOrders = ordersToday.reduce((sum, o) => sum + (o.total || 0), 0);
  const manualIncome = cashTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const income = incomeFromOrders + manualIncome;
  const expenses = cashTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;
  
  document.getElementById('cashIncome').textContent = `S/ ${income.toFixed(2)}`;
  document.getElementById('cashExpenses').textContent = `S/ ${expenses.toFixed(2)}`;
  document.getElementById('cashBalance').textContent = `S/ ${balance.toFixed(2)}`;
  document.getElementById('cashTxCount').textContent = cashTransactions.length + ordersToday.length;
  
  updateBalanceColor(balance);
  renderCashTransactions(ordersToday);
}

function updateBalanceColor(balance) {
  const el = document.getElementById('cashBalance');
  if (balance >= 0) {
    el.style.color = '#00ff88';
  } else {
    el.style.color = '#ff4444';
  }
}

function initCashDay() {
  if (!confirm('¿Iniciar nuevo día de caja? Esto reseteará los contadores.')) return;
  
  const today = new Date();
  const cashData = {
    openTime: today.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    user: localStorage.getItem('frv_admin_user') || 'Admin',
    date: today.toDateString()
  };
  
  localStorage.setItem('frv_current_cash', JSON.stringify(cashData));
  localStorage.setItem(`frv_cash_${today.toDateString()}`, '[]');
  cashTransactions = [];
  
  loadCashBox();
  showNotification('✅ Día iniciado', 'Caja iniciada correctamente', 'success');
  addFeedItem('Caja', '📊 Nuevo día de caja iniciado');
}

function setCashTab(tab, element) {
  currentCashTab = tab;
  document.querySelectorAll('.cash-tab').forEach(t => t.classList.remove('active'));
  element.classList.add('active');
  loadCashBox();
}

function renderCashTransactions(ordersToday) {
  const container = document.getElementById('cashTransactions');
  let html = '';
  
  const allItems = [];
  
  if (currentCashTab === 'all' || currentCashTab === 'orders') {
    ordersToday.forEach(order => {
      allItems.push({
        type: 'order',
        icon: '🧾',
        label: `Mesa ${order.mesa} - ${order.paymentMethod || 'Efectivo'}`,
        time: getTimeAgo(order.createdAt),
        amount: order.total || 0,
        positive: true
      });
    });
  }
  
  if (currentCashTab === 'all' || currentCashTab === 'income') {
    cashTransactions.filter(t => t.type === 'income').forEach(t => {
      allItems.push({
        type: 'income',
        icon: '📥',
        label: t.description,
        time: new Date(t.time).toLocaleTimeString('es-PE'),
        amount: t.amount,
        positive: true
      });
    });
  }
  
  if (currentCashTab === 'all' || currentCashTab === 'expense') {
    cashTransactions.filter(t => t.type === 'expense').forEach(t => {
      allItems.push({
        type: 'expense',
        icon: '📤',
        label: t.description,
        time: new Date(t.time).toLocaleTimeString('es-PE'),
        amount: t.amount,
        positive: false
      });
    });
  }
  
  if (allItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">No hay transacciones</div>';
    return;
  }
  
  allItems.forEach((item, index) => {
    const amountClass = item.positive ? 'positive' : 'negative';
    const amountPrefix = item.positive ? '+' : '-';
    html += `
      <div class="cash-transaction" style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
        <div class="cash-trans-type">${item.icon}</div>
        <div class="cash-trans-details">
          <div class="cash-trans-label">${item.label}</div>
          <div class="cash-trans-time">${item.time}</div>
        </div>
        <div class="cash-trans-amount ${amountClass}">${amountPrefix}S/ ${item.amount.toFixed(2)}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

async function addCashTransaction() {
  const type = document.getElementById('cashType').value;
  const amount = parseFloat(document.getElementById('cashAmount').value);
  const description = document.getElementById('cashDescription').value;
  
  if (!amount || amount <= 0) {
    showNotification('❌ Error', 'Ingresa un monto válido', 'error');
    return;
  }
  
  if (!description) {
    showNotification('❌ Error', 'Ingresa una descripción', 'error');
    return;
  }
  
  const transaction = {
    type,
    amount,
    description,
    time: new Date().toISOString(),
    user: localStorage.getItem('frv_admin_user') || 'Admin'
  };
  
  cashTransactions.push(transaction);
  
  const today = new Date().toDateString();
  localStorage.setItem(`frv_cash_${today}`, JSON.stringify(cashTransactions));
  
  document.getElementById('cashAmount').value = '';
  document.getElementById('cashDescription').value = '';
  
  loadCashBox();
  
  const typeLabel = type === 'income' ? 'Ingreso' : 'Egreso';
  showNotification(`✅ ${typeLabel} registrado`, `S/ ${amount.toFixed(2)} - ${description}`, type === 'income' ? 'success' : 'error');
  addFeedItem('Caja', `${type === 'income' ? '📥' : '📤'} ${typeLabel}: S/ ${amount.toFixed(2)} - ${description}`);
}

function showAddExpense() {
  const amount = parseFloat(prompt('Monto del egreso:'));
  if (!amount || amount <= 0) return;
  
  const description = prompt('Descripción:') || 'Gasto';
  
  cashTransactions.push({
    type: 'expense',
    amount,
    description,
    time: new Date().toISOString()
  });
  
  const today = new Date().toDateString();
  localStorage.setItem(`frv_cash_${today}`, JSON.stringify(cashTransactions));
  loadCashBox();
  showNotification('➖ Egreso registrado', `S/ ${amount.toFixed(2)}`, 'error');
}

// ── ESTADO DE MESAS ─────────────────────────────
function showTables() {
  document.getElementById('tablesModal').classList.add('show');
  renderTables();
}

function closeTables() {
  document.getElementById('tablesModal').classList.remove('show');
}

// ── ENLACE PARA ANFITRIONAS ───────────────────────
function showAnfitrionaLink() {
  const baseUrl = window.location.origin + window.location.pathname.replace(/panel-bar\.html$/, '');
  const link = baseUrl + 'anfitriona.html';
  
  const modal = document.createElement('div');
  modal.className = 'generic-modal show';
  modal.innerHTML = `
    <div class="generic-content" style="max-width: 500px;">
      <div class="generic-header">
        <h2>📱 Enlace para Anfitrionas</h2>
        <button class="close-btn" onclick="this.closest('.generic-modal').remove()">✕</button>
      </div>
      <div style="text-align: center; padding: 20px;">
        <p style="color: #888; margin-bottom: 20px;">Comparte este enlace con las anfitrionas para que puedan ver el estado de sus pedidos sin necesidad de WhatsApp.</p>
        
        <div style="background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
          <input type="text" value="${link}" id="anfitrionaLink" style="width: 100%; background: transparent; border: none; color: #00ff88; font-size: 14px; text-align: center; outline: none;" readonly>
        </div>
        
        <div style="background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 20px; display: inline-block;">
          <canvas id="qrCodeCanvas"></canvas>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button class="inv-btn" style="background: linear-gradient(135deg, #00ff88, #00cc6a); color: #0a0a0a;" onclick="copyAnfitrionaLink()">📋 Copiar Enlace</button>
          <button class="inv-btn" style="background: rgba(0,132,138,0.2); color: #00848A;" onclick="downloadQRCode()">⬇️ Descargar QR</button>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          💡 Imprime este código QR y pégalo en las mesas. Las anfitrionas escanean para ver el estado de su pedido.
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  setTimeout(() => generateQRCode(link), 100);
}

function generateQRCode(text) {
  try {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 180;
    canvas.width = size;
    canvas.height = size;
    
    const qr = generateQRMatrix(text, 4);
    const cellSize = size / qr.length;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#000000';
    for (let row = 0; row < qr.length; row++) {
      for (let col = 0; col < qr[row].length; col++) {
        if (qr[row][col]) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
  } catch (e) {
    console.error('QR Error:', e);
  }
}

function generateQRMatrix(text, errorCorrection) {
  const size = 25;
  const matrix = [];
  
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      const isFinderPattern = (i < 8 && j < 8) || (i < 8 && j >= size - 8) || (i >= size - 8 && j < 8);
      const isTiming = (i === 6 || j === 6);
      
      if (isFinderPattern || isTiming) {
        matrix[i][j] = true;
      } else {
        const hash = (i * 17 + j * 13 + text.length * 7) % 3;
        matrix[i][j] = hash !== 0;
      }
    }
  }
  
  return matrix;
}

function downloadQRCode() {
  const canvas = document.getElementById('qrCodeCanvas');
  if (!canvas) return;
  
  const link = document.createElement('a');
  link.download = 'frv-qr-pedidos.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function copyAnfitrionaLink() {
  const link = document.getElementById('anfitrionaLink').value;
  navigator.clipboard.writeText(link).then(() => {
    alert('✅ Enlace copiado al portapapeles');
  }).catch(() => {
    prompt('Copia este enlace:', link);
  });
}

function openAnfitrionaPreview() {
  const link = document.getElementById('anfitrionaLink').value;
  window.open(link, '_blank');
}

function renderTables() {
  const grid = document.getElementById('tablesGrid');
  const totalTables = 50;
  
  // Determinar estado de cada mesa
  const occupied = [];
  orders.forEach(o => {
    if (o.status !== 'cancelled' && o.status !== 'completed') {
      occupied.push(o.mesa);
    }
  });
  
  let html = '';
  for (let i = 1; i <= totalTables; i++) {
    const isOccupied = occupied.includes(i);
    const statusClass = isOccupied ? 'occupied' : 'free';
    const statusText = isOccupied ? 'OCUPADA' : 'LIBRE';
    
    html += `
      <div class="table-card ${statusClass}" onclick="showTableDetails(${i})">
        <div class="table-number">${i}</div>
        <div class="table-status">${statusText}</div>
      </div>
    `;
  }
  
  grid.innerHTML = html;
}

function showTableDetails(mesaNum) {
  const tableOrders = orders.filter(o => o.mesa === mesaNum && o.status !== 'cancelled');
  
  if (tableOrders.length === 0) {
    alert(`Mesa ${mesaNum}: Sin pedidos activos`);
    return;
  }
  
  const details = tableOrders.map(o => 
    `• Mesa ${o.mesa}: S/ ${(o.total || 0).toFixed(2)} (${o.status})`
  ).join('\n');
  
  alert(`Mesa ${mesaNum}\n\n${details}`);
}

// ── NUEVO PEDIDO DESDE PANEL ─────────────────
let newOrderItemCount = 0;

function showNewOrderModal() {
  document.getElementById('newOrderModal').classList.add('show');
  newOrderItemCount = 0;
  document.getElementById('newOrderMesa').value = '';
  document.getElementById('newOrderAnfitriona').value = '';
  document.getElementById('newOrderNote').value = '';
  document.getElementById('newOrderItems').innerHTML = '';
  
  // Populate anfitriona datalist
  const datalist = document.getElementById('anfitrionaListOptions');
  if (datalist) {
    datalist.innerHTML = anfitrionasList.map(a => `<option value="${a.name}">`).join('');
  }
  
  addOrderItemRow();
}

function closeNewOrderModal() {
  document.getElementById('newOrderModal').classList.remove('show');
}

function addOrderItemRow() {
  newOrderItemCount++;
  const container = document.getElementById('newOrderItems');
  const row = document.createElement('div');
  row.className = 'order-item-row';
  row.id = `item-row-${newOrderItemCount}`;
  
  const options = menuProducts.map(p => 
    `<option value="${p.name}|${p.price}|${p.emoji}">${p.emoji} ${p.name} - S/${p.price}</option>`
  ).join('');
  
  row.innerHTML = `
    <select class="form-select" id="item-select-${newOrderItemCount}">
      ${options}
    </select>
    <input type="number" class="form-input" id="item-qty-${newOrderItemCount}" value="1" min="1" placeholder="Cant.">
    <button style="background:rgba(255,68,68,0.2);color:#ff4444;border:none;padding:8px;border-radius:6px;cursor:pointer;" onclick="removeOrderItemRow(${newOrderItemCount})">✕</button>
  `;
  container.appendChild(row);
}

function removeOrderItemRow(id) {
  const row = document.getElementById(`item-row-${id}`);
  if (row) row.remove();
}

async function createNewOrder() {
  const mesaInput = document.getElementById('newOrderMesa').value;
  const anfitrionaInput = document.getElementById('newOrderAnfitriona').value;
  const noteInput = document.getElementById('newOrderNote').value;
  const payment = document.getElementById('newOrderPayment').value;
  
  // Validate and sanitize inputs
  const mesa = parseInt(mesaInput);
  if (!mesa || mesa < 1 || mesa > 50) {
    showNotification('❌ Error', 'Ingresa un número de mesa válido (1-50)', 'error');
    return;
  }
  
  // Sanitize strings to prevent XSS
  const sanitize = (str) => str.replace(/[<>\"'&]/g, '').substring(0, 100);
  const anfitriona = sanitize(anfitrionaInput);
  const note = sanitize(noteInput);
  
  // Recopilar items
  const items = [];
  let total = 0;
  
  for (let i = 1; i <= newOrderItemCount; i++) {
    const select = document.getElementById(`item-select-${i}`);
    const qtyInput = document.getElementById(`item-qty-${i}`);
    
    if (select && qtyInput) {
      const [name, price, emoji] = select.value.split('|');
      const qty = Math.max(1, Math.min(99, parseInt(qtyInput.value) || 1));
      
      items.push({ name: sanitize(name), price: parseFloat(price), emoji, qty });
      total += parseFloat(price) * qty;
    }
  }
  
  if (items.length === 0) {
    showNotification('❌ Error', 'Agrega al menos un producto', 'error');
    return;
  }
  
  const newOrder = {
    mesa,
    items,
    note,
    paymentMethod: payment,
    total,
    anfitriona: anfitriona || 'Mostrador',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  try {
    if (typeof FirebaseClient === 'undefined') {
      showNotification('❌ Error', 'Firebase no disponible', 'error');
      return;
    }
    
    const saved = await FirebaseClient.createOrder(newOrder);
    
    if (saved) {
      closeNewOrderModal();
      addFeedItem('Pedido', `🆕 Nuevo pedido - Mesa ${mesa}`);
      showNotification('✅ Pedido creado', `Mesa ${mesa} - S/ ${total.toFixed(2)}`, 'success');
    }
  } catch (error) {
    showNotification('❌ Error', error.message, 'error');
  }
}

// ── HISTORIAL ─────────────────────────────
function showHistory() {
  document.getElementById('historyModal').classList.add('show');
  
  // Establecer fechas por defecto
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  document.getElementById('historyDateEnd').value = today.toISOString().split('T')[0];
  document.getElementById('historyDateStart').value = weekAgo.toISOString().split('T')[0];
  
  loadHistory();
}

function closeHistory() {
  document.getElementById('historyModal').classList.remove('show');
}

function loadHistory() {
  const startDate = new Date(document.getElementById('historyDateStart').value);
  const endDate = new Date(document.getElementById('historyDateEnd').value);
  endDate.setDate(endDate.getDate() + 1);
  
  // Cargar pedidos del localStorage o usar los actuales
  const allOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  const container = document.getElementById('historyList');
  
  if (allOrders.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">No hay pedidos en este período</div>';
    return;
  }
  
  container.innerHTML = allOrders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(order => {
      const date = new Date(order.createdAt);
      const dateStr = date.toLocaleDateString('es-PE');
      const timeStr = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      const statusClass = order.status === 'completed' ? 'completed' : 'cancelled';
      
      return `
        <div class="history-item">
          <div class="history-date-item">${dateStr}<br>${timeStr}</div>
          <div class="history-mesa">Mesa ${order.mesa}</div>
          <div class="history-details">
            ${order.items?.length || 0} productos<br>
            ${order.anfitriona || 'Mostrador'}
          </div>
          <div class="history-total">S/ ${(order.total || 0).toFixed(2)}</div>
          <div class="history-status ${statusClass}">${order.status}</div>
        </div>
      `;
    }).join('');
}
