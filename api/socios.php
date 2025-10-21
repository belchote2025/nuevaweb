<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
        if (empty($data['email']) || empty($data['nombre'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
            exit;
        }
        
        // Generar contraseña automáticamente si no se proporciona
        $password = $data['password'] ?? '';
        if (empty($password)) {
            $password = substr(md5(uniqid() . time()), 0, 8);
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
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'activo' => true,
            'numero_socio' => $data['numero_socio'] ?? strtoupper(uniqid('SOC-')),
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Agregar el nuevo socio
        $socios[] = $nuevoSocio;
        
        // Guardar en el archivo
        if (guardarSocios($socios, $sociosFile)) {
            // Preparar respuesta con la contraseña generada
            $respuesta = $nuevoSocio;
            unset($respuesta['password']); // No devolver el hash de la contraseña
            $respuesta['generated_password'] = $password; // Devolver la contraseña en texto plano
            
            echo json_encode([
                'success' => true, 
                'message' => 'Socio registrado exitosamente',
                'data' => $respuesta
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al guardar los datos del socio']);
        }
        break;
        
    case 'PUT':
        // Actualizar socio (especialmente para cambiar contraseñas)
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID del socio requerido']);
            exit;
        }
        
        // Leer socios existentes
        $socios = file_exists($sociosFile) ? json_decode(file_get_contents($sociosFile), true) : [];
        
        $socioEncontrado = false;
        foreach ($socios as &$socio) {
            if ($socio['id'] === $data['id']) {
                $socioEncontrado = true;
                
                // Actualizar campos si se proporcionan
                if (isset($data['nombre'])) $socio['nombre'] = $data['nombre'];
                if (isset($data['email'])) $socio['email'] = $data['email'];
                if (isset($data['telefono'])) $socio['telefono'] = $data['telefono'];
                if (isset($data['direccion'])) $socio['direccion'] = $data['direccion'];
                if (isset($data['activo'])) $socio['activo'] = $data['activo'];
                
                // Actualizar contraseña si se proporciona
                if (isset($data['password']) && !empty($data['password'])) {
                    $socio['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
                }
                
                $socio['updated_at'] = date('Y-m-d H:i:s');
                break;
            }
        }
        
        if (!$socioEncontrado) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Socio no encontrado']);
            exit;
        }
        
        // Guardar cambios
        if (guardarSocios($socios, $sociosFile)) {
            echo json_encode([
                'success' => true, 
                'message' => 'Socio actualizado exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el socio']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}
