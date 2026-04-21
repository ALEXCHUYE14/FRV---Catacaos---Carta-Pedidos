// ── CONFIG ──────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
let MESA = urlParams.get('mesa') || generateUniqueMesa();
let anfitrionaSeleccionada = null;
let anfitrionaPhone = null;
let currentOrder = null;

// Generate unique mesa number for each session (1-50)
function generateUniqueMesa() {
  let sessionMesa = sessionStorage.getItem('frv_mesa');
  if (sessionMesa) {
    return sessionMesa;
  }
  const newMesa = Math.floor(Math.random() * 50) + 1;
  sessionStorage.setItem('frv_mesa', newMesa);
  return newMesa.toString();
}

// Asegurar que el elemento mesaTag existe antes de modificar
const mesaTagElInit = document.getElementById('mesaTag');
if (mesaTagElInit) mesaTagElInit.textContent = `⚡ MESA ${MESA}`;

// ── MESA SELECTOR ──────────────────────────────
function initMesaSelector() {
  const mesaGrid = document.getElementById('mesaGrid');
  if (!mesaGrid) {
    console.warn('mesaGrid no encontrado, selector de mesa no inicializado');
    return;
  }
  mesaGrid.innerHTML = '';
  
  for (let i = 1; i <= 50; i++) {
    const btn = document.createElement('button');
    btn.className = 'mesa-btn';
    btn.textContent = i;
    btn.onclick = () => selectMesa(i, btn);
    if (i == MESA) btn.classList.add('selected');
    mesaGrid.appendChild(btn);
  }
}

function selectMesa(num, btn) {
  document.querySelectorAll('.mesa-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  MESA = num;
}

function confirmarMesa() {
  sessionStorage.setItem('frv_mesa', MESA);
  sessionStorage.setItem('user_selected_mesa', 'true');
  document.getElementById('mesaTag').textContent = `⚡ MESA ${MESA}`;

  if (sessionStorage.getItem('user_selected_mesa')) {
    document.getElementById('mesaTag').style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)';
    document.getElementById('mesaTag').style.color = '#0a0a0a';
  }
  document.getElementById('mesaSelector').classList.remove('show');
}

// Show mesa selector on click (protegido)
const mesaTagElClick = document.getElementById('mesaTag');
if (mesaTagElClick) {
  mesaTagElClick.addEventListener('click', () => {
    document.getElementById('mesaSelector').classList.add('show');
    initMesaSelector();
  });
}

