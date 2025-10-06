<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

try {
    // Obtener datos del POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Datos no válidos');
    }
    
    // Validar campos requeridos
    $required_fields = ['nombre', 'email', 'mensaje'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("El campo {$field} es obligatorio");
        }
    }
    
    // Validar email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email no válido');
    }
    
    // Preparar datos para guardar
    $contacto = [
        'id' => uniqid(),
        'nombre' => trim($input['nombre']),
        'email' => trim($input['email']),
        'mensaje' => trim($input['mensaje']),
        'fecha' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    // Guardar en archivo JSON
    $contactos_file = '../data/contactos.json';
    $contactos = [];
    
    if (file_exists($contactos_file)) {
        $contactos = json_decode(file_get_contents($contactos_file), true) ?: [];
    }
    
    $contactos[] = $contacto;
    
    if (!file_put_contents($contactos_file, json_encode($contactos, JSON_PRETTY_PRINT))) {
        throw new Exception('Error al guardar el mensaje');
    }
    
    // Enviar email (opcional)
    $to = 'info@filamariscales.com'; // Cambiar por email real
    $subject = 'Nuevo mensaje de contacto - ' . $contacto['nombre'];
    $message = "
    Nombre: {$contacto['nombre']}
    Email: {$contacto['email']}
    Fecha: {$contacto['fecha']}
    
    Mensaje:
    {$contacto['mensaje']}
    ";
    
    $headers = "From: {$contacto['email']}\r\n";
    $headers .= "Reply-To: {$contacto['email']}\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // Intentar enviar email (no crítico si falla)
    @mail($to, $subject, $message, $headers);
    
    echo json_encode([
        'success' => true,
        'message' => 'Mensaje enviado correctamente'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

