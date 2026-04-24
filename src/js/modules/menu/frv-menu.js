// FRV Catacaos - Menu JavaScript
// Real-time order system with Firebase synchronization

let currentCategory = 'all';
let cart = [];
let selectedTable = null;
let selectedPayment = 'yape';
let orderNote = '';
let currentMesa = null;

// Products matching the bar panel system
const PRODUCTS = [
  { id: 1, name: 'Corona Botella', cat: 'cervezas', price: 8, emoji: '🍺', img: 'Cristal.jpg', desc: 'Cerveza rubia premium, 330ml' },
  { id: 2, name: 'Pilsener 330ml', cat: 'cervezas', price: 5, emoji: '🍻', img: 'Cristal.jpg', desc: 'Cerveza pilsener clásica' },
  { id: 3, name: 'Heineken', cat: 'cervezas', price: 10, emoji: '🍺', img: 'Cristal.jpg', desc: 'Cerveza premium holandesa' },
  { id: 4, name: 'Cusqueña Dorada', cat: 'cervezas', price: 7, emoji: '🍻', img: 'Cristal.jpg', desc: 'Cerveza dorada peruana' },
  { id: 5, name: 'Shot Tequila', cat: 'tragos', price: 8, emoji: '🥃', img: 'Cristal.jpg', desc: 'Tequila 100% agave' },
  { id: 6, name: 'Shot Vodka', cat: 'tragos', price: 7, emoji: '🥃', img: 'Cristal.jpg', desc: 'Vodka premium' },
  { id: 7, name: 'Shot Ron', cat: 'tragos', price: 7, emoji: '🥃', img: 'Cristal.jpg', desc: 'Ron añejo' },
  { id: 8, name: 'Shot Jäger', cat: 'tragos', price: 9, emoji: '🥃', img: 'Cristal.jpg', desc: 'Licor Jägermeister' },
  { id: 9, name: 'Mojito', cat: 'cócteles', price: 18, emoji: '🍹', img: 'Cristal.jpg', desc: 'Rum, menta, lima, azúcar' },
  { id: 10, name: 'Margarita', cat: 'cócteles', price: 18, emoji: '🍸', img: 'Cristal.jpg', desc: 'Tequila, triple sec, limón' },
  { id: 11, name: 'Piña Colada', cat: 'cócteles', price: 20, emoji: '🥥', img: 'Cristal.jpg', desc: 'Rum, coco, piña' },
  { id: 12, name: 'Negroni', cat: 'cócteles', price: 22, emoji: '🍷', img: 'Cristal.jpg', desc: 'Ginebra, Campari, Vermouth' },
  { id: 13, name: 'Pisco Sour', cat: 'cócteles', price: 20, emoji: '🍋', img: 'Cristal.jpg', desc: 'Pisco, limón, azúcar, hielo' },
  { id: 14, name: 'Aperol Spritz', cat: 'cócteles', price: 22, emoji: '🍊', img: 'Cristal.jpg', desc: 'Aperol, prosecco, soda' },
  { id: 15, name: 'Johnnie Red 750ml', cat: 'botellas', price: 120, emoji: '🥃', img: 'Cristal.jpg', desc: 'Whisky escocés' },
  { id: 16, name: 'Absolut Vodka', cat: 'botellas', price: 100, emoji: '🍾', img: 'Cristal.jpg', desc: 'Vodka premium 750ml' },
  { id: 17, name: 'Jack Daniel\'s', cat: 'botellas', price: 130, emoji: '🥃', img: 'Cristal.jpg', desc: 'Whisky americano' },
  { id: 18, name: 'Moët Chandon', cat: 'botellas', price: 220, emoji: '🍾', img: 'Cristal.jpg', desc: 'Champagne francés' },
  { id: 19, name: 'Patrón Silver', cat: 'botellas', price: 180, emoji: '🥃', img: 'Cristal.jpg', desc: 'Tequila premium' },
  { id: 20, name: 'Red Bull', cat: 'mixers', price: 8, emoji: '🔴', img: 'Cristal.jpg', desc: 'Bebida energética' },
  { id: 21, name: 'Agua Mineral', cat: 'mixers', price: 4, emoji: '💧', img: 'Cristal.jpg', desc: 'Agua mineral natural' },
  { id: 22, name: 'Gaseosa 500ml', cat: 'mixers', price: 5, emoji: '🥤', img: 'Cristal.jpg', desc: 'Gaseosa personal' },
  { id: 23, name: 'Jugo de Naranja', cat: 'mixers', price: 7, emoji: '🍊', img: 'Cristal.jpg', desc: 'Jugo natural de naranja' },
  { id: 24, name: 'Piqueo Mixto', cat: 'piqueos', price: 25, emoji: '🥗', img: 'Cristal.jpg', desc: 'Variedad de piqueos' },
  { id: 25, name: 'Ceviche Porción', cat: 'piqueos', price: 22, emoji: '🐟', img: 'Cristal.jpg', desc: 'Ceviche tradicional' },
  { id: 26, name: 'Chilcano', cat: 'cócteles', price: 15, emoji: '🍸', img: 'Cristal.jpg', desc: 'Pisco, ginger ale, limón' },
  { id: 27, name: 'Cusqueña Trigo', cat: 'cervezas', price: 8, emoji: '🍺', img: 'Cristal.jpg', desc: 'Cerveza de trigo' },
  { id: 28, name: 'Vino Tinto', cat: 'botellas', price: 45, emoji: '🍷', img: 'Cristal.jpg', desc: 'Vino tinto casa' },
  { id: 29, name: 'Caña', cat: 'tragos', price: 12, emoji: '🥃', img: 'Cristal.jpg', desc: 'Caña de puro' },
  { id: 30, name: 'Fernet con Coca', cat: 'cócteles', price: 18, emoji: '🥃', img: 'Cristal.jpg', desc: 'Fernet 1882 con Coca Cola' }
];

