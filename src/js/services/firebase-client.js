// ═══════════════════════════════════════════════════════════════════════════════
// FIREBASE CLIENT - FRV Catacaos - Versión Simplificada y Robusta
// ═══════════════════════════════════════════════════════════════════════════════

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7AniUOlaEngq9rFJBNudZVdAzxMqxOOg",
  authDomain: "frv-catacaos.firebaseapp.com",
  projectId: "frv-catacaos",
  storageBucket: "frv-catacaos.firebasestorage.app",
  messagingSenderId: "337954350829",
  appId: "1:337954350829:web:332af101a283426e3a0ee4",
  databaseURL: "https://frv-catacaos-default-rtdb.firebaseio.com"
};

let firebaseDatabase = null;
let initialized = false;

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN + ANONYMOUS AUTH
// ═══════════════════════════════════════════════════════════════════════════════

 async function initFirebase() {
   if (initialized && firebaseDatabase) {
     return firebaseDatabase;
   }

   if (typeof firebase === 'undefined') {
     console.error('[Firebase] SDK no cargado');
     throw new Error('Firebase SDK no disponible');
   }

   try {
     let app;
     try {
       app = firebase.app();
     } catch (e) {
       app = firebase.initializeApp(firebaseConfig);
     }

     // Initialize Auth (anonymous)
     const auth = firebase.auth();
     try {
       const userCredential = await auth.signInAnonymously();
     } catch (authErr) {
       console.warn('[Auth] Error login anónimo:', authErr.message);
     }

     firebaseDatabase = firebase.database();

     // Connection monitor
     const connectedRef = firebaseDatabase.ref('.info/connected');
     connectedRef.on('value', (snap) => {
     });

     initialized = true;
     return firebaseDatabase;
   } catch (error) {
     console.error('[Firebase]', error.message);
     throw error;
   }
 }

// ═══════════════════════════════════════════════════════════════════════════════
// OPERACIONES DE PEDIDOS
// ═══════════════════════════════════════════════════════════════════════════════

async function getOrders() {
  let db;
  try {
    db = await initFirebase();
  } catch (error) {
    console.error('[Firebase]', error.message);
    throw error;
  }
  
  if (!db) {
    throw new Error('Firebase no inicializado');
  }
  
  try {
    const snapshot = await db.ref('orders').once('value');
    const data = snapshot.val() || {};
    const ordersList = Object.entries(data).map(([id, order]) => ({
      id: id,
      ...order
    }));
    return ordersList;
  } catch (error) {
    console.error('[Firebase]', error.message);
    throw error;
  }
}

async function createOrder(orderData) {
  const db = await initFirebase();
  if (!db) return null;
  
  try {
    const newOrderRef = db.ref('orders').push();
    const order = {
      ...orderData,
      id: newOrderRef.key,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      status: 'pending'
    };
    
    await newOrderRef.set(order);
    return order;
  } catch (error) {
    console.error('[Firebase]', error.message);
    return null;
  }
}

 async function updateOrderStatus(orderId, status) {
   const db = await initFirebase();
   if (!db) return null;
   
   try {
     const updateData = {
       status: status,
       updatedAt: firebase.database.ServerValue.TIMESTAMP
     };
     if (firebase.auth().currentUser) {
       updateData.user_id = firebase.auth().currentUser.uid;
     }
     await db.ref(`orders/${orderId}`).update(updateData);
     const snapshot = await db.ref(`orders/${orderId}`).once('value');
     return snapshot.val();
   } catch (error) {
     console.error('[Firebase]', error.message);
     return null;
   }
 }

