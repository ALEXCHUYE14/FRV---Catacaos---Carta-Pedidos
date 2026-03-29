// ── CONFIG ──────────────────────────────────────
const API_URL = 'https://frv-api.netlify.app';
let eventSource = null;
let orders = [];
let currentFilter = 'all';
let soundEnabled = true;

// ── INICIALIZACIÓN ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  connectToSSE();
  loadOrders();
});

// ── CONEXIÓN SSE (TIEMPO REAL) ──────────────────
function connectToSSE() {
  updateConnectionStatus('connecting', 'Conectando...');
  
  // Cerrar conexión anterior si existe
  if (eventSource) {
    eventSource.close();
  }

  // Crear nueva conexión SSE
  eventSource = new EventSource(`${API_URL}/api/orders/stream`);

  // Conexión abierta
  eventSource.onopen = () => {
    console.log('✅ Conexión SSE establecida');
    updateConnectionStatus('connected', 'En vivo');
    addFeedItem('Sistema', '🟢 Conexión en tiempo real establecida');
  };

  // Recibir mensajes
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleSSEMessage(data);
    } catch (error) {
      console.error('Error al parsear mensaje SSE:', error);
    }
  };

  // Error de conexión
  eventSource.onerror = (error) => {
    console.error('❌ Error en conexión SSE:', error);
    updateConnectionStatus('disconnected', 'Desconectado');
    addFeedItem('Sistema', '🔴 Conexión perdida. Reconectando...');
    
    // Intentar reconectar después de 5 segundos
    setTimeout(() => {
      if (eventSource.readyState === EventSource.CLOSED) {
        connectToSSE();
      }
    }, 5000);
  };
}

// Manejar mensajes SSE
function handleSSEMessage(data) {
  switch (data.type) {
    case 'connected':
      console.log('✅ Conectado al stream:', data.message);
      break;

    case 'ping':
      // Mantener conexión viva
      break;

    case 'new_order':
      console.log('🆕 Nuevo pedido recibido:', data.order);
      handleNewOrder(data.order);
      break;

    case 'order_updated':
      console.log('📝 Pedido actualizado:', data.order);
      handleOrderUpdate(data.order);
      break;

    case 'stats':
      updateStats(data.stats);
      break;

    default:
      console.log('Mensaje SSE desconocido:', data);
  }
}

// Manejar nuevo pedido
function handleNewOrder(order) {
  // Agregar a la lista de pedidos
  orders.unshift(order);
  
  // Renderizar pedidos
  renderOrders();
  
  // Actualizar estadísticas
  loadOrders();
  
  // Mostrar notificación
  showNotification('🆕 Nuevo Pedido', `Mesa ${order.mesa} - ${order.items.length} productos`, 'success');
  
  // Reproducir sonido
  if (soundEnabled) {
    playNotificationSound();
  }
  
  // Agregar al feed
  addFeedItem('Pedido', `🆕 Nuevo pedido de Mesa ${order.mesa} - S/ ${order.total.toFixed(2)}`);
}

// Manejar actualización de pedido
function handleOrderUpdate(order) {
  // Actualizar pedido en la lista
  const index = orders.findIndex(o => o.id === order.id);
  if (index !== -1) {
    orders[index] = order;
  }
  
  // Renderizar pedidos
  renderOrders();
  
  // Actualizar estadísticas
  loadOrders();
  
  // Agregar al feed
  addFeedItem('Actualización', `📝 Pedido ${order.id} actualizado a: ${order.status}`);
}

// Actualizar estado de conexión
function updateConnectionStatus(status, text) {
  const statusEl = document.getElementById('connectionStatus');
  const textEl = document.getElementById('connectionText');
  
  statusEl.className = `connection-status ${status}`;
  textEl.textContent = text;
}

