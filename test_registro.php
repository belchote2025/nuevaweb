<?php
// Datos del nuevo socio
$data = [
    'nombre' => 'Socio de Prueba',
    'email' => 'prueba@ejemplo.com',
    'password' => 'micontraseña123',
    'telefono' => '123456789',
    'direccion' => 'Calle Prueba 123'
];

// Inicializar cURL
$ch = curl_init('http://localhost/fila-mariscales-web/api/socios.php');

// Configurar opciones de cURL
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen(json_encode($data))
]);

// Ejecutar la petición
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Cerrar la conexión
curl_close($ch);

// Mostrar resultados
echo "Código de estado HTTP: $httpCode\n";
echo "Respuesta del servidor:\n";
print_r(json_decode($response, true));
?>
