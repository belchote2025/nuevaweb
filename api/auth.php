<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Cargar socios desde JSON
function loadSocios() {
    $socios_file = '../data/socios.json';
    if (!file_exists($socios_file)) return [];
    $data = json_decode(file_get_contents($socios_file), true);
    return $data ?: [];
}

function response($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// Login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        response(false, 'Email y contraseña requeridos');
    }
    
    $email = $input['email'];
    $password = $input['password'];
    
    // Buscar socio en la base de datos
    $socios = loadSocios();
    $socio = null;
    
    foreach ($socios as $s) {
        if (strtolower($s['email']) === strtolower($email)) {
            $socio = $s;
            break;
        }
    }
    
    if ($socio && password_verify($password, $socio['password'])) {
        $_SESSION['socio_logged_in'] = true;
        $_SESSION['socio_email'] = $socio['email'];
        $_SESSION['socio_nombre'] = $socio['nombre'];
        $_SESSION['socio_id'] = $socio['id'];
        $_SESSION['login_time'] = time();
        
        // No devolver información sensible
        unset($socio['password']);
        
        response(true, 'Inicio de sesión exitoso', [
            'socio' => $socio,
            'redirect' => 'socios-area.html'
        ]);
    } else {
        response(false, 'Credenciales incorrectas o cuenta inactiva');
    }
}

// Logout
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    response(true, 'Cierre de sesión exitoso');
    response(true, 'Logout exitoso');
}

// Verificar sesión
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check') {
    if (isset($_SESSION['socio_logged_in']) && $_SESSION['socio_logged_in'] === true) {
        response(true, 'Sesión activa', [
            'email' => $_SESSION['socio_email'],
            'nombre' => $_SESSION['socio_nombre'],
            'id' => $_SESSION['socio_id'],
            'login_time' => $_SESSION['login_time']
        ]);
    } else {
        response(false, 'No hay sesión activa');
    }
}

response(false, 'Acción no válida');
?>