// ── MENU DATA ────────────────────────────────────
const products = [
  { id:10, name:'Cristal', desc:'Botella 620ml bien fría', price:12, emoji:'🍺', cat:'cervezas', badge:'PROMO', img:'public/img/productos/Cristal.jpg', featured: true },
  { id:11, name:'Pilsen', desc:'Botella 620ml', price:12, emoji:'🍻', cat:'cervezas', img:'public/img/productos/Pilsen cerveza.png', featured: true },
  { id:12, name:'Cusqueña', desc:'Botella 620ml, premium', price:13, emoji:'🍺', cat:'cervezas', img:'public/img/productos/Cusqueña.png' },
  { id:1, name:'Pisco Sour', desc:'Pisco quebranta, limón, clara, jarabe', price:18, emoji:'🍋', cat:'tragos', badge:'TOP', img:'public/img/productos/Pisco-Sour.png' },
  { id:2, name:'Chilcano', desc:'Pisco, ginger ale, limón', price:15, emoji:'🍸', cat:'tragos', img:'public/img/productos/Pisco-Sour.png' },
  { id:3, name:'Mojito', desc:'Ron, menta, lima, soda', price:16, emoji:'🌿', cat:'tragos', img:'public/img/productos/Pisco-Sour.png' },
  { id:4, name:'Margarita', desc:'Tequila, triple sec, limón', price:17, emoji:'🍊', cat:'tragos', img:'public/img/productos/Pisco-Sour.png' },
  { id:5, name:'Piña Colada', desc:'Ron, crema coco, piña', price:16, emoji:'🍍', cat:'tragos', img:'public/img/productos/Pisco-Sour.png' },
  { id:6, name:'Sex on the Beach', desc:'Vodka, durazno, naranja', price:16, emoji:'🏖️', cat:'tragos', badge:'NEW', img:'public/img/productos/Pisco-Sour.png' },
  { id:16, name:"Mike's", desc:"Mike's Hard Lemonade 355ml", price:12, emoji:'🍋', cat:'tragos', img:'public/img/productos/Mikes.png' },
  { id:7, name:'Tequila Shot', desc:'José Cuervo + sal + limón', price:10, emoji:'🥃', cat:'shots', img:'public/img/productos/Pisco-Sour.png' },
  { id:8, name:'Jäger Shot', desc:'Jägermeister bien frío', price:10, emoji:'🌿', cat:'shots', img:'public/img/productos/Pisco-Sour.png' },
  { id:9, name:'Ron con Cola', desc:'Ron Cartavio + Coca Cola', price:12, emoji:'🫙', cat:'shots', img:'public/img/productos/Pisco-Sour.png' },
  { id:13, name:'Agua Mineral', desc:'500ml sin gas / con gas', price:3, emoji:'💧', cat:'sin-alcohol', img:'public/img/productos/agua.jpg' },
  { id:14, name:'Coca Cola', desc:'Botella 500ml', price:4, emoji:'⭐', cat:'sin-alcohol', img:'public/img/productos/coca-cola.jpg' },
  { id:15, name:'Frugos', desc:'Durazno / Mango / Naranja', price:4, emoji:'🧃', cat:'sin-alcohol', img:'public/img/productos/Frugos.jpg' },
];

let cart = {};
let currentCat = 'all';

// ── RENDER MENU ──────────────────────────────────
const catNames = { cervezas:'CERVEZAS', tragos:'TRAGOS', shots:'SHOTS', 'sin-alcohol':'SIN ALCOHOL' };

function renderMenu(cat = 'all') {
  try {
    const filtered = cat === 'all' ? products : products.filter(p => p.cat === cat);
    const cats = [...new Set(filtered.map(p => p.cat))];
    const container = document.getElementById('menuContainer');
    container.innerHTML = '';

    cats.forEach(c => {
      const items = filtered.filter(p => p.cat === c);

      const label = document.createElement('div');
      label.className = 'section-label';
      label.innerHTML = `<div class="section-label-text">${catNames[c] || c.toUpperCase()}</div><div class="section-label-line"></div>`;
      container.appendChild(label);

      const grid = document.createElement('div');
      grid.className = 'menu-grid';

      items.forEach(p => {
        const qtyInCart = cart[p.id] ? cart[p.id].qty : 0;
        const featuredClass = p.featured ? 'featured' : '';
        const emoji = p.emoji || '🍹';
        grid.innerHTML += `
          <div class="card ${featuredClass}" onclick="addItem(${p.id})">
            <div class="card-img ${p.cat}">
              <img src="${p.img}" alt="${p.name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center';this.parentElement.innerHTML='<span style=\"font-size:48px\">${emoji}</span>';">
              <div class="card-img-fallback" style="display:none;align-items:center;justify-content:center;font-size:48px;">${emoji}</div>

              ${p.badge ? `<div class="card-badge ${p.badge==='NEW'?'new':''}">${p.badge}</div>` : ''}
              <div class="card-qty-indicator ${qtyInCart>0?'show':''}" id="qi-${p.id}">${qtyInCart}</div>
            </div>
            <div class="card-body">
              <div class="card-name">${p.name}</div>
              <div class="card-desc">${p.desc}</div>
              <div class="card-footer">
                <div class="card-price">S/ ${p.price.toFixed(2)}</div>
                <button class="add-btn" id="add-${p.id}">+</button>
              </div>
            </div>
          </div>`;
      });
      container.appendChild(grid);
    });
  } catch (error) {
    console.error('❌ Error en renderMenu:', error);
    const container = document.getElementById('menuContainer');
    if (container) {
      container.innerHTML = `<div style="color:red;padding:20px;text-align:center;">Error al renderizar menú: ${error.message}</div>`;
    }
  }
}

