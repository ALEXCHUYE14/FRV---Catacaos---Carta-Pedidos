-- =====================================================
-- SCRIPT SQL PARA CREAR TABLA DE PEDIDOS EN SUPABASE
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
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

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_mesa ON orders(mesa);

-- Habilitar Realtime para actualizaciones en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Verificar que la tabla se creó correctamente
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Insertar un pedido de prueba (opcional)
INSERT INTO orders (id, mesa, items, note, payment_method, total, anfitriona, anfitriona_phone, status)
VALUES (
  'test_order_001',
  '7',
  '[{"name": "Pisco Sour", "emoji": "🍋", "qty": 2, "price": 18, "total": 36, "cat": "tragos"}]'::jsonb,
  'Pedido de prueba',
  '💳 TARJETA',
  36.00,
  'María García',
  '51924996961',
  'pending'
);

-- Verificar que el pedido de prueba se insertó
SELECT * FROM orders WHERE id = 'test_order_001';

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase
-- 2. Ve a "SQL Editor" en el menú lateral
-- 3. Copia y pega todo este script
-- 4. Haz clic en "Run" para ejecutar
-- 5. Verifica que no haya errores
-- =====================================================
