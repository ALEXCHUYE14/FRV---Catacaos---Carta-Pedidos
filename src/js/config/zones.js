// ═══════════════════════════════════════════════════════════════════════════════
// FRV CATACAOS — ZONE CONFIGURATION
// Shared zone definitions for 50 mesas across 5 zones
// ═══════════════════════════════════════════════════════════════════════════════

export const ZONES_CONFIG = {
  VIP: {
    range: [1, 10],
    icon: '👑',
    color: '#FFD600',
    color2: '#7A6200',
    name: 'VIP',
    description: 'Zona Premium'
  },
  Pista: {
    range: [11, 20],
    icon: '🎵',
    color: '#E91E8C',
    color2: '#C4186E',
    name: 'Pista',
    description: 'Zona Principal'
  },
  Barra: {
    range: [21, 28],
    icon: '🍸',
    color: '#2A9D8F',
    color2: '#0F4A4A',
    name: 'Barra',
    description: 'Barra Principal'
  },
  Terraza: {
    range: [29, 38],
    icon: '🌿',
    color: '#7A9D88',
    color2: '#1B6B6B',
    name: 'Terraza',
    description: 'Zona Exterior'
  },
  Salón: {
    range: [39, 50],
    icon: '🪑',
    color: '#A09070',
    color2: '#5A5038',
    name: 'Salón',
    description: 'Salón Principal'
  }
};

export const TOTAL_TABLES = 50;

/**
 * Get zone information for a given mesa number
 * @param {number} num - Mesa number (1-50)
 * @returns {Object} Zone info with zone, icon, color, name
 */
export function getMesaZone(num) {
  for (const [zone, data] of Object.entries(ZONES_CONFIG)) {
    if (num >= data.range[0] && num <= data.range[1]) {
      return { zone, ...data };
    }
  }
  // Fallback for invalid numbers
  return {
    zone: 'General',
    icon: '🪑',
    color: '#5A5038',
    color2: '#2A2520',
    name: 'General',
    description: 'Zona no especificada',
    range: [1, 50]
  };
}

/**
 * Generate default table states for all 50 mesas
 * @returns {Array} Array of table objects
 */
export function generateDefaultTables() {
  return Array.from({ length: TOTAL_TABLES }, (_, i) => {
    const num = i + 1;
    const zoneInfo = getMesaZone(num);
    return {
      id: num,
      num: `M${String(num).padStart(2, '0')}`,
      zone: zoneInfo.zone,
      zoneName: zoneInfo.name,
      status: 'libre', // libre, ocupada, reservada, pedido, cerrar
      hostessId: null,
      total: 0,
      openedAt: null,
      user_id: null,
      timestamp: null
    };
  });
}

/**
 * Validate mesa number is in valid range
 * @param {number} num - Mesa number to validate
 * @returns {boolean} True if valid (1-50)
 */
export function validateMesaNumber(num) {
  const n = parseInt(num, 10);
  return !isNaN(n) && n >= 1 && n <= TOTAL_TABLES && Number.isInteger(n);
}

/**
 * Get all zone names for filters/tabs
 * @returns {Array} Array of zone names
 */
export function getAllZoneNames() {
  return Object.keys(ZONES_CONFIG);
}

/**
 * Get status color mapping for UI
 */
export const STATUS_COLORS = {
  libre: { border: 'rgba(0,230,118,0.3)', bg: 'rgba(0,230,118,0.05)', text: '#00E676', after: '#00E676' },
  ocupada: { border: 'rgba(255,214,0,0.3)', bg: 'rgba(255,214,0,0.05)', text: '#FFD600', after: '#FFD600' },
  reservada: { border: 'rgba(233,30,140,0.3)', bg: 'rgba(233,30,140,0.05)', text: '#E91E8C', after: '#E91E8C' },
  pedido: { border: 'rgba(64,196,255,0.3)', bg: 'rgba(64,196,255,0.05)', text: '#40C4FF', after: '#40C4FF' },
  cerrar: { border: 'rgba(255,59,59,0.3)', bg: 'rgba(255,59,59,0.05)', text: '#FF3B3B', after: '#FF3B3B' }
};
