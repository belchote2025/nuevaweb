# 🚀 Instrucciones de Despliegue - Filá Mariscales

## 📋 Checklist Pre-Despliegue

### ✅ Archivos Verificados
- [x] `.htaccess` configurado con HTTPS y seguridad
- [x] `manifest.json` con iconos válidos
- [x] `sw.js` y `sw.php` para PWA
- [x] Todas las páginas HTML funcionando
- [x] API PHP configurada correctamente
- [x] Archivos de datos JSON en carpeta `data/`
- [x] Imágenes optimizadas en carpeta `uploads/`

## 🌐 Opciones de Hosting Recomendadas

### **Opción 1: Hosting Compartido (Recomendado para empezar)**
- **Hostinger** - €2.99/mes - PHP 8.1, SSL gratis, 100GB
- **SiteGround** - €3.99/mes - PHP 8.1, SSL gratis, 10GB
- **Raiola Networks** - €2.95/mes - PHP 8.1, SSL gratis, 25GB

### **Opción 2: VPS (Más control)**
- **DigitalOcean** - €5/mes - Droplet básico
- **Linode** - €5/mes - Nanode 1GB
- **Vultr** - €3.50/mes - Cloud Compute

## 📤 Pasos de Despliegue

### **Paso 1: Preparar Archivos**

1. **Crear ZIP del proyecto**:
   ```
   - Seleccionar carpeta: fila-mariscales-web
   - Comprimir en ZIP
   - Nombre: fila-mariscales-deployment.zip
   ```

2. **Verificar estructura**:
   ```
   fila-mariscales-web/
   ├── index.html
   ├── admin.html
   ├── login.html
   ├── .htaccess
   ├── manifest.json
   ├── sw.js
   ├── sw.php
   ├── deployment-config.php
   ├── assets/
   ├── api/
   ├── data/
   └── uploads/
   ```

### **Paso 2: Configurar Hosting**

#### **A. Acceder al Panel de Control**
1. Iniciar sesión en tu proveedor de hosting
2. Buscar "File Manager" o "Gestor de Archivos"
3. Navegar a `public_html` o `www`

#### **B. Subir Archivos**
1. **Método ZIP (Recomendado)**:
   - Subir `fila-mariscales-deployment.zip`
   - Extraer en `public_html`
   - Mover contenido a la raíz

2. **Método FTP**:
   - Usar FileZilla o similar
   - Conectar con credenciales del hosting
   - Subir todos los archivos a `public_html`

### **Paso 3: Configurar Permisos**

```bash
# Permisos necesarios:
- Carpetas: 755 (drwxr-xr-x)
- Archivos PHP: 644 (-rw-r--r--)
- Archivos JSON: 644 (-rw-r--r--)
- Carpeta uploads/: 777 (drwxrwxrwx)
- Archivo .htaccess: 644 (-rw-r--r--)
```

### **Paso 4: Configurar SSL**

1. **Activar SSL**:
   - Panel de control → SSL/TLS
   - Activar Let's Encrypt (gratis)
   - Esperar activación (5-10 minutos)

2. **Verificar HTTPS**:
   - Visitar `https://tu-dominio.com`
   - Verificar que aparezca el candado verde

### **Paso 5: Configurar Base de Datos (Opcional)**

Si planeas usar base de datos en el futuro:

1. **Crear Base de Datos**:
   - Panel de control → MySQL Databases
   - Crear nueva base de datos
   - Crear usuario y asignar permisos

2. **Configurar Conexión**:
   - Editar `deployment-config.php`
   - Actualizar credenciales de BD

## 🔧 Configuración Post-Despliegue

### **1. Verificar Funcionamiento**

#### **Páginas Principales**:
- [ ] `https://tu-dominio.com` - Página principal
- [ ] `https://tu-dominio.com/admin.html` - Panel admin
- [ ] `https://tu-dominio.com/login.html` - Login

#### **Funcionalidades**:
- [ ] Carousel funciona correctamente
- [ ] Imágenes se cargan
- [ ] Formularios envían datos
- [ ] Panel de administración accesible
- [ ] PWA se puede instalar

### **2. Configurar Dominio**

