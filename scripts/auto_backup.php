<?php
/**
 * Script de Backup Automático para Filá Mariscales
 * Este script puede ser ejecutado via cron job para crear backups automáticos
 */

// Configuración
$configFile = __DIR__ . '/../config/backup_config.json';
$logFile = __DIR__ . '/../logs/backup.log';

// Crear directorio de logs si no existe
$logDir = dirname($logFile);
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

// Función de logging
function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    echo $logEntry;
}

// Función para cargar configuración
function loadConfig() {
    global $configFile;
    if (!file_exists($configFile)) {
        logMessage("ERROR: Archivo de configuración no encontrado: $configFile");
        return false;
    }
    
    $content = file_get_contents($configFile);
    $config = json_decode($content, true);
    
    if (!$config) {
        logMessage("ERROR: Configuración JSON inválida");
        return false;
    }
    
    return $config;
}

// Función para crear backup
function createAutoBackup($config) {
    $backupDir = __DIR__ . '/../backups/';
    
    // Crear directorio de backups si no existe
    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d_H-i-s');
    $backupName = "auto_backup_$timestamp";
    $backupPath = $backupDir . $backupName;
    
    logMessage("Iniciando backup automático: $backupName");
    
    try {
        // Crear directorio del backup
        mkdir($backupPath, 0755, true);
        
        $backupInfo = [
            'timestamp' => $timestamp,
            'backup_name' => $backupName,
            'type' => 'automatic',
            'files_backed_up' => 0,
            'total_size' => 0,
            'status' => 'success'
        ];
        
        // Respaldar elementos configurados
        foreach ($config['backup_items'] as $name => $item) {
            if ($item['enabled']) {
                $sourcePath = $item['path'];
                $destPath = $backupPath . '/' . $name;
                
                if (file_exists($sourcePath)) {
                    if (is_dir($sourcePath)) {
                        copyDirectory($sourcePath, $destPath);
                    } else {
                        copy($sourcePath, $destPath);
                    }
                    
                    $backupInfo['files_backed_up'] += countFiles($destPath);
                    $backupInfo['total_size'] += getDirectorySize($destPath);
                    
                    logMessage("Respaldado: $name (" . $item['description'] . ")");
                } else {
                    logMessage("ADVERTENCIA: Ruta no encontrada: $sourcePath");
                }
            }
        }
        
        // Crear archivo de información del backup
        $infoFile = $backupPath . '/backup_info.json';
        file_put_contents($infoFile, json_encode($backupInfo, JSON_PRETTY_PRINT));
        
        // Crear archivo ZIP si está habilitado
        if ($config['compression']['enabled']) {
            $zipFile = $backupDir . $backupName . '.zip';
            createZipArchive($backupPath, $zipFile);
            logMessage("Archivo ZIP creado: " . basename($zipFile));
            
            // Eliminar directorio temporal
            deleteDirectory($backupPath);
        }
        
        // Actualizar lista de backups
        updateBackupList($backupName, $backupInfo);
        
        // Limpiar backups antiguos
        cleanupOldBackups($config);
        
        logMessage("Backup completado exitosamente: $backupName");
        return true;
        
    } catch (Exception $e) {
        logMessage("ERROR: " . $e->getMessage());
        return false;
    }
}

// Función para copiar directorio recursivamente
function copyDirectory($src, $dst) {
    if (!file_exists($dst)) {
        mkdir($dst, 0755, true);
    }
    
    $dir = opendir($src);
    while (($file = readdir($dir)) !== false) {
        if ($file != '.' && $file != '..') {
            $srcFile = $src . '/' . $file;
            $dstFile = $dst . '/' . $file;
            
            if (is_dir($srcFile)) {
                copyDirectory($srcFile, $dstFile);
            } else {
                copy($srcFile, $dstFile);
            }
        }
    }
    closedir($dir);
}

// Función para contar archivos
function countFiles($dir) {
    $count = 0;
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file != '.' && $file != '..') {
                $filePath = $dir . '/' . $file;
                if (is_dir($filePath)) {
                    $count += countFiles($filePath);
                } else {
                    $count++;
                }
            }
        }
    }
    return $count;
}

// Función para obtener tamaño de directorio
function getDirectorySize($dir) {
    $size = 0;
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file != '.' && $file != '..') {
                $filePath = $dir . '/' . $file;
                if (is_dir($filePath)) {
                    $size += getDirectorySize($filePath);
                } else {
                    $size += filesize($filePath);
                }
            }
        }
    }
    return $size;
}

// Función para crear archivo ZIP
function createZipArchive($source, $destination) {
    $zip = new ZipArchive();
    if ($zip->open($destination, ZipArchive::CREATE) !== TRUE) {
        throw new Exception("No se puede crear el archivo ZIP");
    }
    
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    
    foreach ($iterator as $file) {
        $filePath = $file->getRealPath();
        $relativePath = substr($filePath, strlen($source) + 1);
        
        if ($file->isDir()) {
            $zip->addEmptyDir($relativePath);
        } else {
            $zip->addFile($filePath, $relativePath);
        }
    }
    
    $zip->close();
}

