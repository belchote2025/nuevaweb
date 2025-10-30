# 🚀 Guía de Despliegue - Filá Mariscales

## 📦 **Tu proyecto está listo para subir al hosting**

He preparado completamente tu proyecto para que puedas subirlo fácilmente a cualquier hosting. Aquí tienes todo lo que necesitas:

## 🎯 **Archivos Creados para el Despliegue**

### ✅ **Archivos de Configuración**
- `.htaccess` - Configuración del servidor con HTTPS, seguridad y optimizaciones
- `deployment-config.php` - Configuración avanzada para producción
- `config-prod.php` - Configuración específica del sitio
- `.env` - Variables de entorno sensibles

### ✅ **Scripts de Instalación**
- `instalar.php` - Instalación automática (ejecutar una vez)
- `verificar-despliegue.php` - Verificación de la instalación
- `backup.php` - Sistema de backup automático
- `health.php` - Monitoreo de salud del sitio

### ✅ **Archivos SEO**
- `robots.txt` - Configuración para motores de búsqueda
- `sitemap.xml` - Mapa del sitio
- `manifest.json` - PWA (aplicación web progresiva)

### ✅ **Documentación**
- `INSTRUCCIONES_DESPLIEGUE.md` - Guía completa paso a paso
- `README_DESPLIEGUE.md` - Este archivo

## 🚀 **Pasos Rápidos para Subir**

### **1. Elegir Hosting (Recomendaciones)**

#### **Opción A: Hosting Compartido (Fácil)**
- **Hostinger** - €2.99/mes - Perfecto para empezar
- **SiteGround** - €3.99/mes - Muy confiable
- **Raiola Networks** - €2.95/mes - Español, buen soporte

#### **Opción B: VPS (Más control)**
- **DigitalOcean** - €5/mes - Muy popular
- **Linode** - €5/mes - Excelente rendimiento

### **2. Subir Archivos**

#### **Método 1: ZIP (Más fácil)**
1. Comprimir toda la carpeta `fila-mariscales-web` en ZIP
2. Subir ZIP al panel de hosting
3. Extraer en `public_html`
4. Mover contenido a la raíz

#### **Método 2: FTP**
1. Usar FileZilla o similar
2. Conectar con credenciales del hosting
3. Subir todos los archivos a `public_html`

### **3. Configurar el Sitio**

1. **Ejecutar instalación automática**:
   - Visitar `https://tu-dominio.com/instalar.php`
   - Seguir las instrucciones
   - Eliminar el archivo después

2. **Verificar instalación**:
   - Visitar `https://tu-dominio.com/verificar-despliegue.php`
   - Corregir cualquier error mostrado

3. **Configurar SSL**:
   - Activar Let's Encrypt en el panel de hosting
   - Esperar activación (5-10 minutos)

### **4. Configurar Dominio**

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

## 🔧 **Configuración Post-Despliegue**

### **1. Cambiar Credenciales por Defecto**
- **Email:** admin@tu-dominio.com
- **Contraseña:** admin123
- **⚠️ CAMBIAR INMEDIATAMENTE**

### **2. Configurar Email (Opcional)**
Editar `config-prod.php`:
```php
define('SMTP_HOST', 'smtp.tu-hosting.com');
define('SMTP_USER', 'noreply@tu-dominio.com');
define('SMTP_PASS', 'tu_password_email');
```

### **3. Configurar Base de Datos (Opcional)**
Si planeas usar BD en el futuro:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'fila_mariscales');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_password');
```

### **4. Configurar Backups Automáticos**
1. Acceder al panel de hosting
2. Configurar cron jobs con el contenido de `crontab.txt`
3. O configurar backups desde el panel

## 🧪 **Pruebas de Funcionamiento**

### **Checklist de Verificación**

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

#### **Seguridad**:
- [ ] HTTPS funciona correctamente
- [ ] Headers de seguridad activos
- [ ] No hay errores en consola

## 🚨 **Solución de Problemas**

### **Error 500 - Internal Server Error**
```bash
# Verificar:
1. Permisos de archivos (644 para archivos, 755 para carpetas)
2. Sintaxis PHP (revisar logs de error)
3. Configuración de .htaccess
4. Versión de PHP (necesita 7.4+)
```

### **Imágenes no cargan**
```bash
# Verificar:
1. Permisos de carpeta uploads/ (777)
2. Rutas en archivos JSON
3. Configuración de .htaccess para imágenes
```

### **API no funciona**
```bash
# Verificar:
1. PHP está habilitado
2. Rutas en api/config.php
3. Permisos de archivos PHP
4. Configuración de CORS
```

## 📊 **Monitoreo y Mantenimiento**

### **Herramientas Recomendadas**:
- **UptimeRobot** - Monitoreo de disponibilidad (gratis)
- **Google Analytics** - Estadísticas de uso (gratis)
- **Google Search Console** - SEO y indexación (gratis)
- **PageSpeed Insights** - Rendimiento (gratis)

### **Tareas de Mantenimiento**:
- [ ] Backup semanal de archivos
- [ ] Revisión de logs de error
- [ ] Actualización de dependencias
- [ ] Optimización de imágenes

## 🎉 **¡Tu Sitio Está Listo!**

### **Enlaces Importantes**:
- **Página Principal:** `https://tu-dominio.com`
- **Panel de Admin:** `https://tu-dominio.com/admin.html`
- **Verificar Estado:** `https://tu-dominio.com/health.php`

### **Características Incluidas**:
- ✅ **PWA** - Se puede instalar como app
- ✅ **Responsive** - Funciona en móvil y desktop
- ✅ **SEO Optimizado** - Preparado para Google
- ✅ **Seguro** - HTTPS y headers de seguridad
- ✅ **Rápido** - Compresión y caché configurados
- ✅ **Monitoreo** - Sistema de salud incluido
- ✅ **Backup** - Sistema automático de respaldos

## 📞 **Soporte**

### **Si necesitas ayuda**:
1. Revisar `INSTRUCCIONES_DESPLIEGUE.md` para detalles
2. Ejecutar `verificar-despliegue.php` para diagnóstico
3. Revisar logs de error del hosting
4. Contactar soporte del hosting

### **Archivos de Log**:
- `logs/app.log` - Logs de la aplicación
- `logs/php_errors.log` - Errores de PHP
- Logs del hosting (panel de control)

---

**¡Tu sitio web de la Filá Mariscales está listo para conquistar el mundo! 🏰⚔️**

*Preparado el $(date) - Todo listo para el despliegue*
