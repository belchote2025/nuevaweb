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

// Guardar socios en JSON
function saveSocios($socios) {
    $socios_file = '../data/socios.json';
    
    // Crear backup antes de guardar
    if (file_exists($socios_file)) {
        $backup_file = '../data/backups/socios_' . date('Y-m-d_H-i-s') . '.json';
        $backup_dir = dirname($backup_file);
        if (!is_dir($backup_dir)) {
            mkdir($backup_dir, 0755, true);
        }
        copy($socios_file, $backup_file);
    }
    
    $result = file_put_contents($socios_file, json_encode($socios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $result !== false;
}

function response($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    response(false, 'Método no permitido');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    response(false, 'Datos inválidos');
}

// Validar campos requeridos
$required_fields = ['nombre', 'email', 'password'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty(trim($input[$field]))) {
        response(false, "El campo {$field} es requerido");
    }
}

$nombre = trim($input['nombre']);
$email = trim($input['email']);
$telefono = trim($input['telefono'] ?? '');
$direccion = trim($input['direccion'] ?? '');
$password = $input['password'];

// Validar email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    response(false, 'El email no es válido');
}

// Validar longitud de contraseña
if (strlen($password) < 6) {
    response(false, 'La contraseña debe tener al menos 6 caracteres');
}

// Cargar socios existentes
$socios = loadSocios();

// Verificar si el email ya existe
foreach ($socios as $socio) {
    if (isset($socio['email']) && strtolower($socio['email']) === strtolower($email)) {
        response(false, 'Ya existe un socio registrado con este email');
    }
}

// Generar ID único y número de socio
$id = uniqid('socio-');
$numero_socio = 'SOC-' . strtoupper(substr($id, -8));

// Crear nuevo socio
$nuevo_socio = [
    'id' => $id,
    'nombre' => $nombre,
    'email' => $email,
    'telefono' => $telefono,
    'direccion' => $direccion,
    'password' => password_hash($password, PASSWORD_BCRYPT),
    'rol' => 'socio',
    'activo' => true,
    'numero_socio' => $numero_socio,
    'fecha_ingreso' => date('Y-m-d'),
    'fecha_creacion' => date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s')
];

// Añadir a la lista de socios
$socios[] = $nuevo_socio;

// Guardar en el archivo
if (saveSocios($socios)) {
    // No devolver la contraseña en la respuesta
    unset($nuevo_socio['password']);
    
    response(true, 'Registro exitoso. Ya puedes iniciar sesión.', [
        'socio' => $nuevo_socio,
        'redirect' => 'login-socios.html'
    ]);
} else {
    response(false, 'Error al guardar el registro. Inténtalo de nuevo.');
}
?>
