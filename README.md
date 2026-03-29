# 🍹 FRV Catacaos — Carta de Bebidas Digital

[![Netlify Status](https://img.shields.io/netlify/9ec7b3e4-7b3a-4b5a-8c9d-1234567890ab)](https://app.netlify.com/sites/fundorioverde/deploys)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

> **Menú digital interactivo para pedidos desde la mesa** — Diseñado para FRV Catacaos, un sistema de carta de bebidas moderno con integración a WhatsApp y panel de administración.

---

## 📋 Índice

- [Descripción](#-descripción)
- [Características](#-características)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Configuración](#-configuración)
- [API](#-api)
- [Contribución](#-contribución)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 🎯 Descripción

**FRV Catacaos** es una aplicación web de carta de bebidas digital que permite a los clientes:

- 📱 **Explorar el menú** de bebidas organizado por categorías
- 🪑 **Seleccionar su mesa** (1-100) para identificar el pedido
- 🛒 **Agregar productos** al carrito de compras
- 👩‍💼 **Elegir una anfitriona** que recibirá el pedido
- 💳 **Seleccionar método de pago** (Tarjeta, Yape, Plin, Efectivo)
- 📤 **Enviar el pedido** directamente al bar vía WhatsApp
- 🎤 **Enviar saludos** al animador del evento

El sistema está optimizado para dispositivos móviles y ofrece una experiencia de usuario fluida con animaciones elegantes y un diseño moderno inspirado en la identidad visual de FRV.

---

## ✨ Características

### 🎨 Interfaz de Usuario
- **Diseño responsivo** — Optimizado para móviles, tablets y desktop
- **Animaciones fluidas** — Efectos de agua, partículas flotantes y ondas de audio
- **Tema oscuro** — Paleta de colores personalizada (amarillo, magenta, teal)
- **Tipografía moderna** — Fuentes Exo 2 y Rajdhani de Google Fonts

### 📦 Funcionalidades del Menú
- **Categorías de productos:**
  - 🍺 Cervezas (Cristal, Pilsen, Cusqueña)
  - 🍹 Tragos (Pisco Sour, Chilcano, Mojito, Margarita, Piña Colada, Sex on the Beach)
  - 🥃 Shots (Tequila, Jäger, Ron con Cola)
  - 🧃 Sin Alcohol (Agua Mineral, Inca Kola, Frugos)
- **Productos destacados** con badges especiales
- **Filtrado por categoría** con pills interactivas
- **Imágenes de alta calidad** de Unsplash

### 🛒 Sistema de Pedidos
- **Carrito de compras** con contador y total en tiempo real
- **Modificación de cantidades** (+/-) y eliminación de productos
- **Notas personalizadas** para el barman
- **Selector de mesa** con grid de 100 mesas
- **Selección de anfitriona** con avatares y roles

### 📲 Integraciones
- **WhatsApp Business** — Envío automático de pedidos formateados
- **API REST** — Envío de datos al panel de administración
- **LocalStorage** — Respaldo offline de pedidos
- **Reportes de ventas** — Estadísticas almacenadas localmente

### 🎭 Interacciones Especiales
- **Saludo al animador** — Envío de mensajes al animador principal (Yaruc)
- **Métodos de pago** — Tarjeta, Yape, Plin, Efectivo
- **Modal de éxito** — Confirmación visual del pedido enviado
- **Badges dinámicos** — TOP, NEW, PROMO en productos

---

## 📸 Capturas de Pantalla

### Vista Principal del Menú
```
┌─────────────────────────────────────┐
│  FRV Catacaos              ⚡ MESA 7│
├─────────────────────────────────────┤
│                                     │
│     CARTA DE                        │
│       BEBIDAS                       │
│  Pedí y pagá desde tu mesa          │
│                                     │
│  [TODO] [CERVEZAS] [TRAGOS] [SHOTS] │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ 🍺      │  │ 🍻      │          │
│  │ Cristal │  │ Pilsen  │          │
│  │ S/ 8.00 │  │ S/ 8.00 │          │
│  │    +    │  │    +    │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  🛒 VER MI PEDIDO (2)              │
└─────────────────────────────────────┘
```

### Carrito de Compras
```
┌─────────────────────────────────────┐
│  MI PEDIDO                          │
├─────────────────────────────────────┤
│  🍺 Cristal x2        S/ 16.00     │
│     [−] [2] [+] [🗑️]              │
│                                     │
│  🍋 Pisco Sour x1     S/ 18.00     │
│     [−] [1] [+] [🗑️]              │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Total:               S/ 34.00     │
│                                     │
│  📝 Nota para el barman...         │
│                                     │
│  👩‍💼 Selecciona tu Anfitriona       │
│  ┌─────────────────────────────┐   │
│  │ 👤 María García             │   │
│  │    Anfitriona Principal     │ ✓ │
│  └─────────────────────────────┘   │
│                                     │
│  💳 Forma de pago                  │
│  [💳 TARJETA] [📱 YAPE]           │
│  [💜 PLIN] [💵 EFECTIVO]          │
│                                     │
│  ⚡ Confirmar Pedido               │
└─────────────────────────────────────┘
```

---

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **HTML5** | - | Estructura semántica y SEO |
| **CSS3** | - | Estilos, animaciones y diseño responsivo |
| **JavaScript** | ES6+ | Lógica de negocio y manipulación del DOM |
| **Google Fonts** | - | Tipografía (Exo 2, Rajdhani) |
| **Unsplash API** | - | Imágenes de productos |
| **WhatsApp API** | - | Envío de pedidos |
| **Netlify** | - | Hosting y despliegue |
| **LocalStorage** | - | Almacenamiento de datos |

### APIs Utilizadas
- **WhatsApp Business API** — `https://wa.me/{phone}?text={message}`
- **FRV Admin API** — `https://frv-api.netlify.app/api/orders`

---

## 📁 Estructura del Proyecto

```
FRV - Catacaos - Carta Pedidos/
├── 📄 frv-menu-cliente.html    # Página principal del menú
├── 🎨 frv-menu.css             # Estilos y animaciones
├── ⚙️ frv-menu.js              # Lógica de la aplicación
├── 📖 README.md                # Documentación del proyecto
└── 📁 img/                     # Imágenes del proyecto
```

### Descripción de Archivos

#### `frv-menu-cliente.html`
- Estructura HTML semántica
- Meta tags para SEO y Open Graph
- Datos estructurados (Schema.org) para restaurantes
- Integración de CSS y JavaScript

#### `frv-menu.css`
- Variables CSS personalizadas (`:root`)
- Animaciones keyframe (waterFlow, mikeFloat, wave1-5)
- Diseño responsivo con CSS Grid y Flexbox
- Efectos visuales (backdrop-filter, gradients, shadows)
- 1432 líneas de estilos

#### `frv-menu.js`
- Gestión de estado (mesa, carrito, anfitriona)
- Renderizado dinámico del menú
- Lógica del carrito de compras
- Generación de mensajes para WhatsApp
- Integración con API REST
- Sistema de reportes de ventas
- 432 líneas de código

---

## 🚀 Instalación

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para fuentes e imágenes)

### Opción 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/frv-catacaos-menu.git

# Entrar al directorio
cd frv-catacaos-menu

# Abrir en el navegador
# Windows
start frv-menu-cliente.html

# macOS
open frv-menu-cliente.html

# Linux
xdg-open frv-menu-cliente.html
```

### Opción 2: Descargar ZIP

1. Descarga el archivo ZIP del repositorio
2. Extrae los archivos
3. Abre `frv-menu-cliente.html` en tu navegador

### Opción 3: Despliegue en Netlify

#### Paso 1: Preparar el proyecto
```bash
# Clonar o descargar el repositorio
git clone <tu-repositorio>
cd FRV-Catacaos-Carta-Pedidos
```

#### Paso 2: Instalar Netlify CLI (opcional)
```bash
npm install -g netlify-cli
```

#### Paso 3: Desplegar
```bash
# Iniciar sesión en Netlify
netlify login

# Inicializar sitio
netlify init

# Desplegar a producción
netlify deploy --prod
```

#### Paso 4: Configurar Variables de Entorno (si es necesario)
En el dashboard de Netlify:
1. Ve a **Site settings** > **Environment variables**
2. Agrega las variables necesarias

#### Paso 5: Verificar URLs
Después del despliegue, tendrás:
- **Menú del cliente:** `https://tu-sitio.netlify.app/`
- **Panel de administración:** `https://tu-sitio.netlify.app/panel-bar.html`
- **API de pedidos:** `https://tu-sitio.netlify.app/api/orders`
- **Stream en tiempo real:** `https://tu-sitio.netlify.app/api/orders/stream`

### Estructura de Netlify Functions
```
netlify/
└── functions/
    ├── orders.js          # API de pedidos (POST/GET/PUT)
    ├── orders-stream.js   # Server-Sent Events (tiempo real)
    └── utils/
        └── store.js       # Almacenamiento compartido
```

---

## 📖 Uso

### Para Clientes

1. **Abrir el menú digital**
   - Escanea el código QR de tu mesa o accede al enlace

2. **Seleccionar tu mesa**
   - Haz clic en el número de mesa en la esquina superior derecha
   - Elige tu mesa del grid (1-100)

3. **Explorar el menú**
   - Usa las pills de categorías para filtrar
   - Desplázate horizontalmente para ver todas las categorías

4. **Agregar productos**
   - Toca el botón `+` en cualquier producto
   - El producto se agregará al carrito automáticamente

5. **Revisar tu pedido**
   - Toca el botón flotante `🛒 VER MI PEDIDO`
   - Modifica cantidades con los botones `+` y `−`
   - Agrega notas para el barman si es necesario

6. **Seleccionar anfitriona**
   - Elige la anfitriona que te atenderá
   - Cada una tiene un rol específico (Principal, VIP, Premium)

7. **Elegir método de pago**
   - Tarjeta, Yape, Plin o Efectivo

8. **Confirmar pedido**
   - Toca `⚡ Confirmar Pedido`
   - Se abrirá WhatsApp con el pedido formateado
   - El pedido se envía automáticamente al bar

9. **Enviar saludo al animador** (opcional)
   - Toca la sección "¿Quieres saludar al Animador?"
   - Se enviará un mensaje personalizado a Yaruc

### Para Administradores

#### Panel de Administración en Tiempo Real
El sistema incluye un panel de administración completo con actualizaciones en tiempo real:

**Acceso:** `https://tu-sitio.netlify.app/panel-bar.html`

**Características del Panel:**
- 🔄 **Actualizaciones en tiempo real** via Server-Sent Events (SSE)
- 📊 **Estadísticas en vivo:** Pedidos pendientes, preparando, completados y recaudación
- 🎯 **Gestión de pedidos:** Cambiar estado de pedidos (pendiente → preparando → listo → completado)
- 📋 **Feed de actividad:** Historial de todos los eventos en tiempo real
- 🔔 **Notificaciones:** Sonido y notificaciones visuales para nuevos pedidos
- 📈 **Reportes:** Ventas por mesa, anfitriona, método de pago y productos
- 🔌 **Botón de prueba:** Verificar conexión con la API

**Flujo de Pedidos:**
1. Cliente realiza pedido desde el menú digital
2. Pedido aparece automáticamente en el panel (sin recargar página)
3. Barista cambia estado a "Preparando"
4. Al terminar, cambia estado a "Listo"
5. Cliente retira pedido, se marca como "Completado"

**Conexión en Tiempo Real:**
El panel se conecta al endpoint `/api/orders/stream` usando Server-Sent Events. Recibe:
- Nuevos pedidos instantáneamente
- Actualizaciones de estado
- Estadísticas actualizadas
- Notificaciones de conexión/desconexión

#### Reportes de Ventas
Los reportes se almacenan en `localStorage` bajo la clave `frv_sales_report`:

```javascript
// Ejemplo de reporte
{
  "cervezas": {
    "Cristal": { qty: 150, revenue: 1200 },
    "Pilsen": { qty: 120, revenue: 960 }
  },
  "tragos": {
    "Pisco Sour": { qty: 80, revenue: 1440 }
  }
}
```

---

## ⚙️ Configuración

### Variables de Configuración

En `frv-menu.js`, puedes modificar:

```javascript
// URL de la API del panel de administración
const API_URL = 'https://frv-api.netlify.app';

// Teléfono del animador (para saludos)
const animadorPhone = '51950729470';

// Rango de mesas disponibles
// Actualmente: 1-100 (modificar en initMesaSelector)
```

### Personalización de Productos

Para agregar o modificar productos, edita el array `products` en `frv-menu.js`:

```javascript
const products = [
  {
    id: 16,                    // ID único
    name: 'Nuevo Producto',    // Nombre
    desc: 'Descripción',       // Descripción
    price: 15,                 // Precio en soles
    emoji: '🍹',              // Emoji representativo
    cat: 'tragos',             // Categoría: cervezas, tragos, shots, sin-alcohol
    badge: 'NEW',              // Badge opcional: 'TOP', 'NEW', 'PROMO'
    img: 'https://...',        // URL de imagen
    featured: false            // true para destacado
  }
];
```

### Personalización de Anfitrionas

Para modificar las anfitrionas, edita el HTML en `frv-menu-cliente.html`:

```html
<div class="anfitriona-card" onclick="selectAnfitriona(this, '51XXXXXXXXX')" data-phone="51XXXXXXXXX">
  <div class="anfitriona-avatar">
    <img src="https://..." alt="Nombre" onerror="this.parentElement.innerHTML='👩'">
  </div>
  <div class="anfitriona-info">
    <div class="anfitriona-name">Nombre Completo</div>
    <div class="anfitriona-role">Rol (Principal, VIP, Premium)</div>
  </div>
  <div class="anfitriona-check">✓</div>
</div>
```

### Colores del Tema

Modifica las variables CSS en `frv-menu.css`:

```css
:root {
  --yellow: #F5C800;      /* Color principal */
  --yellow2: #FFD93D;     /* Color hover */
  --magenta: #D4006A;     /* Color acento */
  --teal: #00848A;        /* Color secundario */
  --dark: #080808;        /* Fondo oscuro */
  --surface: #1E1E1E;     /* Superficie de tarjetas */
}
```

---

## 🔌 API

### Endpoints Disponibles

#### **POST** `/api/orders`
Crea un nuevo pedido.

**Request Body:**
```json
{
  "mesa": "7",
  "items": [
    {
      "name": "Cristal",
      "emoji": "🍺",
      "qty": 2,
      "price": 8,
      "total": 16,
      "cat": "cervezas"
    }
  ],
  "note": "Bien fría por favor",
  "paymentMethod": "💳 TARJETA",
  "total": 34,
  "anfitriona": "María García",
  "anfitrionaPhone": "51924996961"
}
```

**Response (201 Created):**
```json
{
  "id": "order_1001",
  "mesa": "7",
  "items": [...],
  "status": "pending",
  "createdAt": "2024-01-15T20:30:00.000Z",
  "updatedAt": "2024-01-15T20:30:00.000Z"
}
```

#### **GET** `/api/orders`
Obtiene lista de pedidos.

**Query Parameters:**
- `status` - Filtrar por estado (pending, preparing, ready, completed)
- `limit` - Limitar cantidad de resultados

**Response (200 OK):**
```json
{
  "orders": [...],
  "total": 10,
  "stats": {
    "pending": 3,
    "preparing": 2,
    "completed": 5,
    "revenue": 450
  },
  "timestamp": "2024-01-15T20:30:00.000Z"
}
```

#### **PUT** `/api/orders`
Actualiza estado de un pedido.

**Request Body:**
```json
{
  "orderId": "order_1001",
  "status": "preparing"
}
```

#### **GET** `/api/orders/stream`
Server-Sent Events para actualizaciones en tiempo real.

**Eventos SSE:**
- `connected` - Conexión establecida
- `new_order` - Nuevo pedido recibido
- `order_updated` - Pedido actualizado
- `stats` - Estadísticas actualizadas
- `ping` - Keep-alive

### Fallback a LocalStorage

Si la API no está disponible, los pedidos se almacenan localmente:

```javascript
// Clave: frv_orders
// Valor: Array de pedidos
[
  { mesa: "7", items: [...], total: 34, ... },
  { mesa: "3", items: [...], total: 25, ... }
]
```

---

## 🎨 Personalización

### Cambiar el Logo

El logo está compuesto por texto CSS. Para modificarlo, edita en `frv-menu.css`:

```css
.brand-frv {
  font-family: 'Exo 2', sans-serif;
  font-size: 22px;
  font-weight: 900;
  color: var(--white);
  letter-spacing: 2px;
}

.brand-frv span { 
  color: var(--yellow); /* Color de la 'R' */
}

.brand-sub {
  font-size: 9px;
  letter-spacing: 3px;
  color: var(--muted);
  text-transform: uppercase;
}
```

### Agregar Nuevas Categorías

1. **Agregar pill de categoría** en `frv-menu-cliente.html`:
```html
<div class="cat-pill" onclick="filterCat('nueva-categoria',this)">🍹 NUEVA</div>
```

2. **Agregar nombre de categoría** en `frv-menu.js`:
```javascript
const catNames = { 
  cervezas:'CERVEZAS', 
  tragos:'TRAGOS', 
  shots:'SHOTS', 
  'sin-alcohol':'SIN ALCOHOL',
  'nueva-categoria':'NUEVA CATEGORÍA'  // Agregar aquí
};
```

3. **Agregar productos** con la nueva categoría en el array `products`

---

## 📱 Responsive Design

El menú está optimizado para diferentes tamaños de pantalla:

| Dispositivo | Ancho | Características |
|-------------|-------|-----------------|
| **Móvil** | < 768px | Grid de 2 columnas, navegación horizontal |
| **Tablet** | 768px - 1024px | Grid de 2-3 columnas |
| **Desktop** | > 1024px | Grid de 3-4 columnas, más espaciado |

### Breakpoints CSS

```css
/* Móvil (por defecto) */
.menu-grid {
  grid-template-columns: 1fr 1fr;
}

/* Tablet */
@media (min-width: 768px) {
  .menu-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .menu-grid {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}
```

---

## 🔒 Seguridad

### Consideraciones de Seguridad

1. **Validación de entrada**
   - Los números de mesa se validan (1-100)
   - Las cantidades no pueden ser negativas
   - Los precios son fijos (no editables por el cliente)

2. **Protección contra spam**
   - El botón de confirmar pedido se deshabilita temporalmente después del envío
   - Los pedidos requieren selección de anfitriona

3. **Datos sensibles**
   - No se almacenan datos de tarjetas de crédito
   - Los números de teléfono de anfitrionas están hardcodeados
   - Los pedidos se envían directamente a WhatsApp (cifrado de extremo a extremo)

---

## 🚀 Despliegue

### Netlify (Recomendado)

1. **Conectar repositorio**
   - Ve a [app.netlify.com](https://app.netlify.com)
   - Conecta tu repositorio de GitHub/GitLab

2. **Configurar build**
   - Build command: (vacío)
   - Publish directory: `.`

3. **Dominio personalizado** (opcional)
   - Configura tu dominio en Netlify
   - Actualiza los meta tags en `frv-menu-cliente.html`

### GitHub Pages

```bash
# Crear rama gh-pages
git checkout -b gh-pages

# Push a GitHub
git push origin gh-pages

# Activar en Settings > Pages
```

### Servidor Propio

```bash
# Copiar archivos al servidor
scp -r * usuario@servidor:/var/www/html/frv-menu/

# Configurar Nginx/Apache
# Asegurar que el archivo index.html sea frv-menu-cliente.html
```

---

## 🧪 Testing

### Pruebas Manuales

1. **Funcionalidad del menú**
   - [ ] Filtrar por cada categoría
   - [ ] Agregar productos al carrito
   - [ ] Modificar cantidades
   - [ ] Eliminar productos
   - [ ] Vaciar carrito

2. **Selector de mesa**
   - [ ] Abrir selector
   - [ ] Seleccionar mesa
   - [ ] Confirmar selección
   - [ ] Verificar que persiste en sesión

3. **Carrito de compras**
   - [ ] Abrir carrito
   - [ ] Verificar totales
   - [ ] Agregar nota
   - [ ] Seleccionar anfitriona
   - [ ] Seleccionar método de pago

4. **Envío de pedido**
   - [ ] Confirmar pedido
   - [ ] Verificar mensaje de WhatsApp
   - [ ] Verificar modal de éxito
   - [ ] Verificar que el carrito se vacía

5. **Saludo al animador**
   - [ ] Enviar saludo
   - [ ] Verificar mensaje de WhatsApp

### Pruebas de Dispositivos

- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Desktop (Chrome, Firefox, Edge)

---

## 🐛 Troubleshooting

### Problemas Comunes

#### Las imágenes no cargan
**Solución:** Verifica que las URLs de Unsplash sean accesibles. Puedes usar imágenes locales:

```javascript
// Cambiar de:
img:'https://images.unsplash.com/photo-...'

// A:
img:'img/cristal.jpg'
```

#### WhatsApp no abre el chat
**Solución:** Verifica que el número de teléfono tenga el código de país correcto:

```javascript
// Formato correcto para Perú:
anfitrionaPhone: '51924996961'  // 51 + 9 dígitos
```

#### El carrito no persiste
**Solución:** El carrito se limpia después de 6 segundos del pedido. Para mantenerlo, modifica:

```javascript
// En placeOrder(), comentar o eliminar:
// cart = {};
// updateCart();
// renderMenu(currentCat);
```

#### Las animaciones son lentas
**Solución:** Reduce la complejidad de las animaciones en CSS:

```css
/* Desactivar animaciones en dispositivos lentos */
@media (prefers-reduced-motion: reduce) {
  .water-wave,
  .mike,
  .wave-bar {
    animation: none;
  }
}
```

---

## 📈 Roadmap

### Próximas Funciones

- [ ] **Modo offline** — Service Worker para funcionar sin internet
- [ ] **Notificaciones push** — Alertas cuando el pedido esté listo
- [ ] **Historial de pedidos** — Ver pedidos anteriores
- [ ] **Cuenta dividida** — Dividir la cuenta entre mesas
- [ ] **Promociones** — Descuentos y ofertas especiales
- [ ] **Multi-idioma** — Soporte para inglés y portugués
- [ ] **Modo oscuro/claro** — Toggle de tema
- [ ] **Estadísticas en tiempo real** — Dashboard para administradores
- [ ] **Integración con POS** — Conexión con sistemas de punto de venta
- [ ] **Reseñas** — Sistema de calificación de productos

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Sigue estos pasos:

1. **Fork el repositorio**
```bash
git clone https://github.com/tu-usuario/frv-catacaos-menu.git
```

2. **Crear rama de feature**
```bash
git checkout -b feature/nueva-funcionalidad
```

3. **Hacer cambios**
```bash
git add .
git commit -m "feat: agregar nueva funcionalidad"
```

4. **Push y Pull Request**
```bash
git push origin feature/nueva-funcionalidad
```

### Convenciones de Commits

- `feat:` — Nueva funcionalidad
- `fix:` — Corrección de bug
- `docs:` — Documentación
- `style:` — Cambios de estilo (sin afectar funcionalidad)
- `refactor:` — Refactorización de código
- `test:` — Agregar tests
- `chore:` — Mantenimiento

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT** — ver el archivo [LICENSE](LICENSE) para detalles.

```
MIT License

Copyright (c) 2024 FRV Producciones

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contacto

### FRV Producciones

- **Sitio Web:** [https://fundorioverde.netlify.app](https://fundorioverde.netlify.app)
- **Email:** contacto@frvcatacaos.com
- **WhatsApp:** +51 950 729 470
- **Instagram:** [@frvcatacaos](https://instagram.com/frvcatacaos)

### Desarrollador

- **Nombre:** [Tu Nombre]
- **GitHub:** [@tu-usuario](https://github.com/tu-usuario)
- **LinkedIn:** [Tu Perfil](https://linkedin.com/in/tu-perfil)

---

## 🙏 Agradecimientos

- **Unsplash** — Imágenes de alta calidad
- **Google Fonts** — Tipografía Exo 2 y Rajdhani
- **Netlify** — Hosting y despliegue
- **WhatsApp** — Integración de mensajería
- **Comunidad de desarrolladores** — Inspiración y soporte

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Líneas de código** | ~1,864 |
| **Productos en menú** | 15 |
| **Categorías** | 4 |
| **Métodos de pago** | 4 |
| **Anfitrionas** | 3 |
| **Mesas disponibles** | 100 |
| **Tamaño total** | ~50 KB |

---

<div align="center">

**🍹 FRV Catacaos — Carta de Bebidas Digital**

*Pedí y pagá desde tu mesa*

[![Netlify](https://img.shields.io/badge/Netlify-Deploy-blue?style=for-the-badge&logo=netlify)](https://fundorioverde.netlify.app)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Contact-green?style=for-the-badge&logo=whatsapp)](https://wa.me/51950729470)

</div>
