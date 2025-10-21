<?php
// Triggers automáticos para notificaciones push
// Este archivo se puede llamar desde otros endpoints para enviar notificaciones automáticas

require_once 'notifications.php';

class NotificationTriggers {
    
    public static function triggerNewEvent($evento) {
        $title = "🎉 Nuevo Evento: " . $evento['titulo'];
        $body = "No te pierdas: " . $evento['descripcion'];
        
        return self::sendNotification($title, $body, 'evento', '/eventos.html', 'all');
    }
    
    public static function triggerEventReminder($evento, $hoursBefore = 24) {
        $title = "⏰ Recordatorio: " . $evento['titulo'];
        $body = "El evento es en " . $hoursBefore . " horas. ¡No te lo pierdas!";
        
        return self::sendNotification($title, $body, 'evento', '/eventos.html', 'all');
    }
    
    public static function triggerNewNews($noticia) {
        $title = "📰 Nueva Noticia: " . $noticia['titulo'];
        $body = $noticia['resumen'];
        
        return self::sendNotification($title, $body, 'noticia', '/noticias.html', 'all');
    }
    
    public static function triggerReservationConfirmation($reserva) {
        $title = "✅ Reserva Confirmada";
        $body = "Tu reserva para " . $reserva['evento_titulo'] . " ha sido confirmada";
        
        return self::sendNotification($title, $body, 'reserva', '/reservas.html', 'socios');
    }
    
    public static function triggerReservationReminder($reserva, $hoursBefore = 2) {
        $title = "🔔 Recordatorio de Reserva";
        $body = "Tu evento " . $reserva['evento_titulo'] . " es en " . $hoursBefore . " horas";
        
        return self::sendNotification($title, $body, 'reserva', '/reservas.html', 'socios');
    }
    
    public static function triggerUrgentMessage($message, $title = "🚨 Mensaje Urgente") {
        return self::sendNotification($title, $message, 'urgente', '/', 'all');
    }
    
    public static function triggerAdminMessage($message, $title = "📢 Mensaje de la Directiva") {
        return self::sendNotification($title, $message, 'general', '/', 'socios');
    }
    
    private static function sendNotification($title, $body, $type, $url, $targetUsers) {
        $data = [
            'action' => 'send',
            'title' => $title,
            'body' => $body,
            'type' => $type,
            'url' => $url,
            'targetUsers' => $targetUsers,
            'createdBy' => 'system'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'http://localhost/fila-mariscales-web/api/notifications.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode >= 200 && $httpCode < 300;
    }
}

// Función para programar recordatorios automáticos
function scheduleEventReminders() {
    // Esta función se puede llamar desde un cron job
    $eventos = json_decode(file_get_contents('../data/eventos.json'), true);
    $reservas = json_decode(file_get_contents('../data/reservas.json'), true);
    
    $now = new DateTime();
    $reminders = [];
    
    foreach ($eventos as $evento) {
        $eventDate = new DateTime($evento['fecha']);
        $diff = $now->diff($eventDate);
        
        // Recordatorio 24 horas antes
        if ($diff->days == 1 && $diff->invert == 0) {
            NotificationTriggers::triggerEventReminder($evento, 24);
        }
        
        // Recordatorio 2 horas antes
        if ($diff->h == 2 && $diff->days == 0 && $diff->invert == 0) {
            NotificationTriggers::triggerEventReminder($evento, 2);
        }
    }
    
    // Recordatorios de reservas
    foreach ($reservas as $reserva) {
        if ($reserva['estado'] === 'confirmada') {
            $eventDate = new DateTime($reserva['fecha_evento']);
            $diff = $now->diff($eventDate);
            
            if ($diff->h == 2 && $diff->days == 0 && $diff->invert == 0) {
                NotificationTriggers::triggerReservationReminder($reserva, 2);
            }
        }
    }
}

// Si se llama directamente, ejecutar recordatorios
if (basename($_SERVER['PHP_SELF']) === 'notification-triggers.php') {
    scheduleEventReminders();
    echo json_encode(['success' => true, 'message' => 'Recordatorios programados ejecutados']);
}
?>
