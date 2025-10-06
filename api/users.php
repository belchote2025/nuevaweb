<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Requiere sesión admin
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

$users_file = '../data/users.json';

function load_users($file) {
    if (!file_exists($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return $data ?: [];
}

function save_users($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

function response($ok, $message, $data = null) {
    echo json_encode(['success' => $ok, 'message' => $message, 'data' => $data]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $users = load_users($users_file);
    // Ocultar hashes
    $safe = array_map(function($u){ unset($u['password_hash']); return $u; }, $users);
    response(true, 'OK', $safe);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) response(false, 'Datos inválidos');

    $users = load_users($users_file);
    $id = $input['id'] ?? uniqid('user-');
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $role = $input['role'] ?? 'editor';
    $password = $input['password'] ?? '';
    $active = $input['active'] ?? true;

    if (!$name || !$email || (!$input['edit'] && !$password)) response(false, 'Campos requeridos');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) response(false, 'Email no válido');

    // Crear o actualizar
    $found = false;
    foreach ($users as &$u) {
        if ($u['id'] === $id) {
            $u['name'] = $name;
            $u['email'] = $email;
            $u['role'] = $role;
            $u['active'] = (bool)$active;
            if ($password) $u['password_hash'] = password_hash($password, PASSWORD_BCRYPT);
            $u['updated_at'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }
    unset($u);

    if (!$found) {
        $users[] = [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'role' => $role,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
            'active' => (bool)$active
        ];
    }

    if (save_users($users_file, $users)) response(true, 'Guardado', ['id' => $id]);
    response(false, 'Error al guardar');
}

if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id'])) response(false, 'ID requerido');

    $users = load_users($users_file);
    $users = array_values(array_filter($users, fn($u) => $u['id'] !== $input['id']));

    if (save_users($users_file, $users)) response(true, 'Eliminado');
    response(false, 'Error al eliminar');
}

response(false, 'Método no permitido');
?>


