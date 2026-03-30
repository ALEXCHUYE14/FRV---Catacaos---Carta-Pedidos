-- =====================================================
-- SCRIPT SIMPLE PARA CREAR TABLA DE PEDIDOS
-- Ejecutar en SQL Editor de Supabase
-- =====================================================

-- Eliminar tabla si existe (para empezar limpio)
DROP TABLE IF EXISTS orders;

-- Crear tabla de pedidos
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  mesa TEXT NOT NULL,
  items JSONB NOT NULL,
  note TEXT,
  payment_method TEXT,
  total DECIMAL(10,2) NOT NULL,
  anfitriona TEXT,
  anfitriona_phone TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Insertar pedido de prueba
INSERT INTO orders (id, mesa, items, note, payment_method, total, anfitriona, anfitriona_phone, status)
VALUES (
  'pedido_prueba_001',
  '7',
  '[{"name": "Pisco Sour", "emoji": "🍋", "qty": 2, "price": 18, "total": 36, "cat": "tragos"}]'::jsonb,
  'Pedido de prueba - Si ves esto, la conexión funciona',
  '💳 TARJETA',
  36.00,
  'María García',
  '51924996961',
  'pending'
);

-- Verificar que se creó
SELECT * FROM orders;
