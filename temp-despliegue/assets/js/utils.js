// ===== UTILIDADES COMUNES =====
// Archivo con funciones compartidas para evitar duplicación de código

class Utils {
    // ===== NOTIFICACIONES =====
    static showNotification(message, type = 'info') {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'danger': 'alert-danger',
            'info': 'alert-info',
            'warning': 'alert-warning'
        }[type] || 'alert-info';
        
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    // ===== VALIDACIÓN DE EMAIL =====
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ===== FORMATEO DE FECHAS =====
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ===== FORMATEO DE FECHAS CORTO =====
    static formatDateShort(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // ===== FORMATEO DE FECHAS CON HORA =====
    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ===== VALIDACIÓN DE CAMPOS =====
    static validateField(field) {
        const value = field.value.trim();
        
        // Limpiar errores previos
        this.clearFieldError(field);
        
        // Validaciones específicas
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'Este campo es obligatorio');
            return false;
        }
        
        if (field.type === 'email' && value && !this.isValidEmail(value)) {
            this.showFieldError(field, 'Email no válido');
            return false;
        }
        
        return true;
    }

    static clearFieldError(field) {
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('is-invalid');
    }

    static showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-danger small mt-1';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    // ===== SCROLL SUAVE =====
    static smoothScrollTo(targetId, offset = 80) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const targetPosition = targetElement.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // ===== DEBOUNCE =====
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== THROTTLE =====
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ===== GENERAR ID ÚNICO =====
    static generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ===== ESCAPAR HTML =====
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // ===== COPIAR AL PORTAPAPELES =====
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copiado al portapapeles', 'success');
            return true;
        } catch (err) {
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                this.showNotification('Copiado al portapapeles', 'success');
                return true;
            } catch (err) {
                this.showNotification('Error al copiar al portapapeles', 'error');
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    // ===== CARGAR JSON =====
    static async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error cargando JSON desde ${url}:`, error);
            throw error;
        }
    }

    // ===== GUARDAR EN LOCALSTORAGE =====
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
            return false;
        }
    }

    // ===== CARGAR DESDE LOCALSTORAGE =====
    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error cargando desde localStorage:', error);
            return defaultValue;
        }
    }

    // ===== ANIMACIÓN DE ENTRADA =====
    static setupScrollAnimations(selector = '.fade-in-on-scroll') {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll(selector).forEach(el => {
            observer.observe(el);
        });
    }

    // ===== CONFIRMACIÓN =====
    static confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="confirm-btn">Confirmar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            document.getElementById('confirm-btn').addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
        });
    }
}

// ===== FUNCIONES GLOBALES =====
// Hacer las funciones disponibles globalmente para compatibilidad
window.showNotification = Utils.showNotification.bind(Utils);
window.isValidEmail = Utils.isValidEmail.bind(Utils);
window.formatDate = Utils.formatDate.bind(Utils);
window.copyToClipboard = Utils.copyToClipboard.bind(Utils);

