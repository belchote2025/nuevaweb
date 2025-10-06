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

// Cargar usuarios desde JSON
function loadUsers() {
    $users_file = '../data/users.json';
    if (!file_exists($users_file)) return [];
    $data = json_decode(file_get_contents($users_file), true);
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
    
    // Buscar usuario en la base de datos
    $users = loadUsers();
    $user = null;
    
    foreach ($users as $u) {
        if ($u['email'] === $email && $u['active']) {
            $user = $u;
            break;
        }
    }
    
    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_email'] = $email;
        $_SESSION['admin_role'] = $user['role'];
        $_SESSION['admin_user_id'] = $user['id'];
        $_SESSION['login_time'] = time();
        
        response(true, 'Login exitoso', [
            'email' => $email,
            'role' => $user['role'],
            'name' => $user['name'],
            'login_time' => $_SESSION['login_time']
        ]);
    } else {
        response(false, 'Credenciales incorrectas o usuario inactivo');
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
            'role' => $_SESSION['admin_role'] ?? 'admin',
            'login_time' => $_SESSION['login_time']
        ]);
    } else {
        response(false, 'No hay sesión activa');
    }
}

response(false, 'Acción no válida');
?>

