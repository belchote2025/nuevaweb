// ===== SISTEMA DE GALERÍA AVANZADA =====
class AdvancedGallery {
    constructor() {
        this.galleryData = [];
        this.filteredData = [];
        this.currentFilter = 'all';
        this.currentView = 'grid';
        this.init();
    }

    async init() {
        await this.loadGalleryData();
        this.injectStyles();
        this.setupGalleryUI();
        this.setupEventListeners();
        this.renderGallery();
    }

    // ===== CARGA DE DATOS =====
    async loadGalleryData() {
        try {
            const response = await fetch('data/galeria.json');
            this.galleryData = await response.json();
            this.filteredData = [...this.galleryData];
        } catch (error) {
            console.error('Error cargando galería:', error);
            this.galleryData = [];
            this.filteredData = [];
        }
    }

    // ===== CONFIGURACIÓN DE UI =====
    setupGalleryUI() {
        const container = document.getElementById('galeria-container');
        if (!container) return;

        // Crear controles de galería
        const controlsHtml = `
            <div class="gallery-controls mb-4">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="gallery-filters">
                            <button class="btn btn-outline-primary me-2 mb-2 filter-btn active" data-filter="all">
                                <i class="fas fa-th-large me-1"></i>Todas
                            </button>
                            <button class="btn btn-outline-primary me-2 mb-2 filter-btn" data-filter="desfiles">
                                <i class="fas fa-march me-1"></i>Desfiles
                            </button>
                            <button class="btn btn-outline-primary me-2 mb-2 filter-btn" data-filter="eventos">
                                <i class="fas fa-calendar me-1"></i>Eventos
                            </button>
                            <button class="btn btn-outline-primary me-2 mb-2 filter-btn" data-filter="musica">
                                <i class="fas fa-music me-1"></i>Música
                            </button>
                            <button class="btn btn-outline-primary me-2 mb-2 filter-btn" data-filter="reuniones">
                                <i class="fas fa-users me-1"></i>Reuniones
                            </button>
                        </div>
                    </div>
                    <div class="col-md-6 text-md-end">
                        <div class="gallery-views">
                            <div class="btn-group" role="group">
                                <button class="btn btn-outline-secondary view-btn active" data-view="grid" title="Vista de cuadrícula">
                                    <i class="fas fa-th"></i>
                                </button>
                                <button class="btn btn-outline-secondary view-btn" data-view="masonry" title="Vista de mosaico">
                                    <i class="fas fa-th-large"></i>
                                </button>
                                <button class="btn btn-outline-secondary view-btn" data-view="list" title="Vista de lista">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="gallery-stats mt-3">
                    <div class="row">
                        <div class="col-md-6">
                            <span class="badge bg-primary me-2">
                                <i class="fas fa-images me-1"></i>
                                <span id="total-images">0</span> imágenes
                            </span>
                            <span class="badge bg-secondary" id="filter-info">Mostrando todas</span>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <div class="gallery-search">
                                <div class="input-group input-group-sm" style="max-width: 300px; margin-left: auto;">
                                    <input type="text" class="form-control" id="gallery-search" placeholder="Buscar en galería...">
                                    <button class="btn btn-outline-secondary" type="button" id="clear-search">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforebegin', controlsHtml);
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Vistas
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setView(e.target.dataset.view);
            });
        });

        // Búsqueda
        const searchInput = document.getElementById('gallery-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.performSearch();
            }, 300));
        }

        // Limpiar búsqueda
        const clearSearch = document.getElementById('clear-search');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                document.getElementById('gallery-search').value = '';
                this.performSearch();
            });
        }
    }

    // ===== FILTROS =====
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.applyFilters();
    }

    setView(view) {
        this.currentView = view;
        
        // Actualizar botones activos
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        this.renderGallery();
    }

    applyFilters() {
        let filtered = [...this.galleryData];

        // Filtrar por categoría
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(item => item.categoria === this.currentFilter);
        }

        // Aplicar búsqueda
        const searchTerm = document.getElementById('gallery-search').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.titulo.toLowerCase().includes(searchTerm) ||
                item.descripcion.toLowerCase().includes(searchTerm) ||
                item.categoria.toLowerCase().includes(searchTerm)
            );
        }

        this.filteredData = filtered;
        this.renderGallery();
        this.updateStats();
    }

    performSearch() {
        this.applyFilters();
    }

    // ===== RENDERIZADO =====
    renderGallery() {
        const container = document.getElementById('galeria-container');
        if (!container) return;

        if (this.filteredData.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="empty-gallery">
                        <i class="fas fa-images fa-4x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay imágenes que coincidan con los filtros</h5>
                        <p class="text-muted">Intenta cambiar los filtros o la búsqueda</p>
                    </div>
                </div>
            `;
            return;
        }

