# Panel de Administración - Filá Mariscales

## Acceso al Panel

**URL:** `http://localhost/fila-mariscales-web/admin.html`

**Credenciales por defecto:**
- **Email:** admin@filamariscales.com
- **Contraseña:** admin123

## Funcionalidades del Panel

### 1. Dashboard
- Vista general con estadísticas de contenido
- Actividad reciente del sitio
- Contadores de elementos por sección

### 2. Gestión de Contenido

#### Noticias
- Crear, editar y eliminar noticias
- Campos: título, resumen, contenido, imagen, fecha, autor, destacada
- Soporte para noticias destacadas

#### Eventos
- Gestión de eventos y actividades
- Campos: título, descripción, fecha, hora, lugar, tipo, imagen
- Tipos: presentación, cena, ensayo, desfile

#### Galería
- Gestión de imágenes de la galería
- Campos: título, descripción, imagen, miniatura, categoría, fecha, orden
- Subida de imágenes con preview

#### Productos
- Catálogo de productos
- Campos: nombre, descripción, precio, precio oferta, imagen, categoría, stock, destacado
- Gestión de inventario

#### Directiva
- Información de miembros de la directiva
- Campos: nombre, cargo, imagen, descripción

#### Contactos
- Gestión de mensajes de contacto
- Campos: nombre, email, fecha, mensaje
- Solo lectura (generados por el formulario de contacto)

### 3. Gestión de Usuarios

#### Usuarios del Sistema
- Crear, editar y eliminar usuarios
- Roles: Administrador, Editor, Socio
- Campos: nombre, email, rol, contraseña, activo

#### Socios
- Gestión de socios de la filá
- Campos: nombre, email, teléfono, dirección, fecha ingreso, número socio, activo
- Solo administradores pueden gestionar socios

### 4. Configuración

#### Carrusel
- Gestión de slides del carrusel principal
- Campos: título, subtítulo, imagen, texto botón, enlace, activo
- Configuración automática mantenida

#### Textos del Sitio
- Edición de textos por sección
- Secciones: inicio, historia, directiva, socios, eventos, galería, noticias, contacto, footer, SEO
- Soporte para arrays (beneficios)

## Características Técnicas

### Autenticación
- Sistema de sesiones PHP
- Verificación de contraseñas con hash bcrypt
- Control de acceso por roles

### Subida de Imágenes
- Tipos permitidos: JPEG, PNG, WebP
- Tamaño máximo: 5MB
- Organización por carpetas: carousel, gallery, products
- Solo administradores pueden subir imágenes

### Permisos por Rol

#### Administrador
- Acceso completo a todas las secciones
- Puede gestionar usuarios y socios
- Puede subir imágenes
- Puede editar todos los contenidos

#### Editor
- Puede gestionar contenido (noticias, eventos, galería, productos, directiva)
- No puede gestionar usuarios ni socios
- No puede subir imágenes

#### Socio
- Acceso limitado a sección de socios
- Solo lectura en otras secciones

### Estructura de Datos
- Almacenamiento en archivos JSON
- Ubicación: `/data/`
- Formato: JSON con pretty print
- Backup automático en cada modificación

## Solución de Problemas

### Error de Login
1. Verificar que el archivo `data/users.json` existe
2. Verificar que el hash de la contraseña es correcto
3. Verificar permisos de lectura del archivo

### Error al Guardar
1. Verificar permisos de escritura en la carpeta `data/`
2. Verificar que el archivo JSON no esté corrupto
3. Revisar logs del servidor web

### Error de Subida de Imágenes
1. Verificar que la carpeta `uploads/images/` existe
2. Verificar permisos de escritura
3. Verificar que el usuario es administrador
4. Verificar tamaño y tipo de archivo

### Problemas de Rutas
1. Verificar que el archivo `admin.html` está en la raíz del proyecto
2. Verificar que las rutas en `admin.js` son correctas
3. Verificar que los archivos CSS y JS se cargan correctamente

## Mantenimiento

### Backup
- Los archivos JSON se respaldan automáticamente
- Recomendado: backup manual de la carpeta `data/` y `uploads/`

### Actualizaciones
- El panel es compatible con PHP 7.4+
- Requiere Bootstrap 5.3.0 y Font Awesome 6.4.0
- No requiere base de datos

### Seguridad
- Cambiar contraseñas por defecto
- Restringir acceso al panel por IP si es necesario
- Mantener actualizado el servidor web

## Soporte

Para problemas técnicos o consultas sobre el panel de administración, contactar con el administrador del sistema.

