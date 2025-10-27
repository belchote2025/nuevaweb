<?php
/**
 * Script de instalación automática
 * Ejecutar una sola vez después de subir los archivos
 */

// Configuración
$config = [
    'site_name' => 'Filá Mariscales de Caballeros Templarios',
    'site_url' => 'https://tu-dominio.com',
    'admin_email' => 'admin@tu-dominio.com',
    'timezone' => 'Europe/Madrid'
];

// Función para crear directorio si no existe
function createDirectory($dir) {
    if (!file_exists($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "✅ Directorio $dir creado\n";
            return true;
        } else {
            echo "❌ Error creando directorio $dir\n";
            return false;
        }
    }
    return true;
}

// Función para crear archivo si no existe
function createFile($file, $content) {
    if (!file_exists($file)) {
        if (file_put_contents($file, $content)) {
            echo "✅ Archivo $file creado\n";
            return true;
        } else {
            echo "❌ Error creando archivo $file\n";
            return false;
        }
    }
    return true;
}

// Función para configurar permisos
function setPermissions($file, $perms) {
    if (file_exists($file)) {
        if (chmod($file, $perms)) {
            echo "✅ Permisos configurados para $file\n";
            return true;
        } else {
            echo "❌ Error configurando permisos para $file\n";
            return false;
        }
    }
    return true;
}

echo "<h1>🚀 Instalación Automática - Filá Mariscales</h1>";

// Crear directorios necesarios
echo "<h2>📁 Creando directorios...</h2>";
createDirectory('logs');
createDirectory('backups');
createDirectory('cache');
createDirectory('uploads/images/temp');

// Crear archivo de configuración de producción
echo "<h2>⚙️ Configurando archivos...</h2>";

$prodConfig = "<?php
// Configuración de producción
define('SITE_NAME', '{$config['site_name']}');
define('SITE_URL', '{$config['site_url']}');
define('ADMIN_EMAIL', '{$config['admin_email']}');
define('TIMEZONE', '{$config['timezone']}');
define('PRODUCTION', true);

// Configuración de base de datos (configurar según tu hosting)
define('DB_HOST', 'localhost');
define('DB_NAME', 'fila_mariscales');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_password');

