// ═══════════════════════════════════════════════════════════════════════════════
// FRV CATACAOS — PRODUCT CATALOG
// Centralized product definitions
// ═══════════════════════════════════════════════════════════════════════════════

const IMG_BASE = 'public/img/productos/';
const FALLBACK_IMG = `${IMG_BASE}Cristal.jpg`;

export const PRODUCTS = [
  // ── CERVEZAS ──
  {
    id: 1,
    name: 'Cristal Botella',
    cat: 'Cervezas',
    emoji: '🍺',
    price: 8,
    cost: 3.5,
    stock: 48,
    maxStock: 48,
    desc: 'Cerveza peruana clásica, fría y refrescante',
    img: FALLBACK_IMG,
    badge: 'popular'
  },
  {
    id: 2,
    name: 'Pilsener 330ml',
    cat: 'Cervezas',
    emoji: '🍻',
    price: 5,
    cost: 2,
    stock: 72,
    maxStock: 72,
    desc: 'La clásica dorada, sabor suave',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 3,
    name: 'Heineken',
    cat: 'Cervezas',
    emoji: '🍺',
    price: 10,
    cost: 4.5,
    stock: 36,
    maxStock: 36,
    desc: 'Importada holandesa, sabor premium',
    img: FALLBACK_IMG,
    badge: 'special'
  },
  {
    id: 4,
    name: 'Cusqueña Dorada',
    cat: 'Cervezas',
    emoji: '🍻',
    price: 7,
    cost: 3,
    stock: 60,
    maxStock: 60,
    desc: 'Orgullo peruano, sabor único',
    img: FALLBACK_IMG,
    badge: 'popular'
  },

  // ── TRAGOS CORTOS ──
  {
    id: 5,
    name: 'Shot Tequila',
    cat: 'Tragos Cortos',
    emoji: '🥃',
    price: 8,
    cost: 2.5,
    stock: 40,
    maxStock: 40,
    desc: 'Tequila reposado con limón y sal',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 6,
    name: 'Shot Vodka',
    cat: 'Tragos Cortos',
    emoji: '🥃',
    price: 7,
    cost: 2,
    stock: 35,
    maxStock: 35,
    desc: 'Vodka premium directo',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 7,
    name: 'Shot Ron',
    cat: 'Tragos Cortos',
    emoji: '🥃',
    price: 7,
    cost: 2,
    stock: 30,
    maxStock: 30,
    desc: 'Ron añejo peruano',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 8,
    name: 'Shot Jäger',
    cat: 'Tragos Cortos',
    emoji: '🥃',
    price: 9,
    cost: 3.5,
    stock: 20,
    maxStock: 20,
    desc: 'Jägermeister helado',
    img: FALLBACK_IMG,
    badge: 'new'
  },

  // ── CÓCTELES ──
  {
    id: 9,
    name: 'Mojito Clásico',
    cat: 'Cócteles',
    emoji: '🍹',
    price: 18,
    cost: 5,
    stock: 25,
    maxStock: 25,
    desc: 'Ron, menta fresca, limón y soda',
    img: FALLBACK_IMG,
    badge: 'popular'
  },
  {
    id: 10,
    name: 'Margarita',
    cat: 'Cócteles',
    emoji: '🍸',
    price: 18,
    cost: 5.5,
    stock: 20,
    maxStock: 20,
    desc: 'Tequila, triple sec y limón fresco',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 11,
    name: 'Piña Colada',
    cat: 'Cócteles',
    emoji: '🥥',
    price: 20,
    cost: 6,
    stock: 22,
    maxStock: 22,
    desc: 'Ron, crema de coco y piña natural',
    img: FALLBACK_IMG,
    badge: 'popular'
  },
  {
    id: 12,
    name: 'Negroni',
    cat: 'Cócteles',
    emoji: '🍷',
    price: 22,
    cost: 7,
    stock: 18,
    maxStock: 18,
    desc: 'Gin, Campari y vermut rojo',
    img: FALLBACK_IMG,
    badge: 'special'
  },
  {
    id: 13,
    name: 'Pisco Sour',
    cat: 'Cócteles',
    emoji: '🍋',
    price: 20,
    cost: 6,
    stock: 30,
    maxStock: 30,
    desc: 'El coctel peruano por excelencia',
    img: FALLBACK_IMG,
    badge: 'popular'
  },
  {
    id: 14,
    name: 'Aperol Spritz',
    cat: 'Cócteles',
    emoji: '🍊',
    price: 22,
    cost: 7,
    stock: 15,
    maxStock: 15,
    desc: 'Aperol, prosecco y soda naranja',
    img: FALLBACK_IMG,
    badge: 'new'
  },

  // ── BOTELLAS ──
  {
    id: 15,
    name: 'Johnnie Red 750ml',
    cat: 'Botellas',
    emoji: '🥃',
    price: 120,
    cost: 48,
    stock: 12,
    maxStock: 12,
    desc: 'Whisky escocés blended, suave y versátil',
    img: FALLBACK_IMG,
    badge: 'popular'
  },
  {
    id: 16,
    name: 'Absolut Vodka 750ml',
    cat: 'Botellas',
    emoji: '🍾',
    price: 100,
    cost: 42,
    stock: 10,
    maxStock: 10,
    desc: 'Vodka sueco premium, 40% vol.',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 17,
    name: 'Jack Daniel\'s 750ml',
    cat: 'Botellas',
    emoji: '🥃',
    price: 130,
    cost: 52,
    stock: 8,
    maxStock: 8,
    desc: 'Tennessee Whiskey, carácter único',
    img: FALLBACK_IMG,
    badge: 'special'
  },
  {
    id: 18,
    name: 'Moët & Chandon',
    cat: 'Botellas',
    emoji: '🍾',
    price: 220,
    cost: 88,
    stock: 5,
    maxStock: 5,
    desc: 'Champagne francés, brut impérial',
    img: FALLBACK_IMG,
    badge: 'special'
  },
  {
    id: 19,
    name: 'Patrón Silver',
    cat: 'Botellas',
    emoji: '🥃',
    price: 180,
    cost: 72,
    stock: 6,
    maxStock: 6,
    desc: 'Tequila 100% agave azul artesanal',
    img: FALLBACK_IMG,
    badge: null
  },

  // ── SOFT & MIXERS ──
  {
    id: 20,
    name: 'Red Bull',
    cat: 'Soft & Mixers',
    emoji: '🔴',
    price: 8,
    cost: 3,
    stock: 50,
    maxStock: 50,
    desc: 'Energizante premium, con o sin mezcla',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 21,
    name: 'Agua Mineral',
    cat: 'Soft & Mixers',
    emoji: '💧',
    price: 4,
    cost: 1.5,
    stock: 100,
    maxStock: 100,
    desc: '500ml, con o sin gas',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 22,
    name: 'Gaseosa 500ml',
    cat: 'Soft & Mixers',
    emoji: '🥤',
    price: 5,
    cost: 2,
    stock: 80,
    maxStock: 80,
    desc: 'Inca Kola o Coca-Cola',
    img: FALLBACK_IMG,
    badge: null
  },
  {
    id: 23,
    name: 'Jugo de Naranja',
    cat: 'Soft & Mixers',
    emoji: '🍊',
    price: 7,
    cost: 3,
    stock: 40,
    maxStock: 40,
    desc: 'Naranja natural recién exprimida',
    img: FALLBACK_IMG,
    badge: null
  },

  // ── PIQUEOS ──
  {
    id: 24,
    name: 'Piqueo Mixto',
    cat: 'Piqueos',
    emoji: '🥗',
    price: 25,
    cost: 10,
    stock: 30,
    maxStock: 30,
    desc: 'Selección de bocaditos de la casa',
    img: FALLBACK_IMG,
    badge: 'popular'
  },
  {
    id: 25,
    name: 'Ceviche Porción',
    cat: 'Piqueos',
    emoji: '🐟',
    price: 22,
    cost: 8,
    stock: 25,
    maxStock: 25,
    desc: 'Fresco ceviche al estilo Catacaos',
    img: FALLBACK_IMG,
    badge: 'special'
  }
];

export const CATEGORIES = ['Todos', ...new Set(PRODUCTS.map(p => p.cat))];
