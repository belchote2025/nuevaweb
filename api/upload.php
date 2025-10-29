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
if (!isset($_SESSION['socio_logged_in']) || $_SESSION['socio_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

// Verificar que el usuario tiene permisos (por ahora permitir a todos los usuarios logueados)
// TODO: Implementar verificación de roles más específica si es necesario

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
$allowedTypes = ['carousel', 'gallery', 'products', 'backgrounds', 'news', 'events', 'directiva'];
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

// Generar miniatura si es una imagen de galería
$thumbPath = null;
if ($type === 'gallery') {
    $thumbPath = generateThumbnail($targetPath, $targetDir, $filename);
}

respond(true, 'Subida correcta', [
    'path' => $publicPath,
    'thumb_path' => $thumbPath,
    'mime' => $mime,
    'size' => filesize($targetPath)
]);

function generateThumbnail($sourcePath, $targetDir, $filename) {
    // Crear directorio de miniaturas si no existe
    $thumbDir = $targetDir . DIRECTORY_SEPARATOR . 'thumbs';
    if (!is_dir($thumbDir)) {
        @mkdir($thumbDir, 0775, true);
    }
    
    // Obtener información de la imagen
    $imageInfo = getimagesize($sourcePath);
    if (!$imageInfo) {
        return null;
    }
    
    $width = $imageInfo[0];
    $height = $imageInfo[1];
    $mime = $imageInfo['mime'];
    
    // Calcular dimensiones de la miniatura (máximo 300px de ancho)
    $thumbWidth = 300;
    $thumbHeight = intval(($height * $thumbWidth) / $width);
    
    // Crear imagen desde el archivo original
    $sourceImage = null;
    switch ($mime) {
        case 'image/jpeg':
            $sourceImage = imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $sourceImage = imagecreatefrompng($sourcePath);
            break;
        case 'image/webp':
            $sourceImage = imagecreatefromwebp($sourcePath);
            break;
        default:
            return null;
    }
    
    if (!$sourceImage) {
        return null;
    }
    
    // Crear imagen de miniatura
    $thumbImage = imagecreatetruecolor($thumbWidth, $thumbHeight);
    
    // Preservar transparencia para PNG
    if ($mime === 'image/png') {
        imagealphablending($thumbImage, false);
        imagesavealpha($thumbImage, true);
        $transparent = imagecolorallocatealpha($thumbImage, 255, 255, 255, 127);
        imagefilledrectangle($thumbImage, 0, 0, $thumbWidth, $thumbHeight, $transparent);
    }
    
    // Redimensionar
    imagecopyresampled($thumbImage, $sourceImage, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $width, $height);
    
    // Guardar miniatura
    $thumbFilename = 'thumb_' . $filename;
    $thumbPath = $thumbDir . DIRECTORY_SEPARATOR . $thumbFilename;
    
    $success = false;
    switch ($mime) {
        case 'image/jpeg':
            $success = imagejpeg($thumbImage, $thumbPath, 85);
            break;
        case 'image/png':
            $success = imagepng($thumbImage, $thumbPath, 8);
            break;
        case 'image/webp':
            $success = imagewebp($thumbImage, $thumbPath, 85);
            break;
    }
    
    // Limpiar memoria
    imagedestroy($sourceImage);
    imagedestroy($thumbImage);
    
    if ($success) {
        return 'uploads/images/gallery/thumbs/' . $thumbFilename;
    }
    
    return null;
}
?>


