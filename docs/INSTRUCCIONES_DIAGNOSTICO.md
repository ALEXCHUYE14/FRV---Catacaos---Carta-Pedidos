# 🔍 Instrucciones de Diagnóstico - FRV Catacaos

## 🎯 Problema
Los sistemas (Panel de Bar y Menú Digital) no se conectan entre sí.

## ✅ Solución Paso a Paso

### PASO 1: Abrir Diagnóstico Completo (2 minutos)

1. Abre el archivo [`diagnostico.html`](diagnostico.html:1) en tu navegador
2. Haz clic en **"Ejecutar Todas las Pruebas"**
3. Espera a que termine (aproximadamente 10 segundos)
4. Revisa los resultados

**¿Qué buscar?**
- ✅ Verde = Prueba pasó correctamente
- ❌ Rojo = Prueba falló (necesita atención)
- ⚠️ Amarillo = Advertencia

---

### PASO 2: Revisar Errores Comunes

#### Error: "FirebaseClient no está cargado"
**Causa:** Los scripts de Firebase no se cargaron

**Solución:**
1. Verifica tu conexión a internet
2. Recarga la página (Ctrl + F5)
3. Revisa la consola del navegador (F12 → Console)

---

#### Error: "Firebase no inicializado"
**Causa:** Las credenciales de Firebase son incorrectas

**Solución:**
1. Abre [`firebase-client.js`](firebase-client.js:7)
2. Verifica que la configuración sea correcta:
   ```javascript
   const firebaseConfig = {
     apiKey: "TU_API_KEY_REAL",
     authDomain: "frv-catacaos.firebaseapp.com",
     databaseURL: "https://frv-catacaos-default-rtdb.firebaseio.com",
     projectId: "frv-catacaos",
     storageBucket: "frv-catacaos.appspot.com",
     messagingSenderId: "TU_SENDER_ID",
     appId: "TU_APP_ID"
   };
   ```
3. Si no tienes credenciales reales, sigue el archivo [`CONFIGURAR_FIREBASE.md`](CONFIGURAR_FIREBASE.md:1)

---

#### Error: "Permiso denegado" (PERMISSION_DENIED)
**Causa:** Las reglas de seguridad de Firebase no permiten acceso

**Solución:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Realtime Database** → **Reglas**
4. Cambia las reglas a:
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
5. Haz clic en **"Publicar"**

---

#### Error: "Error de red" (NETWORK_ERROR)
**Causa:** Problema de conexión a internet

**Solución:**
1. Verifica tu conexión a internet
2. Intenta acceder a https://firebase.google.com
3. Si no puedes acceder, Firebase está bloqueado en tu red

---

### PASO 3: Probar Conexión Manualmente

1. Abre [`verificar-conexion.html`](verificar-conexion.html:1)
2. Haz clic en **"Probar Conexión"**
3. Revisa el log de actividad

**Resultados esperados:**
- ✅ "Conexión exitosa a Firebase" = Sistema funcionando
- ❌ "Permiso denegado" = Configura reglas de seguridad
- ❌ "Error de red" = Problema de internet

---

### PASO 4: Verificar en Panel de Bar

1. Abre [`panel-bar.html`](panel-bar.html:1)
2. Revisa el estado de conexión (esquina superior izquierda)
   - 🟢 **En vivo** = Conectado correctamente
   - 🟡 **Conectando** = Intentando conectar
   - 🔴 **Desconectado** = Sin conexión

3. Haz clic en **"🔌 Probar Conexión"** en el sidebar
4. Revisa el feed de actividad (panel derecho)

---

### PASO 5: Verificar en Menú Digital

1. Abre [`index.html`](index.html:1)
2. Haz un pedido de prueba
3. Verifica que el pedido aparezca en el Panel de Bar

---

## 🔧 Solución Rápida (Si todo falla)

### Opción A: Crear Nuevo Proyecto Firebase (10 minutos)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto llamado `frv-catacaos`
3. Crea una **Realtime Database** en modo prueba
4. Registra una app web
5. Copia la configuración
6. Pega la configuración en [`firebase-client.js`](firebase-client.js:7)
7. Configura las reglas de seguridad (ver PASO 2)

---

### Opción B: Usar localStorage como respaldo

Si Firebase no funciona, el sistema automáticamente usará localStorage:
- Los pedidos se guardan localmente
- El Panel de Bar puede leerlos
- **Limitación:** No hay sincronización entre dispositivos

---

## 📋 Checklist de Verificación

- [ ] Scripts de Firebase cargados
- [ ] FirebaseClient disponible
- [ ] Firebase inicializado
- [ ] Base de datos accesible
- [ ] Permisos de lectura OK
- [ ] Permisos de escritura OK
- [ ] Suscripción en tiempo real OK
- [ ] Panel de Bar muestra "En vivo"
- [ ] Pedidos aparecen en tiempo real

---

## 📞 Si Nada Funciona

1. Abre la consola del navegador (F12 → Console)
2. Copia TODOS los errores que aparecen
3. Comparte los errores para diagnóstico adicional

### Errores Comunes en Consola

| Error | Solución |
|-------|----------|
| `Failed to load resource` | Problema de conexión a internet |
| `CORS error` | Problema de configuración en Firebase |
| `Invalid API key` | Credenciales incorrectas |
| `Permission denied` | Reglas de seguridad no configuradas |
| `Network error` | Firebase bloqueado en tu red |
| `FirebaseClient is not defined` | Scripts de Firebase no cargados |

---

## 🎉 Resultado Esperado

Después de configurar correctamente:
- ✅ Panel de Bar conectado a Firebase
- ✅ Pedidos aparecen en tiempo real
- ✅ Número de mesa, anfitriona y método de pago visibles
- ✅ Cambios de estado se sincronizan instantáneamente
- ✅ Sistema funcionando sin dependencia de Netlify

---

## 📚 Documentación Adicional

- [`CONFIGURAR_FIREBASE.md`](CONFIGURAR_FIREBASE.md:1) - Guía paso a paso para configurar Firebase
- [`SOLUCION_FIREBASE.md`](SOLUCION_FIREBASE.md:1) - Documentación técnica completa
- [`diagnostico.html`](diagnostico.html:1) - Herramienta de diagnóstico automático
- [`verificar-conexion.html`](verificar-conexion.html:1) - Prueba de conexión manual

---

**Tiempo estimado de diagnóstico:** 5-10 minutos
**Dificultad:** Fácil
**Costo:** Gratis
