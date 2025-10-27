<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function response($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// GET - Crear backup
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $backupDir = __DIR__ . '/../backups/';
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d_H-i-s');
        $backupFile = $backupDir . "backup_$timestamp.zip";
        
        $zip = new ZipArchive();
        if ($zip->open($backupFile, ZipArchive::CREATE) !== TRUE) {
            response(false, 'No se pudo crear el archivo de backup');
        }
        
        // Agregar archivos de datos
        $dataFiles = [
            'noticias.json',
            'eventos.json',
            'galeria.json',
            'productos.json',
            'directiva.json',
            'contactos.json',
            'carousel.json',
            'socios.json',
            'textos.json',
            'imagenes-sitio.json',
            'temas.json',
            'estadisticas.json',
            'alertas.json'
        ];
        
        foreach ($dataFiles as $file) {
            $filePath = __DIR__ . '/../data/' . $file;
            if (file_exists($filePath)) {
                $zip->addFile($filePath, "data/$file");
            }
        }
        
        $zip->close();
        
        response(true, 'Backup creado exitosamente', [
            'archivo' => basename($backupFile),
            'tamaño' => filesize($backupFile),
            'fecha' => $timestamp
        ]);
        
    } catch (Exception $e) {
        response(false, 'Error creando backup: ' . $e->getMessage());
    }
}

// POST - Restaurar backup
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['archivo'])) {
        response(false, 'Archivo de backup requerido');
    }
    
    $backupFile = __DIR__ . '/../backups/' . $input['archivo'];
    
    if (!file_exists($backupFile)) {
        response(false, 'Archivo de backup no encontrado');
    }
    
    try {
        $zip = new ZipArchive();
        if ($zip->open($backupFile) !== TRUE) {
            response(false, 'No se pudo abrir el archivo de backup');
        }
        
        // Extraer archivos
        $zip->extractTo(__DIR__ . '/../data/');
        $zip->close();
        
        response(true, 'Backup restaurado exitosamente');
        
    } catch (Exception $e) {
        response(false, 'Error restaurando backup: ' . $e->getMessage());
    }
}

response(false, 'Método no permitido');
?>
