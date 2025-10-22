// ===== SISTEMA DE BÚSQUEDA GLOBAL =====
class SearchSystem {
    constructor() {
        this.searchData = [];
        this.searchResults = [];
        this.isSearching = false;
        this.init();
    }

    async init() {
        await this.loadSearchData();
        this.setupSearchUI();
        this.setupEventListeners();
    }

    // ===== CARGA DE DATOS PARA BÚSQUEDA =====
    async loadSearchData() {
        try {
            const [noticias, eventos, productos, galeria, directiva] = await Promise.all([
                this.fetchData('noticias'),
                this.fetchData('eventos'),
                this.fetchData('productos'),
                this.fetchData('galeria'),
                this.fetchData('directiva')
            ]);

            this.searchData = [
                ...noticias.map(item => ({
                    ...item,
                    type: 'noticia',
                    searchText: `${item.titulo} ${item.resumen} ${item.contenido}`.toLowerCase(),
                    url: '#noticias'
                })),
                ...eventos.map(item => ({
                    ...item,
                    type: 'evento',
                    searchText: `${item.titulo} ${item.descripcion} ${item.lugar}`.toLowerCase(),
                    url: '#eventos'
                })),
                ...productos.map(item => ({
                    ...item,
                    type: 'producto',
                    searchText: `${item.nombre} ${item.descripcion} ${item.categoria}`.toLowerCase(),
                    url: '#tienda'
                })),
                ...galeria.map(item => ({
                    ...item,
                    type: 'galeria',
                    searchText: `${item.titulo} ${item.descripcion} ${item.categoria}`.toLowerCase(),
                    url: 'galeria.html'
                })),
                ...directiva.map(item => ({
                    ...item,
                    type: 'directiva',
                    searchText: `${item.nombre} ${item.cargo} ${item.descripcion}`.toLowerCase(),
                    url: '#directiva'
                }))
            ];
        } catch (error) {
            console.error('Error cargando datos para búsqueda:', error);
        }
    }

    async fetchData(type) {
        try {
            const response = await fetch(`data/${type}.json`);
            return await response.json();
        } catch (error) {
            console.error(`Error cargando ${type}:`, error);
            return [];
        }
    }

    // ===== CONFIGURACIÓN DE UI =====
    setupSearchUI() {
        // Crear botón de búsqueda en navbar
        const navbar = document.querySelector('.navbar .container');
        if (navbar) {
            const searchButton = document.createElement('button');
            searchButton.className = 'btn btn-outline-light me-2';
            searchButton.innerHTML = '<i class="fas fa-search"></i>';
            searchButton.setAttribute('data-bs-toggle', 'modal');
            searchButton.setAttribute('data-bs-target', '#searchModal');
            searchButton.title = 'Buscar';
            
            navbar.appendChild(searchButton);
        }

        // Crear modal de búsqueda
        this.createSearchModal();
    }

    createSearchModal() {
        const modalHtml = `
            <div class="modal fade" id="searchModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-search me-2"></i>Búsqueda Global
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="search-input-container mb-3">
                                <div class="input-group">
                                    <input type="text" 
                                           class="form-control form-control-lg" 
                                           id="searchInput" 
                                           placeholder="Buscar noticias, eventos, productos, galería..."
                                           autocomplete="off">
                                    <button class="btn btn-primary" type="button" id="searchButton">
                                        <i class="fas fa-search"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="search-filters mb-3">
                                <div class="row">
                                    <div class="col-md-6">
                                        <label class="form-label">Tipo de contenido:</label>
                                        <select class="form-select" id="typeFilter">
                                            <option value="">Todos</option>
                                            <option value="noticia">Noticias</option>
                                            <option value="evento">Eventos</option>
                                            <option value="producto">Productos</option>
                                            <option value="galeria">Galería</option>
                                            <option value="directiva">Directiva</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Ordenar por:</label>
                                        <select class="form-select" id="sortFilter">
                                            <option value="relevance">Relevancia</option>
                                            <option value="date">Fecha</option>
                                            <option value="title">Título</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="searchResults" class="search-results">
                                <div class="text-center text-muted">
                                    <i class="fas fa-search fa-3x mb-3"></i>
                                    <p>Escribe algo para buscar en todo el sitio</p>
                                </div>
                            </div>
                            
                            <div id="searchLoading" class="text-center" style="display: none;">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Buscando...</span>
                                </div>
                                <p class="mt-2">Buscando...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const typeFilter = document.getElementById('typeFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (searchInput) {
            // Búsqueda en tiempo real
            searchInput.addEventListener('input', this.debounce(() => {
                this.performSearch();
            }, 300));

            // Búsqueda con Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.performSearch();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.performSearch();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.performSearch();
            });
        }

        // Limpiar búsqueda al cerrar modal
        document.getElementById('searchModal').addEventListener('hidden.bs.modal', () => {
            this.clearSearch();
        });
    }

    // ===== BÚSQUEDA =====
    performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        const typeFilter = document.getElementById('typeFilter').value;
        const sortFilter = document.getElementById('sortFilter').value;

        if (!query) {
            this.showEmptyState();
            return;
        }

        this.showLoading();
        this.isSearching = true;

        // Simular delay para UX
        setTimeout(() => {
            this.searchResults = this.search(query, typeFilter, sortFilter);
            this.displayResults();
            this.isSearching = false;
        }, 200);
    }

    search(query, typeFilter = '', sortFilter = 'relevance') {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        let results = this.searchData.filter(item => {
            // Filtrar por tipo si se especifica
            if (typeFilter && item.type !== typeFilter) {
                return false;
            }

            // Buscar coincidencias
            return searchTerms.some(term => 
                item.searchText.includes(term) ||
                item.titulo?.toLowerCase().includes(term) ||
                item.nombre?.toLowerCase().includes(term)
            );
        });

        // Calcular relevancia
        results = results.map(item => ({
            ...item,
            relevance: this.calculateRelevance(item, searchTerms)
        }));

        // Ordenar resultados
        results = this.sortResults(results, sortFilter);

        return results.slice(0, 20); // Limitar a 20 resultados
    }

    calculateRelevance(item, searchTerms) {
        let score = 0;
        const title = (item.titulo || item.nombre || '').toLowerCase();
        const content = item.searchText;

        searchTerms.forEach(term => {
            // Puntuación por coincidencia en título
            if (title.includes(term)) {
                score += 10;
            }

            // Puntuación por coincidencia en contenido
            if (content.includes(term)) {
                score += 1;
            }

            // Puntuación por coincidencia exacta
            if (title === term) {
                score += 20;
            }
        });

        return score;
    }

    sortResults(results, sortFilter) {
        switch (sortFilter) {
            case 'date':
                return results.sort((a, b) => {
                    const dateA = new Date(a.fecha_publicacion || a.fecha || a.fecha_subida || 0);
                    const dateB = new Date(b.fecha_publicacion || b.fecha || b.fecha_subida || 0);
                    return dateB - dateA;
                });
            case 'title':
                return results.sort((a, b) => {
                    const titleA = (a.titulo || a.nombre || '').toLowerCase();
                    const titleB = (b.titulo || b.nombre || '').toLowerCase();
                    return titleA.localeCompare(titleB);
                });
            default: // relevance
                return results.sort((a, b) => b.relevance - a.relevance);
        }
    }

    // ===== MOSTRAR RESULTADOS =====
    displayResults() {
        const resultsContainer = document.getElementById('searchResults');
        
        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-search fa-3x mb-3"></i>
                    <p>No se encontraron resultados para tu búsqueda</p>
                    <small>Intenta con otros términos o revisa la ortografía</small>
                </div>
            `;
            return;
        }

