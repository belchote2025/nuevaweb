<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar autenticación para operaciones que no sean GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    session_start();
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit();
    }
}

$dataFile = 'data/reservas.json';

function loadReservas() {
    global $dataFile;
    if (!file_exists($dataFile)) {
        return [];
    }
    $json = file_get_contents($dataFile);
    return json_decode($json, true) ?: [];
}

function saveReservas($reservas) {
    global $dataFile;
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return file_put_contents($dataFile, json_encode($reservas, JSON_PRETTY_PRINT));
}

function generateReservaId() {
    return 'reserva_' . date('YmdHis') . '_' . rand(1000, 9999);
}

function validateReserva($data) {
    $errors = [];
    
    if (empty($data['nombre'])) {
        $errors[] = 'El nombre es obligatorio';
    }
    
    if (empty($data['email'])) {
        $errors[] = 'El email es obligatorio';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'El email no es válido';
    }
    
    if (empty($data['telefono'])) {
        $errors[] = 'El teléfono es obligatorio';
    }
    
    if (empty($data['evento_id'])) {
        $errors[] = 'El evento es obligatorio';
    }
    
    if (empty($data['num_personas']) || $data['num_personas'] < 1) {
        $errors[] = 'El número de personas debe ser mayor a 0';
    }
    
    return $errors;
}

// Manejar diferentes métodos HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $reservas = loadReservas();
        
        // Filtrar por evento si se especifica
        if (isset($_GET['evento_id'])) {
            $reservas = array_filter($reservas, function($reserva) {
                return $reserva['evento_id'] === $_GET['evento_id'];
            });
        }
        
        // Filtrar por estado si se especifica
        if (isset($_GET['estado'])) {
            $reservas = array_filter($reservas, function($reserva) {
                return $reserva['estado'] === $_GET['estado'];
            });
        }
        
        echo json_encode(array_values($reservas));
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos inválidos']);
            break;
        }
        
        // Validar datos
        $errors = validateReserva($input);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos inválidos', 'details' => $errors]);
            break;
        }
        
        // Cargar reservas existentes
        $reservas = loadReservas();
        
        // Verificar si ya existe una reserva para este email y evento
        $existingReserva = array_filter($reservas, function($reserva) use ($input) {
            return $reserva['email'] === $input['email'] && 
                   $reserva['evento_id'] === $input['evento_id'] &&
                   $reserva['estado'] !== 'cancelada';
        });
        
        if (!empty($existingReserva)) {
            http_response_code(409);
            echo json_encode(['error' => 'Ya existe una reserva para este email en este evento']);
            break;
        }
        
        // Crear nueva reserva
        $nuevaReserva = [
            'id' => generateReservaId(),
            'nombre' => trim($input['nombre']),
            'email' => trim($input['email']),
            'telefono' => trim($input['telefono']),
            'evento_id' => $input['evento_id'],
            'num_personas' => intval($input['num_personas']),
            'comentarios' => trim($input['comentarios'] ?? ''),
            'estado' => 'pendiente',
            'fecha_reserva' => date('Y-m-d H:i:s'),
            'fecha_creacion' => date('Y-m-d H:i:s')
        ];
        
        $reservas[] = $nuevaReserva;
        
        if (saveReservas($reservas)) {
            // Enviar email de confirmación (simple)
            $to = $nuevaReserva['email'];
            $subject = 'Confirmación de Reserva - Filá Mariscales';
            $message = "Hola {$nuevaReserva['nombre']},\n\n" .
                       "Hemos recibido tu reserva para el evento ({$nuevaReserva['evento_id']}).\n" .
                       "Número de personas: {$nuevaReserva['num_personas']}.\n\n" .
                       "Te confirmaremos lo antes posible.\n\n" .
                       "Un saludo,\nFilá Mariscales";
            @mail($to, $subject, $message);

            echo json_encode([
                'success' => true,
                'reserva' => $nuevaReserva,
                'message' => 'Reserva creada exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al guardar la reserva']);
        }
        break;
        
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || empty($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de reserva requerido']);
            break;
        }
        
        $reservas = loadReservas();
        $reservaIndex = array_search($input['id'], array_column($reservas, 'id'));
        
        if ($reservaIndex === false) {
            http_response_code(404);
            echo json_encode(['error' => 'Reserva no encontrada']);
            break;
        }
        
        // Actualizar reserva
        $reservas[$reservaIndex] = array_merge($reservas[$reservaIndex], $input);
        $reservas[$reservaIndex]['fecha_actualizacion'] = date('Y-m-d H:i:s');
        
        if (saveReservas($reservas)) {
            echo json_encode([
                'success' => true,
                'reserva' => $reservas[$reservaIndex],
                'message' => 'Reserva actualizada exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al actualizar la reserva']);
        }
        break;
        
    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || empty($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de reserva requerido']);
            break;
        }
        
        $reservas = loadReservas();
        $reservaIndex = array_search($input['id'], array_column($reservas, 'id'));
        
        if ($reservaIndex === false) {
            http_response_code(404);
            echo json_encode(['error' => 'Reserva no encontrada']);
            break;
        }
        
        // Eliminar reserva
        array_splice($reservas, $reservaIndex, 1);
        
        if (saveReservas($reservas)) {
            echo json_encode([
                'success' => true,
                'message' => 'Reserva eliminada exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar la reserva']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}
?>