const HOSTESSES = [
  { id: 1, name: 'Valeria R.', phone: '51924996961', zone: 'VIP', status: 'active' },
  { id: 2, name: 'Daniela C.', phone: '51924996961', zone: 'Pista', status: 'active' },
  { id: 3, name: 'Melissa T.', phone: '51924996961', zone: 'Barra', status: 'active' },
  { id: 4, name: 'Paola M.', phone: '51924996961', zone: 'Terraza', status: 'active' },
  { id: 5, name: 'Sofía L.', phone: '51924996961', zone: 'VIP', status: 'active' }
];

const MESAS = Array.from({length: 52}, (_, i) => ({
  id: i + 1,
  num: `M${String(i + 1).padStart(2, '0')}`,
  zone: i < 10 ? 'VIP' : i < 25 ? 'Pista' : i < 35 ? 'Barra' : 'Terraza',
  status: 'libre'
}));

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initMenu);

function initMenu() {
  console.log('🍹 FRV Menu System - Initializing...');
  hidePreloader();
  renderCategories();
  renderMesaSelector();
  renderProducts();
  setupEventListeners();
  loadCartFromStorage();
  
  // Initialize Firebase if available
  if (typeof window.FirebaseClient !== 'undefined') {
    console.log('🔥 Firebase available for real-time sync');
  }
}

function hidePreloader() {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
  }, 800);
}

function renderCategories() {
  const catsBar = document.getElementById('catsBar');
  if (!catsBar) return;
  
  const categories = ['all', 'cervezas', 'tragos', 'cócteles', 'botellas', 'mixers', 'piqueos'];
  const labels = {
    'all': 'TODO', 'cervezas': '🍺 CERVEZAS', 'tragos': '🥃 TRAGOS',
    'cócteles': '🍹 CÓCTELES', 'botellas': '🍾 BOTELLAS',
    'mixers': '🥤 MIXERS', 'piqueos': '🥗 PIQUEOS'
  };
  
  catsBar.innerHTML = categories.map(cat =>
    `<div class="cat-pill ${cat === currentCategory ? 'active' : ''}"
          onclick="filterCategory('${cat}', this)">${labels[cat]}</div>`
  ).join('');
}

