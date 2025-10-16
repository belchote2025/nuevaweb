<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
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

// Verificar autenticación para operaciones admin
function checkAdminAuth() {
    if (!isset($_SESSION['socio_logged_in']) || $_SESSION['socio_logged_in'] !== true) {
        response(false, 'Acceso no autorizado');
    }
}

// Cargar solicitudes desde JSON
function loadSolicitudes() {
    $file = '../data/solicitudes.json';
    if (!file_exists($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return $data ?: [];
}

// Guardar solicitudes en JSON
function saveSolicitudes($solicitudes) {
    $file = '../data/solicitudes.json';
    return file_put_contents($file, json_encode($solicitudes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Cargar usuarios desde JSON
function loadUsers() {
    $file = '../data/users.json';
    if (!file_exists($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return $data ?: [];
}

// Guardar usuarios en JSON
function saveUsers($users) {
    $file = '../data/users.json';
    return file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Crear nuevo usuario
function createUser($email, $name, $role = 'socio') {
    $users = loadUsers();
    
    // Verificar si el email ya existe
    foreach ($users as $user) {
        if ($user['email'] === $email) {
            return false;
        }
    }
    
    // Generar contraseña temporal
    $tempPassword = substr(md5(uniqid()), 0, 8);
    $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);
    
    $newUser = [
        'id' => 'user-' . uniqid(),
        'name' => $name,
        'email' => $email,
        'role' => $role,
        'password_hash' => $passwordHash,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
        'active' => true,
        'temp_password' => $tempPassword // Solo para mostrar al admin
    ];
    
    $users[] = $newUser;
    
    if (saveUsers($users)) {
        return $newUser;
    }
    
    return false;
}

// POST - Crear nueva solicitud
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        response(false, 'Datos no válidos');
    }
    
    // Validar campos requeridos
    $required = ['nombre', 'email', 'motivo'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            response(false, "El campo $field es obligatorio");
        }
    }
    
    // Validar email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        response(false, 'Email no válido');
    }
    
    // Validar aceptación de términos
    if (!isset($input['acepta']) || !$input['acepta']) {
        response(false, 'Debes aceptar los estatutos y reglamento');
    }
    
    $solicitudes = loadSolicitudes();
    
    // Verificar si ya existe una solicitud con este email
    foreach ($solicitudes as $solicitud) {
        if ($solicitud['email'] === $input['email'] && $solicitud['estado'] === 'pendiente') {
            response(false, 'Ya existe una solicitud pendiente con este email');
        }
    }
    
    $nuevaSolicitud = [
        'id' => 'solicitud-' . uniqid(),
        'nombre' => trim($input['nombre']),
        'email' => trim($input['email']),
        'telefono' => trim($input['telefono'] ?? ''),
        'edad' => intval($input['edad'] ?? 0),
        'motivo' => trim($input['motivo']),
        'experiencia' => trim($input['experiencia'] ?? ''),
        'estado' => 'pendiente',
        'fecha_solicitud' => date('Y-m-d H:i:s'),
        'fecha_revision' => null,
        'revisado_por' => null,
        'observaciones' => ''
    ];
    
    $solicitudes[] = $nuevaSolicitud;
    
    if (saveSolicitudes($solicitudes)) {
        response(true, 'Solicitud enviada correctamente', $nuevaSolicitud);
    } else {
        response(false, 'Error al guardar la solicitud');
    }
}

// GET - Obtener solicitudes (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    checkAdminAuth();
    
    $solicitudes = loadSolicitudes();
    $estado = $_GET['estado'] ?? 'todos';
    
    if ($estado !== 'todos') {
        $solicitudes = array_filter($solicitudes, function($s) use ($estado) {
            return $s['estado'] === $estado;
        });
    }
    
    // Ordenar por fecha de solicitud (más recientes primero)
    usort($solicitudes, function($a, $b) {
        return strtotime($b['fecha_solicitud']) - strtotime($a['fecha_solicitud']);
    });
    
    response(true, 'Solicitudes obtenidas', $solicitudes);
}

// PUT - Actualizar solicitud (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    checkAdminAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        response(false, 'ID de solicitud requerido');
    }
    
    $solicitudes = loadSolicitudes();
    $solicitudIndex = -1;
    
    foreach ($solicitudes as $index => $solicitud) {
        if ($solicitud['id'] === $input['id']) {
            $solicitudIndex = $index;
            break;
        }
    }
    
    if ($solicitudIndex === -1) {
        response(false, 'Solicitud no encontrada');
    }
    
    // Actualizar campos permitidos
    $allowedFields = ['estado', 'observaciones'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $solicitudes[$solicitudIndex][$field] = $input[$field];
        }
    }
    
    $solicitudes[$solicitudIndex]['fecha_revision'] = date('Y-m-d H:i:s');
    $solicitudes[$solicitudIndex]['revisado_por'] = $_SESSION['admin_email'];
    
    if (saveSolicitudes($solicitudes)) {
        response(true, 'Solicitud actualizada', $solicitudes[$solicitudIndex]);
    } else {
        response(false, 'Error al actualizar la solicitud');
    }
}

// POST - Aprobar solicitud y crear usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'aprobar') {
    checkAdminAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['solicitud_id'])) {
        response(false, 'ID de solicitud requerido');
    }
    
    $solicitudes = loadSolicitudes();
    $solicitudIndex = -1;
    
    foreach ($solicitudes as $index => $solicitud) {
        if ($solicitud['id'] === $input['solicitud_id']) {
            $solicitudIndex = $index;
            break;
        }
    }
    
    if ($solicitudIndex === -1) {
        response(false, 'Solicitud no encontrada');
    }
    
    $solicitud = $solicitudes[$solicitudIndex];
    
    // Crear usuario
    $nuevoUsuario = createUser($solicitud['email'], $solicitud['nombre'], 'socio');
    
    if (!$nuevoUsuario) {
        response(false, 'Error al crear el usuario. El email puede ya estar registrado.');
    }
    
    // Actualizar solicitud
    $solicitudes[$solicitudIndex]['estado'] = 'aprobada';
    $solicitudes[$solicitudIndex]['fecha_revision'] = date('Y-m-d H:i:s');
    $solicitudes[$solicitudIndex]['revisado_por'] = $_SESSION['admin_email'];
    $solicitudes[$solicitudIndex]['observaciones'] = 'Solicitud aprobada. Usuario creado con contraseña temporal.';
    $solicitudes[$solicitudIndex]['usuario_id'] = $nuevoUsuario['id'];
    
    if (saveSolicitudes($solicitudes)) {
        response(true, 'Solicitud aprobada y usuario creado', [
            'solicitud' => $solicitudes[$solicitudIndex],
            'usuario' => [
                'email' => $nuevoUsuario['email'],
                'password' => $nuevoUsuario['temp_password'],
                'role' => $nuevoUsuario['role']
            ]
        ]);
    } else {
        response(false, 'Error al actualizar la solicitud');
    }
}

response(false, 'Método no permitido');
?>
