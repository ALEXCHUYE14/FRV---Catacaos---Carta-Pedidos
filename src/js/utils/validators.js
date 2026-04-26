// ═══════════════════════════════════════════════════════════════════════════════
// FRV CATACAOS — VALIDATION & SANITATION UTILITIES
// Security helpers for input validation and XSS prevention
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize string input to prevent XSS
 * @param {string} str - Input string to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 200)
 * @returns {string} Sanitized string
 */
export function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Prevent JS protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .replace(/\(\s*javascript:/gi, '');
}

/**
 * Validate mesa number is in valid range (1-50)
 * @param {number|string} num - Mesa number to validate
 * @returns {boolean} True if valid
 */
export function validateMesaNumber(num) {
  const n = parseInt(num, 10);
  return !isNaN(n) && n >= 1 && n <= 50 && Number.isInteger(n);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid (E.164 format preferred)
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // E.164 format: optional +, then 10-15 digits
  return /^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Validate order data structure
 * @param {Object} data - Order data to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateOrder(data) {
  const errors = [];
  
  if (!validateMesaNumber(data.mesaId)) {
    errors.push('Número de mesa inválido (debe ser 1-50)');
  }
  
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('El carrito está vacío');
  } else {
    // Validate each item
    data.items.forEach((item, idx) => {
      if (!item.id || !item.name || !item.price || !item.qty) {
        errors.push(`Item ${idx + 1}: datos incompletos`);
      }
      if (item.qty <= 0) {
        errors.push(`Item ${idx + 1}: cantidad inválida`);
      }
    });
  }
  
  if (!data.total || data.total <= 0) {
    errors.push('Total inválido');
  }
  
  const validMethods = ['yape', 'tarjeta', 'efectivo'];
  if (!data.paymentMethod || !validMethods.includes(data.paymentMethod)) {
    errors.push('Método de pago inválido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate WhatsApp message content
 * @param {string} msg - Message to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateWhatsAppMessage(msg) {
  const errors = [];
  
  if (!msg || msg.trim().length === 0) {
    errors.push('El mensaje no puede estar vacío');
  }
  
  if (msg.length > 4096) {
    errors.push('Mensaje demasiado largo (máximo 4096 caracteres)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format currency safely
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: PEN)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'PEN') {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(num);
}