        const resultsHtml = `
            <div class="search-results-header mb-3">
                <h6>${this.searchResults.length} resultado${this.searchResults.length !== 1 ? 's' : ''} encontrado${this.searchResults.length !== 1 ? 's' : ''}</h6>
            </div>
            <div class="search-results-list">
                ${this.searchResults.map(result => this.createResultCard(result)).join('')}
            </div>
        `;

        resultsContainer.innerHTML = resultsHtml;
    }

    createResultCard(result) {
        const typeIcons = {
            'noticia': 'newspaper',
            'evento': 'calendar',
            'producto': 'shopping-cart',
            'galeria': 'images',
            'directiva': 'users'
        };

        const typeColors = {
            'noticia': 'primary',
            'evento': 'success',
            'producto': 'warning',
            'galeria': 'info',
            'directiva': 'secondary'
        };

        const icon = typeIcons[result.type] || 'file';
        const color = typeColors[result.type] || 'secondary';
        const title = result.titulo || result.nombre || 'Sin título';
        const description = result.resumen || result.descripcion || '';
        const date = result.fecha_publicacion || result.fecha || result.fecha_subida || '';

        return `
            <div class="search-result-card card mb-3" onclick="searchSystem.openResult('${result.url}', '${result.type}', '${result.id}')">
                <div class="card-body">
                    <div class="d-flex align-items-start">
                        <div class="flex-shrink-0 me-3">
                            <div class="search-result-icon bg-${color} text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                <i class="fas fa-${icon}"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h6 class="card-title mb-0">${title}</h6>
                                <span class="badge bg-${color}">${result.type}</span>
                            </div>
                            <p class="card-text text-muted small mb-2">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                            ${date ? `<small class="text-muted"><i class="fas fa-calendar me-1"></i>${new Date(date).toLocaleDateString('es-ES')}</small>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== ACCIONES =====
    openResult(url, type, id) {
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('searchModal'));
        modal.hide();

        // Navegar a la sección
        if (url.startsWith('#')) {
            const targetElement = document.querySelector(url);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Destacar el elemento encontrado
        setTimeout(() => {
            this.highlightResult(type, id);
        }, 500);
    }

    highlightResult(type, id) {
        // Remover highlights anteriores
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });

        // Buscar y destacar el elemento
        const resultElement = document.querySelector(`[data-${type}-id="${id}"]`);
        if (resultElement) {
            resultElement.classList.add('search-highlight');
            resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Remover highlight después de 3 segundos
            setTimeout(() => {
                resultElement.classList.remove('search-highlight');
            }, 3000);
        }
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('sortFilter').value = 'relevance';
        this.showEmptyState();
    }

    showEmptyState() {
        document.getElementById('searchResults').innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-search fa-3x mb-3"></i>
                <p>Escribe algo para buscar en todo el sitio</p>
            </div>
        `;
    }

    showLoading() {
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('searchLoading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('searchResults').style.display = 'block';
        document.getElementById('searchLoading').style.display = 'none';
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
}

// ===== INICIALIZACIÓN =====
let searchSystem;

document.addEventListener('DOMContentLoaded', function() {
    searchSystem = new SearchSystem();
});

// ===== FUNCIONES GLOBALES =====
window.searchSystem = searchSystem;

