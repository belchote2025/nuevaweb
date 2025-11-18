<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar autenticación
if (!isset($_SESSION['socio_logged_in']) || $_SESSION['socio_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado. Por favor inicie sesión.']);
    exit();
}

// Verificar si el usuario es administrador
$socios = json_decode(file_get_contents('../data/socios.json'), true);
$usuario_actual = null;

foreach ($socios as $socio) {
    if (isset($socio['email']) && $socio['email'] === $_SESSION['socio_email']) {
        $usuario_actual = $socio;
        break;
    }
}

if (!isset($usuario_actual['rol']) || $usuario_actual['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Se requieren privilegios de administrador.']);
    exit();
}

$users_file = '../data/users.json';
$socios_file = '../data/socios.json';

function load_users($file) {
    if (!file_exists($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return $data ?: [];
}

function save_users($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

function load_socios($file) {
    if (!file_exists($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return $data ?: [];
}

function save_socios($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

function merge_users_with_socios($users, $socios) {
    $map = [];

    foreach ($users as $user) {
        $key = strtolower($user['email'] ?? $user['id']);
        $entry = $user;
        $entry['telefono'] = $entry['telefono'] ?? '';
        $entry['direccion'] = $entry['direccion'] ?? '';
        $entry['fecha_ingreso'] = $entry['fecha_ingreso'] ?? '';
        $entry['numero_socio'] = $entry['numero_socio'] ?? '';
        $entry['socio_id'] = $entry['socio_id'] ?? null;
        $entry['origin'] = 'users';
        $entry['sources'] = [
            'users' => true,
            'socios' => !empty($entry['socio_id'])
        ];
        $entry['nombre'] = $entry['name'] ?? ($entry['nombre'] ?? '');
        $map[$key] = $entry;
    }

    foreach ($socios as $socio) {
        $emailKey = strtolower($socio['email'] ?? '');
        $key = $emailKey ?: ($socio['id'] ?? uniqid('socio-'));

        if (isset($map[$key])) {
            $entry = &$map[$key];
            if (empty($entry['name']) && isset($socio['nombre'])) {
                $entry['name'] = $socio['nombre'];
                $entry['nombre'] = $socio['nombre'];
            }
            $entry['telefono'] = $entry['telefono'] ?: ($socio['telefono'] ?? '');
            $entry['direccion'] = $entry['direccion'] ?: ($socio['direccion'] ?? '');
            $entry['fecha_ingreso'] = $entry['fecha_ingreso'] ?: ($socio['fecha_ingreso'] ?? '');
            $entry['numero_socio'] = $entry['numero_socio'] ?: ($socio['numero_socio'] ?? '');
            if (empty($entry['socio_id']) && isset($socio['id'])) {
                $entry['socio_id'] = $socio['id'];
            }
            if (!empty($socio['rol'])) {
                $entry['role'] = $entry['role'] ?? $socio['rol'];
            }
            $entry['active'] = isset($entry['active']) ? $entry['active'] : ($socio['activo'] ?? true);
            $entry['sources']['socios'] = true;
            $entry['origin'] = $entry['sources']['users'] ? 'combined' : 'socios';
            unset($entry);
        } else {
            $newId = $socio['id'] ?? uniqid('socio-');
            $map[$key] = [
                'id' => $newId,
                'name' => $socio['nombre'] ?? '',
                'nombre' => $socio['nombre'] ?? '',
                'email' => $socio['email'] ?? '',
                'role' => $socio['rol'] ?? 'socio',
                'active' => $socio['activo'] ?? true,
                'created_at' => $socio['fecha_creacion'] ?? ($socio['fecha_ingreso'] ?? ''),
                'updated_at' => $socio['updated_at'] ?? '',
                'telefono' => $socio['telefono'] ?? '',
                'direccion' => $socio['direccion'] ?? '',
                'fecha_ingreso' => $socio['fecha_ingreso'] ?? '',
                'numero_socio' => $socio['numero_socio'] ?? '',
                'socio_id' => $newId,
                'origin' => 'socios',
                'sources' => [
                    'users' => false,
                    'socios' => true
                ]
            ];
        }
    }

    return array_values($map);
}

function response($ok, $message, $data = null) {
    echo json_encode(['success' => $ok, 'message' => $message, 'data' => $data]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

$sociosData = load_socios($socios_file);

if ($method === 'GET') {
    $users = load_users($users_file);
    $combined = merge_users_with_socios($users, $sociosData);

    $safe = array_map(function($u){
        unset($u['password_hash']);
        unset($u['password']);
        return $u;
    }, $combined);

    response(true, 'OK', $safe);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) response(false, 'Datos inválidos');

    // Verificar que solo los administradores pueden crear socios
    $current_user_role = $_SESSION['admin_role'] ?? 'admin';
    $role = $input['role'] ?? 'editor';
    
    if ($role === 'socio' && $current_user_role !== 'admin') {
        response(false, 'Solo los administradores pueden crear socios');
    }

    $telefono = trim($input['telefono'] ?? '');
    $direccion = trim($input['direccion'] ?? '');
    $fecha_ingreso = $input['fecha_ingreso'] ?? '';
    $numero_socio = trim($input['numero_socio'] ?? '');
    $socio_id = $input['socio_id'] ?? null;

    $users = load_users($users_file);
    $socios = $sociosData;
    $id = $input['id'] ?? uniqid('user-');
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $active = $input['active'] ?? true;

    $is_edit = isset($input['id']) && !empty($input['id']);
    if (!$name || !$email || (!$is_edit && !$password)) response(false, 'Campos requeridos');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) response(false, 'Email no válido');

    // Crear o actualizar
    $found = false;
    $passwordHash = null;
    if ($password) {
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    }

    $existingUser = null;
    foreach ($users as &$u) {
        if ($u['id'] === $id) {
            $u['name'] = $name;
            $u['nombre'] = $name;
            $u['email'] = $email;
            $u['role'] = $role;
            $u['active'] = (bool)$active;
            if ($passwordHash) $u['password_hash'] = $passwordHash;
            $u['updated_at'] = date('Y-m-d H:i:s');
            $u['telefono'] = $telefono;
            $u['direccion'] = $direccion;
            $u['fecha_ingreso'] = $fecha_ingreso;
            $u['numero_socio'] = $numero_socio;
            $u['socio_id'] = $role === 'socio' ? ($socio_id ?: ($u['socio_id'] ?? uniqid('socio-'))) : null;
            $found = true;
            $existingUser = $u;
            break;
        }
    }
    unset($u);

    if (!$found) {
        if ($role === 'socio' && !$socio_id) {
            $socio_id = uniqid('socio-');
        }
        $users[] = [
            'id' => $id,
            'name' => $name,
            'nombre' => $name,
            'email' => $email,
            'role' => $role,
            'password_hash' => $passwordHash ?: password_hash($password ?: substr(md5(uniqid()),0,8), PASSWORD_BCRYPT),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
            'active' => (bool)$active,
            'telefono' => $telefono,
            'direccion' => $direccion,
            'fecha_ingreso' => $fecha_ingreso ?: date('Y-m-d'),
            'numero_socio' => $numero_socio,
            'socio_id' => $role === 'socio' ? $socio_id : null
        ];
    }

    if (!save_users($users_file, $users)) {
        response(false, 'Error al guardar');
    }

    // Sincronizar archivo de socios
    if ($role === 'socio') {
        $fechaSocio = $fecha_ingreso ?: date('Y-m-d');
        if (!$socio_id) {
            $socio_id = $existingUser['socio_id'] ?? uniqid('socio-');
        }
        $updated = false;
        foreach ($socios as &$socio) {
            if (($socio_id && isset($socio['id']) && $socio['id'] === $socio_id) || (isset($socio['email']) && strtolower($socio['email']) === strtolower($email))) {
                $socio['nombre'] = $name;
                $socio['email'] = $email;
                $socio['telefono'] = $telefono;
                $socio['direccion'] = $direccion;
                $socio['fecha_ingreso'] = $fechaSocio;
                $socio['numero_socio'] = $numero_socio ?: ($socio['numero_socio'] ?? strtoupper(uniqid('SOC-')));
                $socio['activo'] = (bool)$active;
                $socio['rol'] = 'socio';
                if ($passwordHash) {
                    $socio['password'] = $passwordHash;
                }
                $socio['updated_at'] = date('Y-m-d H:i:s');
                if (!isset($socio['id'])) {
                    $socio['id'] = $socio_id;
                }
                $updated = true;
                break;
            }
        }
        unset($socio);

        if (!$updated) {
            $socios[] = [
                'id' => $socio_id ?? uniqid('socio-'),
                'nombre' => $name,
                'email' => $email,
                'telefono' => $telefono,
                'direccion' => $direccion,
                'fecha_ingreso' => $fechaSocio,
                'numero_socio' => $numero_socio ?: strtoupper(uniqid('SOC-')),
                'password' => $passwordHash ?: password_hash($password ?: substr(md5(uniqid()),0,8), PASSWORD_BCRYPT),
                'activo' => (bool)$active,
                'rol' => 'socio',
                'fecha_creacion' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
        }

        save_socios($socios_file, $socios);
    } elseif ($socio_id) {
        $socios = array_values(array_filter($socios, function($s) use ($socio_id, $email) {
            if (isset($s['id']) && $s['id'] === $socio_id) return false;
            if (isset($s['email']) && strtolower($s['email']) === strtolower($email)) return false;
            return true;
        }));
        save_socios($socios_file, $socios);
        $socio_id = null;
    }

    response(true, 'Guardado', ['id' => $id, 'socio_id' => $socio_id]);
    response(false, 'Error al guardar');
}

if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id'])) response(false, 'ID requerido');

    $users = load_users($users_file);
    $deletedUser = null;
    $users = array_values(array_filter($users, function($u) use ($input, &$deletedUser) {
        if ($u['id'] === $input['id']) {
            $deletedUser = $u;
            return false;
        }
        return true;
    }));

    if (!save_users($users_file, $users)) {
        response(false, 'Error al eliminar');
    }

    if ($deletedUser && ($deletedUser['socio_id'] ?? null)) {
        $socios = load_socios($socios_file);
        $socios = array_values(array_filter($socios, function($s) use ($deletedUser) {
            if (isset($s['id']) && $s['id'] === $deletedUser['socio_id']) {
                return false;
            }
            if (isset($s['email']) && isset($deletedUser['email']) && strtolower($s['email']) === strtolower($deletedUser['email'])) {
                return false;
            }
            return true;
        }));
        save_socios($socios_file, $socios);
    }

    response(true, 'Eliminado');
    response(false, 'Error al eliminar');
}

response(false, 'Método no permitido');
?>














