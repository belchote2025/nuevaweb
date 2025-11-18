<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit();
}

$file = __DIR__ . '/../data/temas.json';
$themes = [];

if (file_exists($file)) {
    $themes = json_decode(file_get_contents($file), true) ?: [];
}

$activeTheme = null;

foreach ($themes as $theme) {
    if (!empty($theme['activo'])) {
        $activeTheme = $theme;
        break;
    }
}

if (!$activeTheme && count($themes) > 0) {
    $activeTheme = $themes[0];
}

if ($activeTheme) {
    echo json_encode([
        'success' => true,
        'data' => $activeTheme
    ]);
} else {
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => 'tema-defecto',
            'nombre' => 'Tema por defecto',
            'descripcion' => 'Paleta clásica de la Filá Mariscales',
            'colores' => [
                'primario' => '#DC143C',
                'secundario' => '#FFD700',
                'fondo' => '#F8F9FA',
                'texto' => '#212529'
            ],
            'tipografia' => [
                'titulos' => '"Cinzel", serif',
                'texto' => '"Open Sans", sans-serif'
            ]
        ]
    ]);
}

