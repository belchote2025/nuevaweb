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

// GET - Buscar contenido
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = $_GET['q'] ?? '';
    $tipo = $_GET['tipo'] ?? 'todos';
    $limit = intval($_GET['limit'] ?? 10);
    
    if (empty($query)) {
        response(false, 'Término de búsqueda requerido');
    }
    
    $resultados = [];
    
    // Buscar en noticias
    if ($tipo === 'todos' || $tipo === 'noticias') {
        $noticias = json_decode(file_get_contents(__DIR__ . '/../data/noticias.json'), true);
        foreach ($noticias as $noticia) {
            if (stripos($noticia['titulo'], $query) !== false || 
                stripos($noticia['contenido'], $query) !== false) {
                $resultados[] = [
                    'tipo' => 'noticia',
                    'titulo' => $noticia['titulo'],
                    'descripcion' => substr($noticia['resumen'], 0, 150) . '...',
                    'url' => '/noticias.html#' . $noticia['id'],
                    'fecha' => $noticia['fecha_publicacion']
                ];
            }
        }
    }
    
    // Buscar en eventos
    if ($tipo === 'todos' || $tipo === 'eventos') {
        $eventos = json_decode(file_get_contents(__DIR__ . '/../data/eventos.json'), true);
        foreach ($eventos as $evento) {
            if (stripos($evento['titulo'], $query) !== false || 
                stripos($evento['descripcion'], $query) !== false) {
                $resultados[] = [
                    'tipo' => 'evento',
                    'titulo' => $evento['titulo'],
                    'descripcion' => substr($evento['descripcion'], 0, 150) . '...',
                    'url' => '/eventos.html#' . $evento['id'],
                    'fecha' => $evento['fecha']
                ];
            }
        }
    }
    
    // Buscar en productos
    if ($tipo === 'todos' || $tipo === 'productos') {
        $productos = json_decode(file_get_contents(__DIR__ . '/../data/productos.json'), true);
        foreach ($productos as $producto) {
            if (stripos($producto['nombre'], $query) !== false || 
                stripos($producto['descripcion'], $query) !== false) {
                $resultados[] = [
                    'tipo' => 'producto',
                    'titulo' => $producto['nombre'],
                    'descripcion' => substr($producto['descripcion'], 0, 150) . '...',
                    'url' => '/productos.html#' . $producto['id'],
                    'precio' => $producto['precio']
                ];
            }
        }
    }
    
    // Limitar resultados
    $resultados = array_slice($resultados, 0, $limit);
    
    response(true, 'Búsqueda completada', [
        'query' => $query,
        'total' => count($resultados),
        'resultados' => $resultados
    ]);
}

response(false, 'Método no permitido');
?>