        switch (this.currentView) {
            case 'grid':
                this.renderGridView(container);
                break;
            case 'masonry':
                this.renderMasonryView(container);
                break;
            case 'list':
                this.renderListView(container);
                break;
        }

        this.setupImageModals();
        // Actualizar estadísticas tras renderizar
        this.updateStats();
    }

    renderGridView(container) {
        container.innerHTML = this.filteredData.map(item => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="gallery-item" data-gallery-id="${item.id}">
                    <div class="gallery-card">
                        <div class="gallery-image-container">
                            <img src="${item.thumb_url}" 
                                 alt="${item.titulo}" 
                                class="gallery-image"
                                 style="width:100%;height:150px;object-fit:cover;display:block;"
                                 loading="lazy">
                            <div class="gallery-overlay">
                                <div class="gallery-actions">
                                    <button class="btn btn-light btn-sm" onclick="gallerySystem.openModal('${item.id}')" title="Ver imagen">
                                        <i class="fas fa-search-plus"></i>
                                    </button>
                                    <button class="btn btn-light btn-sm" onclick="gallerySystem.downloadImage('${item.imagen_url}', '${item.titulo}')" title="Descargar">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button class="btn btn-light btn-sm" onclick="gallerySystem.shareImage('${item.id}')" title="Compartir">
                                        <i class="fas fa-share"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="gallery-info">
                            <h6 class="gallery-title">${item.titulo}</h6>
                            <p class="gallery-description">${item.descripcion}</p>
                            <div class="gallery-meta">
                                <span class="badge bg-primary">${item.categoria}</span>
                                <small class="text-muted ms-2">
                                    <i class="fas fa-calendar me-1"></i>
                                    ${new Date(item.fecha_subida).toLocaleDateString('es-ES')}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderMasonryView(container) {
        container.innerHTML = `
            <div class="masonry-container">
                ${this.filteredData.map(item => `
                    <div class="masonry-item" data-gallery-id="${item.id}">
                        <div class="gallery-card">
                            <div class="gallery-image-container">
                                <img src="${item.thumb_url}" 
                                     alt="${item.titulo}" 
                                     class="gallery-image"
                                     style="width:100%;height:auto;display:block;"
                                     loading="lazy">
                                <div class="gallery-overlay">
                                    <div class="gallery-actions">
                                        <button class="btn btn-light btn-sm" onclick="gallerySystem.openModal('${item.id}')" title="Ver imagen">
                                            <i class="fas fa-search-plus"></i>
                                        </button>
                                        <button class="btn btn-light btn-sm" onclick="gallerySystem.downloadImage('${item.imagen_url}', '${item.titulo}')" title="Descargar">
                                            <i class="fas fa-download"></i>
                                        </button>
                                        <button class="btn btn-light btn-sm" onclick="gallerySystem.shareImage('${item.id}')" title="Compartir">
                                            <i class="fas fa-share"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="gallery-info">
                                <h6 class="gallery-title">${item.titulo}</h6>
                                <p class="gallery-description">${item.descripcion}</p>
                                <div class="gallery-meta">
                                    <span class="badge bg-primary">${item.categoria}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Aplicar masonry layout
        this.initMasonry();
    }

    renderListView(container) {
        container.innerHTML = this.filteredData.map(item => `
            <div class="col-12 mb-3">
                <div class="gallery-item list-item" data-gallery-id="${item.id}">
                    <div class="card">
                        <div class="row g-0">
                            <div class="col-md-3">
                                <img src="${item.thumb_url}" 
                                     alt="${item.titulo}" 
                                     class="img-fluid rounded-start gallery-image"
                                     style="height: 150px; object-fit: cover;"
                                     loading="lazy">
                            </div>
                            <div class="col-md-9">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 class="card-title">${item.titulo}</h5>
                                            <p class="card-text">${item.descripcion}</p>
                                            <div class="gallery-meta">
                                                <span class="badge bg-primary me-2">${item.categoria}</span>
                                                <small class="text-muted">
                                                    <i class="fas fa-calendar me-1"></i>
                                                    ${new Date(item.fecha_subida).toLocaleDateString('es-ES')}
                                                </small>
                                            </div>
                                        </div>
                                        <div class="gallery-actions">
                                            <button class="btn btn-outline-primary btn-sm me-1" onclick="gallerySystem.openModal('${item.id}')">
                                                <i class="fas fa-search-plus me-1"></i>Ver
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm me-1" onclick="gallerySystem.downloadImage('${item.imagen_url}', '${item.titulo}')">
                                                <i class="fas fa-download me-1"></i>Descargar
                                            </button>
                                            <button class="btn btn-outline-info btn-sm" onclick="gallerySystem.shareImage('${item.id}')">
                                                <i class="fas fa-share me-1"></i>Compartir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ===== MASONRY LAYOUT =====
    initMasonry() {
        // Implementación simple de masonry
        const container = document.querySelector('.masonry-container');
        if (!container) return;

        container.style.columnCount = '4';
        container.style.columnGap = '1rem';
        // Asegurar que los ítems ocupen todo el ancho de la columna
        container.querySelectorAll('.masonry-item').forEach(item => {
            item.style.breakInside = 'avoid';
            item.style.marginBottom = '1rem';
        });

        // Responsive columns
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width < 768) {
                container.style.columnCount = '1';
            } else if (width < 992) {
                container.style.columnCount = '2';
            } else if (width < 1200) {
                container.style.columnCount = '3';
            } else {
                container.style.columnCount = '4';
            }
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
    }

    // ===== ESTILOS DINÁMICOS =====
    injectStyles() {
        const id = 'gallery-dynamic-styles';
        if (document.getElementById(id)) return;
        const css = `
.gallery-card{border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.7)}
.gallery-image-container{position:relative}
.gallery-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);opacity:0;transition:opacity .2s}
.gallery-image-container:hover .gallery-overlay{opacity:1}
.gallery-actions .btn{margin:0 .15rem}
@media (max-width: 767.98px){
  .gallery-image{height:130px !important;}
}
`;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ===== MODALES =====
    setupImageModals() {
        // Los modales se crean dinámicamente cuando se necesitan
    }

    openModal(imageId) {
        const image = this.filteredData.find(item => item.id == imageId);
        if (!image) return;

        const modalHtml = `
            <div class="modal fade" id="galleryModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${image.titulo}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <img src="${image.imagen_url}" 
                                 alt="${image.titulo}" 
                                 class="img-fluid rounded"
                                 style="max-height: 70vh;">
                            <div class="mt-3">
                                <p class="text-muted">${image.descripcion}</p>
                                <div class="gallery-meta">
                                    <span class="badge bg-primary me-2">${image.categoria}</span>
                                    <small class="text-muted">
                                        <i class="fas fa-calendar me-1"></i>
                                        ${new Date(image.fecha_subida).toLocaleDateString('es-ES')}
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline-secondary" onclick="gallerySystem.downloadImage('${image.imagen_url}', '${image.titulo}')">
                                <i class="fas fa-download me-2"></i>Descargar
                            </button>
                            <button class="btn btn-outline-primary" onclick="gallerySystem.shareImage('${image.id}')">
                                <i class="fas fa-share me-2"></i>Compartir
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('galleryModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('galleryModal'));
        modal.show();

        // Limpiar modal cuando se cierre
        document.getElementById('galleryModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // ===== ACCIONES =====
    downloadImage(imageUrl, title) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${title}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    shareImage(imageId) {
        const image = this.filteredData.find(item => item.id == imageId);
        if (!image) return;

        const shareData = {
            title: image.titulo,
            text: image.descripcion,
            url: window.location.href.replace(/\/[^\/]*$/, '/galeria.html')
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback: copiar al portapapeles
            const shareText = `${image.titulo}\n${image.descripcion}\n${window.location.href.replace(/\/[^\/]*$/, '/galeria.html')}`;
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Enlace copiado al portapapeles', 'success');
            });
        }
    }

    // ===== ESTADÍSTICAS =====
    updateStats() {
        const totalImages = document.getElementById('total-images');
        const filterInfo = document.getElementById('filter-info');
        const statTotal = document.getElementById('stat-total-images');
        const statEvents = document.getElementById('stat-events-count');
        const statCats = document.getElementById('stat-categories-count');
        const statYears = document.getElementById('stat-years-count');

        const total = this.galleryData.length;
        if (totalImages) totalImages.textContent = this.filteredData.length;
        if (statTotal) statTotal.textContent = String(total);
        
        // Fotos de eventos
        const eventsCount = this.galleryData.filter(i => (i.categoria || '').toLowerCase().includes('evento')).length;
        if (statEvents) statEvents.textContent = String(eventsCount);

        // Categorías distintas
        const categories = new Set(this.galleryData.map(i => i.categoria || ''));
        if (statCats) statCats.textContent = String(categories.size);

        // Años distintos en fecha_subida
        const years = new Set(this.galleryData.map(i => (i.fecha_subida || '').slice(0,4)).filter(Boolean));
        if (statYears) statYears.textContent = String(years.size);

        if (filterInfo) {
            if (this.currentFilter === 'all') {
                filterInfo.textContent = 'Mostrando todas';
            } else {
                filterInfo.textContent = `Filtro: ${this.currentFilter}`;
            }
        }
    }

    // ===== UTILIDADES =====
    debounce(func, wait) {
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

    showNotification(message, type) {
        Utils.showNotification(message, type);
    }
}

// ===== INICIALIZACIÓN =====
let gallerySystem;

document.addEventListener('DOMContentLoaded', function() {
    gallerySystem = new AdvancedGallery();
});

// ===== FUNCIONES GLOBALES =====
window.gallerySystem = gallerySystem;