async function getStats() {
  const db = await initFirebase();
  if (!db) return { pending: 0, preparing: 0, completed: 0 };
  
  try {
    const snapshot = await db.ref('orders').once('value');
    const data = snapshot.val() || {};
    
    const ordersList = Object.values(data);
    return {
      pending: ordersList.filter(o => o.status === 'pending').length,
      preparing: ordersList.filter(o => o.status === 'preparing').length,
      completed: ordersList.filter(o => o.status === 'completed' || o.status === 'ready').length
    };
  } catch (error) {
    return { pending: 0, preparing: 0, completed: 0 };
  }
}

 async function subscribeToOrders(callback) {
   try {
     await initFirebase();
   } catch (initErr) {
     console.error('[Firebase]', initErr.message);
     return () => {};
   }

   if (typeof firebase === 'undefined') return () => {};

   const db = firebase.database();
   const ordersRef = db.ref('orders');

   const listener = ordersRef.on('value', (snapshot) => {
     const data = snapshot.val() || {};
     const ordersList = Object.entries(data).map(([id, order]) => ({
       id: id,
       ...order
     })).sort((a, b) => {
       const dateA = new Date(a.createdAt || 0);
       const dateB = new Date(b.createdAt || 0);
       return dateB - dateA;
     });
     callback({ orders: ordersList, source: 'firebase-realtime' });
   }, (error) => {
     console.error('[Firebase] listener error:', error);
   });

   return () => {
     ordersRef.off('value', listener);
   };
 }

  async function updateTableStatus(tableId, status, extraData = {}) {
    const db = await initFirebase();
    if (!db) return null;

    try {
      const update = {
        status: status,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        ...extraData
      };
      if (firebase.auth().currentUser) {
        update.user_id = firebase.auth().currentUser.uid;
      }
      await db.ref(`tables/${tableId}`).update(update);
      return true;
    } catch (error) {
      console.error('[Firebase]', error.message);
      return null;
    }
  }

  /**
   * Atomically select a table using transaction
   * @param {number} tableId - Table ID to select
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function selectTableTransaction(tableId) {
    const db = await initFirebase();
    if (!db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    const tableRef = db.ref(`tables/${tableId}`);
    const user = firebase.auth().currentUser;
    
    try {
      // Use transaction for atomic check-and-set
      const result = await new Promise((resolve, reject) => {
        tableRef.transaction((current) => {
          if (current === null) {
            // Table doesn't exist - create it as libre
            return {
              id: tableId,
              num: `M${String(tableId).padStart(2, '0')}`,
              status: 'ocupada',
              user_id: user ? user.uid : 'anonymous',
              openedAt: Date.now(),
              updatedAt: Date.now()
            };
          }
          
          if (current.status !== 'libre') {
            // Abort transaction - table already occupied
            return; // Abort
          }
          
          // Update to occupied
          return {
            ...current,
            status: 'ocupada',
            user_id: user ? user.uid : 'anonymous',
            openedAt: Date.now(),
            updatedAt: Date.now()
          };
        }, (error, committed, snapshot) => {
          if (error) {
            resolve({ success: false, error: error.message });
          } else if (!committed) {
            const curr = snapshot.val();
            resolve({ 
              success: false, 
              error: 'Mesa ya ocupada',
              currentStatus: curr ? curr.status : 'desconocida'
            });
          } else {
            resolve({ success: true, data: snapshot.val() });
          }
        }, false); // Don't apply locally first (wait for server)
      });
      
      return result;
    } catch (error) {
      console.error('[Firebase] Transaction failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Free a table (set status to libre)
   * @param {number} tableId - Table ID to free
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function freeTable(tableId) {
    const db = await initFirebase();
    if (!db) return { success: false, error: 'Firebase not initialized' };

    try {
      const update = {
        status: 'libre',
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        total: 0,
        guestCount: 0
      };
      
      if (firebase.auth().currentUser) {
        update.user_id = firebase.auth().currentUser.uid;
      }
      
      await db.ref(`tables/${tableId}`).update(update);
      return { success: true };
    } catch (error) {
      console.error('[Firebase]', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Release all tables by a user (session cleanup)
   * @returns {Promise<{success: boolean, count: number}>}
   */
  async function releaseUserTables() {
    const db = await initFirebase();
    const user = firebase.auth().currentUser;
    if (!db || !user) return { success: false, count: 0 };

    try {
      const snapshot = await db.ref('tables')
        .orderByChild('user_id')
        .equalTo(user.uid)
        .once('value');
      
      const updates = {};
      snapshot.forEach(child => {
        updates[`tables/${child.key}/status`] = 'libre';
        updates[`tables/${child.key}/user_id`] = null;
      });
      
      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
      }
      
      return { success: true, count: Object.keys(updates).length / 2 };
    } catch (error) {
      console.error('[Firebase]', error.message);
      return { success: false, count: 0 };
    }
  }


 async function subscribeToTables(callback) {
   try {
     await initFirebase();
   } catch (e) {
     console.error('[Firebase]', e.message);
     return () => {};
   }

   if (typeof firebase === 'undefined') return () => {};

   const db = firebase.database();
   const tablesRef = db.ref('tables');

   const listener = tablesRef.on('value', (snap) => {
     const data = snap.val() || {};
     const tables = Object.entries(data).map(([id, t]) => ({
       id: parseInt(id),
       ...t
     }));
     callback({ tables, source: 'firebase-tables' });
   }, (err) => {
     console.error('[Firebase] tables listener error:', err);
   });

   return () => {
     tablesRef.off('value', listener);
   };
 }

function testConnection() {
  return new Promise(async (resolve) => {
    
    try {
      let db;
      try {
        db = await initFirebase();
      } catch (initError) {
        resolve({ success: false, error: initError.message, details: 'Firebase SDK o configuración incorrecta' });
        return;
      }
      
      if (!db) {
        resolve({ success: false, error: 'Firebase no inicializado', details: 'Verifica la configuración en Firebase Console' });
        return;
      }
      
      await db.ref('.info/connected').once('value');
      const orders = await getOrders();
      
      resolve({ 
        success: true, 
        message: 'Conectado a Firebase',
        ordersCount: orders.length,
        source: 'Firebase Realtime Database'
      });
    } catch (error) {
      resolve({ success: false, error: error.message, details: 'Verifica las reglas de Firebase y la conexión a internet' });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR A VARIABLES GLOBALES
// ═══════════════════════════════════════════════════════════════════════════════

window.getOrders = getOrders;
window.createOrder = createOrder;
window.updateOrderStatus = updateOrderStatus;
window.subscribeToOrders = subscribeToOrders;
window.updateTableStatus = updateTableStatus;
window.subscribeToTables = subscribeToTables;
window.testConnection = testConnection;

  window.FirebaseClient = {
  // Core initialization
  init: initFirebase,
  
  // Orders
  getOrders,
  createOrder,
  updateOrderStatus,
  getStats,
  subscribeToOrders,
  
  // Tables
  updateTableStatus,
  subscribeToTables,
  selectTableTransaction,
  freeTable,
  releaseUserTables,
  
  // Utilities
  testConnection
};
