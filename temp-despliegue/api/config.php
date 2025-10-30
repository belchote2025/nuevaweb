<?php
// Configuración de la aplicación
define('BASE_PATH', dirname(__DIR__));
define('DATA_PATH', BASE_PATH . '/data');

// Configuración de sesión
session_name('filamariscales_session');
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Cambiar a 1 en producción con HTTPS
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_lifetime', 86400); // 24 horas

// Configuración de zona horaria
date_default_timezone_set('Europe/Madrid');

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php_errors.log');

// Configuración CORS
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Función para cargar datos JSON
function loadJsonData($file) {
    if (!file_exists($file)) {
        return [];
    }
    
    $json = file_get_contents($file);
    if ($json === false) {
        error_log("Error al leer el archivo: $file");
        return [];
    }
    
    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Error al decodificar JSON: " . json_last_error_msg() . " en $file");
        return [];
    }
    
    return is_array($data) ? $data : [];
}

// Función para guardar datos JSON
function saveJsonData($file, $data) {
    if (!is_dir(dirname($file))) {
        mkdir(dirname($file), 0755, true);
    }
    
    $result = file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        error_log("Error al guardar el archivo: $file");
        return false;
    }
    
    return true;
}

// Función para generar respuestas JSON
function jsonResponse($success, $message = '', $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    
    $response = [
        'success' => $success,
        'message' => $message,
        'data' => $data
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Función para verificar autenticación (excepto para login y rutas públicas)
function requireAuth() {
    if (!isset($_SESSION['user'])) {
        jsonResponse(false, 'No autorizado', null, 401);
    }
}

// Función para verificar rol de administrador
function requireAdmin() {
    requireAuth();
    if ($_SESSION['user']['role'] !== 'admin') {
        jsonResponse(false, 'Acceso denegado', null, 403);
    }
}

// Obtener datos JSON del cuerpo de la petición
function getJsonInput() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonResponse(false, 'Formato de solicitud inválido', null, 400);
    }
    
    return $input;
}
