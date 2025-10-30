<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

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

// Cargar usuarios administradores desde JSON
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
    $user_type = $input['user_type'] ?? 'socio'; // 'socio' o 'admin'
    
    // Buscar usuario según el tipo
    $usuario = null;
    $redirect = '';
    
    if ($user_type === 'admin') {
        // Buscar primero en usuarios administradores
        $users = loadUsers();
        foreach ($users as $u) {
            if (strtolower($u['email']) === strtolower($email)) {
                $usuario = $u;
                $redirect = 'admin.html';
                break;
            }
        }
        
        // Si no se encuentra en users.json, buscar en socios.json
        if (!$usuario) {
            $socios = loadSocios();
            foreach ($socios as $s) {
                if (strtolower($s['email']) === strtolower($email) && 
                    isset($s['rol']) && in_array($s['rol'], ['admin', 'editor', 'moderator'])) {
                    $usuario = $s;
                    $redirect = 'admin.html';
                    break;
                }
            }
        }
        
        // Verificar contraseña y estado activo
        if ($usuario) {
            $password_field = isset($usuario['password_hash']) ? 'password_hash' : 'password';
            $active_field = isset($usuario['active']) ? 'active' : 'activo';
            $name_field = isset($usuario['name']) ? 'name' : 'nombre';
            $role_field = isset($usuario['role']) ? 'role' : 'rol';
            
            if (password_verify($password, $usuario[$password_field]) && $usuario[$active_field]) {
                $_SESSION['socio_logged_in'] = true;
                $_SESSION['socio_email'] = $usuario['email'];
                $_SESSION['socio_nombre'] = $usuario[$name_field];
                $_SESSION['socio_id'] = $usuario['id'];
                $_SESSION['login_time'] = time();
                $_SESSION['admin_role'] = $usuario[$role_field] ?? 'admin';
                
                unset($usuario[$password_field]);
                
                response(true, 'Inicio de sesión exitoso', [
                    'socio' => $usuario,
                    'role' => $usuario[$role_field] ?? 'admin',
                    'redirect' => $redirect
                ]);
            }
        }
    } else {
        // Buscar en socios
        $socios = loadSocios();
        foreach ($socios as $s) {
            if (strtolower($s['email']) === strtolower($email)) {
                $usuario = $s;
                $redirect = 'socios-area.html';
                break;
            }
        }
        
        // Verificar contraseña y estado activo
        if ($usuario && password_verify($password, $usuario['password']) && $usuario['activo']) {
            $_SESSION['socio_logged_in'] = true;
            $_SESSION['socio_email'] = $usuario['email'];
            $_SESSION['socio_nombre'] = $usuario['nombre'];
            $_SESSION['socio_id'] = $usuario['id'];
            $_SESSION['login_time'] = time();
            $_SESSION['admin_role'] = $usuario['rol'] ?? 'socio';
            
            unset($usuario['password']);
            
            response(true, 'Inicio de sesión exitoso', [
                'socio' => $usuario,
                'role' => $usuario['rol'] ?? 'socio',
                'redirect' => $redirect
            ]);
        }
    }
    
    // Si llegamos aquí, las credenciales son incorrectas
    response(false, 'Credenciales incorrectas o cuenta inactiva');
}

// Logout
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    response(true, 'Cierre de sesión exitoso');
}

// Verificar sesión
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check') {
    if (isset($_SESSION['socio_logged_in']) && $_SESSION['socio_logged_in'] === true) {
        // Obtener información del usuario incluyendo el rol
        $socios = loadSocios();
        $usuario_actual = null;
        
        foreach ($socios as $socio) {
            if (isset($socio['email']) && $socio['email'] === $_SESSION['socio_email']) {
                $usuario_actual = $socio;
                break;
            }
        }
        
        response(true, 'Sesión activa', [
            'email' => $_SESSION['socio_email'],
            'nombre' => $_SESSION['socio_nombre'],
            'id' => $_SESSION['socio_id'],
            'role' => $usuario_actual['rol'] ?? 'socio',
            'login_time' => $_SESSION['login_time']
        ]);
    } else {
        response(false, 'No hay sesión activa');
    }
}

response(false, 'Acción no válida');
?>

