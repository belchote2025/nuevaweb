<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

function respond($ok, $message = '', $data = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $ok,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// Requerir autenticación de socio
if (!isset($_SESSION['socio_logged_in']) || $_SESSION['socio_logged_in'] !== true) {
    respond(false, 'No autorizado', null, 401);
}

$USER_ID = $_SESSION['socio_id'] ?? null;
$USER_NAME = $_SESSION['socio_nombre'] ?? ($_SESSION['socio_email'] ?? 'Usuario');

$roomsFile = __DIR__ . '/../data/chat_rooms.json';
$messagesFile = __DIR__ . '/../data/chat_messages.json';
$privateFile = __DIR__ . '/../data/chat_private.json';
$sociosFile = __DIR__ . '/../data/socios.json';

function loadJson($file) {
    if (!file_exists($file)) return [];
    $raw = file_get_contents($file);
    $data = json_decode($raw, true);
    return $data ?: [];
}

function saveJson($file, $data) {
    $dir = dirname($file);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function loadSocios($file) {
    if (!file_exists($file)) return [];
    $raw = file_get_contents($file);
    $data = json_decode($raw, true);
    return $data ?: [];
}

// Determinar rol del usuario
$USER_ROLE = 'socio';
try {
    $socios = loadSocios($sociosFile);
    $email = $_SESSION['socio_email'] ?? null;
    if ($email) {
        foreach ($socios as $s) {
            if (($s['email'] ?? null) === $email) {
                $USER_ROLE = $s['rol'] ?? 'socio';
                break;
            }
        }
    }
} catch (Exception $e) {}

$action = $_GET['action'] ?? $_POST['action'] ?? 'getRooms';

switch ($action) {
    case 'getRooms': {
        $rooms = loadJson($roomsFile);
        // Restringir sala directiva a roles autorizados
        $rooms = array_values(array_filter($rooms, function($r) use ($USER_ROLE) {
            if (($r['id'] ?? '') === 'directiva') {
                return in_array($USER_ROLE, ['directiva','admin'], true);
            }
            return true;
        }));
        respond(true, 'OK', $rooms);
    }
    case 'getMessages': {
        $roomId = $_GET['room_id'] ?? '';
        if (!$roomId) respond(false, 'room_id requerido', null, 400);
        if ($roomId === 'directiva' && !in_array($USER_ROLE, ['directiva','admin'], true)) {
            respond(false, 'Acceso denegado', null, 403);
        }
        $since = isset($_GET['since']) ? (int)$_GET['since'] : 0;
        $msgs = array_values(array_filter(loadJson($messagesFile), function($m) use ($roomId, $since) {
            return ($m['room_id'] ?? '') === $roomId && (int)($m['ts'] ?? 0) > $since;
        }));
        respond(true, 'OK', $msgs);
    }
    case 'postMessage': {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $roomId = trim($input['room_id'] ?? '');
        $text = trim($input['text'] ?? '');
        if ($roomId === '' || $text === '') respond(false, 'room_id y text requeridos', null, 400);
        if ($roomId === 'directiva' && !in_array($USER_ROLE, ['directiva','admin'], true)) {
            respond(false, 'Acceso denegado', null, 403);
        }
        $all = loadJson($messagesFile);
        $msg = [
            'id' => uniqid('msg_'),
            'room_id' => $roomId,
            'user_id' => $USER_ID,
            'user_name' => $USER_NAME,
            'text' => $text,
            'ts' => time()
        ];
        $all[] = $msg;
        saveJson($messagesFile, $all);
        respond(true, 'Enviado', $msg);
    }
    case 'getPrivate': {
        $withId = $_GET['with_id'] ?? '';
        if (!$withId) respond(false, 'with_id requerido', null, 400);
        $since = isset($_GET['since']) ? (int)$_GET['since'] : 0;
        $items = array_values(array_filter(loadJson($privateFile), function($m) use ($withId, $since, $USER_ID) {
            $between = (($m['from_id'] ?? null) == $USER_ID && ($m['to_id'] ?? null) == $withId)
                   || (($m['from_id'] ?? null) == $withId && ($m['to_id'] ?? null) == $USER_ID);
            return $between && (int)($m['ts'] ?? 0) > $since;
        }));
        // Marcar como leídos los que llegan al usuario actual
        $all = loadJson($privateFile);
        $changed = false;
        foreach ($all as &$m) {
            if (($m['to_id'] ?? null) == $USER_ID && ($m['from_id'] ?? null) == $withId && empty($m['read'])) {
                $m['read'] = true;
                $changed = true;
            }
        }
        if ($changed) saveJson($privateFile, $all);
        respond(true, 'OK', $items);
    }
    case 'postPrivate': {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $toId = $input['to_id'] ?? '';
        $text = trim($input['text'] ?? '');
        if ($toId === '' || $text === '') respond(false, 'to_id y text requeridos', null, 400);
        $all = loadJson($privateFile);
        $msg = [
            'id' => uniqid('pm_'),
            'from_id' => $USER_ID,
            'from_name' => $USER_NAME,
            'to_id' => $toId,
            'text' => $text,
            'ts' => time(),
            'read' => false
        ];
        $all[] = $msg;
        saveJson($privateFile, $all);
        respond(true, 'Enviado', $msg);
    }
    case 'getNotifications': {
        // Conteo simple: privados no leídos por usuario actual + últimos mensajes de salas (no persistimos lastRead, opcional)
        $priv = loadJson($privateFile);
        $unreadPriv = 0;
        foreach ($priv as $m) {
            if (($m['to_id'] ?? null) == $USER_ID && empty($m['read'])) $unreadPriv++;
        }
        respond(true, 'OK', [ 'private_unread' => $unreadPriv ]);
    }
    case 'getUsers': {
        $socios = loadSocios($sociosFile);
        $list = [];
        foreach ($socios as $s) {
            if (!isset($s['id'])) continue;
            $list[] = [
                'id' => $s['id'],
                'nombre' => $s['nombre'] ?? $s['email'] ?? ('Socio ' . $s['id']),
                'rol' => $s['rol'] ?? 'socio'
            ];
        }
        respond(true, 'OK', $list);
    }
    default:
        respond(false, 'Acción no soportada', null, 400);
}
?>


