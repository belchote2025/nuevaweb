<?php
session_start();

// Verificar autenticación
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

header('Content-Type: application/json');

function getFileCount($file) {
    if (!file_exists($file)) return 0;
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? count($data) : 0;
}

function getFileSize($file) {
    if (!file_exists($file)) return 0;
    return filesize($file);
}

function getLastModified($file) {
    if (!file_exists($file)) return null;
    return date('Y-m-d H:i:s', filemtime($file));
}

try {
    $stats = [
        'noticias' => getFileCount('../data/noticias.json'),
        'eventos' => getFileCount('../data/eventos.json'),
        'galeria' => getFileCount('../data/galeria.json'),
        'productos' => getFileCount('../data/productos.json'),
        'directiva' => getFileCount('../data/directiva.json'),
        'contactos' => getFileCount('../data/contactos.json'),
        'socios' => getFileCount('../data/socios.json'),
        'usuarios' => getFileCount('../data/users.json'),
        'carousel' => getFileCount('../data/carousel.json'),
        'textos' => getFileCount('../data/textos.json')
    ];

    // Calcular totales
    $stats['total_content'] = $stats['noticias'] + $stats['eventos'] + $stats['galeria'] + $stats['productos'];
    $stats['total_users'] = $stats['usuarios'] + $stats['socios'];
    $stats['total_contacts'] = $stats['contactos'];

    // Información del sistema
    $stats['system'] = [
        'php_version' => PHP_VERSION,
        'server_time' => date('Y-m-d H:i:s'),
        'data_size' => 0
    ];

    // Calcular tamaño total de datos
    $dataFiles = [
        '../data/noticias.json',
        '../data/eventos.json',
        '../data/galeria.json',
        '../data/productos.json',
        '../data/directiva.json',
        '../data/contactos.json',
        '../data/socios.json',
        '../data/users.json',
        '../data/carousel.json',
        '../data/textos.json'
    ];

    foreach ($dataFiles as $file) {
        $stats['system']['data_size'] += getFileSize($file);
    }

    // Actividad reciente (últimas modificaciones)
    $recentActivity = [];
    foreach ($dataFiles as $file) {
        if (file_exists($file)) {
            $recentActivity[] = [
                'file' => basename($file, '.json'),
                'last_modified' => getLastModified($file),
                'size' => getFileSize($file)
            ];
        }
    }

    // Ordenar por fecha de modificación
    usort($recentActivity, function($a, $b) {
        return strtotime($b['last_modified']) - strtotime($a['last_modified']);
    });

    $stats['recent_activity'] = array_slice($recentActivity, 0, 5);

    echo json_encode([
        'success' => true,
        'data' => $stats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
    ]);
}
?>
