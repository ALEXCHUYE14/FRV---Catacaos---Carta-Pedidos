
// ── CONFIG ──────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
let MESA = urlParams.get('mesa') || generateUniqueMesa();
let anfitrionaSeleccionada = null;
let anfitrionaPhone = null;
let currentOrder = null;

// Generate unique mesa number for each session (1-100)
function generateUniqueMesa() {
  // Check if mesa already assigned in this session
  let sessionMesa = sessionStorage.getItem('frv_mesa');
  if (sessionMesa) {
    return sessionMesa;
  }
  // Generate random mesa 1-100
  const newMesa = Math.floor(Math.random() * 100) + 1;
  sessionStorage.setItem('frv_mesa', newMesa);
  return newMesa.toString();
}

document.getElementById('mesaTag').textContent = `⚡ MESA ${MESA}`;

// ── MESA SELECTOR ──────────────────────────────
function initMesaSelector() {
  const mesaGrid = document.getElementById('mesaGrid');
  mesaGrid.innerHTML = '';
  
  for (let i = 1; i <= 100; i++) {
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
  document.getElementById('mesaTag').textContent = `⚡ MESA ${MESA}`;
  document.getElementById('mesaSelector').classList.remove('show');
}

// Show mesa selector on click
document.getElementById('mesaTag').addEventListener('click', () => {
  document.getElementById('mesaSelector').classList.add('show');
  initMesaSelector();
});

// ── MENU DATA ────────────────────────────────────
const products = [
  // CERVEZAS (PRIMERO - destacadas)
  { id:10, name:'Cristal', desc:'Botella 620ml bien fría', price:8, emoji:'🍺', cat:'cervezas', badge:'PROMO', img:'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop', featured: true },
  { id:11, name:'Pilsen', desc:'Botella 620ml', price:8, emoji:'🍻', cat:'cervezas', img:'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop', featured: true },
  { id:12, name:'Cusqueña', desc:'Botella 620ml, premium', price:10, emoji:'🍺', cat:'cervezas', img:'https://images.unsplash.com/photo-1556855810-ac404aa91e85?w=400&h=300&fit=crop' },
  // TRAGOS
  { id:1, name:'Pisco Sour', desc:'Pisco quebranta, limón, clara, jarabe', price:18, emoji:'🍋', cat:'tragos', badge:'TOP', img:'https://images.unsplash.com/photo-1556855810-ac404aa91e85?w=400&h=300&fit=crop' },
  { id:2, name:'Chilcano', desc:'Pisco, ginger ale, limón', price:15, emoji:'🍸', cat:'tragos', img:'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop' },
  { id:3, name:'Mojito', desc:'Ron, menta, lima, soda', price:16, emoji:'🌿', cat:'tragos', img:'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop' },
  { id:4, name:'Margarita', desc:'Tequila, triple sec, limón', price:17, emoji:'🍊', cat:'tragos', img:'https://images.unsplash.com/photo-1556855810-ac404aa91e85?w=400&h=300&fit=crop' },
  { id:5, name:'Piña Colada', desc:'Ron, crema coco, piña', price:16, emoji:'🍍', cat:'tragos', img:'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop' },
  { id:6, name:'Sex on the Beach', desc:'Vodka, durazno, naranja', price:16, emoji:'🏖️', cat:'tragos', badge:'NEW', img:'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop' },
  // SHOTS
  { id:7, name:'Tequila Shot', desc:'José Cuervo + sal + limón', price:10, emoji:'🥃', cat:'shots', img:'https://images.unsplash.com/photo-1556855810-ac404aa91e85?w=400&h=300&fit=crop' },
  { id:8, name:'Jäger Shot', desc:'Jägermeister bien frío', price:10, emoji:'🌿', cat:'shots', img:'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop' },
  { id:9, name:'Ron con Cola', desc:'Ron Cartavio + Coca Cola', price:12, emoji:'🫙', cat:'shots', img:'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop' },
  // SIN ALCOHOL
  { id:13, name:'Agua Mineral', desc:'500ml sin gas / con gas', price:3, emoji:'💧', cat:'sin-alcohol', img:'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop' },
  { id:14, name:'Inca Kola', desc:'Botella 500ml', price:4, emoji:'⭐', cat:'sin-alcohol', img:'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop' },
  { id:15, name:'Frugos', desc:'Durazno / Mango / Naranja', price:4, emoji:'🧃', cat:'sin-alcohol', img:'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop' },
];

let cart = {};
let currentCat = 'all';

// ── RENDER MENU ──────────────────────────────────
const catNames = { cervezas:'CERVEZAS', tragos:'TRAGOS', shots:'SHOTS', 'sin-alcohol':'SIN ALCOHOL' };

function renderMenu(cat = 'all') {
  const filtered = cat === 'all' ? products : products.filter(p => p.cat === cat);
  const cats = [...new Set(filtered.map(p => p.cat))];
  const container = document.getElementById('menuContainer');
  container.innerHTML = '';

  cats.forEach(c => {
    const items = filtered.filter(p => p.cat === c);

    const label = document.createElement('div');
    label.className = 'section-label';
    label.innerHTML = `<div class="section-label-text">${catNames[c]}</div><div class="section-label-line"></div>`;
    container.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'menu-grid';

    items.forEach(p => {
      const qtyInCart = cart[p.id] ? cart[p.id].qty : 0;
      const featuredClass = p.featured ? 'featured' : '';
      grid.innerHTML += `
        <div class="card ${featuredClass}" onclick="addItem(${p.id})">
          <div class="card-img ${p.cat}">
            <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
            <div class="card-emoji">${p.emoji}</div>
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
  
  let message = `🎤 *¡SALUDO PARA YARUC!*

`;
  message += `🪑 *Mesa:* ${mesa}
`;
  message += `
🎉 ¡Hola Yaruc! Queremos enviarte un saludo desde nuestra mesa.
`;
  message += `
¡Gracias por animar la noche! 🎶💃
`;
  message += `
⏰ *Hora:* ${new Date().toLocaleTimeString('es-PE')}`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${animadorPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}

// ── CART LOGIC ───────────────────────────────────
function addItem(id) {
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
      <div class="ci-emoji">${i.emoji}</div>
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
  
  // Add clear cart button
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

// ── SEND TO FIREBASE ──────────────────────────

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
    anfitrionaPhone: anfitrionaPhone
  };
  
  try {
    // Verificar que FirebaseClient esté disponible
    if (typeof FirebaseClient === 'undefined') {
      console.error('❌ FirebaseClient no está cargado');
      sendToLocalStorage(orderData);
      return orderData;
    }
    
    // Enviar a Firebase
    const savedOrder = await FirebaseClient.createOrder(orderData);
    
    if (savedOrder) {
      console.log('✅ Pedido enviado a Firebase:', savedOrder);
      // Guardar también en localStorage como respaldo
      sendToLocalStorage(orderData);
    } else {
      console.error('❌ Error al enviar pedido a Firebase');
      // Fallback a localStorage si Firebase falla
      sendToLocalStorage(orderData);
    }
  } catch (error) {
    console.error('❌ Error de conexión con Firebase:', error);
    // Fallback a localStorage si Firebase no está disponible
    sendToLocalStorage(orderData);
  }
  
  // Update sales report
  updateSalesReport(items);
  
  return orderData;
}

// Fallback a localStorage
function sendToLocalStorage(orderData) {
  const existingOrders = JSON.parse(localStorage.getItem('frv_orders') || '[]');
  existingOrders.unshift(orderData);
  localStorage.setItem('frv_orders', JSON.stringify(existingOrders));
  localStorage.setItem('frv_new_order', JSON.stringify(orderData));
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
function placeOrder() {
  const count = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  if (!count) {
    alert('Por favor agrega productos a tu pedido');
    return;
  }

  if (!anfitrionaPhone) {
    alert('Por favor selecciona una anfitriona para atenderte');
    return;
  }

  const orderNum = Math.floor(Math.random() * 900) + 100;
  document.getElementById('orderNum').textContent = orderNum;

  // Send to admin panel
  const orderData = sendToAdminPanel();

  // Send via WhatsApp to selected anfitriona
  sendWhatsApp(anfitrionaPhone);

  document.getElementById('cartSheet').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('successModal').classList.add('show');

  setTimeout(() => {
    cart = {};
    updateCart();
    renderMenu(currentCat);
    document.getElementById('successModal').classList.remove('show');
    document.getElementById('orderNote').value = '';
  }, 6000);
}

// INIT
renderMenu();
initMesaSelector();