function filterCategory(cat, element) {
  currentCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  if (element) element.classList.add('active');
  renderProducts();
}

function renderProducts() {
  const container = document.getElementById('menuContainer');
  if (!container) return;
  
  let filtered = PRODUCTS;
  if (currentCategory !== 'all') {
    filtered = PRODUCTS.filter(p => p.cat === currentCategory);
  }
  
  // Search filter
  const searchInput = document.getElementById('pos-search');
  if (searchInput && searchInput.value) {
    const query = searchInput.value.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
  }
  
  container.innerHTML = filtered.map(product => `
    <div class="prod-card" onclick="quickAddToCart(${product.id})">
      ${product.img ? `<img src="public/img/productos/${product.img}" alt="${product.name}" class="prod-img" onerror="this.style.display='none'">` : ''}
      <div class="prod-emoji">${product.emoji}</div>
      <div class="prod-name">${product.name}</div>
      <div class="prod-desc">${product.desc}</div>
      <div class="prod-price">S/ ${product.price.toFixed(2)}</div>
    </div>
  `).join('');
}

function quickAddToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  
  saveCartToStorage();
  updateCartUI();
  showToast(`${product.emoji} ${product.name} añadido`, 'success');
}

function renderMesaSelector() {
  const grid = document.getElementById('mesaGrid');
  if (!grid) return;
  
  grid.innerHTML = MESAS.map(mesa => {
    const isBooked = mesa.status !== 'libre';
    return `
      <button class="mesa-btn ${isBooked ? 'booked' : ''} ${selectedMesa === mesa.id ? 'selected' : ''}"
              onclick="selectMesa(${mesa.id})" ${isBooked ? 'disabled' : ''}>
        ${mesa.num}
      </button>
    `;
  }).join('');
}

function selectMesa(mesaId) {
  selectedMesa = mesaId;
  const mesa = MESAS.find(m => m.id === mesaId);
  document.getElementById('mesaTag').textContent = `⚡ ${mesa.num}`;
  closeMesaSelector();
  openCartSheet();
  showToast(`Mesa ${mesa.num} seleccionada`, 'info');
}

function openMesaSelector() {
  document.getElementById('mesaSelector').style.display = 'flex';
}

