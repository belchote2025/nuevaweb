<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de VAPID (necesario para notificaciones push)
define('VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv69yViEuiBIa40HIe8F7jG0N8yH8=');
define('VAPID_PRIVATE_KEY', 'your-private-key-here');
define('VAPID_SUBJECT', 'mailto:admin@filamariscales.com');

// Archivo para almacenar suscripciones
$subscriptionsFile = __DIR__ . '/../data/notifications.json';
$notificationsFile = __DIR__ . '/../data/notification_history.json';

// Función para cargar suscripciones
function loadSubscriptions() {
    global $subscriptionsFile;
    if (file_exists($subscriptionsFile)) {
        return json_decode(file_get_contents($subscriptionsFile), true) ?: [];
    }
    return [];
}

// Función para guardar suscripciones
function saveSubscriptions($subscriptions) {
    global $subscriptionsFile;
    return file_put_contents($subscriptionsFile, json_encode($subscriptions, JSON_PRETTY_PRINT));
}

// Función para cargar historial de notificaciones
function loadNotifications() {
    global $notificationsFile;
    if (file_exists($notificationsFile)) {
        return json_decode(file_get_contents($notificationsFile), true) ?: [];
    }
    return [];
}

// Función para guardar notificaciones
function saveNotifications($notifications) {
    global $notificationsFile;
    return file_put_contents($notificationsFile, json_encode($notifications, JSON_PRETTY_PRINT));
}

// Función para enviar notificación push
function sendPushNotification($subscription, $payload) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $subscription['endpoint']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/octet-stream',
        'Content-Encoding: aesgcm',
        'TTL: 86400'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $httpCode >= 200 && $httpCode < 300;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? '';
        
        if ($action === 'vapid-key') {
            echo json_encode([
                'success' => true,
                'publicKey' => VAPID_PUBLIC_KEY
            ]);
        } elseif ($action === 'subscriptions') {
            $subscriptions = loadSubscriptions();
            echo json_encode([
                'success' => true,
                'data' => $subscriptions
            ]);
        } elseif ($action === 'history') {
            $notifications = loadNotifications();
            echo json_encode([
                'success' => true,
                'data' => $notifications
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? '';
        
        if ($action === 'subscribe') {
            // Suscribir usuario a notificaciones
            $subscription = $data['subscription'] ?? null;
            $userInfo = $data['userInfo'] ?? [];
            
            if (!$subscription) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Datos de suscripción requeridos']);
                break;
            }
            
            $subscriptions = loadSubscriptions();
            $subscriptionId = uniqid('sub_');
            
            $newSubscription = [
                'id' => $subscriptionId,
                'endpoint' => $subscription['endpoint'],
                'keys' => $subscription['keys'],
                'userInfo' => $userInfo,
                'created_at' => date('Y-m-d H:i:s'),
                'active' => true
            ];
            
            $subscriptions[] = $newSubscription;
            saveSubscriptions($subscriptions);
            
            echo json_encode([
                'success' => true,
                'message' => 'Suscripción registrada exitosamente',
                'subscriptionId' => $subscriptionId
            ]);
            
        } elseif ($action === 'unsubscribe') {
            // Desuscribir usuario
            $subscriptionId = $data['subscriptionId'] ?? null;
            
            if (!$subscriptionId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de suscripción requerido']);
                break;
            }
            
            $subscriptions = loadSubscriptions();
            $subscriptions = array_filter($subscriptions, function($sub) use ($subscriptionId) {
                return $sub['id'] !== $subscriptionId;
            });
            
            saveSubscriptions(array_values($subscriptions));
            
            echo json_encode([
                'success' => true,
                'message' => 'Suscripción cancelada exitosamente'
            ]);
            
        } elseif ($action === 'send') {
            // Enviar notificación
            $title = $data['title'] ?? '';
            $body = $data['body'] ?? '';
            $type = $data['type'] ?? 'general';
            $url = $data['url'] ?? '';
            $targetUsers = $data['targetUsers'] ?? 'all'; // 'all', 'socios', 'admin'
            
            if (empty($title) || empty($body)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Título y mensaje requeridos']);
                break;
            }
            
            $subscriptions = loadSubscriptions();
            $sentCount = 0;
            $errors = [];
            
            foreach ($subscriptions as $subscription) {
                if (!$subscription['active']) continue;
                
                // Filtrar por tipo de usuario si es necesario
                if ($targetUsers !== 'all') {
                    $userRole = $subscription['userInfo']['role'] ?? 'socio';
                    if ($targetUsers === 'socios' && $userRole !== 'socio') continue;
                    if ($targetUsers === 'admin' && $userRole !== 'admin') continue;
                }
                
                $payload = json_encode([
                    'title' => $title,
                    'body' => $body,
                    'icon' => '/assets/images/logo.png',
                    'badge' => '/assets/images/badge.png',
                    'data' => [
                        'type' => $type,
                        'url' => $url,
                        'timestamp' => time()
                    ]
                ]);
                
                if (sendPushNotification($subscription, $payload)) {
                    $sentCount++;
                } else {
                    $errors[] = $subscription['id'];
                }
            }
            
            // Guardar en historial
            $notifications = loadNotifications();
            $notificationId = uniqid('notif_');
            $notifications[] = [
                'id' => $notificationId,
                'title' => $title,
                'body' => $body,
                'type' => $type,
                'url' => $url,
                'targetUsers' => $targetUsers,
                'sentCount' => $sentCount,
                'errors' => $errors,
                'created_at' => date('Y-m-d H:i:s'),
                'created_by' => $data['createdBy'] ?? 'system'
            ];
            saveNotifications($notifications);
            
            echo json_encode([
                'success' => true,
                'message' => "Notificación enviada a {$sentCount} usuarios",
                'sentCount' => $sentCount,
                'errors' => $errors
            ]);
            
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}
?>