#### **Si tienes dominio propio**:
1. **Configurar DNS**:
   ```
   Tipo: A
   Nombre: @
   Valor: IP del servidor
   
   Tipo: CNAME
   Nombre: www
   Valor: tu-dominio.com
   ```

2. **Esperar propagación** (24-48 horas)

#### **Si usas subdominio del hosting**:
- Ya está configurado automáticamente

### **3. Optimizaciones Adicionales**

#### **A. Configurar CDN (Opcional)**:
- Cloudflare (gratis)
- Configurar DNS en Cloudflare
- Activar optimizaciones

#### **B. Configurar Analytics**:
- Google Analytics
- Editar `deployment-config.php`
- Agregar ID de seguimiento

#### **C. Configurar Email**:
- Configurar SMTP en `deployment-config.php`
- Probar envío de emails

## 🧪 Pruebas de Funcionamiento

### **Checklist de Pruebas**:

#### **Frontend**:
- [ ] Página principal carga correctamente
- [ ] Navegación entre páginas funciona
- [ ] Carousel se reproduce automáticamente
- [ ] Imágenes se muestran correctamente
- [ ] Formularios envían datos
- [ ] Responsive design funciona en móvil

#### **Backend/Admin**:
- [ ] Login de administrador funciona
- [ ] Panel de administración carga
- [ ] Se pueden editar contenidos
- [ ] Subida de imágenes funciona
- [ ] Cambios se reflejan en frontend

#### **PWA**:
- [ ] Manifest.json es válido
- [ ] Service Worker se registra
- [ ] Se puede instalar como app
- [ ] Funciona offline (básico)

#### **Seguridad**:
- [ ] HTTPS funciona correctamente
- [ ] Headers de seguridad activos
- [ ] Archivos sensibles protegidos
- [ ] No hay errores en consola

## 🚨 Solución de Problemas

### **Error 500 - Internal Server Error**:
```bash
# Verificar:
1. Permisos de archivos (644 para archivos, 755 para carpetas)
2. Sintaxis PHP (revisar logs de error)
3. Configuración de .htaccess
4. Versión de PHP (necesita 7.4+)
```

### **Imágenes no cargan**:
```bash
# Verificar:
1. Permisos de carpeta uploads/ (777)
2. Rutas en archivos JSON
3. Configuración de .htaccess para imágenes
```

### **API no funciona**:
```bash
# Verificar:
1. PHP está habilitado
2. Rutas en api/config.php
3. Permisos de archivos PHP
4. Configuración de CORS
```

### **PWA no funciona**:
```bash
# Verificar:
1. manifest.json está en la raíz
2. sw.js es accesible
3. HTTPS está activo
4. Headers de Content-Type correctos
```

## 📊 Monitoreo y Mantenimiento

### **Herramientas Recomendadas**:
- **UptimeRobot** - Monitoreo de disponibilidad
- **Google Analytics** - Estadísticas de uso
- **Google Search Console** - SEO y indexación
- **PageSpeed Insights** - Rendimiento

### **Tareas de Mantenimiento**:
- [ ] Backup semanal de archivos
- [ ] Backup diario de base de datos (si se usa)
- [ ] Actualización de dependencias
- [ ] Revisión de logs de error
- [ ] Optimización de imágenes

## 📞 Soporte

### **Si necesitas ayuda**:
1. Revisar logs de error del hosting
2. Verificar configuración de archivos
3. Probar en modo incógnito
4. Contactar soporte del hosting

### **Archivos de Log Importantes**:
- `logs/app.log` - Logs de la aplicación
- `logs/php_errors.log` - Errores de PHP
- Logs del hosting (panel de control)

## ✅ Lista de Verificación Final

- [ ] Sitio web accesible via HTTPS
- [ ] Todas las páginas cargan correctamente
- [ ] Panel de administración funciona
- [ ] Imágenes y recursos se cargan
- [ ] Formularios envían datos
- [ ] PWA se puede instalar
- [ ] No hay errores en consola
- [ ] Responsive design funciona
- [ ] SSL certificado válido
- [ ] Backup configurado

---

**¡Tu sitio web de la Filá Mariscales está listo para el mundo! 🎉**

*Última actualización: $(date)*
