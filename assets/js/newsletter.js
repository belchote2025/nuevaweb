// ===== SISTEMA DE NEWSLETTER =====
class NewsletterSystem {
    constructor() {
        this.subscribers = [];
        this.init();
    }

    async init() {
        await this.loadSubscribers();
        this.setupNewsletterUI();
        this.setupEventListeners();
    }

    // ===== CARGA DE DATOS =====
    async loadSubscribers() {
        try {
            const response = await fetch('data/newsletter.json');
            this.subscribers = await response.json();
        } catch (error) {
            console.error('Error cargando suscriptores:', error);
            this.subscribers = [];
        }
    }

    // ===== CONFIGURACIÓN DE UI =====
    setupNewsletterUI() {
        // Crear sección de newsletter en el footer
        const footer = document.querySelector('footer');
        if (footer) {
            const newsletterHtml = `
                <div class="newsletter-section bg-primary text-white py-4">
                    <div class="container">
                        <div class="row align-items-center">
                            <div class="col-lg-6">
                                <h5 class="mb-1">
                                    <i class="fas fa-envelope me-2"></i>
                                    Mantente informado
                                </h5>
                                <p class="mb-0">Recibe las últimas noticias y eventos de la Filá Mariscales</p>
                            </div>
                            <div class="col-lg-6">
                                <form id="newsletter-form" class="newsletter-form">
                                    <div class="input-group">
                                        <input type="email" 
                                               class="form-control" 
                                               id="newsletter-email" 
                                               placeholder="Tu email"
                                               required>
                                        <button class="btn btn-light" type="submit">
                                            <i class="fas fa-paper-plane me-1"></i>Suscribirse
                                        </button>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input class="form-check-input" type="checkbox" id="newsletter-privacy" required>
                                        <label class="form-check-label small" for="newsletter-privacy">
                                            Acepto la <a href="#" class="text-white" onclick="newsletterSystem.showPrivacyPolicy()">política de privacidad</a>
                                        </label>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            footer.insertAdjacentHTML('beforebegin', newsletterHtml);
        }

        // Crear modal de newsletter
        this.createNewsletterModal();
    }

    createNewsletterModal() {
        const modalHtml = `
            <div class="modal fade" id="newsletterModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-envelope me-2"></i>Newsletter
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <i class="fas fa-newspaper fa-3x text-primary mb-3"></i>
                                <h4>¡No te pierdas nada!</h4>
                                <p class="text-muted">Suscríbete a nuestro newsletter y recibe:</p>
                            </div>
                            
                            <div class="newsletter-benefits mb-4">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-calendar-alt text-primary me-3"></i>
                                            <div>
                                                <h6 class="mb-0">Eventos</h6>
                                                <small class="text-muted">Próximos eventos y actividades</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-newspaper text-primary me-3"></i>
                                            <div>
                                                <h6 class="mb-0">Noticias</h6>
                                                <small class="text-muted">Últimas noticias de la Filá</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-images text-primary me-3"></i>
                                            <div>
                                                <h6 class="mb-0">Galería</h6>
                                                <small class="text-muted">Nuevas fotos y videos</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-gift text-primary me-3"></i>
                                            <div>
                                                <h6 class="mb-0">Ofertas</h6>
                                                <small class="text-muted">Descuentos exclusivos</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <form id="newsletter-modal-form">
                                <div class="mb-3">
                                    <label for="newsletter-modal-email" class="form-label">Email</label>
                                    <input type="email" 
                                           class="form-control" 
                                           id="newsletter-modal-email" 
                                           placeholder="tu@email.com"
                                           required>
                                </div>
                                <div class="mb-3">
                                    <label for="newsletter-modal-name" class="form-label">Nombre (opcional)</label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="newsletter-modal-name" 
                                           placeholder="Tu nombre">
                                </div>
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="newsletter-modal-privacy" required>
                                        <label class="form-check-label" for="newsletter-modal-privacy">
                                            Acepto la <a href="#" onclick="newsletterSystem.showPrivacyPolicy()">política de privacidad</a>
                                        </label>
                                    </div>
                                </div>
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-paper-plane me-2"></i>Suscribirse
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Formulario del footer
        const footerForm = document.getElementById('newsletter-form');
        if (footerForm) {
            footerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubscription(e.target);
            });
        }

