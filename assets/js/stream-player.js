/**
 * Stream Player - Maneja la reproducción de enlaces de streaming
 * 
 * Uso:
 * 1. Incluir este archivo en tu HTML
 * 2. Asegurarte de tener un elemento con id="stream-container"
 * 3. Inicializar con: new StreamPlayer('stream-container', { contentId: 123 });
 */

class StreamPlayer {
    constructor(containerId, options = {}) {
        // Configuración predeterminada
        this.config = {
            apiUrl: '/api/stream.php',
            contentId: null,
            autoLoad: true,
            showFilters: true,
            showReportButton: true,
            ...options
        };
        
        // Elementos del DOM
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('No se encontró el contenedor con el ID especificado');
            return;
        }
        
        // Estado de la aplicación
        this.state = {
            links: [],
            filteredLinks: [],
            filters: {
                quality: 'all',
                provider: 'all'
            },
            loading: false,
            error: null
        };
        
        // Inicialización
        this.init();
    }
    
    async init() {
        // Renderizar la interfaz de usuario
        this.render();
        
        // Cargar enlaces si está configurado para hacerlo automáticamente
        if (this.config.autoLoad && this.config.contentId) {
            await this.loadLinks(this.config.contentId);
        }
        
        // Configurar manejadores de eventos
        this.setupEventListeners();
    }
    
    async loadLinks(contentId) {
        try {
            this.setState({ loading: true, error: null });
            
            const response = await fetch(`${this.config.apiUrl}/links?content_id=${contentId}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error al cargar los enlaces');
            }
            
            this.setState({ 
                links: result.data || [],
                filteredLinks: result.data || [],
                loading: false 
            });
            
        } catch (error) {
            console.error('Error al cargar enlaces:', error);
            this.setState({ 
                error: error.message || 'Ocurrió un error al cargar los enlaces',
                loading: false
            });
        }
    }
    
    async playLink(linkId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const linkElement = event?.currentTarget;
        const originalHtml = linkElement?.innerHTML;
        
        try {
            // Mostrar estado de carga
            if (linkElement) {
                linkElement.disabled = true;
                linkElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            }
            
            // Obtener URL de reproducción
            const response = await fetch(`${this.config.apiUrl}/stream?id=${linkId}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error al obtener el enlace de reproducción');
            }
            
            // Abrir en una nueva pestaña
            window.open(result.url, '_blank');
            
        } catch (error) {
            console.error('Error al reproducir:', error);
            this.showToast(error.message || 'No se pudo reproducir el enlace', 'error');
        } finally {
            // Restaurar el botón
            if (linkElement) {
                linkElement.disabled = false;
                linkElement.innerHTML = originalHtml;
            }
        }
    }
    
    async reportLink(linkId, reason, message = '') {
        try {
            const response = await fetch(`${this.config.apiUrl}/report?id=${linkId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason, message })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error al reportar el enlace');
            }
            
            this.showToast('Reporte enviado correctamente', 'success');
            return true;
            
        } catch (error) {
            console.error('Error al reportar enlace:', error);
            this.showToast(error.message || 'Error al enviar el reporte', 'error');
            return false;
        }
    }
    
    applyFilters() {
        const { links, filters } = this.state;
        
        let filtered = [...links];
        
        // Filtrar por calidad
        if (filters.quality !== 'all') {
            filtered = filtered.filter(link => link.quality === filters.quality);
        }
        
        // Filtrar por proveedor
        if (filters.provider !== 'all') {
            filtered = filtered.filter(link => link.provider === filters.provider);
        }
        
        this.setState({ filteredLinks: filtered });
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
    
    setFilter(filter, value) {
        this.state.filters[filter] = value;
        this.applyFilters();
    }
    
    showToast(message, type = 'info') {
        // Implementación básica de notificación toast
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    setupEventListeners() {
        // Delegación de eventos para los botones de reproducción
        this.container.addEventListener('click', (event) => {
            const playButton = event.target.closest('.play-button');
            if (playButton) {
                const linkId = playButton.dataset.linkId;
                if (linkId) {
                    this.playLink(linkId, event);
                }
            }
            
            // Manejar filtros de calidad
            const qualityFilter = event.target.closest('[data-filter-quality]');
            if (qualityFilter) {
                const quality = qualityFilter.dataset.filterQuality;
                this.setFilter('quality', quality);
            }
            
            // Manejar filtros de proveedor
            const providerFilter = event.target.closest('[data-filter-provider]');
            if (providerFilter) {
                const provider = providerFilter.dataset.filterProvider;
                this.setFilter('provider', provider);
            }
            
            // Manejar botones de reporte
            const reportButton = event.target.closest('.report-button');
            if (reportButton) {
                const linkId = reportButton.dataset.linkId;
                if (linkId) {
                    this.showReportModal(linkId);
                }
            }
        });
    }
    
    showReportModal(linkId) {
        // Crear el modal de reporte
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Reportar enlace</h3>
                <p>Selecciona el motivo del reporte:</p>
                <select id="report-reason" class="form-control mb-3">
                    <option value="dead_link">Enlace caído</option>
                    <option value="wrong_content">Contenido incorrecto</option>
                    <option value="poor_quality">Mala calidad</option>
                    <option value="other">Otro</option>
                </select>
                <textarea id="report-message" class="form-control mb-3" 
                    placeholder="Proporciona más detalles (opcional)" rows="3"></textarea>
                <div class="modal-actions">
                    <button class="btn btn-secondary cancel-report">Cancelar</button>
                    <button class="btn btn-danger submit-report">Enviar reporte</button>
                </div>
            </div>
        `;
        
        // Agregar el modal al DOM
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Configurar eventos del modal
        const cancelButton = modal.querySelector('.cancel-report');
        const submitButton = modal.querySelector('.submit-report');
        
        const closeModal = () => {
            document.body.style.overflow = '';
            modal.remove();
        };
        
        cancelButton.addEventListener('click', closeModal);
        
        submitButton.addEventListener('click', async () => {
            const reason = modal.querySelector('#report-reason').value;
            const message = modal.querySelector('#report-message').value;
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            
            const success = await this.reportLink(linkId, reason, message);
            
            if (success) {
                closeModal();
            } else {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar reporte';
            }
        });
        
        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    render() {
        const { loading, error, filteredLinks, filters } = this.state;
        
        // Si está cargando, mostrar indicador de carga
        if (loading) {
            this.container.innerHTML = `
                <div class="loading-container">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p>Cargando enlaces...</p>
                </div>
            `;
            return;
        }
        
        // Si hay un error, mostrarlo
        if (error) {
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${error}
                    <button class="btn btn-sm btn-outline-dark ms-3" onclick="location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
            return;
        }
        
        // Si no hay enlaces, mostrar mensaje
        if (filteredLinks.length === 0) {
            this.container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron enlaces disponibles.
                </div>
            `;
            return;
        }
        
        // Renderizar la interfaz de usuario
        let html = `
            ${this.config.showFilters ? `
            <div class="stream-filters mb-4">
                <div class="btn-group btn-group-sm me-3" role="group">
                    <button type="button" 
                            class="btn ${filters.quality === 'all' ? 'btn-primary' : 'btn-outline-primary'}"
                            data-filter-quality="all">
                        Todas las calidades
                    </button>
                    <button type="button" 
                            class="btn ${filters.quality === '1080p' ? 'btn-primary' : 'btn-outline-primary'}"
                            data-filter-quality="1080p">
                        1080p
                    </button>
                    <button type="button" 
                            class="btn ${filters.quality === '720p' ? 'btn-primary' : 'btn-outline-primary'}"
                            data-filter-quality="720p">
                        720p
                    </button>
                    <button type="button" 
                            class="btn ${filters.quality === '480p' ? 'btn-primary' : 'btn-outline-primary'}"
                            data-filter-quality="480p">
                        480p
                    </button>
                </div>
                
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" 
                            class="btn ${filters.provider === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}"
                            data-filter-provider="all">
                        Todos
                    </button>
                    <button type="button" 
                            class="btn ${filters.provider === 'gdrive' ? 'btn-secondary' : 'btn-outline-secondary'}"
                            data-filter-provider="gdrive">
                        <i class="fab fa-google-drive me-1"></i> Drive
                    </button>
                    <button type="button" 
                            class="btn ${filters.provider === 'mega' ? 'btn-secondary' : 'btn-outline-secondary'}"
                            data-filter-provider="mega">
                        <i class="fas fa-hdd me-1"></i> MEGA
                    </button>
                    <button type="button" 
                            class="btn ${filters.provider === 'uptobox' ? 'btn-secondary' : 'btn-outline-secondary'}"
                            data-filter-provider="uptobox">
                        <i class="fas fa-cloud me-1"></i> Uptobox
                    </button>
                </div>
            </div>
            ` : ''}
            
            <div class="row g-3" id="links-container">
        `;
        
        // Agregar tarjetas de enlaces
        filteredLinks.forEach(link => {
            const providerIcons = {
                'gdrive': 'fab fa-google-drive',
                'mega': 'fas fa-hdd',
                'uptobox': 'fas fa-cloud',
                'mediafire': 'fas fa-file-archive',
                'direct': 'fas fa-link'
            };
            
            const providerNames = {
                'gdrive': 'Google Drive',
                'mega': 'MEGA',
                'uptobox': 'Uptobox',
                'mediafire': 'MediaFire',
                'direct': 'Enlace directo'
            };
            
            html += `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <div class="provider-badge mb-2">
                                <i class="${providerIcons[link.provider] || 'fas fa-film'}"></i>
                                ${providerNames[link.provider] || link.provider}
                            </div>
                            
                            <div class="quality-badge mb-3">
                                <i class="fas fa-tv me-1"></i>
                                ${link.quality}
                            </div>
                            
                            <button class="btn btn-primary btn-lg w-100 play-button mb-2" 
                                    data-link-id="${link.id}">
                                <i class="fas fa-play me-2"></i> Reproducir
                            </button>
                            
                            <div class="link-stats small text-muted mt-2">
                                <div><i class="fas fa-eye me-1"></i> ${link.view_count || 0} vistas</div>
                                ${link.last_viewed ? `
                                    <div class="mt-1">
                                        <i class="far fa-clock me-1"></i> 
                                        ${this.formatTimeAgo(link.last_viewed)}
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${this.config.showReportButton ? `
                                <button class="btn btn-link btn-sm text-danger mt-2 report-button" 
                                        data-link-id="${link.id}"
                                        title="Reportar problema">
                                    <i class="fas fa-flag"></i> Reportar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
        `;
        
        this.container.innerHTML = html;
    }
    
    formatTimeAgo(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (isNaN(seconds)) return '';
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60,
            segundo: 1
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? 
                    `hace 1 ${unit}` : 
                    `hace ${interval} ${unit}${interval !== 1 ? 's' : ''}`;
            }
        }
        
        return 'ahora mismo';
    }
}

// Inicialización automática si hay un contenedor con id="stream-player"
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('stream-player');
    if (container) {
        const contentId = container.dataset.contentId;
        new StreamPlayer('stream-player', { 
            contentId: contentId || null,
            autoLoad: true,
            showFilters: true,
            showReportButton: true
        });
    }
});
