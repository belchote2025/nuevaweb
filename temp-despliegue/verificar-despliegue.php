<?php
/**
 * Script de verificación para el despliegue
 * Ejecutar este script después de subir los archivos al hosting
 */

// Configuración
$errors = [];
$warnings = [];
$success = [];

// Función para verificar archivos
function checkFile($file, $required = true) {
    global $errors, $success;
    
    if (file_exists($file)) {
        $success[] = "✅ Archivo $file existe";
        return true;
    } else {
        if ($required) {
            $errors[] = "❌ Archivo requerido $file no encontrado";
        } else {
            $warnings[] = "⚠️ Archivo opcional $file no encontrado";
        }
        return false;
    }
}

// Función para verificar permisos
function checkPermissions($file, $expected = 0644) {
    global $errors, $success;
    
    if (file_exists($file)) {
        $perms = fileperms($file);
        $octal = substr(sprintf('%o', $perms), -4);
        
        if ($octal == sprintf('%o', $expected)) {
            $success[] = "✅ Permisos correctos para $file ($octal)";
        } else {
            $errors[] = "❌ Permisos incorrectos para $file (actual: $octal, esperado: " . sprintf('%o', $expected) . ")";
        }
    }
}

// Función para verificar directorios
function checkDirectory($dir, $writable = false) {
    global $errors, $success, $warnings;
    
    if (is_dir($dir)) {
        $success[] = "✅ Directorio $dir existe";
        
        if ($writable) {
            if (is_writable($dir)) {
                $success[] = "✅ Directorio $dir es escribible";
            } else {
                $errors[] = "❌ Directorio $dir no es escribible";
            }
        }
    } else {
        $errors[] = "❌ Directorio $dir no existe";
    }
}

// Función para verificar configuración PHP
function checkPHPConfig() {
    global $errors, $success, $warnings;
    
    // Versión de PHP
    $phpVersion = PHP_VERSION;
    if (version_compare($phpVersion, '7.4.0', '>=')) {
        $success[] = "✅ Versión de PHP: $phpVersion (compatible)";
    } else {
        $errors[] = "❌ Versión de PHP: $phpVersion (se requiere 7.4+)";
    }
    
    // Extensiones necesarias
    $requiredExtensions = ['json', 'curl', 'fileinfo', 'gd'];
    foreach ($requiredExtensions as $ext) {
        if (extension_loaded($ext)) {
            $success[] = "✅ Extensión PHP $ext cargada";
        } else {
            $warnings[] = "⚠️ Extensión PHP $ext no está cargada (opcional)";
        }
    }
    
    // Límites de subida
    $uploadMax = ini_get('upload_max_filesize');
    $postMax = ini_get('post_max_size');
    $success[] = "✅ Límite de subida: $uploadMax";
    $success[] = "✅ Límite POST: $postMax";
}

// Función para verificar HTTPS
function checkHTTPS() {
    global $errors, $success;
    
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        $success[] = "✅ HTTPS está activo";
    } else {
        $errors[] = "❌ HTTPS no está activo (recomendado para producción)";
    }
}

// Función para verificar archivos JSON
function checkJSONFiles() {
    global $errors, $success;
    
    $jsonFiles = [
        'data/carousel.json',
        'data/noticias.json',
        'data/eventos.json',
        'data/galeria.json',
        'data/socios.json',
        'data/textos.json',
        'manifest.json'
    ];
    
    foreach ($jsonFiles as $file) {
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $json = json_decode($content, true);
            
            if (json_last_error() === JSON_ERROR_NONE) {
                $success[] = "✅ Archivo JSON $file es válido";
            } else {
                $errors[] = "❌ Archivo JSON $file tiene errores de sintaxis";
            }
        }
    }
}

// Función para verificar API
function checkAPI() {
    global $errors, $success;
    
    $apiFiles = [
        'api/config.php',
        'api/admin.php',
        'api/auth.php',
        'api/upload.php'
    ];
    
    foreach ($apiFiles as $file) {
        if (file_exists($file)) {
            $success[] = "✅ Archivo API $file existe";
        } else {
            $errors[] = "❌ Archivo API $file no encontrado";
        }
    }
}

// Función para verificar PWA
function checkPWA() {
    global $errors, $success, $warnings;
    
    // Manifest
    if (file_exists('manifest.json')) {
        $manifest = json_decode(file_get_contents('manifest.json'), true);
        if ($manifest && isset($manifest['name']) && isset($manifest['icons'])) {
            $success[] = "✅ Manifest PWA es válido";
        } else {
            $errors[] = "❌ Manifest PWA tiene estructura incorrecta";
        }
    }
    
    // Service Worker
    if (file_exists('sw.js')) {
        $success[] = "✅ Service Worker existe";
    } else {
        $warnings[] = "⚠️ Service Worker no encontrado";
    }
    
    if (file_exists('sw.php')) {
        $success[] = "✅ Service Worker PHP existe";
    } else {
        $warnings[] = "⚠️ Service Worker PHP no encontrado";
    }
}

