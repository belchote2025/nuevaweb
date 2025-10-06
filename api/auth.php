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

// Configuración de admin (en producción usar hash de contraseña)
$admin_credentials = [
    'email' => 'admin@filamariscales.com',
    'password' => 'admin123' // En producción usar password_hash()
];

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
    
    if ($input['email'] === $admin_credentials['email'] && 
        $input['password'] === $admin_credentials['password']) {
        
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_email'] = $input['email'];
        $_SESSION['login_time'] = time();
        
        response(true, 'Login exitoso', [
            'email' => $input['email'],
            'login_time' => $_SESSION['login_time']
        ]);
    } else {
        response(false, 'Credenciales incorrectas');
    }
}

// Logout
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    response(true, 'Logout exitoso');
}

// Verificar sesión
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check') {
    if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
        response(true, 'Sesión activa', [
            'email' => $_SESSION['admin_email'],
            'login_time' => $_SESSION['login_time']
        ]);
    } else {
        response(false, 'No hay sesión activa');
    }
}

response(false, 'Acción no válida');
?>