function closeMesaSelector() {
  document.getElementById('mesaSelector').style.display = 'none';
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartCount').textContent = count;
  
  renderCartItems();
  updateCartTotal();
  
  // Mostrar selector de mesa si no hay mesa seleccionada
  if (!selectedMesa && cart.length > 0) {
    openMesaSelector();
  }
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  if (!container) return;
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:var(--text3)">
        <div style="font-size:36px; margin-bottom:12px">🍹</div>
        <div>Agrega productos<br>para comenzar</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="cart-row">
      <span class="cart-emoji">${item.emoji}</span>
      <div class="cart-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">S/ ${item.price.toFixed(2)} × ${item.qty} = S/ ${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div class="qty-ctrl">
        <button class="qbtn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qnum">${item.qty}</span>
        <button class="qbtn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <button class="cart-del" onclick="removeItem(${item.id})">✕</button>
    </div>
  `).join('');
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  
  saveCartToStorage();
  updateCartUI();
}

function removeItem(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCartToStorage();
  updateCartUI();
}

function updateCartTotal() {
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subTotal * 0.10;
  const total = subTotal + tax;
  
  document.getElementById('cartTotal').textContent = `S/ ${total.toFixed(2)}`;
  document.getElementById('p-sub').textContent = `S/ ${subTotal.toFixed(2)}`;
  document.getElementById('p-tax').textContent = `S/ ${tax.toFixed(2)}`;
  document.getElementById('p-total').textContent = `S/ ${total.toFixed(2)}`;
  
  document.getElementById('btn-cobrar').disabled = cart.length === 0 || !selectedMesa;
}

function selectPayment(method, element) {
  selectedPayment = method;
  document.querySelectorAll('.pm').forEach(p => p.classList.remove('selected'));
  element.classList.add('selected');
}

function openCartSheet() {
  document.getElementById('cartSheet').classList.add('show');
  document.getElementById('overlay').classList.add('show');
  updateCartUI();
}

function closeCartSheet() {
  document.getElementById('cartSheet').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

function goBackToMenu() {
  closeCartSheet();
}

function addMoreProducts() {
  closeCartSheet();
}

function toggleCart() {
  const sheet = document.getElementById('cartSheet');
  if (sheet.classList.contains('show')) {
    closeCartSheet();
  } else {
    if (!selectedMesa) {
      openMesaSelector();
    } else {
      openCartSheet();
    }
  }
}

// Real-time order placement with Firebase
async function placeOrder() {
  if (cart.length === 0 || !selectedMesa) {
    showToast('Selecciona una mesa y agrega productos', 'error');
    return;
  }
  
  const mesa = MESAS.find(m => m.id === selectedMesa);
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subTotal * 1.10; // +10% IGV
  
  const orderData = {
    tableId: selectedMesa,
    tableNum: mesa.num,
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      emoji: item.emoji
    })),
    method: selectedPayment,
    total: total,
    subTotal: subTotal,
    status: 'pending',
    createdAt: new Date().toISOString(),
    note: orderNote,
    hostesses: HOSTESSES.map(h => ({ id: h.id, name: h.name, phone: h.phone }))
  };
  
  try {
    // Save to Firebase if available
    if (typeof window.createOrder === 'function') {
      const result = await window.createOrder(orderData);
      if (result) {
        console.log('📝 Pedido guardado en Firebase:', result);
      } else {
        console.log('📝 Pedido guardado localmente');
      }
    }
    
    // Send WhatsApp messages to selected hostesses
    await sendWhatsAppNotifications(orderData);
    
    // Show success modal
    showOrderSuccess(orderData);
    
    // Save order locally
    saveOrderToStorage(orderData);
    
    // Clear cart
    cart = [];
    selectedMesa = null;
    orderNote = '';
    saveCartToStorage();
    
    // Update UI
    closeCartSheet();
    updateCartUI();
    
    // Update mesa selector
    renderMesaSelector();
    
  } catch (error) {
    console.error('Error al guardar pedido:', error);
    showToast('Error al enviar pedido', 'error');
  }
}

function saveOrderToStorage(order) {
  const orders = JSON.parse(localStorage.getItem('frv_orders') || '[]');
  orders.push({ ...order, id: Date.now() });
  localStorage.setItem('frv_orders', JSON.stringify(orders));
}

async function sendWhatsAppNotifications(order) {
  const whatsappNumber = '51924996961';
  
  // Build message text
  let itemsText = order.items.map(item => `• ${item.emoji} ${item.name} ×${item.qty} = S/${(item.price * item.qty).toFixed(2)}`).join('\n');
  
  let message = `*🍽️ NUEVO PEDIDO - FRV CATACAOS*\n\n`;
  message += `*Mesa:* ${order.tableNum}\n`;
  message += `*Items:*\n${itemsText}\n\n`;
  message += `*Subtotal:* S/${order.subTotal.toFixed(2)}\n`;
  message += `*IGV (10%):* S/${(order.total - order.subTotal).toFixed(2)}\n`;
  message += `*TOTAL:* S/${order.total.toFixed(2)}\n`;
  message += `*Pago:* ${getPaymentMethodLabel(order.method)}\n\n`;
  
  if (order.note) {
    message += `*Nota:* ${order.note}\n\n`;
  }
  
  message += `*Hora:* ${new Date().toLocaleTimeString('es-PE')}\n`;
  message += `*Por favor, preparar lo antes posible 🚀*`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  
  // Try to open WhatsApp
  try {
    window.open(whatsappUrl, '_blank');
  } catch (e) {
    console.log('WhatsApp not available, message prepared:', message);
  }
  
  // Send to each hostess as well
  HOSTESSES.forEach(h => {
    const hostessMessage = `*🍹 Nuevo pedido en tu zona (${order.tableNum})*\n\n${itemsText}\n\n*Total: S/${order.total.toFixed(2)}*`;
    const hostessUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(hostessMessage)}`;
    console.log(`WhatsApp for ${h.name}: ${hostessUrl}`);
  });
}