function filterCat(cat, el) {
  currentCat = cat;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  renderMenu(cat);
}

// ── ANFITRIONA SELECTION ─────────────────────────
function selectAnfitriona(card, phone) {
  document.querySelectorAll('.anfitriona-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  anfitrionaSeleccionada = card.querySelector('.anfitriona-name').textContent;
  anfitrionaPhone = phone;
}

// ── ANIMADOR SALUDOS ─────────────────────────────
function enviarSaludoAnimador() {
  const animadorPhone = '51950729470';
  const mesa = MESA;
  
  let message = `🎤 *¡SALUDO PARA YARUC!*\n\n`;
  message += `🪑 *Mesa:* ${mesa}\n`;
  message += `\n🎉 ¡Hola Yaruc! Queremos enviarte un saludo desde nuestra mesa.\n`;
  message += `\n¡Gracias por animar la noche! 🎶💃\n`;
  message += `\n⏰ *Hora:* ${new Date().toLocaleTimeString('es-PE')}`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${animadorPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}

// ── CART LOGIC ───────────────────────────────────
function addItem(id) {
  if (!sessionStorage.getItem('user_selected_mesa')) {
    document.getElementById('mesaSelector').classList.add('show');
    initMesaSelector();
    alert('Por favor, selecciona la mesa en la que te encuentras ubicada antes de hacer tu pedido.');
    return;
  }
  
  const p = products.find(x => x.id === id);
  if (!cart[id]) cart[id] = { ...p, qty: 0 };
  cart[id].qty++;
  updateCart();

  const btn = document.getElementById('add-' + id);
  if (btn) {
    btn.classList.add('added');
    btn.textContent = '✓';
    setTimeout(() => { btn.classList.remove('added'); btn.textContent = '+'; }, 500);
  }

  const qi = document.getElementById('qi-' + id);
  if (qi) {
    qi.textContent = cart[id].qty;
    qi.classList.add('show');
  }
}

function updateQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  updateCart();

  const qi = document.getElementById('qi-' + id);
  if (qi) {
    if (cart[id]) { qi.textContent = cart[id].qty; qi.classList.add('show'); }
    else { qi.textContent = 0; qi.classList.remove('show'); }
  }
}

function removeItem(id) {
  delete cart[id];
  updateCart();
  const qi = document.getElementById('qi-' + id);
  if (qi) {
    qi.textContent = 0;
    qi.classList.remove('show');
  }
}

function clearCart() {
  cart = {};
  updateCart();
  renderMenu(currentCat);
}

function updateCart() {
  const total = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);
  const count = Object.values(cart).reduce((s, i) => s + i.qty, 0);

  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = 'S/ ' + total.toFixed(2);

  const btn = document.getElementById('cartBtn');
  count > 0 ? btn.classList.add('visible') : btn.classList.remove('visible');

  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const items = Object.values(cart);
  if (!items.length) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);font-size:14px;font-family:'Exo 2',sans-serif;">Tu carrito está vacío</div>`;
    return;
  }
  container.innerHTML = items.map(i => `
    <div class="cart-item">
      <div class="ci-info">
        <div class="ci-name">${i.name}</div>
        <div class="ci-price">S/ ${(i.price * i.qty).toFixed(2)}</div>
      </div>
      <div class="ci-qty">
        <button class="qty-btn" onclick="updateQty(${i.id},-1)">−</button>
        <span class="qty-num">${i.qty}</span>
        <button class="qty-btn" onclick="updateQty(${i.id},1)">+</button>
        <button class="qty-btn remove-btn" onclick="removeItem(${i.id})">🗑️</button>
      </div>
    </div>`).join('');
  
  container.innerHTML += `
    <div style="text-align:center;padding:12px;">
      <button class="clear-cart-btn" onclick="clearCart()">🗑️ Vaciar Carrito</button>
    </div>
  `;
}

