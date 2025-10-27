<?php
/**
 * Configuración de despliegue para producción
 * Este archivo contiene configuraciones específicas para el hosting
 */

// Configuración de base de datos (si se necesita en el futuro)
define('DB_HOST', 'localhost');
define('DB_NAME', 'fila_mariscales');
define('DB_USER', 'tu_usuario_db');
define('DB_PASS', 'tu_password_db');

// Configuración de rutas para producción
define('PRODUCTION_URL', 'https://tu-dominio.com');
define('ADMIN_URL', 'https://tu-dominio.com/admin.html');

// Configuración de email (para notificaciones)
define('SMTP_HOST', 'smtp.tu-hosting.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'noreply@tu-dominio.com');
define('SMTP_PASS', 'tu_password_email');

// Configuración de seguridad
define('ENCRYPTION_KEY', 'tu_clave_de_encriptacion_segura_aqui');
define('SESSION_TIMEOUT', 3600); // 1 hora

// Configuración de archivos
define('MAX_UPLOAD_SIZE', 5242880); // 5MB
define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Configuración de caché
define('CACHE_ENABLED', true);
define('CACHE_DURATION', 3600); // 1 hora

// Configuración de logs
define('LOG_ENABLED', true);
define('LOG_FILE', 'logs/app.log');

// Configuración de PWA
define('PWA_ENABLED', true);
define('PWA_CACHE_VERSION', '1.0.0');

// Configuración de notificaciones push
define('PUSH_NOTIFICATIONS_ENABLED', true);
define('VAPID_PUBLIC_KEY', 'tu_vapid_public_key');
define('VAPID_PRIVATE_KEY', 'tu_vapid_private_key');

// Configuración de analytics
define('GOOGLE_ANALYTICS_ID', 'GA-XXXXXXXXX-X');

// Configuración de backup
define('BACKUP_ENABLED', true);
define('BACKUP_FREQUENCY', 'daily'); // daily, weekly, monthly
define('BACKUP_RETENTION_DAYS', 30);

// Configuración de monitoreo
define('UPTIME_MONITORING', true);
define('ERROR_REPORTING', true);

// Configuración de CDN (si se usa)
define('CDN_ENABLED', false);
define('CDN_URL', 'https://cdn.tu-dominio.com');

// Configuración de SSL
define('SSL_ENABLED', true);
define('FORCE_HTTPS', true);

// Configuración de compresión
define('GZIP_ENABLED', true);
define('MINIFY_CSS', true);
define('MINIFY_JS', true);

// Configuración de rate limiting
define('RATE_LIMIT_ENABLED', true);
define('RATE_LIMIT_REQUESTS', 100); // requests per minute
define('RATE_LIMIT_WINDOW', 60); // seconds

// Configuración de CORS
define('CORS_ENABLED', true);
define('CORS_ORIGINS', ['https://tu-dominio.com', 'https://www.tu-dominio.com']);

// Configuración de timezone
date_default_timezone_set('Europe/Madrid');

// Configuración de errores para producción
if (defined('PRODUCTION') && PRODUCTION) {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', 'logs/php_errors.log');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Función para verificar si estamos en producción
function isProduction() {
    return !in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', '::1']);
}

// Función para obtener la URL base
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    return $protocol . '://' . $host;
}

// Función para logging
function logMessage($message, $level = 'INFO') {
    if (LOG_ENABLED) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
        file_put_contents(LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);
    }
}

// Función para sanitizar datos
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Función para validar email
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Función para generar token seguro
function generateSecureToken($length = 32) {
    return bin2hex(random_bytes($length));
}

// Función para verificar permisos de archivo
function checkFilePermissions($file) {
    if (!file_exists($file)) {
        return false;
    }
    
    $perms = fileperms($file);
    return ($perms & 0x0004) ? true : false; // Verificar si es legible
}

// Función para crear directorio si no existe
function ensureDirectoryExists($dir) {
    if (!file_exists($dir)) {
        return mkdir($dir, 0755, true);
    }
    return true;
}

// Configuración de headers de seguridad
function setSecurityHeaders() {
    if (headers_sent()) {
        return;
    }
    
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    
    if (SSL_ENABLED) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

// Aplicar headers de seguridad
setSecurityHeaders();

// Log de inicio de aplicación
logMessage('Aplicación iniciada - ' . getBaseUrl());

?>
