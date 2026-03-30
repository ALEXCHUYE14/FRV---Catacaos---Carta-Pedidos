# 🚀 PASOS PARA CONECTAR TU SISTEMA

## ✅ Lo que ya tienes configurado:
- URL de Supabase: `https://hajohhpjbikpjhycikcv.supabase.co`
- API Key: `sb_publishable_YklPcKRSc_Mg-UM-DR4dtA_2mDzL3_h`

## 📋 PASO 1: Crear la Tabla en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto (el que tiene la URL: `https://hajohhpjbikpjhycikcv.supabase.co`)
4. En el menú de la izquierda, busca y haz clic en **"SQL Editor"**
5. Haz clic en el botón **"New Query"** (o "+ New query")
6. Copia TODO el contenido del archivo `CREAR_TABLA_PEDIDOS.sql`
7. Pégalo en el editor de SQL
8. Haz clic en el botón **"Run"** (o presiona Ctrl+Enter)
9. Espera a que diga "Success" o "No errors"
10. Si hay algún error, avísame

## 📋 PASO 2: Desplegar en Netlify

Abre tu terminal (o PowerShell) y ejecuta estos comandos uno por uno:

```bash
# 1. Instalar Netlify CLI (si no lo tienes)
npm install -g netlify-cli

# 2. Iniciar sesión en Netlify
netlify login

# 3. Ir a tu carpeta del proyecto
cd "d:/--- Proyetos WEB ----/FRV - Catacaos - Carta Pedidos"

# 4. Inicializar sitio en Netlify
netlify init

# 5. Instalar dependencias
npm install

# 6. Desplegar
netlify deploy --prod
```

**Nota:** Cuando ejecutes `netlify init`, te preguntará:
- "Create & configure a new site" → Selecciona **Yes**
- "Team" → Selecciona tu equipo
- "Site name" → Puedes escribir un nombre o dejarlo en blanco
- "Build command" → Deja en blanco (solo presiona Enter)
- "Directory to deploy" → Escribe `.` (punto)

## 📋 PASO 3: Verificar Conexión

1. Después de desplegar, Netlify te dará una URL como: `https://tu-sitio.netlify.app`
2. Abre esa URL en tu navegador
3. Agrega `/panel-bar.html` al final: `https://tu-sitio.netlify.app/panel-bar.html`
4. Haz clic en el botón **"🔌 Probar Conexión"**
5. Deberías ver: **"✅ Conexión exitosa a Supabase"**

## 📋 PASO 4: Probar el Sistema

1. Abre el menú del cliente: `https://tu-sitio.netlify.app/`
2. Selecciona una mesa (ej: Mesa 7)
3. Agrega productos al carrito
4. Haz clic en **"⚡ Confirmar Pedido"**
5. El pedido debe aparecer **instantáneamente** en el panel de administración

## ❓ ¿Problemas?

### Error: "Tabla 'orders' no encontrada"
- Asegúrate de ejecutar el SQL en el Paso 1
- Verifica que no haya errores al ejecutar el SQL

### Error: "No se pudo conectar a Supabase"
- Verifica que la API key sea correcta
- Verifica que la URL sea correcta

### Error: "CORS policy"
- Asegúrate de desplegar después de hacer cambios
- Ejecuta `netlify deploy --prod` de nuevo

### Error: "npm no se reconoce"
- Instala Node.js desde [https://nodejs.org](https://nodejs.org)

## 📞 ¿Necesitas Ayuda?

Si tienes problemas en algún paso, dime:
1. ¿En qué paso estás?
2. ¿Qué error ves?
3. ¿Puedes copiar el mensaje de error?