function getPaymentMethodLabel(method) {
  const labels = {
    'yape': 'Yape/Plin',
    'tarjeta': 'Tarjeta',
    'efectivo': 'Efectivo'
  };
  return labels[method] || method;
}

function showOrderSuccess(order) {
  const modal = document.getElementById('successModal');
  if (!modal) return;
  
  const orderNum = `#${String(Date.now()).slice(-6)}`;
  document.getElementById('orderNum').textContent = orderNum;
  
  modal.style.display = 'flex';
  
  setTimeout(() => {
    modal.style.display = 'none';
  }, 4000);
}

// Animador saludo
function enviarSaludoAnimador() {
  const phone = '51950729470';
  const mesa = selectedMesa ? MESAS.find(m => m.id === selectedMesa)?.num : 'no especificada';
  
  const message = `*Saludo para Yaruc!*\n\n` +
    `*Mesa:* ${mesa}\n` +
    `*Desde:* Carta digital FRV\n\n` +
    `*¡Que tengas un excelente show! 🎤✨*`;
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
}

// Alerta de seguridad
function sendSafetyAlert() {
  const phone = '51924996961';
  const mesa = selectedMesa ? MESAS.find(m => m.id === selectedMesa)?.num : 'no especificada';
  
  if (confirm('¿Enviar alerta de seguridad al equipo?')) {
    const message = `*🚨 ALERTA DE SEGURIDAD - FRV CATACAOS*\n\n` +
      `*⚠️ Se necesita asistencia inmediata\n\n` +
      `*🪑 Mesa:* ${mesa}\n` +
      `*⏰ Hora:* ${new Date().toLocaleTimeString('es-PE')}\n\n` +
      `*Por favor, acudir lo antes posible.*`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  }
}

// Toast notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Cart storage
function saveCartToStorage() {
  localStorage.setItem('frv_cart', JSON.stringify(cart));
  localStorage.setItem('frv_mesa', JSON.stringify(selectedMesa));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem('frv_cart');
  if (saved) {
    try {
      cart = JSON.parse(saved);
      updateCartUI();
    } catch (e) {
      cart = [];
    }
  }
  
  const savedMesa = localStorage.getItem('frv_mesa');
  if (savedMesa) {
    try {
      selectedMesa = parseInt(savedMesa);
      const mesa = MESAS.find(m => m.id === selectedMesa);
      if (mesa) {
        document.getElementById('mesaTag').textContent = `⚡ ${mesa.num}`;
      }
    } catch (e) {
      selectedMesa = null;
    }
  }
}

// Event listeners
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('pos-search');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        renderProducts();
      }, 300);
    });
  }
  
  // Note input
  const noteInput = document.getElementById('orderNote');
  if (noteInput) {
    noteInput.addEventListener('input', (e) => {
      orderNote = e.target.value;
    });
  }
  
  // Close cart on overlay click
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener('click', closeCartSheet);
  }
  
  // Close mesa selector on outside click
  const mesaSelector = document.getElementById('mesaSelector');
  if (mesaSelector) {
    mesaSelector.addEventListener('click', (e) => {
      if (e.target === mesaSelector) {
        closeMesaSelector();
      }
    });
  }
  
  // Real-time updates from Firebase
  if (typeof window.subscribeToOrders !== 'undefined') {
    window.subscribeToOrders((data) => {
      if (data && data.orders) {
        console.log('📡 Real-time updates received:', data.orders.length, 'orders');
        // Update local state if needed
      }
    });
  }
}

// Auto-refresh products every 5 minutes
setInterval(() => {
  renderProducts();
}, 300000);

console.log('✅ FRV Menu System loaded successfully');
