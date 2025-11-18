// Sistema de Notificaciones Push - Filá Mariscales
class NotificationManager {
    constructor() {
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        this.subscription = null;
        this.registration = null;
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('Notificaciones push no soportadas en este navegador');
            return;
        }

        try {
            // Verificar si estamos en un entorno válido para Service Workers
            if (!this.canRegisterServiceWorker()) {
                console.warn('Service Worker no disponible en este entorno (requiere HTTPS o localhost)');
                return;
            }

            // Obtener la ruta base del proyecto
            const swPath = this.getServiceWorkerPath();
            
            // Registrar service worker - intentar primero con .php para tipo MIME correcto
            let registration;
            try {
                registration = await navigator.serviceWorker.register(swPath + 'sw.php', {
                    scope: './'
                });
                console.log('Service Worker registrado con sw.php:', registration);
            } catch (phpError) {
                // Solo loggear si no es un error de SSL conocido
                if (!this.isSSLError(phpError)) {
                    console.warn('Error con sw.php, intentando con sw.js:', phpError);
                }
                try {
                    registration = await navigator.serviceWorker.register(swPath + 'sw.js', {
                        scope: './'
                    });
                    console.log('Service Worker registrado con sw.js:', registration);
                } catch (jsError) {
                    // Si ambos fallan por SSL, solo loggear silenciosamente
                    if (this.isSSLError(jsError)) {
                        console.warn('Service Worker no disponible: certificado SSL inválido en desarrollo local');
                        return; // Salir silenciosamente si es error de SSL
                    }
                    throw jsError; // Re-lanzar otros errores
                }
            }
            
            this.registration = registration;

            // Verificar suscripción existente
            await this.checkSubscription();
            
            // Configurar event listeners
            this.setupEventListeners();
            
        } catch (error) {
            // Solo loggear errores que no sean de SSL
            if (!this.isSSLError(error)) {
                console.error('Error inicializando notificaciones:', error);
            }
        }
    }

    // Verificar si podemos registrar un Service Worker
    canRegisterServiceWorker() {
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        const isHTTPS = window.location.protocol === 'https:';
        
        // Service Workers funcionan en HTTPS o en localhost con HTTP
        return isHTTPS || isLocalhost;
    }

    // Detectar errores de SSL
    isSSLError(error) {
        if (!error || !error.message) return false;
        const errorMsg = error.message.toLowerCase();
        return errorMsg.includes('ssl') || 
               errorMsg.includes('certificate') ||
               errorMsg.includes('securityerror');
    }

    // Obtener la ruta base para el Service Worker
    getServiceWorkerPath() {
        // Obtener el path base del proyecto
        const pathname = window.location.pathname;
        const pathParts = pathname.split('/').filter(p => p);
        
        // Si estamos en la raíz, usar ruta relativa
        if (pathParts.length === 0 || pathParts[pathParts.length - 1].endsWith('.html')) {
            // Estamos en un archivo HTML dentro del proyecto
            // Usar ruta relativa al directorio raíz
            return './';
        }
        
        // Construir ruta relativa al directorio raíz
        return './';
    }

    setupEventListeners() {
        // Botón de activar/desactivar notificaciones
        const toggleBtn = document.getElementById('notification-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleNotifications());
        }

        // Botón de enviar notificación (solo para admin)
        const sendBtn = document.getElementById('send-notification-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.showSendModal());
        }

    }

    async checkSubscription() {
        try {
            // Verificar si tenemos un registro válido
            if (!this.registration) {
                return;
            }
            
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.getSubscription();
            
            // Actualizar UI según el estado
            this.updateNotificationUI();
            
        } catch (error) {
            // Solo loggear si no es un error esperado (como cuando no hay SW)
            if (!this.isSSLError(error)) {
                console.error('Error verificando suscripción:', error);
            }
        }
    }

    async toggleNotifications() {
        if (!this.isSupported) {
            this.showMessage('Las notificaciones no están soportadas en este navegador', 'error');
            return;
        }

        try {
            if (this.subscription) {
                await this.unsubscribe();
            } else {
                await this.subscribe();
            }
        } catch (error) {
            console.error('Error alternando notificaciones:', error);
            this.showMessage('Error al cambiar configuración de notificaciones', 'error');
        }
    }

    async subscribe() {
        try {
            // Verificar que tengamos un registro válido
            if (!this.registration) {
                this.showMessage('Service Worker no disponible. Las notificaciones requieren HTTPS válido o localhost.', 'error');
                return;
            }
            
            // Solicitar permisos
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                this.showMessage('Permisos de notificación denegados', 'error');
                return;
            }

            // Obtener clave pública VAPID
            const response = await fetch('api/notifications.php?action=vapid-key');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Error obteniendo clave VAPID');
            }

            // Crear suscripción
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(data.publicKey)
            });

            // Enviar suscripción al servidor
            const userInfo = this.getUserInfo();
            const subscribeResponse = await fetch('api/notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'subscribe',
                    subscription: this.subscription,
                    userInfo: userInfo
                })
            });

            const result = await subscribeResponse.json();
            
            if (result.success) {
                this.showMessage('Notificaciones activadas correctamente', 'success');
                this.updateNotificationUI();
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Error suscribiéndose:', error);
            this.showMessage('Error activando notificaciones: ' + error.message, 'error');
        }
    }

    async unsubscribe() {
        try {
            if (!this.subscription) return;

            // Verificar que tengamos un registro válido
            if (!this.registration) {
                this.subscription = null;
                this.updateNotificationUI();
                return;
            }

            // Desuscribir del navegador
            await this.subscription.unsubscribe();

            // Notificar al servidor
            const response = await fetch('api/notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'unsubscribe',
                    subscriptionId: this.subscription.endpoint
                })
            });

            this.subscription = null;
            this.showMessage('Notificaciones desactivadas', 'info');
            this.updateNotificationUI();

        } catch (error) {
            console.error('Error desuscribiéndose:', error);
            this.showMessage('Error desactivando notificaciones', 'error');
        }
    }

    updateNotificationUI() {
        const toggleBtn = document.getElementById('notification-toggle');
        const statusText = document.getElementById('notification-status');
        
        if (toggleBtn) {
            toggleBtn.classList.remove('inactive', 'active');
            if (this.subscription) {
                toggleBtn.innerHTML = '<i class="fas fa-bell-slash me-2"></i>Desactivar Notificaciones';
                toggleBtn.className = 'btn btn-notification btn-lg rounded-circle active';
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-bell me-2"></i>Activar Notificaciones';
                toggleBtn.className = 'btn btn-notification btn-lg rounded-circle inactive';
            }
        }

        if (statusText) {
            statusText.textContent = this.subscription ? 
                'Notificaciones activadas' : 
                'Notificaciones desactivadas';
        }
    }

    getUserInfo() {
        // Obtener información del usuario actual
        return {
            email: this.getCurrentUserEmail(),
            role: this.getCurrentUserRole(),
            name: this.getCurrentUserName(),
            timestamp: new Date().toISOString()
        };
    }

    getCurrentUserEmail() {
        // Implementar según tu sistema de autenticación
        return localStorage.getItem('userEmail') || 'socio@filamariscales.com';
    }

    getCurrentUserRole() {
        // Implementar según tu sistema de roles
        return localStorage.getItem('userRole') || 'socio';
    }

    getCurrentUserName() {
        // Implementar según tu sistema de usuarios
        return localStorage.getItem('userName') || 'Socio';
    }

    // Método para enviar notificación (solo admin)
    async sendNotification(title, body, type = 'general', url = '', targetUsers = 'all') {
        try {
            const response = await fetch('api/notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'send',
                    title: title,
                    body: body,
                    type: type,
                    url: url,
                    targetUsers: targetUsers,
                    createdBy: this.getCurrentUserEmail()
                })
            });

            // Verificar si la respuesta es JSON válido
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Respuesta no es JSON:', text);
                throw new Error('El servidor devolvió una respuesta no válida');
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage(`Notificación enviada a ${result.sentCount} usuarios`, 'success');
                return result;
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Error enviando notificación:', error);
            this.showMessage('Error enviando notificación: ' + error.message, 'error');
        }
    }

    showSendModal() {
        // Verificar que Bootstrap esté disponible
        if (typeof bootstrap === 'undefined') {
            this.showMessage('Bootstrap no está cargado. No se puede mostrar el modal.', 'error');
            return;
        }
        
        // Crear modal para enviar notificación
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'notificationModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="notificationModalLabel">
                            <i class="fas fa-bell me-2"></i>Enviar Notificación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="notification-form">
                            <div class="mb-3">
                                <label for="notif-title" class="form-label">Título *</label>
                                <input type="text" class="form-control" id="notif-title" required placeholder="Ej: Nuevo evento disponible">
                            </div>
                            <div class="mb-3">
                                <label for="notif-body" class="form-label">Mensaje *</label>
                                <textarea class="form-control" id="notif-body" rows="3" required placeholder="Escribe aquí el mensaje de la notificación..."></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="notif-type" class="form-label">Tipo</label>
                                        <select class="form-select" id="notif-type">
                                            <option value="general">General</option>
                                            <option value="evento">Evento</option>
                                            <option value="noticia">Noticia</option>
                                            <option value="reserva">Reserva</option>
                                            <option value="urgente">Urgente</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="notif-target" class="form-label">Destinatarios</label>
                                        <select class="form-select" id="notif-target">
                                            <option value="all">Todos los usuarios</option>
                                            <option value="socios">Solo socios</option>
                                            <option value="admin">Solo administradores</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="notif-url" class="form-label">URL (opcional)</label>
                                <input type="url" class="form-control" id="notif-url" placeholder="https://...">
                                <div class="form-text">URL a la que redirigir cuando se haga clic en la notificación</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" id="send-notification">
                            <i class="fas fa-paper-plane me-2"></i>Enviar Notificación
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Inicializar modal de Bootstrap
        const bsModal = new bootstrap.Modal(modal, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        // Mostrar modal
        try {
            bsModal.show();
        } catch (error) {
            console.error('Error mostrando modal:', error);
            // Fallback: mostrar formulario simple
            this.showSimpleForm();
            return;
        }

        // Event listener para enviar
        modal.querySelector('#send-notification').addEventListener('click', async () => {
            const form = modal.querySelector('#notification-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const title = modal.querySelector('#notif-title').value;
            const body = modal.querySelector('#notif-body').value;
            const type = modal.querySelector('#notif-type').value;
            const target = modal.querySelector('#notif-target').value;
            const url = modal.querySelector('#notif-url').value;

            // Deshabilitar botón mientras se envía
            const sendBtn = modal.querySelector('#send-notification');
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

            try {
                await this.sendNotification(title, body, type, url, target);
                bsModal.hide();
            } catch (error) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Notificación';
            }
        });

        // Limpiar modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }

    // Método de fallback si el modal no funciona
    showSimpleForm() {
        const title = prompt('Título de la notificación:');
        if (!title) return;
        
        const body = prompt('Mensaje de la notificación:');
        if (!body) return;
        
        const type = prompt('Tipo (general/evento/noticia/urgente):', 'general');
        const target = prompt('Destinatarios (all/socios/admin):', 'all');
        const url = prompt('URL (opcional):', '');
        
        this.sendNotification(title, body, type, url, target);
    }

    // Método para probar notificaciones
    async testNotification() {
        try {
            // Crear una notificación de prueba
            const result = await this.sendNotification(
                '🔔 Notificación de Prueba',
                'Esta es una notificación de prueba del sistema. Si ves esto, el sistema funciona correctamente.',
                'general',
                '',
                'all'
            );
            
            if (result) {
                this.showMessage('Notificación de prueba enviada correctamente', 'success');
            }
        } catch (error) {
            console.error('Error en notificación de prueba:', error);
            this.showMessage('Error enviando notificación de prueba', 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Usar el sistema de notificaciones existente si está disponible
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, type);
        } else {
            // Fallback simple
            alert(message);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});
