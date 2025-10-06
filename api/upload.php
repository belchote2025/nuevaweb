<?php
// Simple image upload endpoint for admin panel
// Saves images to ../uploads/images/{carousel|gallery}/ and returns public relative path

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Require admin session
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

// Verificar que el usuario es administrador (no editor ni viewer)
if (!isset($_SESSION['admin_role']) || $_SESSION['admin_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Solo los administradores pueden subir imágenes']);
    exit();
}

function respond($ok, $message, $data = null) {
    echo json_encode(['success' => $ok, 'message' => $message, 'data' => $data]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    respond(false, 'Método no permitido');
}

// Validate target type
$type = $_POST['type'] ?? 'gallery';
$allowedTypes = ['carousel', 'gallery', 'products'];
if (!in_array($type, $allowedTypes, true)) {
    respond(false, 'Tipo no válido');
}

// Validate file
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    respond(false, 'Archivo no recibido');
}

$file = $_FILES['file'];

// Mime/type whitelist
$allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($file['tmp_name']);
if (!in_array($mime, $allowedMime, true)) {
    respond(false, 'Formato no permitido');
}

// Prepare destination
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($ext === 'jpeg') $ext = 'jpg';
$basename = uniqid($type . '_');
$filename = $basename . '.' . $ext;

$baseDir = realpath(__DIR__ . '/..');
$targetDir = $baseDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . $type;
if (!is_dir($targetDir)) {
    @mkdir($targetDir, 0775, true);
}

$targetPath = $targetDir . DIRECTORY_SEPARATOR . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    respond(false, 'No se pudo guardar el archivo');
}

// Build public relative URL (frontend will use it as src)
$publicPath = 'uploads/images/' . $type . '/' . $filename;

respond(true, 'Subida correcta', [
    'path' => $publicPath,
    'mime' => $mime,
    'size' => filesize($targetPath)
]);
?>


