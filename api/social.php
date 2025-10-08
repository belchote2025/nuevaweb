<?php
session_start();
header('Content-Type: application/json');

// Verificar autenticación y rol de administrador
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true || $_SESSION['admin_role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso denegado.']);
    exit();
}

// Función para cargar configuración de redes sociales
function loadSocialConfig() {
    $configFile = '../config/social_config.json';
    if (file_exists($configFile)) {
        $content = file_get_contents($configFile);
        return json_decode($content, true) ?: [];
    }
    return [];
}

// Función para guardar configuración de redes sociales
function saveSocialConfig($config) {
    $configFile = '../config/social_config.json';
    $configDir = dirname($configFile);
    
    if (!file_exists($configDir)) {
        mkdir($configDir, 0755, true);
    }
    
    return file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT)) !== false;
}

// Función para generar URLs de compartir
function generateShareUrls($data) {
    $baseUrl = 'https://filamariscales.com'; // Cambiar por tu dominio real
    $title = urlencode($data['title'] ?? '');
    $description = urlencode($data['description'] ?? '');
    $url = urlencode($data['url'] ?? $baseUrl);
    $image = urlencode($data['image'] ?? '');
    
    return [
        'facebook' => "https://www.facebook.com/sharer/sharer.php?u=$url",
        'twitter' => "https://twitter.com/intent/tweet?text=$title&url=$url",
        'whatsapp' => "https://wa.me/?text=$title%20$url",
        'telegram' => "https://t.me/share/url?url=$url&text=$title",
        'linkedin' => "https://www.linkedin.com/sharing/share-offsite/?url=$url",
        'pinterest' => "https://pinterest.com/pin/create/button/?url=$url&media=$image&description=$description"
    ];
}

// Función para obtener estadísticas de redes sociales
function getSocialStats() {
    $statsFile = '../data/social_stats.json';
    if (file_exists($statsFile)) {
        $content = file_get_contents($statsFile);
        return json_decode($content, true) ?: [];
    }
    
    // Datos por defecto
    return [
        'facebook' => ['followers' => 0, 'posts' => 0, 'engagement' => 0],
        'twitter' => ['followers' => 0, 'posts' => 0, 'engagement' => 0],
        'instagram' => ['followers' => 0, 'posts' => 0, 'engagement' => 0],
        'youtube' => ['subscribers' => 0, 'videos' => 0, 'views' => 0]
    ];
}

// Función para actualizar estadísticas
function updateSocialStats($platform, $stats) {
    $statsFile = '../data/social_stats.json';
    $currentStats = getSocialStats();
    
    $currentStats[$platform] = array_merge($currentStats[$platform] ?? [], $stats);
    
    return file_put_contents($statsFile, json_encode($currentStats, JSON_PRETTY_PRINT)) !== false;
}

// Función para crear post en redes sociales
function createSocialPost($platform, $content, $media = null) {
    $postsFile = '../data/social_posts.json';
    $posts = [];
    
    if (file_exists($postsFile)) {
        $content = file_get_contents($postsFile);
        $posts = json_decode($content, true) ?: [];
    }
    
    $newPost = [
        'id' => uniqid(),
        'platform' => $platform,
        'content' => $content,
        'media' => $media,
        'status' => 'pending',
        'created_at' => date('Y-m-d H:i:s'),
        'scheduled_at' => null,
        'published_at' => null
    ];
    
    $posts[] = $newPost;
    
    if (file_put_contents($postsFile, json_encode($posts, JSON_PRETTY_PRINT))) {
        return $newPost;
    }
    
    return false;
}

// Función para obtener posts de redes sociales
function getSocialPosts($limit = 10) {
    $postsFile = '../data/social_posts.json';
    if (file_exists($postsFile)) {
        $content = file_get_contents($postsFile);
        $posts = json_decode($content, true) ?: [];
        
        // Ordenar por fecha de creación (más recientes primero)
        usort($posts, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        return array_slice($posts, 0, $limit);
    }
    
    return [];
}

// Función para programar post
function scheduleSocialPost($postId, $scheduledAt) {
    $postsFile = '../data/social_posts.json';
    if (!file_exists($postsFile)) {
        return false;
    }
    
    $content = file_get_contents($postsFile);
    $posts = json_decode($content, true) ?: [];
    
    foreach ($posts as &$post) {
        if ($post['id'] === $postId) {
            $post['scheduled_at'] = $scheduledAt;
            $post['status'] = 'scheduled';
            break;
        }
    }
    
    return file_put_contents($postsFile, json_encode($posts, JSON_PRETTY_PRINT)) !== false;
}

// Función para publicar post inmediatamente
function publishSocialPost($postId) {
    $postsFile = '../data/social_posts.json';
    if (!file_exists($postsFile)) {
        return false;
    }
    
    $content = file_get_contents($postsFile);
    $posts = json_decode($content, true) ?: [];
    
    foreach ($posts as &$post) {
        if ($post['id'] === $postId) {
            $post['status'] = 'published';
            $post['published_at'] = date('Y-m-d H:i:s');
            break;
        }
    }
    
    return file_put_contents($postsFile, json_encode($posts, JSON_PRETTY_PRINT)) !== false;
}

// Manejar peticiones GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'config':
            $config = loadSocialConfig();
            echo json_encode(['success' => true, 'data' => $config]);
            break;
            
        case 'stats':
            $stats = getSocialStats();
            echo json_encode(['success' => true, 'data' => $stats]);
            break;
            
        case 'posts':
            $limit = intval($_GET['limit'] ?? 10);
            $posts = getSocialPosts($limit);
            echo json_encode(['success' => true, 'data' => $posts]);
            break;
            
        case 'share_urls':
            $data = [
                'title' => $_GET['title'] ?? '',
                'description' => $_GET['description'] ?? '',
                'url' => $_GET['url'] ?? '',
                'image' => $_GET['image'] ?? ''
            ];
            $urls = generateShareUrls($data);
            echo json_encode(['success' => true, 'data' => $urls]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'save_config':
            $config = $input['config'] ?? [];
            if (saveSocialConfig($config)) {
                echo json_encode(['success' => true, 'message' => 'Configuración guardada correctamente']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error guardando configuración']);
            }
            break;
            
        case 'update_stats':
            $platform = $input['platform'] ?? '';
            $stats = $input['stats'] ?? [];
            
            if ($platform && updateSocialStats($platform, $stats)) {
                echo json_encode(['success' => true, 'message' => 'Estadísticas actualizadas correctamente']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error actualizando estadísticas']);
            }
            break;
            
        case 'create_post':
            $platform = $input['platform'] ?? '';
            $content = $input['content'] ?? '';
            $media = $input['media'] ?? null;
            
            if ($platform && $content) {
                $post = createSocialPost($platform, $content, $media);
                if ($post) {
                    echo json_encode(['success' => true, 'message' => 'Post creado correctamente', 'data' => $post]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error creando post']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Plataforma y contenido requeridos']);
            }
            break;
            
        case 'schedule_post':
            $postId = $input['post_id'] ?? '';
            $scheduledAt = $input['scheduled_at'] ?? '';
            
            if ($postId && $scheduledAt) {
                if (scheduleSocialPost($postId, $scheduledAt)) {
                    echo json_encode(['success' => true, 'message' => 'Post programado correctamente']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error programando post']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'ID de post y fecha requeridos']);
            }
            break;
            
        case 'publish_post':
            $postId = $input['post_id'] ?? '';
            
            if ($postId) {
                if (publishSocialPost($postId)) {
                    echo json_encode(['success' => true, 'message' => 'Post publicado correctamente']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error publicando post']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'ID de post requerido']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>