        // Formulario del modal
        const modalForm = document.getElementById('newsletter-modal-form');
        if (modalForm) {
            modalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubscription(e.target);
            });
        }

        // Mostrar modal de newsletter después de 30 segundos
        setTimeout(() => {
            this.showNewsletterModal();
        }, 30000);
    }

    // ===== SUSCRIPCIÓN =====
    async handleSubscription(form) {
        const email = form.querySelector('input[type="email"]').value.trim();
        const name = form.querySelector('input[type="text"]')?.value.trim() || '';
        const privacy = form.querySelector('input[type="checkbox"]').checked;

        if (!email || !privacy) {
            this.showNotification('Por favor, completa todos los campos requeridos', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Por favor, introduce un email válido', 'error');
            return;
        }

        // Verificar si ya está suscrito
        if (this.isSubscribed(email)) {
            this.showNotification('Este email ya está suscrito a nuestro newsletter', 'info');
            return;
        }

        try {
            const subscriber = {
                id: Date.now().toString(),
                email: email,
                name: name,
                subscribed_at: new Date().toISOString(),
                status: 'active',
                source: 'website'
            };

            // Añadir a la lista local
            this.subscribers.push(subscriber);

            // Guardar en el servidor
            await this.saveSubscribers();

            // Mostrar confirmación
            this.showNotification('¡Te has suscrito correctamente! Recibirás nuestras noticias pronto.', 'success');

            // Limpiar formulario
            form.reset();

            // Cerrar modal si está abierto
            const modal = bootstrap.Modal.getInstance(document.getElementById('newsletterModal'));
            if (modal) {
                modal.hide();
            }

            // Enviar email de bienvenida (opcional)
            this.sendWelcomeEmail(subscriber);

        } catch (error) {
            console.error('Error en suscripción:', error);
            this.showNotification('Error al procesar la suscripción. Inténtalo de nuevo.', 'error');
        }
    }

    async saveSubscribers() {
        try {
            const response = await fetch('api/newsletter.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save',
                    subscribers: this.subscribers
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error guardando suscriptores:', error);
            // Fallback: guardar localmente
            localStorage.setItem('newsletter_subscribers', JSON.stringify(this.subscribers));
        }
    }

    // ===== VALIDACIONES =====
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isSubscribed(email) {
        return this.subscribers.some(sub => sub.email.toLowerCase() === email.toLowerCase());
    }

    // ===== MODAL =====
    showNewsletterModal() {
        // Solo mostrar si no está suscrito y no se ha mostrado recientemente
        const lastShown = localStorage.getItem('newsletter_modal_last_shown');
        const now = Date.now();
        
        if (lastShown && (now - parseInt(lastShown)) < 7 * 24 * 60 * 60 * 1000) {
            return; // No mostrar si se mostró hace menos de 7 días
        }

        const modal = new bootstrap.Modal(document.getElementById('newsletterModal'));
        modal.show();

        // Guardar timestamp
        localStorage.setItem('newsletter_modal_last_shown', now.toString());
    }

    // ===== EMAIL DE BIENVENIDA =====
    async sendWelcomeEmail(subscriber) {
        try {
            const response = await fetch('api/newsletter.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'welcome',
                    subscriber: subscriber
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('Email de bienvenida enviado');
            }
        } catch (error) {
            console.error('Error enviando email de bienvenida:', error);
        }
    }

    // ===== POLÍTICA DE PRIVACIDAD =====
    showPrivacyPolicy() {
        const modalHtml = `
            <div class="modal fade" id="privacyModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Política de Privacidad - Newsletter</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <h6>Recopilación de datos</h6>
                            <p>Recopilamos únicamente tu dirección de email y nombre (opcional) para enviarte nuestro newsletter.</p>
                            
                            <h6>Uso de datos</h6>
                            <p>Utilizamos tu email para:</p>
                            <ul>
                                <li>Enviarte noticias y eventos de la Filá Mariscales</li>
                                <li>Informarte sobre actividades y celebraciones</li>
                                <li>Compartir contenido relevante de la hermandad</li>
                            </ul>
                            
                            <h6>Protección de datos</h6>
                            <p>No compartimos tu información con terceros. Tus datos están seguros y solo los utilizamos para el propósito indicado.</p>
                            
                            <h6>Cancelación</h6>
                            <p>Puedes cancelar tu suscripción en cualquier momento haciendo clic en el enlace de cancelación en nuestros emails.</p>
                            
                            <h6>Contacto</h6>
                            <p>Para cualquier consulta sobre privacidad, contacta con nosotros en: info@filamariscales.com</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('privacyModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('privacyModal'));
        modal.show();

        // Limpiar modal cuando se cierre
        document.getElementById('privacyModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // ===== GESTIÓN DE SUSCRIPTORES (ADMIN) =====
    async getSubscribers() {
        try {
            const response = await fetch('api/newsletter.php?action=get');
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error obteniendo suscriptores:', error);
            return [];
        }
    }

    async sendNewsletter(subject, content) {
        try {
            const response = await fetch('api/newsletter.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'send',
                    subject: subject,
                    content: content
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error enviando newsletter:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    // ===== NOTIFICACIONES =====
    showNotification(message, type) {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'info': 'alert-info'
        }[type] || 'alert-info';
        
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

// ===== INICIALIZACIÓN =====
let newsletterSystem;

document.addEventListener('DOMContentLoaded', function() {
    newsletterSystem = new NewsletterSystem();
});

// ===== FUNCIONES GLOBALES =====
window.newsletterSystem = newsletterSystem;

