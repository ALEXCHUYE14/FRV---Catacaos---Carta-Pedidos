// ── CONFIG ──────────────────────────────────────
let orders = [];
let currentFilter = 'all';
let soundEnabled = true;
let firebaseUnsubscribe = null;
let revenueVisible = true;
let expandedOrders = new Set();

// ── INICIALIZACIÓN ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  if (localStorage.getItem('frv_admin_auth') !== 'true') {
    window.location.href = 'login.html';
    return;
  }
  
  initClock();
  initFirebaseConnection();
});

// ── LOGOUT ──────────────────────────────────────
function logout() {
  localStorage.removeItem('frv_admin_auth');
  localStorage.removeItem('frv_admin_user');
  localStorage.removeItem('frv_login_time');
  window.location.href = 'login.html';
}

// ── CONEXIÓN FIREBASE (TIEMPO REAL) ─────────────
function initFirebaseConnection() {
  updateConnectionStatus('connecting', 'Conectando...');
  addFeedItem('Sistema', '🔌 Iniciando conexión con Firebase...');
  
  // Verificar que FirebaseClient esté disponible
  if (typeof FirebaseClient === 'undefined') {
    console.error('❌ FirebaseClient no está cargado');
    updateConnectionStatus('disconnected', 'Error');
    addFeedItem('Sistema', '❌ FirebaseClient no está cargado. Verifica que firebase-client.js esté incluido.');
    showNotification('❌ Error', 'Firebase no está cargado', 'error');
    return;
  }
  
  // Inicializar Firebase
  const db = FirebaseClient.init();
  if (!db) {
    console.error('❌ No se pudo inicializar Firebase');
    updateConnectionStatus('disconnected', 'Error');
    addFeedItem('Sistema', '❌ No se pudo inicializar Firebase. Verifica la configuración.');
    showNotification('❌ Error', 'No se pudo inicializar Firebase', 'error');
    return;
  }
  
  console.log('✅ Firebase inicializado, suscribiéndose a cambios...');
  updateConnectionStatus('connected', 'En vivo');
  addFeedItem('Sistema', '🟢 Conexión en tiempo real establecida con Firebase');
  
  // Cargar pedidos iniciales
  loadOrders();
  
  // Suscribirse a cambios en tiempo real
  subscribeToOrdersUpdates();
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
            <span class="item-emoji">${item.emoji}</span>
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

// ── GENERAR PDF PROFESIONAL ─────────────────────
function generatePDF() {
  // Mostrar todos los pedidos (no solo completados) para el reporte
  const allOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const currentDate = new Date().toLocaleDateString('es-PE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const currentTime = new Date().toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Validar que haya pedidos
  if (allOrders.length === 0) {
    showNotification('❌ Sin pedidos', 'No hay pedidos para generar reporte', 'error');
    addFeedItem('Reporte', '❌ No hay pedidos para generar reporte');
    return;
  }
  
  // Generar reportes
  const mesas = {};
  allOrders.forEach(order => {
    if (!mesas[order.mesa]) {
      mesas[order.mesa] = { count: 0, total: 0 };
    }
    mesas[order.mesa].count++;
    mesas[order.mesa].total += order.total || 0;
  });
  
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
  
  // Obtener métodos de pago
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
  
  // Crear contenido HTML para PDF
  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte FRV Catacaos - ${currentDate}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #F5C800;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 48px;
          font-weight: 900;
          color: #0a0a0a;
          letter-spacing: 4px;
          margin-bottom: 5px;
        }
        .logo span {
          color: #F5C800;
        }
        .subtitle {
          font-size: 14px;
          color: #666;
          letter-spacing: 2px;
        }
        .date-time {
          font-size: 12px;
          color: #888;
          margin-top: 10px;
        }
        .summary {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-around;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #00ff88;
        }
        .summary-label {
          font-size: 12px;
          color: #888;
          margin-top: 5px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #0a0a0a;
          border-bottom: 2px solid #F5C800;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background: #f5f5f5;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          border-bottom: 2px solid #ddd;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }
        tr:hover {
          background: #f9f9f9;
        }
        .total-row {
          font-weight: 700;
          background: #f0f0f0 !important;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #F5C800;
          font-size: 11px;
          color: #888;
        }
        @media print {
          body { padding: 10px; }
          .summary { flex-wrap: wrap; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">F<span>R</span>V</div>
        <div class="subtitle">Catacaos — Reporte de Ventas</div>
        <div class="date-time">${currentDate} - ${currentTime}</div>
      </div>
      
      <div class="summary">
        <div class="summary-item">
          <div class="summary-value">${allOrders.length}</div>
          <div class="summary-label">Pedidos Totales</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">S/ ${totalRevenue.toFixed(2)}</div>
          <div class="summary-label">Total Recaudado</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${Object.keys(mesas).length}</div>
          <div class="summary-label">Mesas Atendidas</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${Object.keys(anfitrionas).length}</div>
          <div class="summary-label">Anfitrionas Activas</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">🪑 Ventas por Mesa</div>
        <table>
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Pedidos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(mesas)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([mesa, data]) => `
                <tr>
                  <td>Mesa ${mesa}</td>
                  <td>${data.count}</td>
                  <td>S/ ${data.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td>S/ ${Object.values(mesas).reduce((sum, m) => sum + m.total, 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">👩‍💼 Ventas por Anfitriona</div>
        <table>
          <thead>
            <tr>
              <th>Anfitriona</th>
              <th>Pedidos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(anfitrionas)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([anfitriona, data]) => `
                <tr>
                  <td>${anfitriona}</td>
                  <td>${data.count}</td>
                  <td>S/ ${data.total.toFixed(2)}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">📦 Productos Vendidos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(products)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 15)
              .map(([product, data]) => `
                <tr>
                  <td>${product}</td>
                  <td>${data.qty} uds</td>
                  <td>S/ ${data.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td>S/ ${Object.values(products).reduce((sum, p) => sum + p.total, 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} FRV Catacaos - Todos los derechos reservados</p>
        <p>Reporte generado automáticamente por el sistema de administración</p>
      </div>
    </body>
    </html>
  `;
  
  // Crear ventana para PDF
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    showNotification('❌ Error', 'El popup fue bloqueado. Permite popups para descargar el PDF.', 'error');
    addFeedItem('Reporte', '❌ Error: Popup bloqueado');
    return;
  }
  
  printWindow.document.write(pdfContent);
  printWindow.document.close();
  
  // Esperar a que cargue y luego imprimir
  setTimeout(() => {
    printWindow.print();
  }, 500);
  
  addFeedItem('Reporte', '📄 Reporte PDF generado');
  showNotification('📄 PDF', 'Reporte generado exitosamente', 'success');
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
  const statusEl = document.getElementById('connectionStatus');
  const textEl = document.getElementById('connectionText');
  
  if (statusEl && textEl) {
    statusEl.className = `connection-status ${status}`;
    textEl.textContent = text;
  }
}