function toggleCart() {
  document.getElementById('cartSheet').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
  renderCartItems();
}

function selectPM(el) {
  document.querySelectorAll('.pm').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}

// ── WHATSAPP ORDER ───────────────────────────────
function generateWhatsAppMessage() {
  const items = Object.values(cart);
  const note = document.getElementById('orderNote').value;
  const paymentMethod = document.querySelector('.pm.selected')?.textContent?.trim() || 'No especificado';
  
  let message = `🍹 *NUEVO PEDIDO - FRV Catacaos*\n\n`;
  message += `🪑 *Mesa:* ${MESA}\n`;
  
  if (anfitrionaSeleccionada) {
    message += `👩‍💼 *Anfitriona:* ${anfitrionaSeleccionada}\n`;
  }
  
  message += `\n📋 *Detalle del Pedido:*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  
  items.forEach(item => {
    message += `• ${item.emoji} ${item.name} x${item.qty} - S/ ${(item.price * item.qty).toFixed(2)}\n`;
  });
  
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  message += `💰 *Total:* S/ ${total.toFixed(2)}\n`;
  message += `💳 *Pago:* ${paymentMethod}\n`;
  
  if (note) {
    message += `\n📝 *Nota:* ${note}\n`;
  }
  
  message += `\n⏰ *Hora:* ${new Date().toLocaleTimeString('es-PE')}\n`;
  message += `\n✅ Pedido confirmado desde el menú digital`;
  
  return encodeURIComponent(message);
}

function sendWhatsApp(phone) {
  const message = generateWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  window.open(whatsappUrl, '_blank');
}

// ── SEND TO ADMIN PANEL (Firebase) ──────────────────────────
async function sendToAdminPanel() {
  const items = Object.values(cart);
  const note = document.getElementById('orderNote').value;
  const paymentMethod = document.querySelector('.pm.selected')?.textContent?.trim() || 'No especificado';
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  
  const orderData = {
    mesa: MESA,
    items: items.map(i => ({
      name: i.name,
      emoji: i.emoji,
      qty: i.qty,
      price: i.price,
      total: i.price * i.qty,
      cat: i.cat
    })),
    note: note,
    paymentMethod: paymentMethod,
    total: total,
    anfitriona: anfitrionaSeleccionada,
    anfitrionaPhone: anfitrionaPhone,
    createdAt: new Date().toISOString(),
    status: 'pending',
    source: 'menu-digital'
  };
  
  let orderId = null;
  let firebaseWorking = false;
  
  // Función mejorada para escribir directamente en Firebase
  const writeToFirebaseDirect = async () => {
    // Intentar con SDK nativo directamente (más confiable)
    try {
      if (typeof firebase !== 'undefined' && firebase.database) {
        console.log('📡 Escribiendo directamente en Firebase...');
        const db = firebase.database();
        
        // Verificar conexión primero
        const connected = await db.ref('.info/connected').once('value');
        if (connected.val() !== true) {
          console.warn('⚠️ Firebase no conectado');
          return { success: false, error: 'no connected' };
        }
        
        // Escribir pedido
        const newRef = db.ref('orders').push();
        await newRef.set({
          ...orderData,
          id: newRef.key,
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
        
        console.log('✅ Pedido guardado en Firebase:', newRef.key);
        return { success: true, id: newRef.key };
      }
    } catch (error) {
      console.error('❌ Error Firebase SDK:', error.message);
    }
    
    // Intentar con FirebaseClient si SDK nativo falló
    try {
      if (typeof FirebaseClient !== 'undefined') {
        console.log('📡 Intentando con FirebaseClient...');
        const db = await FirebaseClient.init();
        if (db) {
          const newOrder = await FirebaseClient.createOrder(orderData);
          if (newOrder) {
            console.log('✅ Pedido guardado via FirebaseClient:', newOrder.id || newOrder.key);
            return { success: true, id: newOrder.id || newOrder.key };
          }
        }
      }
    } catch (error) {
      console.error('❌ Error FirebaseClient:', error.message);
    }
    
    return { success: false };
  };
  
  // Intentar escribir a Firebase (máximo 3 intentos)
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📡 Envío a Firebase - intento ${attempt}/${maxRetries}`);
    const result = await writeToFirebaseDirect();
    if (result.success) {
      orderId = result.id;
      firebaseWorking = true;
      console.log('✅ Pedido enviado exitosamente a Firebase');
      break;
    }
    if (attempt < maxRetries) {
      console.log('⏳ Reintentando en 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Fallback: localStorage solo si Firebase absolutamente no funciona
  if (!firebaseWorking) {
    console.warn('⚠️ Firebase no disponible - guardando localmente');
    const existingOrders = JSON.parse(localStorage.getItem('frv_orders') || '[]');
    
    orderData.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    orderId = orderData.id;
    
    existingOrders.unshift(orderData);
    localStorage.setItem('frv_orders', JSON.stringify(existingOrders));
    
    if (menuBroadcastChannel) {
      menuBroadcastChannel.postMessage({ type: 'new_order', order: orderData });
    }
    
    console.log('⚠️ Pedido en localStorage (el panel no lo verá si está en otro navegador):', orderId);
  }
  
  if (orderId) {
    localStorage.setItem('frv_last_order_id', orderId);
  }
  
  updateSalesReport(items);
  
  return orderData;
}

// BroadcastChannel para comunicación entre pestañas
let menuBroadcastChannel = null;

function initMenuBroadcast() {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      menuBroadcastChannel = new BroadcastChannel('frv_orders');
      console.log('✅ Menu BroadcastChannel listo');
    }
  } catch (e) {
    console.warn('BroadcastChannel no disponible');
  }
}

