<?php
session_start();
header('Content-Type: application/json');

// Verificar autenticación y rol de administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true || $_SESSION['admin_role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso denegado.']);
    exit();
}

// Función para crear backup
function createBackup() {
    $backupDir = '../backups/';
    
    // Crear directorio de backups si no existe
    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d_H-i-s');
    $backupName = "backup_fila_mariscales_$timestamp";
    $backupPath = $backupDir . $backupName;
    
    // Crear directorio del backup
    mkdir($backupPath, 0755, true);
    
    // Archivos y directorios a respaldar
    $itemsToBackup = [
        'data' => '../data/',
        'uploads' => '../uploads/',
        'config' => '../config/'
    ];
    
    $backupInfo = [
        'timestamp' => $timestamp,
        'backup_name' => $backupName,
        'files_backed_up' => 0,
        'total_size' => 0,
        'status' => 'success'
    ];
    
    try {
        // Respaldar cada directorio
        foreach ($itemsToBackup as $name => $path) {
            if (file_exists($path)) {
                $destPath = $backupPath . '/' . $name;
                
                if (is_dir($path)) {
                    copyDirectory($path, $destPath);
                } else {
                    copy($path, $destPath);
                }
                
                $backupInfo['files_backed_up'] += countFiles($destPath);
                $backupInfo['total_size'] += getDirectorySize($destPath);
            }
        }
        
        // Crear archivo de información del backup
        $infoFile = $backupPath . '/backup_info.json';
        file_put_contents($infoFile, json_encode($backupInfo, JSON_PRETTY_PRINT));
        
        // Crear archivo ZIP del backup
        $zipFile = $backupDir . $backupName . '.zip';
        createZipArchive($backupPath, $zipFile);
        
        // Eliminar directorio temporal
        deleteDirectory($backupPath);
        
        // Actualizar lista de backups
        updateBackupList($backupName, $backupInfo);
        
        return [
            'success' => true,
            'message' => 'Backup creado correctamente',
            'backup_name' => $backupName,
            'zip_file' => $backupName . '.zip',
            'size' => formatBytes(filesize($zipFile)),
            'files_count' => $backupInfo['files_backed_up']
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error creando backup: ' . $e->getMessage()
        ];
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
    $backupListFile = '../backups/backup_list.json';
    $backups = [];
    
    if (file_exists($backupListFile)) {
        $content = file_get_contents($backupListFile);
        $backups = json_decode($content, true) ?: [];
    }
    
    $backups[] = [
        'name' => $backupName,
        'timestamp' => $backupInfo['timestamp'],
        'files_count' => $backupInfo['files_backed_up'],
        'size' => $backupInfo['total_size'],
        'status' => $backupInfo['status']
    ];
    
    // Mantener solo los últimos 10 backups
    if (count($backups) > 10) {
        $backups = array_slice($backups, -10);
    }
    
    file_put_contents($backupListFile, json_encode($backups, JSON_PRETTY_PRINT));
}

// Función para obtener lista de backups
function getBackupList() {
    $backupListFile = '../backups/backup_list.json';
    
    if (!file_exists($backupListFile)) {
        return [];
    }
    
    $content = file_get_contents($backupListFile);
    $backups = json_decode($content, true) ?: [];
    
    // Verificar que los archivos ZIP existan
    $validBackups = [];
    foreach ($backups as $backup) {
        $zipFile = '../backups/' . $backup['name'] . '.zip';
        if (file_exists($zipFile)) {
            $backup['zip_exists'] = true;
            $backup['zip_size'] = filesize($zipFile);
            $backup['zip_size_formatted'] = formatBytes(filesize($zipFile));
        } else {
            $backup['zip_exists'] = false;
        }
        $validBackups[] = $backup;
    }
    
    return array_reverse($validBackups); // Más recientes primero
}

// Función para eliminar backup
function deleteBackup($backupName) {
    $backupDir = '../backups/';
    $zipFile = $backupDir . $backupName . '.zip';
    
    if (file_exists($zipFile)) {
        unlink($zipFile);
        
        // Actualizar lista de backups
        $backupListFile = $backupDir . 'backup_list.json';
        if (file_exists($backupListFile)) {
            $content = file_get_contents($backupListFile);
            $backups = json_decode($content, true) ?: [];
            
            $backups = array_filter($backups, function($backup) use ($backupName) {
                return $backup['name'] !== $backupName;
            });
            
            file_put_contents($backupListFile, json_encode(array_values($backups), JSON_PRETTY_PRINT));
        }
        
        return true;
    }
    
    return false;
}

// Función para formatear bytes
function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}