// Configuración de email
define('SMTP_HOST', 'smtp.tu-hosting.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'noreply@tu-dominio.com');
define('SMTP_PASS', 'tu_password_email');

// Configuración de seguridad
define('ENCRYPTION_KEY', '" . bin2hex(random_bytes(32)) . "');
define('SESSION_TIMEOUT', 3600);

// Configuración de archivos
define('MAX_UPLOAD_SIZE', 5242880); // 5MB
define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Configuración de caché
define('CACHE_ENABLED', true);
define('CACHE_DURATION', 3600);

// Configuración de logs
define('LOG_ENABLED', true);
define('LOG_FILE', 'logs/app.log');

// Configuración de PWA
define('PWA_ENABLED', true);
define('PWA_CACHE_VERSION', '1.0.0');

// Configuración de SSL
define('SSL_ENABLED', true);
define('FORCE_HTTPS', true);

// Configuración de timezone
date_default_timezone_set(TIMEZONE);

// Configuración de errores para producción
error_reporting(0);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', LOG_FILE);
?>";

createFile('config-prod.php', $prodConfig);

// Crear archivo .env para configuración sensible
$envContent = "# Configuración sensible - NO subir a Git
DB_HOST=localhost
DB_NAME=fila_mariscales
DB_USER=tu_usuario
DB_PASS=tu_password

SMTP_HOST=smtp.tu-hosting.com
SMTP_PORT=587
SMTP_USER=noreply@tu-dominio.com
SMTP_PASS=tu_password_email

ENCRYPTION_KEY=" . bin2hex(random_bytes(32)) . "
SESSION_TIMEOUT=3600

SITE_URL={$config['site_url']}
ADMIN_EMAIL={$config['admin_email']}
";

createFile('.env', $envContent);

// Crear archivo robots.txt
$robotsContent = "User-agent: *
Allow: /

# Sitemap
Sitemap: {$config['site_url']}/sitemap.xml

# Disallow admin area
Disallow: /admin.html
Disallow: /login.html
Disallow: /api/
Disallow: /data/
Disallow: /logs/
Disallow: /backups/
";

createFile('robots.txt', $robotsContent);

// Crear sitemap.xml básico
$sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>' . $config['site_url'] . '</loc>
        <lastmod>' . date('Y-m-d') . '</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>' . $config['site_url'] . '/lafila.html</loc>
        <lastmod>' . date('Y-m-d') . '</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>' . $config['site_url'] . '/historia.html</loc>
        <lastmod>' . date('Y-m-d') . '</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>' . $config['site_url'] . '/actividades.html</loc>
        <lastmod>' . date('Y-m-d') . '</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>' . $config['site_url'] . '/eventos.html</loc>
        <lastmod>' . date('Y-m-d') . '</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>' . $config['site_url'] . '/galeria.html</loc>
        <lastmod>' . date('Y-m-d') . '</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>' . $config['site_url'] . '/socios.html</loc>
        <lastmod>' . date('Y-m-d') . '</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>' . $config['site_url'] . '/contacto.html</loc>
        <lastmod>' . date('Y-m-d') . '</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
</urlset>';

createFile('sitemap.xml', $sitemapContent);

// Configurar permisos
echo "<h2>🔐 Configurando permisos...</h2>";
setPermissions('uploads', 0777);
setPermissions('logs', 0755);
setPermissions('backups', 0755);
setPermissions('cache', 0755);
setPermissions('.htaccess', 0644);
setPermissions('manifest.json', 0644);

// Crear usuario administrador por defecto
echo "<h2>👤 Configurando usuario administrador...</h2>";

$adminUser = [
    'id' => uniqid(),
    'name' => 'Administrador',
    'email' => $config['admin_email'],
    'password' => password_hash('admin123', PASSWORD_DEFAULT),
    'role' => 'admin',
    'active' => true,
    'created_at' => date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s')
];

$usersFile = 'data/users.json';
if (file_exists($usersFile)) {
    $users = json_decode(file_get_contents($usersFile), true);
    if (!is_array($users)) {
        $users = [];
    }
    
    // Verificar si ya existe un admin
    $hasAdmin = false;
    foreach ($users as $user) {
        if ($user['role'] === 'admin') {
            $hasAdmin = true;
            break;
        }
    }
    
    if (!$hasAdmin) {
        $users[] = $adminUser;
        if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT))) {
            echo "✅ Usuario administrador creado (email: {$config['admin_email']}, password: admin123)\n";
        } else {
            echo "❌ Error creando usuario administrador\n";
        }
    } else {
        echo "ℹ️ Usuario administrador ya existe\n";
    }
} else {
    $users = [$adminUser];
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT))) {
        echo "✅ Archivo de usuarios creado con administrador\n";
    } else {
        echo "❌ Error creando archivo de usuarios\n";
    }
}

// Crear archivo de configuración de backup
echo "<h2>💾 Configurando sistema de backup...</h2>";

$backupScript = '<?php
/**
 * Script de backup automático
 * Ejecutar diariamente via cron job
 */

$backupDir = "backups/";
$date = date("Y-m-d_H-i-s");
$backupFile = $backupDir . "backup_" . $date . ".zip";

// Crear directorio de backup si no existe
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0755, true);
}

// Archivos y directorios a incluir en el backup
$filesToBackup = [
    "data/",
    "uploads/",
    "assets/",
    "api/",
    "*.html",
    "*.php",
    "*.json",
    "*.js",
    "*.css",
    ".htaccess",
    "manifest.json"
];

// Crear ZIP
$zip = new ZipArchive();
if ($zip->open($backupFile, ZipArchive::CREATE) === TRUE) {
    foreach ($filesToBackup as $file) {
        if (is_dir($file)) {
            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($file));
            foreach ($iterator as $file) {
                if ($file->isFile()) {
                    $zip->addFile($file->getPathname(), $file->getPathname());
                }
            }
        } else {
            if (file_exists($file)) {
                $zip->addFile($file, $file);
            }
        }
    }
    $zip->close();
    echo "Backup creado: $backupFile\n";
} else {
    echo "Error creando backup\n";
}

// Limpiar backups antiguos (mantener solo 7 días)
$files = glob($backupDir . "backup_*.zip");
foreach ($files as $file) {
    if (filemtime($file) < time() - (7 * 24 * 60 * 60)) {
        unlink($file);
    }
}
?>';

createFile('backup.php', $backupScript);

// Crear archivo de monitoreo
echo "<h2>📊 Configurando monitoreo...</h2>";

$monitorScript = '<?php
/**
 * Script de monitoreo de salud del sitio
 * Verificar que todos los servicios funcionen correctamente
 */

$health = [
    "status" => "ok",
    "timestamp" => date("Y-m-d H:i:s"),
    "checks" => []
];

