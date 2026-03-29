// Almacenamiento compartido para Netlify Functions
// En producción, usar Redis, Supabase, o similar

class OrderStore {
  constructor() {
    this.orders = [];
    this.orderIdCounter = 1000;
    this.listeners = [];
  }

  // Agregar pedido
  addOrder(orderData) {
    const newOrder = {
      id: `order_${++this.orderIdCounter}`,
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.unshift(newOrder);

    // Mantener solo los últimos 100 pedidos
    if (this.orders.length > 100) {
      this.orders = this.orders.slice(0, 100);
    }

    // Notificar a los listeners
    this.notifyListeners('new_order', newOrder);

    return newOrder;
  }

  // Obtener pedidos
  getOrders(filters = {}) {
    let result = [...this.orders];

    if (filters.status) {
      result = result.filter(o => o.status === filters.status);
    }

    if (filters.limit) {
      result = result.slice(0, parseInt(filters.limit));
    }

    return result;
  }

  // Actualizar estado de pedido
  updateOrderStatus(orderId, status) {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return null;
    }

    this.orders[orderIndex].status = status;
    this.orders[orderIndex].updatedAt = new Date().toISOString();

    // Notificar a los listeners
    this.notifyListeners('order_updated', this.orders[orderIndex]);

    return this.orders[orderIndex];
  }

  // Obtener pedido por ID
  getOrderById(orderId) {
    return this.orders.find(o => o.id === orderId);
  }

  // Agregar listener para cambios
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notificar a todos los listeners
  notifyListeners(eventType, data) {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, data);
      } catch (error) {
        console.error('Error en listener:', error);
      }
    });
  }

  // Obtener estadísticas
  getStats() {
    const pending = this.orders.filter(o => o.status === 'pending').length;
    const preparing = this.orders.filter(o => o.status === 'preparing').length;
    const completed = this.orders.filter(o => o.status === 'completed').length;
    const revenue = this.orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return { pending, preparing, completed, revenue };
  }
}

// Singleton para compartir entre funciones
let storeInstance = null;

function getStore() {
  if (!storeInstance) {
    storeInstance = new OrderStore();
  }
  return storeInstance;
}

module.exports = { getStore, OrderStore };