// Función para restaurar backup
function restoreBackup($backupName) {
    $backupDir = '../backups/';
    $zipFile = $backupDir . $backupName . '.zip';
    
    if (!file_exists($zipFile)) {
        return [
            'success' => false,
            'message' => 'Archivo de backup no encontrado'
        ];
    }
    
    try {
        $zip = new ZipArchive();
        if ($zip->open($zipFile) !== TRUE) {
            throw new Exception("No se puede abrir el archivo ZIP");
        }
        
        // Extraer a directorio temporal
        $tempDir = $backupDir . 'temp_restore_' . time();
        $zip->extractTo($tempDir);
        $zip->close();
        
        // Restaurar archivos
        $itemsToRestore = ['data', 'uploads', 'config'];
        
        foreach ($itemsToRestore as $item) {
            $sourcePath = $tempDir . '/' . $item;
            $destPath = '../' . $item . '/';
            
            if (file_exists($sourcePath)) {
                if (is_dir($sourcePath)) {
                    // Crear directorio de destino si no existe
                    if (!file_exists($destPath)) {
                        mkdir($destPath, 0755, true);
                    }
                    
                    // Copiar archivos
                    copyDirectory($sourcePath, $destPath);
                }
            }
        }
        
        // Limpiar directorio temporal
        deleteDirectory($tempDir);
        
        return [
            'success' => true,
            'message' => 'Backup restaurado correctamente'
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Error restaurando backup: ' . $e->getMessage()
        ];
    }
}

// Manejar peticiones
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            $backups = getBackupList();
            echo json_encode(['success' => true, 'data' => $backups]);
            break;
            
        case 'info':
            $backupName = $_GET['name'] ?? '';
            if ($backupName) {
                $backupList = getBackupList();
                $backup = array_filter($backupList, function($b) use ($backupName) {
                    return $b['name'] === $backupName;
                });
                
                if (!empty($backup)) {
                    echo json_encode(['success' => true, 'data' => array_values($backup)[0]]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Backup no encontrado']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Nombre de backup requerido']);
            }
            break;
            
        case 'download':
            $backupName = $_GET['name'] ?? '';
            if ($backupName) {
                $backupDir = '../backups/';
                $zipFile = $backupDir . $backupName . '.zip';
                
                if (file_exists($zipFile)) {
                    header('Content-Type: application/zip');
                    header('Content-Disposition: attachment; filename="' . $backupName . '.zip"');
                    header('Content-Length: ' . filesize($zipFile));
                    readfile($zipFile);
                    exit();
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Archivo de backup no encontrado']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Nombre de backup requerido']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'create':
            $result = createBackup();
            echo json_encode($result);
            break;
            
        case 'delete':
            $backupName = $input['name'] ?? '';
            if ($backupName) {
                if (deleteBackup($backupName)) {
                    echo json_encode(['success' => true, 'message' => 'Backup eliminado correctamente']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error eliminando backup']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Nombre de backup requerido']);
            }
            break;
            
        case 'restore':
            $backupName = $input['name'] ?? '';
            if ($backupName) {
                $result = restoreBackup($backupName);
                echo json_encode($result);
            } else {
                echo json_encode(['success' => false, 'message' => 'Nombre de backup requerido']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>
