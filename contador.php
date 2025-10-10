<?php
// Ruta al archivo donde se guardará el contador
$archivo_contador = 'contador_visitas.txt';

// Verificar si el archivo existe, si no, crearlo con valor 0
if (!file_exists($archivo_contador)) {
    file_put_contents($archivo_contador, '0');
}

// Leer el valor actual del contador
$visitas = (int)file_get_contents($archivo_contador);

// Incrementar el contador solo si no es una actualización de página
$es_actualizacion = isset($_SERVER['HTTP_CACHE_CONTROL']) && 
                   (strpos($_SERVER['HTTP_CACHE_CONTROL'], 'max-age=0') !== false || 
                    strpos($_SERVER['HTTP_CACHE_CONTROL'], 'no-cache') !== false);

if (!$es_actualizacion) {
    $visitas++;
    file_put_contents($archivo_contador, $visitas);
}

// Devolver el número de visitas formateado
echo number_format($visitas, 0, ',', '.');
?>
