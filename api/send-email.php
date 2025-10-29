<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Verificar autenticación
if (!isset($_SESSION['socio_logged_in']) || $_SESSION['socio_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado.']);
    exit();
}

// Verificar rol de administrador
$user_role = $_SESSION['admin_role'] ?? 'socio';
$allowed_roles = ['admin', 'editor', 'moderator'];

if (!in_array($user_role, $allowed_roles)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado.']);
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $to = $input['email'] ?? '';
    $nombre = $input['nombre'] ?? '';
    $nuevaPassword = $input['password'] ?? '';
    $type = $input['type'] ?? 'password';
    $subject = $input['subject'] ?? '';
    $message = $input['message'] ?? '';
    
    if ($type === 'password') {
        if (empty($to) || empty($nombre) || empty($nuevaPassword)) {
            response(false, 'Faltan datos requeridos.');
        }
    } else if ($type === 'reply') {
        if (empty($to) || empty($nombre) || empty($subject) || empty($message)) {
            response(false, 'Faltan datos requeridos para la respuesta.');
        }
    } else {
        response(false, 'Tipo de email no válido.');
    }
    
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        response(false, 'Email no válido.');
    }
    
    // Obtener URL base del sitio
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $scriptDir = dirname($_SERVER['PHP_SELF']);
    $baseUrl = rtrim($protocol . '://' . $host . $scriptDir, '/');
    
    // Configuración del email
    if ($type === 'password') {
        $emailSubject = "Nueva Contraseña - Filá Mariscales";
        
        // Escapar variables para HTML
        $nombreEscapado = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');
        $passwordEscapado = htmlspecialchars($nuevaPassword, ENT_QUOTES, 'UTF-8');
        $emailEscapado = htmlspecialchars($to, ENT_QUOTES, 'UTF-8');
        $loginUrl = htmlspecialchars($baseUrl . '/login-socios.html', ENT_QUOTES, 'UTF-8');
        $anio = date('Y');
        
        $emailMessage = <<<HTML
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC143C; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: #fff; border: 2px solid #DC143C; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .password { font-size: 24px; font-weight: bold; color: #DC143C; letter-spacing: 2px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Nueva Contraseña - Filá Mariscales</h1>
            </div>
            <div class="content">
                <h2>Hola {$nombreEscapado},</h2>
                <p>Se ha generado una nueva contraseña para tu cuenta en el sistema de la Filá Mariscales.</p>
                
                <div class="password-box">
                    <h3>Tu nueva contraseña es:</h3>
                    <div class="password">{$passwordEscapado}</div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Guarda esta contraseña en un lugar seguro</li>
                        <li>Te recomendamos cambiarla después de iniciar sesión</li>
                        <li>No compartas esta información con nadie</li>
                    </ul>
                </div>
                
                <p><strong>Para iniciar sesión:</strong></p>
                <ol>
                    <li>Ve a: <a href="{$loginUrl}">Área de Socios</a></li>
                    <li>Usa tu email: <strong>{$emailEscapado}</strong></li>
                    <li>Usa la contraseña mostrada arriba</li>
                </ol>
                
                <div class="footer">
                    <p>Si no solicitaste este cambio, contacta con la administración inmediatamente.</p>
                    <p>© {$anio} Filá Mariscales de Caballeros Templarios</p>
                </div>
            </div>
        </div>
    </body>
    </html>
HTML;
    } else if ($type === 'reply') {
        $emailSubject = $subject;
        
        // Escapar variables para HTML
        $nombreEscapado = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');
        $mensajeEscapado = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
        $asuntoEscapado = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $anio = date('Y');
        
        $emailMessage = <<<HTML
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC143C; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .message-box { background: #fff; border: 2px solid #DC143C; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📧 Respuesta - Filá Mariscales</h1>
            </div>
            <div class="content">
                <h2>Hola {$nombreEscapado},</h2>
                <p>Hemos recibido tu mensaje y te respondemos:</p>
                
                <div class="message-box">
                    <h3>{$asuntoEscapado}</h3>
                    <div style="white-space: pre-wrap;">{$mensajeEscapado}</div>
                </div>
                
                <p>Si tienes más preguntas, no dudes en contactarnos nuevamente.</p>
                
                <div class="footer">
                    <p>© {$anio} Filá Mariscales de Caballeros Templarios</p>
                </div>
            </div>
        </div>
    </body>
    </html>
HTML;
    }
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: Filá Mariscales <noreply@filamariscales.com>',
        'Reply-To: admin@filamariscales.com',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Intentar enviar el email
    if (mail($to, $emailSubject, $emailMessage, implode("\r\n", $headers))) {
        $messageType = $type === 'password' ? 'contraseña' : 'respuesta';
        response(true, "Email de {$messageType} enviado exitosamente a " . $to);
    } else {
        response(false, 'Error al enviar el email. Verifica la configuración del servidor.');
    }
}

response(false, 'Método no permitido.');
?>