// Verificar archivos principales
$mainFiles = ["index.html", "admin.html", "manifest.json", ".htaccess"];
foreach ($mainFiles as $file) {
    $health["checks"][$file] = file_exists($file) ? "ok" : "error";
}

// Verificar directorios
$directories = ["assets", "api", "data", "uploads"];
foreach ($directories as $dir) {
    $health["checks"][$dir] = is_dir($dir) ? "ok" : "error";
}

// Verificar permisos de escritura
$writableDirs = ["uploads", "logs", "backups"];
foreach ($writableDirs as $dir) {
    $health["checks"][$dir . "_writable"] = is_writable($dir) ? "ok" : "error";
}

// Verificar archivos JSON
$jsonFiles = glob("data/*.json");
foreach ($jsonFiles as $file) {
    $content = file_get_contents($file);
    $json = json_decode($content, true);
    $health["checks"][basename($file)] = (json_last_error() === JSON_ERROR_NONE) ? "ok" : "error";
}

// Si hay errores, cambiar status
foreach ($health["checks"] as $check => $status) {
    if ($status === "error") {
        $health["status"] = "error";
        break;
    }
}

// Devolver JSON
header("Content-Type: application/json");
echo json_encode($health, JSON_PRETTY_PRINT);
?>';

createFile('health.php', $monitorScript);

// Crear archivo de configuración de cron jobs
echo "<h2>⏰ Configurando tareas programadas...</h2>";

$cronInstructions = "# Tareas programadas para Filá Mariscales
# Agregar estas líneas al crontab del servidor

# Backup diario a las 2:00 AM
0 2 * * * /usr/bin/php " . __DIR__ . "/backup.php >> logs/backup.log 2>&1

# Limpieza de logs semanal (domingos a las 3:00 AM)
0 3 * * 0 find " . __DIR__ . "/logs -name '*.log' -mtime +7 -delete

# Verificación de salud cada 5 minutos
*/5 * * * * /usr/bin/php " . __DIR__ . "/health.php > /dev/null 2>&1

# Limpieza de caché diaria a las 4:00 AM
0 4 * * * find " . __DIR__ . "/cache -type f -mtime +1 -delete
";

createFile('crontab.txt', $cronInstructions);

// Mostrar resumen
echo "<h2>✅ Instalación Completada</h2>";
echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
echo "<h3>🎉 ¡Instalación exitosa!</h3>";
echo "<p>Tu sitio web de la Filá Mariscales está listo para funcionar.</p>";
echo "</div>";

echo "<h3>📋 Próximos pasos:</h3>";
echo "<ol>";
echo "<li><strong>Configurar dominio:</strong> Apunta tu dominio al servidor</li>";
echo "<li><strong>Activar SSL:</strong> Configura HTTPS en tu panel de hosting</li>";
echo "<li><strong>Configurar email:</strong> Actualiza las credenciales SMTP en config-prod.php</li>";
echo "<li><strong>Configurar base de datos:</strong> Si planeas usar BD, actualiza las credenciales</li>";
echo "<li><strong>Cambiar contraseña:</strong> Cambia la contraseña del administrador (admin123)</li>";
echo "<li><strong>Configurar backups:</strong> Configura las tareas programadas (crontab.txt)</li>";
echo "<li><strong>Probar funcionalidades:</strong> Verifica que todo funcione correctamente</li>";
echo "</ol>";

echo "<h3>🔗 Enlaces importantes:</h3>";
echo "<ul>";
echo "<li><a href='index.html'>Página Principal</a></li>";
echo "<li><a href='admin.html'>Panel de Administración</a></li>";
echo "<li><a href='verificar-despliegue.php'>Verificar Instalación</a></li>";
echo "<li><a href='health.php'>Estado del Sistema</a></li>";
echo "</ul>";

echo "<h3>🔐 Credenciales por defecto:</h3>";
echo "<ul>";
echo "<li><strong>Email:</strong> {$config['admin_email']}</li>";
echo "<li><strong>Contraseña:</strong> admin123</li>";
echo "<li><strong>Rol:</strong> Administrador</li>";
echo "</ul>";

echo "<p><strong>⚠️ IMPORTANTE:</strong> Cambia la contraseña del administrador inmediatamente después del primer login.</p>";

echo "<p><em>Instalación completada el " . date('Y-m-d H:i:s') . "</em></p>";

// Eliminar este archivo después de la instalación
echo "<script>
setTimeout(function() {
    if (confirm('¿Deseas eliminar este archivo de instalación por seguridad?')) {
        fetch('instalar.php', {method: 'DELETE'});
    }
}, 5000);
</script>";
?>