// Función para eliminar directorio recursivamente
function deleteDirectory($dir) {
    if (!is_dir($dir)) {
        return false;
    }
    
    $files = array_diff(scandir($dir), array('.', '..'));
    foreach ($files as $file) {
        $path = $dir . '/' . $file;
        is_dir($path) ? deleteDirectory($path) : unlink($path);
    }
    return rmdir($dir);
}

// Función para actualizar lista de backups
function updateBackupList($backupName, $backupInfo) {
    $backupListFile = __DIR__ . '/../backups/backup_list.json';
    $backups = [];
    
    if (file_exists($backupListFile)) {
        $content = file_get_contents($backupListFile);
        $backups = json_decode($content, true) ?: [];
    }
    
    $backups[] = [
        'name' => $backupName,
        'timestamp' => $backupInfo['timestamp'],
        'type' => $backupInfo['type'],
        'files_count' => $backupInfo['files_backed_up'],
        'size' => $backupInfo['total_size'],
        'status' => $backupInfo['status']
    ];
    
    file_put_contents($backupListFile, json_encode($backups, JSON_PRETTY_PRINT));
}

// Función para limpiar backups antiguos
function cleanupOldBackups($config) {
    $backupDir = __DIR__ . '/../backups/';
    $maxBackups = $config['auto_backup']['max_backups'] ?? 10;
    $retentionDays = $config['auto_backup']['retention_days'] ?? 30;
    
    $backupListFile = $backupDir . 'backup_list.json';
    if (!file_exists($backupListFile)) {
        return;
    }
    
    $content = file_get_contents($backupListFile);
    $backups = json_decode($content, true) ?: [];
    
    // Ordenar por timestamp (más recientes primero)
    usort($backups, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    $deletedCount = 0;
    
    // Eliminar backups que excedan el límite
    if (count($backups) > $maxBackups) {
        $toDelete = array_slice($backups, $maxBackups);
        foreach ($toDelete as $backup) {
            $zipFile = $backupDir . $backup['name'] . '.zip';
            if (file_exists($zipFile)) {
                unlink($zipFile);
                $deletedCount++;
                logMessage("Backup eliminado (límite excedido): " . $backup['name']);
            }
        }
    }
    
    // Eliminar backups más antiguos que el período de retención
    $cutoffDate = date('Y-m-d', strtotime("-$retentionDays days"));
    foreach ($backups as $backup) {
        $backupDate = date('Y-m-d', strtotime($backup['timestamp']));
        if ($backupDate < $cutoffDate) {
            $zipFile = $backupDir . $backup['name'] . '.zip';
            if (file_exists($zipFile)) {
                unlink($zipFile);
                $deletedCount++;
                logMessage("Backup eliminado (período de retención): " . $backup['name']);
            }
        }
    }
    
    if ($deletedCount > 0) {
        logMessage("Limpieza completada: $deletedCount backups eliminados");
        
        // Actualizar lista de backups
        $remainingBackups = array_filter($backups, function($backup) use ($backupDir) {
            $zipFile = $backupDir . $backup['name'] . '.zip';
            return file_exists($zipFile);
        });
        
        file_put_contents($backupListFile, json_encode(array_values($remainingBackups), JSON_PRETTY_PRINT));
    }
}

// Ejecutar backup automático
if (php_sapi_name() === 'cli') {
    logMessage("=== INICIANDO BACKUP AUTOMÁTICO ===");
    
    $config = loadConfig();
    if (!$config) {
        logMessage("ERROR: No se pudo cargar la configuración");
        exit(1);
    }
    
    // Verificar si el backup automático está habilitado
    if (!$config['auto_backup']['enabled']) {
        logMessage("Backup automático deshabilitado en configuración");
        exit(0);
    }
    
    $success = createAutoBackup($config);
    
    if ($success) {
        logMessage("=== BACKUP AUTOMÁTICO COMPLETADO EXITOSAMENTE ===");
        exit(0);
    } else {
        logMessage("=== BACKUP AUTOMÁTICO FALLÓ ===");
        exit(1);
    }
} else {
    // Si se accede via web, mostrar información
    header('Content-Type: text/plain');
    echo "Script de Backup Automático para Filá Mariscales\n";
    echo "Este script debe ejecutarse desde la línea de comandos o via cron job.\n\n";
    echo "Ejemplo de uso:\n";
    echo "php " . __FILE__ . "\n\n";
    echo "Para configurar un cron job diario a las 2:00 AM:\n";
    echo "0 2 * * * /usr/bin/php " . __FILE__ . " >> /var/log/backup.log 2>&1\n";
}
?>