function sendToLocalStorage(orderData) {
  const existingOrders = JSON.parse(localStorage.getItem('frv_orders') || '[]');
  
  if (!orderData.id) {
    orderData.id = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  orderData.createdAt = orderData.createdAt || new Date().toISOString();
  orderData.status = orderData.status || 'pending';
  
  existingOrders.unshift(orderData);
  localStorage.setItem('frv_orders', JSON.stringify(existingOrders));
  
  if (menuBroadcastChannel) {
    menuBroadcastChannel.postMessage({ type: 'new_order', order: orderData });
  }
  
  localStorage.setItem('frv_last_order', JSON.stringify(orderData));
  localStorage.setItem('frv_last_order_time', Date.now().toString());
  
  console.log('✅ Pedido guardado en localStorage:', orderData.id);
}

async function decrementInventoryFromOrder(items) {
  try {
    if (typeof FirebaseClient === 'undefined') return;
    
    const db = await FirebaseClient.init();
    if (!db) return;
    
    const snapshot = await db.ref('inventory').once('value');
    const data = snapshot.val() || {};
    const inventory = data;
    
    let updates = {};
    let hasChanges = false;
    
    items.forEach(item => {
      Object.keys(inventory).forEach(key => {
        if (inventory[key].name === item.name && inventory[key].stock > 0) {
          const currentStock = inventory[key].stock || 0;
          const newStock = Math.max(0, currentStock - item.qty);
          updates[`inventory/${key}/stock`] = newStock;
          hasChanges = true;
          
          if (newStock <= (inventory[key].minStock || 10)) {
            console.log(`⚠️ Stock bajo para ${item.name}: ${newStock}`);
          }
        }
      });
    });
    
    if (hasChanges) {
      await db.ref().update(updates);
      console.log('✅ Inventario actualizado');
    }
  } catch (error) {
    console.error('❌ Error actualizando inventario:', error);
  }
}

// ── SALES REPORT ─────────────────────────────────
function updateSalesReport(items) {
  const report = JSON.parse(localStorage.getItem('frv_sales_report') || '{}');
  
  items.forEach(item => {
    if (!report[item.cat]) {
      report[item.cat] = {};
    }
    if (!report[item.cat][item.name]) {
      report[item.cat][item.name] = { qty: 0, revenue: 0 };
    }
    report[item.cat][item.name].qty += item.qty;
    report[item.cat][item.name].revenue += item.price * item.qty;
  });
  
  localStorage.setItem('frv_sales_report', JSON.stringify(report));
}

// ── PLACE ORDER ──────────────────────────────────
async function placeOrder() {
  try {
    const count = Object.values(cart).reduce((s, i) => s + i.qty, 0);
    if (!count) {
      alert('Por favor agrega productos a tu pedido');
      return;
    }

    if (!sessionStorage.getItem('user_selected_mesa')) {
      alert('⚠️ Por favor selecciona tu número de mesa antes de hacer el pedido');
      document.getElementById('mesaSelector').classList.add('show');
      initMesaSelector();
      return;
    }

    if (!anfitrionaPhone) {
      alert('Por favor selecciona una anfitriona para atenderte');
      return;
    }

    const orderNum = Math.floor(Math.random() * 900) + 100;
    document.getElementById('orderNum').textContent = orderNum;

    // Mostrar que se está enviando
    console.log('📤 Enviando pedido...');
    
    // Enviar pedido al panel de bar (Firebase + fallback localStorage)
    const orderData = await sendToAdminPanel();
    console.log('✅ Pedido procesado:', orderData);

    // Enviar por WhatsApp a la anfitriona
    sendWhatsApp(anfitrionaPhone);

    // Mostrar modal de éxito
    document.getElementById('cartSheet').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
    document.getElementById('successModal').classList.add('show');

    // Limpiar después de 6 segundos
    setTimeout(() => {
      cart = {};
      updateCart();
      renderMenu(currentCat);
      document.getElementById('successModal').classList.remove('show');
      document.getElementById('orderNote').value = '';
    }, 6000);
    
  } catch (error) {
    console.error('❌ Error en placeOrder:', error);
    alert('Error al enviar el pedido: ' + error.message);
  }
}

// ── BOTONES DEL CARRITO ────────────────────────────
function goBackToMenu() {
  document.getElementById('cartSheet').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

function addMoreProducts() {
  document.getElementById('cartSheet').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('menuContainer').scrollIntoView({ behavior: 'smooth' });
}

// ── INITIALIZATION ──────────────────────────────────
function initMenu() {
  try {
    console.log('🍹 FRV Menu - Inicializando...');
    
    const menuContainer = document.getElementById('menuContainer');
    const mesaTag = document.getElementById('mesaTag');
    
    if (!menuContainer) {
      console.error('❌ menuContainer no encontrado');
      return;
    }
    
    if (!mesaTag) {
      console.error('❌ mesaTag no encontrado');
    } else {
      mesaTag.textContent = `⚡ MESA ${MESA}`;
    }
    
    renderMenu();
    initMesaSelector();
    initMenuBroadcast();
    
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
    
    console.log('✅ Menú inicializado correctamente');
  } catch (error) {
    console.error('❌ Error crítico en initMenu:', error);
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
    const container = document.getElementById('menuContainer');
    if (container) {
      container.innerHTML = `
        <div style="color:red;padding:20px;text-align:center;background:rgba(255,0,0,0.1);border-radius:8px;margin:20px;">
          <h3>❌ Error al cargar el menú</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()" style="margin-top:10px;padding:8px 16px;background:var(--yellow);border:none;border-radius:4px;cursor:pointer;">🔄 Recargar página</button>
        </div>
      `;
    }
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenu);
} else {
  initMenu();
}
