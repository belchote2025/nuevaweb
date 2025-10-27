<?php
// API para gestión de fondos
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iniciar sesión
session_start();

// Verificar autenticación
if (!isset($_SESSION['socio_logged_in']) || $_SESSION['socio_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

// Archivo de datos
$dataFile = '../data/fondos.json';

// Función para cargar fondos
function loadFondos() {
    global $dataFile;
    if (!file_exists($dataFile)) {
        return [];
    }
    $json = file_get_contents($dataFile);
    return json_decode($json, true) ?: [];
}

// Función para guardar fondos
function saveFondos($fondos) {
    global $dataFile;
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return file_put_contents($dataFile, json_encode($fondos, JSON_PRETTY_PRINT));
}

// Función para generar ID único
function generateId() {
    return 'fondo_' . uniqid();
}

// Función para validar datos
function validateFondo($data) {
    $errors = [];
    
    if (empty($data['nombre'])) {
        $errors[] = 'El nombre es requerido';
    }
    
    if (empty($data['tipo'])) {
        $errors[] = 'El tipo es requerido';
    }
    
    if (!in_array($data['tipo'], ['imagen', 'color', 'gradiente'])) {
        $errors[] = 'Tipo de fondo no válido';
    }
    
    if ($data['tipo'] === 'imagen' && empty($data['imagen_url'])) {
        $errors[] = 'La URL de imagen es requerida para fondos de tipo imagen';
    }
    
    if (($data['tipo'] === 'color' || $data['tipo'] === 'gradiente') && empty($data['color'])) {
        $errors[] = 'El color es requerido para fondos de color/gradiente';
    }
    
    if ($data['tipo'] === 'gradiente' && empty($data['color_secundario'])) {
        $errors[] = 'El color secundario es requerido para gradientes';
    }
    
    if (empty($data['paginas'])) {
        $errors[] = 'Las páginas son requeridas';
    }
    
    return $errors;
}

// Manejar diferentes métodos HTTP
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        $fondos = loadFondos();
        echo json_encode(['success' => true, 'data' => $fondos]);
        break;
        
    case 'POST':
        $errors = validateFondo($input);
        if (!empty($errors)) {
            echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
            exit();
        }
        
        $fondos = loadFondos();
        $nuevoFondo = $input;
        $nuevoFondo['id'] = generateId();
        $nuevoFondo['fecha_creacion'] = date('Y-m-d H:i:s');
        $nuevoFondo['activo'] = isset($nuevoFondo['activo']) ? (bool)$nuevoFondo['activo'] : true;
        
        $fondos[] = $nuevoFondo;
        
        if (saveFondos($fondos)) {
            echo json_encode(['success' => true, 'message' => 'Fondo creado correctamente', 'data' => $nuevoFondo]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error guardando fondo']);
        }
        break;
        
    case 'PUT':
        if (empty($input['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            exit();
        }
        
        $errors = validateFondo($input);
        if (!empty($errors)) {
            echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
            exit();
        }
        
        $fondos = loadFondos();
        $fondoIndex = -1;
        
        foreach ($fondos as $index => $fondo) {
            if ($fondo['id'] === $input['id']) {
                $fondoIndex = $index;
                break;
            }
        }
        
        if ($fondoIndex === -1) {
            echo json_encode(['success' => false, 'message' => 'Fondo no encontrado']);
            exit();
        }
        
        // Actualizar fondo
        $fondos[$fondoIndex] = array_merge($fondos[$fondoIndex], $input);
        $fondos[$fondoIndex]['fecha_modificacion'] = date('Y-m-d H:i:s');
        $fondos[$fondoIndex]['activo'] = isset($input['activo']) ? (bool)$input['activo'] : true;
        
        if (saveFondos($fondos)) {
            echo json_encode(['success' => true, 'message' => 'Fondo actualizado correctamente', 'data' => $fondos[$fondoIndex]]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error actualizando fondo']);
        }
        break;
        
    case 'DELETE':
        if (empty($input['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            exit();
        }
        
        $fondos = loadFondos();
        $fondoIndex = -1;
        
        foreach ($fondos as $index => $fondo) {
            if ($fondo['id'] === $input['id']) {
                $fondoIndex = $index;
                break;
            }
        }
        
        if ($fondoIndex === -1) {
            echo json_encode(['success' => false, 'message' => 'Fondo no encontrado']);
            exit();
        }
        
        // Eliminar fondo
        array_splice($fondos, $fondoIndex, 1);
        
        if (saveFondos($fondos)) {
            echo json_encode(['success' => true, 'message' => 'Fondo eliminado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error eliminando fondo']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}
?>

