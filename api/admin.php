<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Verificar autenticación
if (!isset($_SESSION['socio_logged_in']) || $_SESSION['socio_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado. Por favor inicie sesión.']);
    exit();
}

// Verificar si el usuario tiene permisos de administración
$user_role = $_SESSION['admin_role'] ?? 'socio';

// Si no hay rol en sesión, intentar obtenerlo de los archivos
if ($user_role === 'socio' || empty($user_role)) {
    // Buscar en socios.json
    $socios_file = __DIR__ . '/../data/socios.json';
    if (file_exists($socios_file)) {
        $socios = json_decode(file_get_contents($socios_file), true);
        foreach ($socios as $s) {
            if (isset($s['email']) && $s['email'] === $_SESSION['socio_email']) {
                $user_role = $s['rol'] ?? 'socio';
                $_SESSION['admin_role'] = $user_role;
                break;
            }
        }
    }
    
    // Si aún no se encuentra, buscar en users.json
    if ($user_role === 'socio' || empty($user_role)) {
        $users_file = __DIR__ . '/../data/users.json';
        if (file_exists($users_file)) {
            $users = json_decode(file_get_contents($users_file), true);
            foreach ($users as $u) {
                if (isset($u['email']) && $u['email'] === $_SESSION['socio_email']) {
                    $user_role = $u['role'] ?? 'socio';
                    $_SESSION['admin_role'] = $user_role;
                    break;
                }
            }
        }
    }
}

$allowed_roles = ['admin', 'editor', 'moderator'];

if (!in_array($user_role, $allowed_roles)) {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'message' => 'Acceso denegado. Se requieren privilegios de administración.'
    ]);
    exit();
}

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

function getDataFile($type) {
    $files = [
        'noticias' => __DIR__ . '/../data/noticias.json',
        'eventos' => __DIR__ . '/../data/eventos.json',
        'galeria' => __DIR__ . '/../data/galeria.json',
        'productos' => __DIR__ . '/../data/productos.json',
        'directiva' => __DIR__ . '/../data/directiva.json',
        'contactos' => __DIR__ . '/../data/contactos.json',
        'carousel' => __DIR__ . '/../data/carousel.json',
        'socios' => __DIR__ . '/../data/socios.json',
        'textos' => __DIR__ . '/../data/textos.json',
        'imagenes-sitio' => __DIR__ . '/../data/imagenes-sitio.json',
        'temas' => __DIR__ . '/../data/temas.json',
        'alertas' => __DIR__ . '/../data/alertas.json'
    ];
    
    return $files[$type] ?? null;
}

function loadData($type) {
    $file = getDataFile($type);
    if (!$file || !file_exists($file)) {
        return [];
    }
    
    $content = file_get_contents($file);
    $data = json_decode($content, true) ?: [];
    
    // Para el carrusel, devolver solo los slides
    if ($type === 'carousel' && isset($data['slides'])) {
        return $data['slides'];
    }
    
    return $data;
}

function saveData($type, $data, $input = null) {
    $file = getDataFile($type);
    if (!$file) {
        return false;
    }
    
    // Para el carrusel, mantener la estructura original con config y slides
    if ($type === 'carousel') {
        $originalContent = file_get_contents($file);
        $originalData = json_decode($originalContent, true) ?: [];
        
        // Mantener la configuración original
        $carouselData = [
            'config' => $originalData['config'] ?? [
                'auto_slide' => true,
                'interval' => 5000,
                'pause_on_hover' => true,
                'show_indicators' => true,
                'show_controls' => true,
                'animation' => 'slide'
            ],
            'slides' => $data
        ];
        
        return file_put_contents($file, json_encode($carouselData, JSON_PRETTY_PRINT)) !== false;
    }
    
    // Para textos, manejar actualización por sección
    if ($type === 'textos' && $input) {
        $originalContent = file_get_contents($file);
        $originalData = json_decode($originalContent, true) ?: [];
        
        // Si se especifica una sección, actualizar solo esa sección
        if (isset($input['section']) && isset($input['data'])) {
            $originalData[$input['section']] = $input['data'];
            return file_put_contents($file, json_encode($originalData, JSON_PRETTY_PRINT)) !== false;
        }
    }
    
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

// Obtener datos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = $_GET['type'] ?? '';
    
    if (empty($type)) {
        response(false, 'Tipo de datos requerido');
    }
    
    // Verificar acceso a secciones restringidas
    if ($type === 'socios') {
        $current_role = $_SESSION['admin_role'] ?? 'admin';
        if ($current_role !== 'admin' && $current_role !== 'socio') {
            response(false, 'No tienes permisos para acceder a esta sección');
        }
    }
    
    $data = loadData($type);
    
    // Para la sección de socios, mostrar información adicional de contraseñas para administradores
    if ($type === 'socios' && $current_role === 'admin') {
        // Agregar información de contraseñas para administradores
        foreach ($data as &$socio) {
            if (isset($socio['password'])) {
                $socio['has_password'] = true;
                $socio['password_status'] = 'Asignada';
            } else {
                $socio['has_password'] = false;
                $socio['password_status'] = 'Sin contraseña';
            }
        }
    }
    
    response(true, 'Datos obtenidos', $data);
}

