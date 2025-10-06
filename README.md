# Filá Mariscales - Web Moderna

## 🏛️ Descripción
Réplica exacta del proyecto PHP original de la Filá Mariscales de Caballeros Templarios de Elche, implementada con tecnologías web modernas para máxima compatibilidad con servidores web.

## 🚀 Características

### ✅ Funcionalidades Completas
- **Todas las secciones originales:** Historia, Directiva, Noticias, Blog, Calendario, Galería, Música, Libro, Descargas, Tienda, Patrocinadores, Hermanamientos, Socios, Eventos, Contacto
- **Panel de administración completo** con CRUD para todas las secciones
- **Sistema de autenticación** seguro
- **Formulario de contacto** funcional
- **Tienda online** con carrito de compras
- **Galería de imágenes** con modal
- **Calendario de eventos** dinámico

### 🛠️ Tecnologías Utilizadas
- **Frontend:** HTML5, CSS3, JavaScript ES6+, Bootstrap 5
- **Backend:** PHP 7.4+ (APIs simples)
- **Datos:** Archivos JSON (sin base de datos)
- **Iconos:** Font Awesome 6
- **Fuentes:** Google Fonts (Cinzel, Open Sans)

### 📱 Características Técnicas
- **Responsive Design:** Adaptable a móviles, tablets y desktop
- **SEO Friendly:** HTML semántico y meta tags optimizados
- **Performance:** Carga rápida con recursos optimizados
- **Compatibilidad:** Funciona en cualquier hosting web
- **Sin Dependencias:** No requiere base de datos compleja

## 📁 Estructura del Proyecto

```
fila-mariscales-web/
├── index.html              # Página principal
├── login.html              # Página de login
├── admin/                  # Panel de administración
│   └── index.html
├── api/                    # APIs PHP
│   ├── auth.php           # Autenticación
│   ├── admin.php          # CRUD admin
│   └── contacto.php       # Formulario contacto
├── assets/                # Recursos estáticos
│   ├── css/
│   │   ├── style.css      # Estilos principales
│   │   ├── auth.css       # Estilos autenticación
│   │   └── admin.css      # Estilos admin
│   └── js/
│       ├── main.js        # JavaScript principal
│       ├── auth.js        # JavaScript autenticación
│       └── admin.js       # JavaScript admin
├── data/                  # Archivos JSON de datos
│   ├── noticias.json
│   ├── eventos.json
│   ├── galeria.json
│   ├── productos.json
│   ├── directiva.json
│   └── contactos.json
└── uploads/               # Directorio para subidas
```

## 🚀 Instalación

### Requisitos
- Servidor web (Apache/Nginx)
- PHP 7.4 o superior
- Navegador web moderno

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/eduNavegatel/fila-mariscales-web.git
   cd fila-mariscales-web
   ```

2. **Configurar permisos:**
   ```bash
   chmod 755 uploads/
   chmod 644 data/*.json
   ```

3. **Configurar servidor web:**
   - Asegurar que PHP esté habilitado
   - Configurar document root al directorio del proyecto
   - Habilitar mod_rewrite (opcional)

4. **Acceder al sitio:**
   - Frontend: `http://tu-dominio.com/`
   - Admin: `http://tu-dominio.com/admin/`

## 🔐 Credenciales de Administración

- **URL:** `/admin/`
- **Email:** `admin@filamariscales.com`
- **Contraseña:** `admin123`

> ⚠️ **Importante:** Cambiar estas credenciales en producción editando `api/auth.php`

## 📝 Uso del Panel de Administración

### Dashboard
- Vista general con estadísticas
- Actividad reciente
- Acceso rápido a todas las secciones

### Gestión de Contenido
- **Noticias:** Crear, editar, eliminar artículos
- **Eventos:** Gestionar calendario de actividades
- **Galería:** Subir y organizar imágenes
- **Productos:** Administrar tienda online
- **Directiva:** Gestionar información de miembros
- **Contactos:** Ver mensajes recibidos

### Características del Admin
- Interfaz intuitiva y responsive
- Validación de formularios
- Confirmación de eliminación
- Búsqueda y filtrado
- Exportación de datos

## 🎨 Personalización

### Colores y Estilos
Editar `assets/css/style.css` para personalizar:
- Colores principales
- Tipografías
- Espaciados
- Animaciones

### Contenido
- **Datos:** Modificar archivos JSON en `data/`
- **Imágenes:** Reemplazar URLs en los archivos JSON
- **Textos:** Editar directamente en `index.html`

### Configuración
- **Email de contacto:** Modificar en `api/contacto.php`
- **Credenciales admin:** Cambiar en `api/auth.php`
- **Configuración general:** Editar `assets/js/main.js`

## 🔧 Mantenimiento

### Backup
```bash
# Backup completo
tar -czf backup-$(date +%Y%m%d).tar.gz fila-mariscales-web/

# Backup solo datos
cp -r data/ backup-data-$(date +%Y%m%d)/
```

### Actualizaciones
```bash
# Actualizar desde GitHub
git pull origin web-version

# Verificar cambios
git log --oneline -5
```

### Logs
- Revisar logs del servidor web para errores
- Verificar permisos de archivos
- Comprobar espacio en disco

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error 500:** Verificar permisos de archivos
2. **APIs no funcionan:** Comprobar que PHP esté habilitado
3. **Imágenes no cargan:** Verificar URLs en archivos JSON
4. **Admin no carga:** Revisar credenciales y sesiones

### Debug
```bash
# Verificar PHP
php -v

# Verificar permisos
ls -la data/
ls -la uploads/

# Verificar logs
tail -f /var/log/apache2/error.log
```

## 📞 Soporte

Para soporte técnico o consultas:
- **Email:** info@filamariscales.com
- **GitHub Issues:** [Crear issue](https://github.com/eduNavegatel/fila-mariscales-web/issues)

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Filá Mariscales de Caballeros Templarios de Elche
- Comunidad de desarrolladores open source
- Bootstrap y Font Awesome por los recursos

---

**Desarrollado con ❤️ para la Filá Mariscales**

*Versión 2.0 - Enero 2025*