// ── CARGAR PEDIDOS ──────────────────────────────
async function loadOrders() {
  try {
    const response = await fetch(`${API_URL}/api/orders`);
    
    if (response.ok) {
      const data = await response.json();
      orders = data.orders || [];
      
      // Actualizar estadísticas
      if (data.stats) {
        updateStats(data.stats);
      }
      
      renderOrders();
    } else {
      console.error('Error al cargar pedidos:', response.status);
    }
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
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
        ${order.items.map(item => `
          <div class="order-item">
            <span class="item-emoji">${item.emoji}</span>
            <span class="item-name">${item.name}</span>
            <span class="item-qty">x${item.qty}</span>
            <span class="item-price">S/ ${(item.price * item.qty).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
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
        ` : ''}
        ${order.status === 'preparing' ? `
          <button class="action-btn ready" onclick="updateOrderStatus('${order.id}', 'ready')">
            ✅ Marcar como Listo
          </button>
        ` : ''}
        ${order.status === 'ready' ? `
          <button class="action-btn completed" onclick="updateOrderStatus('${order.id}', 'completed')">
            ✔️ Completar Pedido
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ── ACTUALIZAR ESTADO DE PEDIDO ─────────────────
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        status: newStatus
      })
    });
    
    if (response.ok) {
      const updatedOrder = await response.json();
      console.log('✅ Pedido actualizado:', updatedOrder);
      
      // Actualizar en la lista local
      const index = orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        orders[index] = updatedOrder;
      }
      
      renderOrders();
      loadOrders();
      
      addFeedItem('Actualización', `📝 Pedido ${orderId} actualizado a: ${newStatus}`);
    } else {
      console.error('Error al actualizar pedido:', response.status);
      showNotification('❌ Error', 'No se pudo actualizar el pedido', 'error');
    }
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    showNotification('❌ Error', 'Error de conexión', 'error');
  }
}

// ── ACTUALIZAR ESTADÍSTICAS ─────────────────────
function updateStats(stats) {
  document.getElementById('s-pending').textContent = stats.pending || 0;
  document.getElementById('s-preparing').textContent = stats.preparing || 0;
  document.getElementById('s-done').textContent = stats.completed || 0;
  document.getElementById('s-revenue').textContent = `S/ ${(stats.revenue || 0).toFixed(0)}`;
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
  const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  
  const feedItem = document.createElement('div');
  feedItem.className = 'feed-item';
  feedItem.innerHTML = `
    <div class="fi-top"><span>${source}</span><span>${time}</span></div>
    <div class="fi-msg">${message}</div>
  `;
  
  // Insertar al inicio
  feed.insertBefore(feedItem, feed.firstChild);
  
  // Mantener solo los últimos 50 items
  while (feed.children.length > 50) {
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
  addFeedItem('Sistema', '🔌 Probando conexión con la API...');
  
  try {
    const response = await fetch(`${API_URL}/api/orders`);
    
    if (response.ok) {
      const data = await response.json();
      addFeedItem('Sistema', `✅ Conexión exitosa - ${data.total || 0} pedidos en sistema`);
      showNotification('✅ Conexión Exitosa', `API respondiendo correctamente`, 'success');
    } else {
      addFeedItem('Sistema', `❌ Error de conexión: ${response.status}`);
      showNotification('❌ Error', `API respondió con status ${response.status}`, 'error');
    }
  } catch (error) {
    addFeedItem('Sistema', `❌ Error de conexión: ${error.message}`);
    showNotification('❌ Error', 'No se pudo conectar a la API', 'error');
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
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(demoOrder)
    });
    
    if (response.ok) {
      const savedOrder = await response.json();
      console.log('✅ Pedido demo creado:', savedOrder);
      addFeedItem('Demo', `🆕 Pedido demo creado para Mesa ${demoOrder.mesa}`);
    } else {
      console.error('Error al crear pedido demo:', response.status);
      addFeedItem('Demo', `❌ Error al crear pedido demo`);
    }
  } catch (error) {
    console.error('Error al crear pedido demo:', error);
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
  // Generar reportes basados en los pedidos
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  // Reporte por mesas
  const mesas = {};
  completedOrders.forEach(order => {
    if (!mesas[order.mesa]) {
      mesas[order.mesa] = { count: 0, total: 0 };
    }
    mesas[order.mesa].count++;
    mesas[order.mesa].total += order.total;
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
  completedOrders.forEach(order => {
    if (order.anfitriona) {
      if (!anfitrionas[order.anfitriona]) {
        anfitrionas[order.anfitriona] = { count: 0, total: 0 };
      }
      anfitrionas[order.anfitriona].count++;
      anfitrionas[order.anfitriona].total += order.total;
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
  completedOrders.forEach(order => {
    const pm = order.paymentMethod || 'No especificado';
    if (!payments[pm]) {
      payments[pm] = { count: 0, total: 0 };
    }
    payments[pm].count++;
    payments[pm].total += order.total;
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
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      if (!products[item.name]) {
        products[item.name] = { qty: 0, revenue: 0 };
      }
      products[item.name].qty += item.qty;
      products[item.name].revenue += item.price * item.qty;
    });
  });
  
  const productsReport = document.getElementById('productsReport');
  productsReport.innerHTML = Object.entries(products)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([product, data]) => `
      <div class="report-row">
        <span>${product}</span>
        <span>${data.qty} unidades</span>
        <span>S/ ${data.revenue.toFixed(2)}</span>
      </div>
    `).join('');
  
  document.getElementById('productsTotal').textContent = `S/ ${Object.values(products).reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}`;
  
  // Total general
  const generalTotal = completedOrders.reduce((sum, o) => sum + o.total, 0);
  document.getElementById('generalTotal').textContent = `S/ ${generalTotal.toFixed(2)}`;
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
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  
  return date.toLocaleDateString('es-PE');
}

// Cerrar modal al hacer clic fuera
document.getElementById('reportsModal').addEventListener('click', (e) => {
  if (e.target.id === 'reportsModal') {
    closeReports();
  }
});