// Crear/Actualizar datos
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['type'])) {
        response(false, 'Datos no válidos');
    }
    
    $type = $input['type'];
    $item = $input['data'] ?? [];
    
    if (empty($item)) {
        response(false, 'Datos del elemento requeridos');
    }
    
    // Verificar permisos para operaciones en socios
    if ($type === 'socios') {
        $current_role = $_SESSION['admin_role'] ?? 'admin';
        if ($current_role !== 'admin') {
            response(false, 'Solo los administradores pueden gestionar socios');
        }
    }
    
    $data = loadData($type);
    
    // Generar ID si no existe
    if (!isset($item['id'])) {
        $item['id'] = uniqid();
    }
    
    // Añadir timestamp
    $item['updated_at'] = date('Y-m-d H:i:s');
    
    // Generar miniatura si se actualiza una imagen de galería (deshabilitado temporalmente)
    // if ($type === 'galeria' && isset($item['imagen_url']) && !isset($item['thumb_url'])) {
    //     $thumbPath = generateThumbnailFromUrl($item['imagen_url']);
    //     if ($thumbPath) {
    //         $item['thumb_url'] = $thumbPath;
    //     }
    // }
    
    // Debug: Log de entrada
    error_log("API Admin - Input recibido: " . json_encode($input));
    error_log("API Admin - Edit ID presente: " . (isset($input['edit_id']) ? 'SÍ' : 'NO'));
    if (isset($input['edit_id'])) {
        error_log("API Admin - Edit ID valor: " . $input['edit_id']);
    }
    
    // Si es nuevo elemento
    if (!isset($input['edit_id'])) {
        error_log("API Admin - Creando nuevo elemento");
        $data[] = $item;
    } else {
        // Actualizar elemento existente
        $edit_id = $input['edit_id'];
        $found = false;
        
        error_log("API Admin - Buscando elemento con ID: " . $edit_id);
        error_log("API Admin - Elementos disponibles: " . json_encode(array_column($data, 'id')));
        
        foreach ($data as $key => $existing_item) {
            if ($existing_item['id'] == $edit_id) {
                error_log("API Admin - Elemento encontrado en posición: " . $key);
                $data[$key] = $item;
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            error_log("API Admin - Elemento no encontrado con ID: " . $edit_id);
            response(false, 'Elemento no encontrado');
        } else {
            error_log("API Admin - Elemento actualizado correctamente");
        }
    }
    
    if (saveData($type, $data, $input)) {
        response(true, 'Datos guardados correctamente', $item);
    } else {
        response(false, 'Error al guardar los datos');
    }
}

// Actualizar datos (PUT)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['type']) || !isset($input['id'])) {
        response(false, 'Tipo e ID requeridos');
    }
    
    $type = $input['type'];
    $id = $input['id'];
    
    $data = loadData($type);
    $found = false;
    
    foreach ($data as $key => $item) {
        if ($item['id'] == $id) {
            // Actualizar campos específicos según el tipo
            if ($type === 'contactos') {
                // Actualizar estado si se proporciona
                if (isset($input['estado'])) {
                    $data[$key]['estado'] = $input['estado'];
                }
                // Actualizar prioridad si se proporciona
                if (isset($input['prioridad'])) {
                    $data[$key]['prioridad'] = $input['prioridad'];
                }
            } else {
                // Para otros tipos, actualizar todos los campos proporcionados
                foreach ($input as $field => $value) {
                    if ($field !== 'type' && $field !== 'id') {
                        $data[$key][$field] = $value;
                    }
                }
            }
            
            // Actualizar timestamp
            if (isset($data[$key])) {
                $data[$key]['updated_at'] = date('Y-m-d H:i:s');
            }
            
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        response(false, 'Elemento no encontrado');
    }
    
    if (saveData($type, $data)) {
        response(true, 'Actualizado correctamente', $data[$key] ?? null);
    } else {
        response(false, 'Error al guardar');
    }
}

// Eliminar datos
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['type']) || !isset($input['id'])) {
        response(false, 'Tipo e ID requeridos');
    }
    
    $type = $input['type'];
    $id = $input['id'];
    
    // Verificar permisos para eliminar socios
    if ($type === 'socios') {
        $current_role = $_SESSION['admin_role'] ?? 'admin';
        if ($current_role !== 'admin') {
            response(false, 'Solo los administradores pueden eliminar socios');
        }
    }
    
    $data = loadData($type);
    $found = false;
    
    foreach ($data as $key => $item) {
        if ($item['id'] == $id) {
            unset($data[$key]);
            $data = array_values($data); // Reindexar array
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        response(false, 'Elemento no encontrado');
    }
    
    if (saveData($type, $data, $input)) {
        response(true, 'Elemento eliminado correctamente');
    } else {
        response(false, 'Error al eliminar el elemento');
    }
}

response(false, 'Método no permitido');

/*
function generateThumbnailFromUrl($imageUrl) {
    // Si es una URL externa, no generar miniatura
    if (strpos($imageUrl, 'http') === 0) {
        return null;
    }
    
    // Construir ruta completa del archivo
    $baseDir = realpath(__DIR__ . '/..');
    $fullPath = $baseDir . DIRECTORY_SEPARATOR . $imageUrl;
    
    if (!file_exists($fullPath)) {
        return null;
    }
    
    // Obtener información de la imagen
    $imageInfo = getimagesize($fullPath);
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
            $sourceImage = imagecreatefromjpeg($fullPath);
            break;
        case 'image/png':
            $sourceImage = imagecreatefrompng($fullPath);
            break;
        case 'image/webp':
            $sourceImage = imagecreatefromwebp($fullPath);
            break;
        default:
            return null;
    }
    
    if (!$sourceImage) {
        return null;
    }
    
    // Crear directorio de miniaturas
    $thumbDir = dirname($fullPath) . DIRECTORY_SEPARATOR . 'thumbs';
    if (!is_dir($thumbDir)) {
        @mkdir($thumbDir, 0775, true);
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
    $filename = basename($imageUrl);
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
        // Retornar ruta relativa para la miniatura
        $relativePath = dirname($imageUrl) . '/thumbs/' . $thumbFilename;
        return $relativePath;
    }
    
    return null;
}
*/
?>