// Función para verificar .htaccess
function checkHtaccess() {
    global $errors, $success;
    
    if (file_exists('.htaccess')) {
        $content = file_get_contents('.htaccess');
        
        if (strpos($content, 'RewriteEngine On') !== false) {
            $success[] = "✅ .htaccess tiene RewriteEngine activado";
        } else {
            $errors[] = "❌ .htaccess no tiene RewriteEngine activado";
        }
        
        if (strpos($content, 'HTTPS') !== false) {
            $success[] = "✅ .htaccess tiene configuración HTTPS";
        } else {
            $warnings[] = "⚠️ .htaccess no tiene configuración HTTPS";
        }
        
        if (strpos($content, 'DEFLATE') !== false) {
            $success[] = "✅ .htaccess tiene compresión activada";
        } else {
            $warnings[] = "⚠️ .htaccess no tiene compresión activada";
        }
    } else {
        $errors[] = "❌ Archivo .htaccess no encontrado";
    }
}

// Ejecutar verificaciones
echo "<h1>🔍 Verificación de Despliegue - Filá Mariscales</h1>";
echo "<p>Verificando configuración del servidor...</p>";

// Verificar archivos principales
echo "<h2>📁 Archivos Principales</h2>";
checkFile('index.html');
checkFile('admin.html');
checkFile('login.html');
checkFile('manifest.json');
checkFile('.htaccess');

// Verificar directorios
echo "<h2>📂 Directorios</h2>";
checkDirectory('assets');
checkDirectory('api');
checkDirectory('data');
checkDirectory('uploads', true);

// Verificar permisos
echo "<h2>🔐 Permisos</h2>";
checkPermissions('.htaccess');
checkPermissions('manifest.json');
checkPermissions('index.html');

// Verificar configuración PHP
echo "<h2>🐘 Configuración PHP</h2>";
checkPHPConfig();

// Verificar HTTPS
echo "<h2>🔒 Seguridad</h2>";
checkHTTPS();

// Verificar archivos JSON
echo "<h2>📄 Archivos JSON</h2>";
checkJSONFiles();

// Verificar API
echo "<h2>🔌 API</h2>";
checkAPI();

// Verificar PWA
echo "<h2>📱 PWA</h2>";
checkPWA();

// Verificar .htaccess
echo "<h2>⚙️ Configuración del Servidor</h2>";
checkHtaccess();

// Mostrar resultados
echo "<h2>📊 Resumen</h2>";

if (!empty($success)) {
    echo "<h3>✅ Éxitos (" . count($success) . ")</h3>";
    echo "<ul>";
    foreach ($success as $item) {
        echo "<li>$item</li>";
    }
    echo "</ul>";
}

if (!empty($warnings)) {
    echo "<h3>⚠️ Advertencias (" . count($warnings) . ")</h3>";
    echo "<ul>";
    foreach ($warnings as $item) {
        echo "<li>$item</li>";
    }
    echo "</ul>";
}

if (!empty($errors)) {
    echo "<h3>❌ Errores (" . count($errors) . ")</h3>";
    echo "<ul>";
    foreach ($errors as $item) {
        echo "<li>$item</li>";
    }
    echo "</ul>";
}

// Resultado final
echo "<h2>🎯 Resultado Final</h2>";

if (empty($errors)) {
    echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3>🎉 ¡Despliegue Exitoso!</h3>";
    echo "<p>Tu sitio web está configurado correctamente. Puedes acceder a:</p>";
    echo "<ul>";
    echo "<li><a href='index.html'>Página Principal</a></li>";
    echo "<li><a href='admin.html'>Panel de Administración</a></li>";
    echo "<li><a href='login.html'>Login</a></li>";
    echo "</ul>";
    echo "</div>";
} else {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3>⚠️ Se encontraron errores</h3>";
    echo "<p>Por favor, corrige los errores antes de continuar.</p>";
    echo "</div>";
}

// Información del servidor
echo "<h2>🖥️ Información del Servidor</h2>";
echo "<ul>";
echo "<li><strong>Servidor:</strong> " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Desconocido') . "</li>";
echo "<li><strong>PHP:</strong> " . PHP_VERSION . "</li>";
echo "<li><strong>Documento Root:</strong> " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Desconocido') . "</li>";
echo "<li><strong>URL:</strong> " . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://" . $_SERVER['HTTP_HOST'] . "</li>";
echo "</ul>";

// Instrucciones adicionales
echo "<h2>📋 Próximos Pasos</h2>";
echo "<ol>";
echo "<li>Si hay errores, corrígelos según las indicaciones</li>";
echo "<li>Configura el SSL/HTTPS en tu panel de hosting</li>";
echo "<li>Configura el dominio en tu panel de hosting</li>";
echo "<li>Prueba todas las funcionalidades del sitio</li>";
echo "<li>Configura backups automáticos</li>";
echo "<li>Configura monitoreo (UptimeRobot, etc.)</li>";
echo "</ol>";

echo "<p><em>Script de verificación completado el " . date('Y-m-d H:i:s') . "</em></p>";
?>
