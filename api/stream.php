<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar autenticación
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir configuración de la base de datos
require_once '../config/database.php';

class StreamController {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getLinks($contentId = null) {
        try {
            $query = "SELECT cl.*, c.title as content_title, 
                     COUNT(DISTINCT lv.id) as view_count,
                     MAX(lv.created_at) as last_viewed
                     FROM content_links cl
                     LEFT JOIN contents c ON cl.content_id = c.id
                     LEFT JOIN link_views lv ON cl.id = lv.link_id";
            
            $params = [];
            if ($contentId) {
                $query .= " WHERE cl.content_id = ?";
                $params[] = $contentId;
            }
            
            $query .= " GROUP BY cl.id
                      ORDER BY 
                          FIELD(cl.quality, '4K', '1080p', '720p', '480p', '360p'),
                          FIELD(cl.provider, 'gdrive', 'mega', 'uptobox', 'mediafire', 'direct')";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $links = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'data' => $links];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error al obtener enlaces: ' . $e->getMessage()];
        }
    }
    
    public function getStreamUrl($linkId) {
        try {
            // Obtener información del enlace
            $link = $this->getLinkById($linkId);
            
            if (!$link) {
                return ['success' => false, 'message' => 'Enlace no encontrado'];
            }
            
            if (!$link['is_active']) {
                return ['success' => false, 'message' => 'Este enlace no está disponible actualmente'];
            }
            
            // Procesar URL según el proveedor
            $streamUrl = $this->processProviderUrl($link['url'], $link['provider']);
            
            // Registrar la visualización
            $this->recordView($linkId);
            
            return [
                'success' => true, 
                'url' => $streamUrl,
                'provider' => $link['provider'],
                'quality' => $link['quality']
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al procesar el enlace: ' . $e->getMessage()];
        }
    }
    
    private function getLinkById($linkId) {
        $query = "SELECT * FROM content_links WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$linkId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function processProviderUrl($url, $provider) {
        switch ($provider) {
            case 'gdrive':
                return $this->processGDriveUrl($url);
            case 'mega':
                return $this->processMegaUrl($url);
            case 'uptobox':
                return $this->processUptoboxUrl($url);
            case 'mediafire':
                return $this->processMediafireUrl($url);
            default:
                return $url; // Enlace directo
        }
    }
    
    private function processGDriveUrl($url) {
        // Extraer ID del archivo de Google Drive
        preg_match('/[\/?]d\/([^\/\?]+)/', $url, $matches);
        $fileId = $matches[1] ?? null;
        
        if (!$fileId) {
            throw new Exception('ID de archivo de Google Drive no válido');
        }
        
        // URL para descarga directa de Google Drive
        return "https://drive.google.com/uc?export=download&id={$fileId}";
    }
    
    private function processMegaUrl($url) {
        // Para MEGA, usamos un proxy o si tienes API key
        // Esta es una implementación básica que devuelve la URL original
        // En producción, deberías usar la API de MEGA
        return $url;
    }
    
    private function processUptoboxUrl($url) {
        // Para Uptobox, necesitarías una API key
        // Esta es una implementación básica
        return $url;
    }
    
    private function processMediafireUrl($url) {
        // Para MediaFire, podrías necesitar hacer web scraping o usar una API
        // Esta es una implementación básica
        return $url;
    }
    
    private function recordView($linkId) {
        try {
            $query = "INSERT INTO link_views 
                     (link_id, user_id, ip_address, user_agent, referrer) 
                     VALUES (?, ?, ?, ?, ?)";
            
            $stmt = $this->db->prepare($query);
            return $stmt->execute([
                $linkId,
                $_SESSION['user_id'] ?? null,
                $_SERVER['REMOTE_ADDR'],
                $_SERVER['HTTP_USER_AGENT'] ?? '',
                $_SERVER['HTTP_REFERER'] ?? ''
            ]);
        } catch (Exception $e) {
            // No detenemos el flujo si falla el registro de la visualización
            error_log('Error al registrar visualización: ' . $e->getMessage());
            return false;
        }
    }
    
    public function addLink($data) {
        try {
            // Validar datos
            $required = ['content_id', 'url', 'provider', 'quality'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return ['success' => false, 'message' => "El campo $field es obligatorio"];
                }
            }
            
            $query = "INSERT INTO content_links 
                     (content_id, provider, url, quality, is_active, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, 1, NOW(), NOW())";
            
            $stmt = $this->db->prepare($query);
            $success = $stmt->execute([
                $data['content_id'],
                $data['provider'],
                $data['url'],
                $data['quality']
            ]);
            
            if ($success) {
                $linkId = $this->db->lastInsertId();
                return [
                    'success' => true, 
                    'message' => 'Enlace agregado correctamente',
                    'id' => $linkId
                ];
            } else {
                return ['success' => false, 'message' => 'Error al agregar el enlace'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()];
        }
    }
    
    public function updateLink($linkId, $data) {
        try {
            // Validar que el enlace existe
            $link = $this->getLinkById($linkId);
            if (!$link) {
                return ['success' => false, 'message' => 'Enlace no encontrado'];
            }
            
            $updates = [];
            $params = [];
            
            // Construir la consulta dinámicamente
            if (isset($data['url'])) {
                $updates[] = 'url = ?';
                $params[] = $data['url'];
            }
            
            if (isset($data['provider'])) {
                $updates[] = 'provider = ?';
                $params[] = $data['provider'];
            }
            
            if (isset($data['quality'])) {
                $updates[] = 'quality = ?';
                $params[] = $data['quality'];
            }
            
            if (isset($data['is_active'])) {
                $updates[] = 'is_active = ?';
                $params[] = $data['is_active'] ? 1 : 0;
            }
            
            if (empty($updates)) {
                return ['success' => false, 'message' => 'No se proporcionaron datos para actualizar'];
            }
            
            $updates[] = 'updated_at = NOW()';
            $params[] = $linkId; // Para el WHERE id = ?
            
            $query = "UPDATE content_links SET " . implode(', ', $updates) . " WHERE id = ?";
            
            $stmt = $this->db->prepare($query);
            $success = $stmt->execute($params);
            
            if ($success) {
                return ['success' => true, 'message' => 'Enlace actualizado correctamente'];
            } else {
                return ['success' => false, 'message' => 'Error al actualizar el enlace'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()];
        }
    }
    
    public function deleteLink($linkId) {
        try {
            // Primero verificamos si el enlace existe
            $link = $this->getLinkById($linkId);
            if (!$link) {
                return ['success' => false, 'message' => 'Enlace no encontrado'];
            }
            
            // Eliminar registros relacionados primero (si es necesario)
            // Por ejemplo, si tienes restricciones de clave foránea con ON DELETE CASCADE, esto no sería necesario
            
            $query = "DELETE FROM content_links WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $success = $stmt->execute([$linkId]);
            
            if ($success) {
                return ['success' => true, 'message' => 'Enlace eliminado correctamente'];
            } else {
                return ['success' => false, 'message' => 'Error al eliminar el enlace'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()];
        }
    }
    
    public function reportLink($linkId, $userId, $reason, $message = '') {
        try {
            // Verificar que el enlace existe
            $link = $this->getLinkById($linkId);
            if (!$link) {
                return ['success' => false, 'message' => 'Enlace no encontrado'];
            }
            
            $query = "INSERT INTO link_reports 
                     (link_id, user_id, reason, message, status, created_at) 
                     VALUES (?, ?, ?, ?, 'pending', NOW())";
            
            $stmt = $this->db->prepare($query);
            $success = $stmt->execute([
                $linkId,
                $userId,
                $reason,
                $message
            ]);
            
            if ($success) {
                return ['success' => true, 'message' => 'Reporte enviado correctamente'];
            } else {
                return ['success' => false, 'message' => 'Error al enviar el reporte'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()];
        }
    }
}

// Crear instancia del controlador
$db = new PDO(
    "mysql:host=localhost;dbname=tu_base_de_datos;charset=utf8mb4",
    'usuario',
    'contraseña',
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
);

$controller = new StreamController($db);

// Manejar la solicitud
$method = $_SERVER['REQUEST_METHOD'];
$request = $_REQUEST;

// Obtener el ID de la URL si existe
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$endpoint = end($pathParts);

// Obtener el ID de los parámetros de la URL
$linkId = $_GET['id'] ?? null;
$contentId = $_GET['content_id'] ?? null;

// Enrutamiento de la API
try {
    switch ($method) {
        case 'GET':
            if ($endpoint === 'stream' && $linkId) {
                // Obtener URL de reproducción
                $result = $controller->getStreamUrl($linkId);
            } elseif ($endpoint === 'links' && $contentId) {
                // Obtener enlaces de un contenido específico
                $result = $controller->getLinks($contentId);
            } elseif ($endpoint === 'links' && $linkId) {
                // Obtener un enlace específico
                $result = $controller->getLinkById($linkId);
                $result = $result 
                    ? ['success' => true, 'data' => $result]
                    : ['success' => false, 'message' => 'Enlace no encontrado'];
            } else {
                // Listar todos los enlaces (con paginación en producción)
                $result = $controller->getLinks();
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            
            if ($endpoint === 'links') {
                // Crear un nuevo enlace
                $result = $controller->addLink($data);
            } elseif ($endpoint === 'report' && $linkId) {
                // Reportar un enlace
                $result = $controller->reportLink(
                    $linkId,
                    $_SESSION['user_id'] ?? null,
                    $data['reason'] ?? 'other',
                    $data['message'] ?? ''
                );
            } else {
                $result = ['success' => false, 'message' => 'Acción no válida'];
            }
            break;
            
        case 'PUT':
        case 'PATCH':
            if ($endpoint === 'links' && $linkId) {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->updateLink($linkId, $data);
            } else {
                $result = ['success' => false, 'message' => 'Acción no válida'];
            }
            break;
            
        case 'DELETE':
            if ($endpoint === 'links' && $linkId) {
                $result = $controller->deleteLink($linkId);
            } else {
                $result = ['success' => false, 'message' => 'Acción no válida'];
            }
            break;
            
        default:
            $result = ['success' => false, 'message' => 'Método no soportado'];
            break;
    }
    
    // Enviar respuesta
    http_response_code(200);
    echo json_encode($result);
    
} catch (Exception $e) {
    // Manejo de errores
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}
