<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitudes OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ruta al archivo de socios
$sociosFile = __DIR__ . '/../data/socios.json';

// Función para generar ID único
function generarIdUnico() {
    return uniqid('', true);
}

// Función para guardar los socios
function guardarSocios($socios, $archivo) {
    return file_put_contents($archivo, json_encode($socios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Obtener el método de la solicitud
$metodo = $_SERVER['REQUEST_METHOD'];

// Manejar la solicitud según el método
switch ($metodo) {
    case 'GET':
        // Obtener todos los socios (solo para administradores)
        if (file_exists($sociosFile)) {
            $socios = json_decode(file_get_contents($sociosFile), true);
            // No mostrar contraseñas en la respuesta
            $socios = array_map(function($socio) {
                unset($socio['password']);
                return $socio;
            }, $socios);
            echo json_encode(['success' => true, 'data' => $socios]);
        } else {
            echo json_encode(['success' => true, 'data' => []]);
        }
        break;
        
    case 'POST':
        // Obtener los datos del cuerpo de la solicitud
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos obligatorios
        if (empty($data['email']) || empty($data['password']) || empty($data['nombre'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
            exit;
        }
        
        // Leer socios existentes
        $socios = file_exists($sociosFile) ? json_decode(file_get_contents($sociosFile), true) : [];
        
        // Verificar si el correo ya está registrado
        $existe = false;
        foreach ($socios as $socio) {
            if (strtolower($socio['email']) === strtolower($data['email'])) {
                $existe = true;
                break;
            }
        }
        
        if ($existe) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El correo electrónico ya está registrado']);
            exit;
        }
        
        // Crear nuevo socio
        $nuevoSocio = [
            'id' => generarIdUnico(),
            'nombre' => $data['nombre'],
            'email' => $data['email'],
            'telefono' => $data['telefono'] ?? '',
            'direccion' => $data['direccion'] ?? '',
            'fecha_ingreso' => $data['fecha_ingreso'] ?? date('Y-m-d'),
            'password' => password_hash($data['password'], PASSWORD_DEFAULT),
            'activo' => true,
            'numero_socio' => $data['numero_socio'] ?? strtoupper(uniqid('SOC-')),
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Agregar el nuevo socio
        $socios[] = $nuevoSocio;
        
        // Guardar en el archivo
        if (guardarSocios($socios, $sociosFile)) {
            // No devolver la contraseña en la respuesta
            unset($nuevoSocio['password']);
            echo json_encode([
                'success' => true, 
                'message' => 'Socio registrado exitosamente',
                'data' => $nuevoSocio
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al guardar los datos del socio']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}
