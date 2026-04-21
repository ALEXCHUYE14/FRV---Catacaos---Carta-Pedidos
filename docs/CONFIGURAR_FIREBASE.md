# 🔧 GUÍA PASO A PASO: Configurar Firebase

## 🎯 Problema
El sistema no conecta porque Firebase tiene credenciales dummy que no funcionan.

## ✅ Solución
Necesitas crear un proyecto Firebase real y obtener las credenciales correctas.

---

## 📋 PASO 1: Crear Proyecto Firebase (5 minutos)

### 1.1 Ir a Firebase Console
1. Abre tu navegador
2. Ve a: **https://console.firebase.google.com/**
3. Inicia sesión con tu cuenta de Google

### 1.2 Crear Nuevo Proyecto
1. Haz clic en **"Agregar proyecto"** (botón grande)
2. Nombre del proyecto: `frv-catacaos` (o el que prefieras)
3. **Desmarca** "Google Analytics para este proyecto" (opcional, ahorra tiempo)
4. Haz clic en **"Crear proyecto"**
5. Espera unos segundos y haz clic en **"Continuar"**

---

## 📋 PASO 2: Crear Realtime Database (3 minutos)

### 2.1 Ir a Realtime Database
1. En el menú lateral izquierdo, busca **"Realtime Database"**
2. Haz clic en **"Realtime Database"**
3. Haz clic en **"Crear base de datos"**

### 2.2 Configurar Base de Datos
1. Selecciona ubicación: **"United States (us-central1)"** (o la más cercana)
2. Selecciona **"Modo de prueba"** (para desarrollo)
3. Haz clic en **"Habilitar"**

---

## 📋 PASO 3: Obtener Credenciales (2 minutos)

### 3.1 Ir a Configuración del Proyecto
1. Haz clic en el ícono de **⚙️ (Configuración)** (esquina superior izquierda)
2. Haz clic en **"Configuración del proyecto"**

### 3.2 Registrar App Web
1. Desplázate hacia abajo hasta **"Tus apps"**
2. Haz clic en el ícono **`</>`** (Web)
3. Nombre de la app: `frv-catacaos-web`
4. **Desmarca** "Configurar Firebase Hosting" (no lo necesitas)
5. Haz clic en **"Registrar app"**

### 3.3 Copiar Configuración
1. Verás un objeto como este:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "frv-catacaos.firebaseapp.com",
  databaseURL: "https://frv-catacaos-default-rtdb.firebaseio.com",
  projectId: "frv-catacaos",
  storageBucket: "frv-catacaos.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

2. **Copia TODO el objeto** (desde `const` hasta el cierre `}`)

---

## 📋 PASO 4: Actualizar Configuración (1 minuto)

### 4.1 Abrir firebase-client.js
1. Abre el archivo [`firebase-client.js`](firebase-client.js:1) en tu editor
2. Busca la línea 7 que dice:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyReplaceWithYourOwn",
  // ... resto de configuración
};
```

### 4.2 Reemplazar Configuración
1. **Reemplaza TODO** el objeto `firebaseConfig` con el que copiaste
2. **Guarda el archivo** (Ctrl + S)

---

## 📋 PASO 5: Probar Conexión (1 minuto)

### 5.1 Abrir Panel de Bar
1. Abre [`panel-bar.html`](panel-bar.html:1) en tu navegador
2. Debería mostrar **"🟢 En vivo"** en verde
3. Si muestra error, revisa la consola del navegador (F12)

### 5.2 Crear Pedido de Prueba
1. En el Panel de Bar, haz clic en **"🔌 Probar Conexión"**
2. Debería mostrar: **"✅ Conexión exitosa a Firebase"**
3. Haz clic en **"🆕 Crear Pedido de Prueba"**
4. El pedido debería aparecer en la lista

### 5.3 Probar Menú Digital
1. Abre [`Index.html`](Index.html:1) en otra pestaña
2. Haz un pedido real
3. El pedido debería aparecer **inmediatamente** en el Panel de Bar

---

## 🔧 Solución de Problemas

### Error: "Firebase no está cargado"
**Causa:** Los scripts de Firebase no se cargaron.

**Solución:**
1. Verifica tu conexión a internet
2. Recarga la página (Ctrl + F5)
3. Revisa la consola del navegador (F12) para errores

### Error: "No se pudo inicializar Firebase"
**Causa:** Las credenciales son incorrectas.

**Solución:**
1. Verifica que copiaste **TODA** la configuración
2. Verifica que no haya espacios extra
3. Verifica que las comillas sean correctas (" no ")

### Error: "Permission denied"
**Causa:** Las reglas de seguridad no permiten acceso.

**Solución:**
1. Ve a Firebase Console → Realtime Database → Reglas
2. Cambia las reglas a:
```json
{
  "rules": {
    "orders": {
      ".read": true,
      ".write": true
    }
  }
}
```
3. Haz clic en **"Publicar"**

### Error: "Network error"
**Causa:** Problema de conexión a internet.

**Solución:**
1. Verifica tu conexión a internet
2. Intenta acceder a https://firebase.google.com
3. Si no puedes acceder, Firebase está bloqueado en tu red

---

## ✅ Checklist de Verificación

- [ ] Proyecto Firebase creado
- [ ] Realtime Database creada (modo prueba)
- [ ] App web registrada
- [ ] Configuración copiada
- [ ] firebase-client.js actualizado
- [ ] Archivo guardado
- [ ] Panel de Bar muestra "🟢 En vivo"
- [ ] "Probar Conexión" funciona
- [ ] "Crear Pedido de Prueba" funciona
- [ ] Pedidos aparecen en tiempo real

---

## 📞 Si Nada Funciona

Si después de seguir todos los pasos el problema persiste:

1. **Abre la consola del navegador** (F12 → Console)
2. **Copia los errores** que aparecen
3. **Comparte los errores** para diagnóstico adicional

### Errores Comunes en Consola

| Error | Solución |
|-------|----------|
| `Failed to load resource` | Problema de conexión a internet |
| `CORS error` | Problema de configuración en Firebase |
| `Invalid API key` | Credenciales incorrectas |
| `Permission denied` | Reglas de seguridad no configuradas |
| `Network error` | Firebase bloqueado en tu red |

---

## 🎉 Resultado Esperado

Después de configurar correctamente:
- ✅ Panel de Bar conectado a Firebase
- ✅ Pedidos aparecen en tiempo real
- ✅ Número de mesa, anfitriona y método de pago visibles
- ✅ Cambios de estado se sincronizan instantáneamente
- ✅ Sistema funcionando sin dependencia de Netlify

---

**Tiempo estimado:** 10-15 minutos
**Dificultad:** Fácil
**Costo:** Gratis
