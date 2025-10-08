<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar autenticación
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

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

function getDataFile($type) {
    $files = [
        'noticias' => '../data/noticias.json',
        'eventos' => '../data/eventos.json',
        'galeria' => '../data/galeria.json',
        'productos' => '../data/productos.json',
        'directiva' => '../data/directiva.json',
        'contactos' => '../data/contactos.json',
        'carousel' => '../data/carousel.json',
        'socios' => '../data/socios.json'
    ];
    
    return $files[$type] ?? null;
}

function loadData($type) {
    $file = getDataFile($type);
    if (!$file || !file_exists($file)) {
        return [];
    }
    
    $content = file_get_contents($file);
    $data = json_decode($content, true) ?: [];
    
    // Para el carrusel, devolver solo los slides
    if ($type === 'carousel' && isset($data['slides'])) {
        return $data['slides'];
    }
    
    return $data;
}

function saveData($type, $data) {
    $file = getDataFile($type);
    if (!$file) {
        return false;
    }
    
    // Para el carrusel, mantener la estructura original con config y slides
    if ($type === 'carousel') {
        $originalContent = file_get_contents($file);
        $originalData = json_decode($originalContent, true) ?: [];
        
        // Mantener la configuración original
        $carouselData = [
            'config' => $originalData['config'] ?? [
                'auto_slide' => true,
                'interval' => 5000,
                'pause_on_hover' => true,
                'show_indicators' => true,
                'show_controls' => true,
                'animation' => 'slide'
            ],
            'slides' => $data
        ];
        
        return file_put_contents($file, json_encode($carouselData, JSON_PRETTY_PRINT)) !== false;
    }
    
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

// Obtener datos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = $_GET['type'] ?? '';
    
    if (empty($type)) {
        response(false, 'Tipo de datos requerido');
    }
    
    // Verificar acceso a secciones restringidas
    if ($type === 'socios') {
        $current_role = $_SESSION['admin_role'] ?? 'admin';
        if ($current_role !== 'admin' && $current_role !== 'socio') {
            response(false, 'No tienes permisos para acceder a esta sección');
        }
    }
    
    $data = loadData($type);
    response(true, 'Datos obtenidos', $data);
}

// Crear/Actualizar datos
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['type'])) {
        response(false, 'Datos no válidos');
    }
    
    $type = $input['type'];
    $item = $input['data'] ?? [];
    
    if (empty($item)) {
        response(false, 'Datos del elemento requeridos');
    }
    
    // Verificar permisos para operaciones en socios
    if ($type === 'socios') {
        $current_role = $_SESSION['admin_role'] ?? 'admin';
        if ($current_role !== 'admin') {
            response(false, 'Solo los administradores pueden gestionar socios');
        }
    }
    
    $data = loadData($type);
    
    // Generar ID si no existe
    if (!isset($item['id'])) {
        $item['id'] = uniqid();
    }
    
    // Añadir timestamp
    $item['updated_at'] = date('Y-m-d H:i:s');
    
    // Si es nuevo elemento
    if (!isset($input['edit_id'])) {
        $data[] = $item;
    } else {
        // Actualizar elemento existente
        $edit_id = $input['edit_id'];
        $found = false;
        
        foreach ($data as $key => $existing_item) {
            if ($existing_item['id'] == $edit_id) {
                $data[$key] = $item;
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            response(false, 'Elemento no encontrado');
        }
    }
    
    if (saveData($type, $data)) {
        response(true, 'Datos guardados correctamente', $item);
    } else {
        response(false, 'Error al guardar los datos');
    }
}

// Eliminar datos
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['type']) || !isset($input['id'])) {
        response(false, 'Tipo e ID requeridos');
    }
    
    $type = $input['type'];
    $id = $input['id'];
    
    // Verificar permisos para eliminar socios
    if ($type === 'socios') {
        $current_role = $_SESSION['admin_role'] ?? 'admin';
        if ($current_role !== 'admin') {
            response(false, 'Solo los administradores pueden eliminar socios');
        }
    }
    
    $data = loadData($type);
    $found = false;
    
    foreach ($data as $key => $item) {
        if ($item['id'] == $id) {
            unset($data[$key]);
            $data = array_values($data); // Reindexar array
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        response(false, 'Elemento no encontrado');
    }
    
    if (saveData($type, $data)) {
        response(true, 'Elemento eliminado correctamente');
    } else {
        response(false, 'Error al eliminar el elemento');
    }
}

response(false, 'Método no permitido');
?>

