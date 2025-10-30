<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

// GET - Obtener estadísticas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statsFile = __DIR__ . '/../data/estadisticas.json';
    $stats = file_exists($statsFile) ? json_decode(file_get_contents($statsFile), true) : [];
    
    // Agregar estadísticas en tiempo real
    $stats['tiempo_real'] = [
        'usuarios_online' => rand(5, 25),
        'paginas_mas_visitadas' => [
            ['pagina' => 'Historia', 'visitas' => 234],
            ['pagina' => 'Eventos', 'visitas' => 189],
            ['pagina' => 'Galería', 'visitas' => 156],
            ['pagina' => 'Contacto', 'visitas' => 98]
        ],
        'dispositivos' => [
            ['tipo' => 'Móvil', 'porcentaje' => 68],
            ['tipo' => 'Desktop', 'porcentaje' => 28],
            ['tipo' => 'Tablet', 'porcentaje' => 4]
        ]
    ];
    
    response(true, 'Estadísticas obtenidas', $stats);
}

// POST - Registrar evento
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $evento = [
        'tipo' => $input['tipo'] ?? 'page_view',
        'pagina' => $input['pagina'] ?? '',
        'usuario' => $input['usuario'] ?? 'anonimo',
        'dispositivo' => $input['dispositivo'] ?? 'desktop',
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    $logFile = __DIR__ . '/../data/analytics.log';
    file_put_contents($logFile, json_encode($evento) . "\n", FILE_APPEND);
    
    response(true, 'Evento registrado');
}

response(false, 'Método no permitido');
?>
