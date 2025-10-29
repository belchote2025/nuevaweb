// Service Worker para Notificaciones Push - Filá Mariscales
const CACHE_NAME = 'fila-mariscales-v1';
const NOTIFICATION_TITLE = 'Filá Mariscales';

// Evento de instalación
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
    console.log('Service Worker activado');
    event.waitUntil(self.clients.claim());
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
    console.log('Notificación push recibida:', event);
    
    let notificationData = {
        title: NOTIFICATION_TITLE,
        body: 'Nueva notificación de la Filá Mariscales',
        icon: '/assets/images/logo.png',
        badge: '/assets/images/badge.png',
        tag: 'fila-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'Ver',
                icon: '/assets/images/view-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Cerrar',
                icon: '/assets/images/close-icon.png'
            }
        ]
    };

    // Si hay datos en el push
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                title: data.title || NOTIFICATION_TITLE,
                body: data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                data: data.data || {}
            };
        } catch (e) {
            console.error('Error parseando datos de notificación:', e);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('Notificación clickeada:', event);
    
    event.notification.close();
    
    const action = event.action;
    const notificationData = event.notification.data || {};
    
    if (action === 'dismiss') {
        // Solo cerrar la notificación
        return;
    }
    
    // Determinar URL a abrir
    let urlToOpen = '/';
    
    if (notificationData.url) {
        urlToOpen = notificationData.url;
    } else if (notificationData.type) {
        switch (notificationData.type) {
            case 'noticia':
                urlToOpen = '/noticias.html';
                break;
            case 'evento':
                urlToOpen = '/eventos.html';
                break;
            case 'reserva':
                urlToOpen = '/reservas.html';
                break;
            case 'socio':
                urlToOpen = '/socios-area.html';
                break;
            default:
                urlToOpen = '/';
        }
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Buscar ventana existente
            for (const client of clientList) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Abrir nueva ventana si no hay ventana existente
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Manejar notificaciones cerradas
self.addEventListener('notificationclose', (event) => {
    console.log('Notificación cerrada:', event);
    
    // Opcional: Enviar analytics de notificación cerrada
    if (event.notification.data && event.notification.data.analytics) {
        // Enviar evento de analytics
        fetch('api/analytics.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: 'notification_closed',
                notification_id: event.notification.data.id,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error('Error enviando analytics:', err));
    }
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
    console.log('Mensaje recibido en Service Worker:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Cache de recursos estáticos
self.addEventListener('fetch', (event) => {
    // Solo cachear recursos estáticos
    if (event.request.url.includes('/assets/') || 
        event.request.url.includes('.css') || 
        event.request.url.includes('.js')) {
        
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
