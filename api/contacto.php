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
    
    // Enviar email de notificación
    $email_sent = sendContactEmail($contacto);
    
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

function sendContactEmail($contacto) {
    // Configuración del email (CAMBIAR POR TU EMAIL)
    $to = 'contacto@filamariscales.com'; // Email de contacto de la Filá
    $from_email = 'noreply@filamariscales.com';
    $from_name = 'Filá Mariscales Web';
    
    $subject = 'Nuevo mensaje de contacto - ' . $contacto['nombre'];
    
    // Crear mensaje HTML
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC143C; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #DC143C; }
            .message-box { background: white; padding: 15px; border-left: 4px solid #DC143C; margin-top: 10px; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>🏛️ Nuevo Mensaje de Contacto</h2>
                <p>Filá Mariscales de Caballeros Templarios</p>
            </div>
            
            <div class='content'>
                <div class='field'>
                    <span class='label'>👤 Nombre:</span> {$contacto['nombre']}
                </div>
                
                <div class='field'>
                    <span class='label'>📧 Email:</span> {$contacto['email']}
                </div>
                
                <div class='field'>
                    <span class='label'>📅 Fecha:</span> {$contacto['fecha']}
                </div>
                
                <div class='field'>
                    <span class='label'>🌐 IP:</span> {$contacto['ip']}
                </div>
                
                <div class='field'>
                    <span class='label'>💬 Mensaje:</span>
                    <div class='message-box'>
                        " . nl2br(htmlspecialchars($contacto['mensaje'])) . "
                    </div>
                </div>
            </div>
            
            <div class='footer'>
                <p>Este mensaje fue enviado desde el formulario de contacto de la web de la Filá Mariscales</p>
                <p>Puedes responder directamente a: {$contacto['email']}</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Headers para email HTML
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: {$from_name} <{$from_email}>\r\n";
    $headers .= "Reply-To: {$contacto['email']}\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    
    // Intentar enviar email
    $sent = @mail($to, $subject, $message, $headers);
    
    // Log del intento de envío
    if ($sent) {
        error_log("Email de contacto enviado exitosamente a: {$to}");
    } else {
        error_log("Error enviando email de contacto a: {$to}");
    }
    
    return $sent;
}
?>

