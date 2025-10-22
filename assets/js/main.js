// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    DATA_BASE_URL: 'data/',
    API_BASE_URL: 'api/',
    SITE_NAME: 'Filá Mariscales de Caballeros Templarios',
    VERSION: '2.0.0'
};

// ===== CLASE PRINCIPAL DE LA APLICACIÓN =====
class FilaMariscalesApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.setupSmoothScrolling();
        this.setupNavbarScroll();
        this.setupFormHandlers();
        this.setupAnimations();
    }

    // ===== CONFIGURACIÓN DE EVENTOS =====
    setupEventListeners() {
        // Formulario de contacto
        const contactoForm = document.getElementById('contacto-form');
        if (contactoForm) {
            contactoForm.addEventListener('submit', this.handleContactForm.bind(this));
        }

        // Botones de navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', this.handleNavClick.bind(this));
        });

        // Mejorar comportamiento del menú hamburguesa
        this.setupMobileMenu();

        // Eventos de scroll
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    setupMobileMenu() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        if (navbarToggler && navbarCollapse) {
            // Mejorar el comportamiento del toggler
            navbarToggler.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Menú hamburguesa clickeado');
            });

            // Cerrar menú al hacer clic fuera con verificación de elementos
            document.addEventListener('click', (e) => {
                try {
                    if (navbarCollapse && navbarToggler && 
                        !navbarCollapse.contains(e.target) && 
                        !navbarToggler.contains(e.target)) {
                        if (navbarCollapse.classList.contains('show')) {
                            navbarToggler.click();
                        }
                    }
                } catch (error) {
                    console.warn('Error cerrando menú:', error);
                }
            });

            // Mejorar dropdowns en móvil con verificación
            this.setupDropdowns();

            // Cerrar dropdowns al hacer clic fuera con verificación
            document.addEventListener('click', (e) => {
                try {
                    if (!e.target.closest('.dropdown')) {
                        const openMenus = document.querySelectorAll('.dropdown-menu.show');
                        openMenus.forEach(menu => {
                            if (menu && menu.classList) {
                                menu.classList.remove('show');
                            }
                        });
                    }
                } catch (error) {
                    console.warn('Error cerrando dropdowns:', error);
                }
            });
        }
    }

    setupDropdowns() {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        dropdownToggles.forEach(toggle => {
            if (toggle) {
                // Remover todos los event listeners existentes
                const newToggle = toggle.cloneNode(true);
                toggle.parentNode.replaceChild(newToggle, toggle);
                
                // Remover atributos de Bootstrap
                newToggle.removeAttribute('data-bs-toggle');
                newToggle.removeAttribute('data-bs-auto-close');
                newToggle.removeAttribute('aria-expanded');
                
                newToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('Dropdown clickeado:', newToggle.textContent.trim());
                    
                    const dropdown = newToggle.nextElementSibling;
                    if (dropdown && dropdown.classList) {
                        // Cerrar otros dropdowns
                        const openMenus = document.querySelectorAll('.dropdown-menu.show');
                        openMenus.forEach(menu => {
                            if (menu && menu !== dropdown && menu.classList) {
                                menu.classList.remove('show');
                            }
                        });
                        
                        // Toggle el dropdown actual
                        dropdown.classList.toggle('show');
                        console.log('Dropdown toggled:', dropdown.classList.contains('show'));
                        
                        // Forzar visibilidad con timeout
                        if (dropdown.classList.contains('show')) {
                            setTimeout(() => {
                                dropdown.style.display = 'block';
                                dropdown.style.opacity = '1';
                                dropdown.style.visibility = 'visible';
                            }, 10);
                        }
                    }
                });
            }
        });
    }

    // ===== CARGA DE DATOS INICIALES =====
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadTextos(),
                this.loadCarousel(),
                this.loadDirectiva(),
                this.loadNoticias(),
                this.loadBlog(),
                this.loadCalendario(),
                this.loadProximosEventos(),
                this.loadGaleria(),
                this.loadMusica(),
                this.loadLibro(),
                this.loadDescargas(),
                this.loadProductos(),
                this.loadPatrocinadores(),
                this.loadHermanamientos(),
                this.loadSocios(),
                this.loadEventos(),
                this.loadFondos()
            ]);
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showError('Error al cargar los datos. Por favor, recarga la página.');
        }
    }

    // ===== CARRUSEL HOME =====
    async loadCarousel() {
        const container = document.getElementById('home-carousel');
        if (!container) {
            console.log('Carousel container not found');
            return;
        }

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}carousel.json`);
            if (!response.ok) throw new Error('Failed to load carousel data');
            const data = await response.json();
            if (data && Array.isArray(data.slides)) {
                this.renderCarousel(data, container);
            } else {
                throw new Error('Invalid carousel data format');
            }
        } catch (error) {
            console.error('Error loading carousel:', error);
            this.renderCarouselDefault(container);
        }
    }

    renderCarousel(data, container) {
        const { config, slides } = data;
        
        if (!slides || slides.length === 0) {
            container.innerHTML = '';
            return;
        }

        const carouselId = 'carouselHome';
        const indicators = config.show_indicators ? slides.map((s, i) => `
            <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${i}" ${s.activo || i === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${i+1}"></button>
        `).join('') : '';

        const items = slides.map((s, i) => `
            <div class="carousel-item ${s.activo || i === 0 ? 'active' : ''}">
                <img src="${s.imagen_url}" class="carousel-image" alt="${s.titulo}" onerror="this.src='https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'">
                <div class="carousel-overlay" style="opacity: ${s.overlay_opacity || 0.4};"></div>
                <div class="carousel-caption d-none d-md-block">
                    <div class="carousel-content">
                        <h2 class="display-4 fw-bold mb-3 carousel-title">${s.titulo}</h2>
                        <p class="lead mb-4 carousel-subtitle">${s.subtitulo || ''}</p>
                        ${s.enlace ? `<a href="${s.enlace}" class="btn btn-primary btn-lg carousel-btn">
                            <i class="fas fa-arrow-right me-2"></i>${s.texto_boton || 'Ver más'}
                        </a>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        const controls = config.show_controls ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Anterior</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Siguiente</span>
            </button>
        ` : '';

        container.innerHTML = `
            <div id="${carouselId}" 
                 class="carousel slide" 
                 data-bs-ride="${config.auto_slide ? 'carousel' : 'false'}"
                 data-bs-interval="${config.interval || 5000}"
                 data-bs-pause="${config.pause_on_hover ? 'hover' : 'false'}">
                ${indicators ? `<div class="carousel-indicators">${indicators}</div>` : ''}
                <div class="carousel-inner">
                    ${items}
                </div>
                ${controls}
            </div>
        `;

        // Configurar eventos personalizados
        this.setupCarouselEvents(carouselId, config);
    }

    setupCarouselEvents(carouselId, config) {
        const carousel = document.getElementById(carouselId);
        if (!carousel) return;

        // Pausar en hover si está configurado
        if (config.pause_on_hover) {
            carousel.addEventListener('mouseenter', () => {
                const bsCarousel = bootstrap.Carousel.getInstance(carousel);
                if (bsCarousel) bsCarousel.pause();
            });

            carousel.addEventListener('mouseleave', () => {
                const bsCarousel = bootstrap.Carousel.getInstance(carousel);
                if (bsCarousel && config.auto_slide) bsCarousel.cycle();
            });
        }

        // Efectos de transición personalizados con verificación de elementos
        carousel.addEventListener('slide.bs.carousel', (e) => {
            try {
                const activeItem = e.target.querySelector('.carousel-item.active');
                const nextItem = e.relatedTarget;
                
                // Verificar que los elementos existen antes de manipular classList
                if (activeItem && activeItem.classList) {
                    activeItem.classList.add('fade-out');
                }
                if (nextItem && nextItem.classList) {
                    nextItem.classList.add('fade-in');
                }
            } catch (error) {
                console.warn('Error en transición del carrusel:', error);
            }
        });

        carousel.addEventListener('slid.bs.carousel', (e) => {
            try {
                // Limpiar clases de animación con verificación
                const items = e.target.querySelectorAll('.carousel-item');
                items.forEach(item => {
                    if (item && item.classList) {
                        item.classList.remove('fade-out', 'fade-in');
                    }
                });
            } catch (error) {
                console.warn('Error limpiando animaciones del carrusel:', error);
            }
        });
    }

    handleCarouselClick(enlace) {
        // Manejar clics en botones del carrusel
        if (enlace.startsWith('#')) {
            const targetElement = document.querySelector(enlace);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.location.href = enlace;
        }
    }

    // ===== CARGA DE DIRECTIVA =====
    async loadDirectiva() {
        const container = document.getElementById('directiva-container');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}directiva.json`);
            const directiva = await response.json();
            this.renderDirectiva(directiva, container);
        } catch (error) {
            console.error('Error cargando directiva:', error);
            this.renderDirectivaDefault(container);
        }
    }

    renderDirectiva(directiva, container) {
        container.innerHTML = directiva.map(miembro => `
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card h-100 text-center">
                    <img src="${miembro.imagen}" class="card-img-top" alt="${miembro.nombre}" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${miembro.nombre}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${miembro.cargo}</h6>
                        <p class="card-text">${miembro.descripcion}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderDirectivaDefault(container) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">Información de la directiva no disponible en este momento.</p>
            </div>
        `;
    }

    // ===== CARGA DE NOTICIAS =====
    async loadNoticias() {
        const container = document.getElementById('noticias-container');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}noticias.json`);
            const noticias = await response.json();
            this.renderNoticias(noticias, container);
        } catch (error) {
            console.error('Error cargando noticias:', error);
            this.renderNoticiasDefault(container);
        }
    }

    renderNoticias(noticias, container) {
        container.innerHTML = noticias.map(noticia => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100">
                    <img src="${noticia.imagen_url}" class="card-img-top" alt="${noticia.titulo}" style="height: 200px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${noticia.titulo}</h5>
                        <p class="card-text flex-grow-1">${noticia.resumen}</p>
                        <div class="card-footer bg-transparent border-0 p-0 mt-auto">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                ${this.formatDate(noticia.fecha_publicacion)}
                            </small>
                            <button class="btn btn-primary btn-sm float-end" onclick="app.showNoticiaModal('${noticia.titulo}', '${noticia.contenido}')">
                                Leer más
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderNoticiasDefault(container) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No hay noticias disponibles en este momento.</p>
            </div>
        `;
    }

    // ===== CARGA DE BLOG =====
    async loadBlog() {
        const container = document.getElementById('blog-container');
        if (!container) return;

        try {
            // Usar las noticias como artículos del blog
            const response = await fetch(`${CONFIG.DATA_BASE_URL}noticias.json`);
            const noticias = await response.json();
            this.renderBlog(noticias, container);
        } catch (error) {
            console.error('Error cargando blog:', error);
            this.renderBlogDefault(container);
        }
    }

    renderBlog(articulos, container) {
        container.innerHTML = articulos.map(articulo => `
            <div class="col-lg-6 mb-4">
                <div class="card h-100">
                    <img src="${articulo.imagen_url}" class="card-img-top" alt="${articulo.titulo}" style="height: 200px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                    <div class="card-body">
                        <h5 class="card-title">${articulo.titulo}</h5>
                        <p class="card-text">${articulo.resumen}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${this.formatDate(articulo.fecha_publicacion)}</small>
                            <button class="btn btn-outline-primary btn-sm" onclick="app.showNoticiaModal('${articulo.titulo}', '${articulo.contenido}')">
                                Leer artículo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderBlogDefault(container) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No hay artículos del blog disponibles en este momento.</p>
            </div>
        `;
    }

    // ===== CARGA DE CALENDARIO =====
    async loadCalendario() {
        const container = document.getElementById('calendar-container');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}eventos.json`);
            const eventos = await response.json();
            this.renderCalendario(eventos, container);
        } catch (error) {
            console.error('Error cargando calendario:', error);
            this.renderCalendarioDefault(container);
        }
    }

    // ===== CARGA DE PRÓXIMOS EVENTOS =====
    async loadProximosEventos() {
        const container = document.getElementById('proximos-eventos');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}eventos.json`);
            if (!response.ok) throw new Error('Error cargando eventos');
            const eventos = await response.json();
            
            // Filtrar eventos futuros y ordenar por fecha
            const hoy = new Date();
            const eventosFuturos = eventos
                .filter(evento => {
                    const fechaEvento = new Date(evento.fecha);
                    return fechaEvento >= hoy;
                })
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                .slice(0, 6); // Mostrar solo los próximos 6 eventos

            this.renderProximosEventos(eventosFuturos, container);
        } catch (error) {
            console.error('Error cargando próximos eventos:', error);
            this.renderProximosEventosError(container);
        }
    }

    renderProximosEventos(eventos, container) {
        if (eventos.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No hay próximos eventos programados.
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = eventos.map(evento => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">${evento.titulo}</h5>
                            <span class="badge bg-primary">${new Date(evento.fecha).toLocaleDateString('es-ES')}</span>
                        </div>
                        <p class="card-text text-muted">${evento.descripcion}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-map-marker-alt me-1"></i>
                                ${evento.ubicacion || 'Ubicación por confirmar'}
                            </small>
                            <a href="eventos.html" class="btn btn-outline-primary btn-sm">
                                Ver detalles
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderProximosEventosError(container) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los próximos eventos. Por favor, intenta de nuevo.
                </div>
            </div>
        `;
    }

    renderCalendario(eventos, container) {
        const eventosPorMes = this.groupEventsByMonth(eventos);
        
        container.innerHTML = `
            <div class="calendar-wrapper">
                ${Object.entries(eventosPorMes).map(([mes, eventosMes]) => `
                    <div class="month-section mb-4">
                        <h4 class="month-title">${mes}</h4>
                        <div class="row">
                            ${eventosMes.map(evento => `
                                <div class="col-md-6 mb-3">
                                    <div class="event-card p-3 border rounded">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 class="mb-1">${evento.titulo}</h6>
                                                <p class="mb-1 text-muted small">${evento.descripcion}</p>
                                                <small class="text-muted">
                                                    <i class="fas fa-clock me-1"></i>${evento.hora}
                                                    <i class="fas fa-map-marker-alt ms-2 me-1"></i>${evento.lugar}
                                                </small>
                                            </div>
                                            <span class="badge bg-primary">${this.formatDate(evento.fecha)}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderCalendarioDefault(container) {
        container.innerHTML = `
            <div class="text-center">
                <p class="text-muted">No hay eventos programados en este momento.</p>
            </div>
        `;
    }

    // ===== CARGA DE GALERÍA =====
    async loadGaleria() {
        const container = document.getElementById('galeria-container');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}galeria.json`);
            const galeria = await response.json();
            this.renderGaleria(galeria, container);
        } catch (error) {
            console.error('Error cargando galería:', error);
            this.renderGaleriaDefault(container);
        }
    }

    renderGaleria(imagenes, container) {
        // Separar imágenes con y sin videos de YouTube
        const imagenesConVideo = imagenes.filter(img => img.youtube_url);
        const imagenesSinVideo = imagenes.filter(img => !img.youtube_url);
        
        container.innerHTML = `
            <!-- Galería de Imágenes -->
            <div class="col-12 mb-5">
                <h4 class="mb-4"><i class="fas fa-images me-2"></i>Galería de Imágenes</h4>
                <div class="row">
                    ${imagenesSinVideo.map(imagen => `
                        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                            <div class="card h-100">
                                <div class="gallery-item position-relative" onclick="app.showImageModal('${imagen.imagen_url}', '${imagen.titulo}')">
                                    <img src="${imagen.imagen_url}" alt="${imagen.titulo}" class="card-img-top" style="height: 200px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
                                    <div class="gallery-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s;">
                                        <i class="fas fa-search-plus text-white fa-2x"></i>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h6 class="card-title">${imagen.titulo}</h6>
                                    <p class="card-text text-muted small">${imagen.descripcion}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">${new Date(imagen.fecha_subida).toLocaleDateString('es-ES')}</small>
                                        <span class="badge bg-primary">${imagen.categoria}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Videos de YouTube -->
            ${imagenesConVideo.length > 0 ? `
                <div class="col-12">
                    <h4 class="mb-4"><i class="fab fa-youtube me-2 text-danger"></i>Videos de YouTube</h4>
                    <div class="row">
                        ${imagenesConVideo.map(imagen => `
                            <div class="col-lg-6 mb-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">${imagen.titulo}</h6>
                                        <p class="card-text text-muted small">${imagen.descripcion}</p>
                                        <div class="ratio ratio-16x9">
                                            <iframe src="${this.getYouTubeEmbedUrl(imagen.youtube_url)}" 
                                                    title="${imagen.titulo}" 
                                                    frameborder="0" 
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                    allowfullscreen>
                                            </iframe>
                                        </div>
                                        <div class="mt-2 d-flex justify-content-between align-items-center">
                                            <small class="text-muted">${new Date(imagen.fecha_subida).toLocaleDateString('es-ES')}</small>
                                            <span class="badge bg-danger">${imagen.categoria}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    renderGaleriaDefault(container) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No hay imágenes disponibles en la galería.</p>
            </div>
        `;
    }

    // ===== CARGA DE MÚSICA =====
    async loadMusica() {
        const container = document.getElementById('musica-container');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}musica.json`);
            if (!response.ok) throw new Error('Error cargando datos musicales');
            const musicaData = await response.json();
            this.renderMusica(musicaData, container);
        } catch (error) {
            console.error('Error cargando música:', error);
            this.renderMusicaDefault(container);
        }
    }

    renderMusica(data, container) {
        const { banda, repertorio, actuaciones, instrumentos } = data;
        
        container.innerHTML = `
            <!-- Información de la Banda -->
            <div class="col-12 mb-5">
                <div class="card">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <img src="${banda.imagen}" class="img-fluid rounded-start h-100" alt="${banda.nombre}" style="object-fit: cover;">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h4 class="card-title">${banda.nombre}</h4>
                                <p class="card-text">${banda.descripcion}</p>
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Director:</strong> ${banda.director}</p>
                                        <p><strong>Fundación:</strong> ${banda.fundacion}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Miembros:</strong> ${banda.miembros} músicos</p>
                                        <p><strong>Instrumentos:</strong> ${instrumentos.length} tipos</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Repertorio Musical -->
            <div class="col-12 mb-5">
                <h4 class="mb-4"><i class="fas fa-music me-2"></i>Repertorio Musical</h4>
                <div class="row">
                    ${repertorio.map(pieza => `
                        <div class="col-lg-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h6 class="card-title mb-0">${pieza.titulo}</h6>
                                        ${pieza.favorita ? '<span class="badge bg-warning"><i class="fas fa-star"></i> Favorita</span>' : ''}
                                    </div>
                                    <p class="card-text text-muted small">${pieza.descripcion}</p>
                                    <div class="row">
                                        <div class="col-6">
                                            <small><strong>Compositor:</strong> ${pieza.compositor}</small><br>
                                            <small><strong>Año:</strong> ${pieza.año}</small>
                                        </div>
                                        <div class="col-6">
                                            <small><strong>Duración:</strong> ${pieza.duracion}</small><br>
                                            <small><strong>Tipo:</strong> ${pieza.tipo}</small>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        ${pieza.audio_url ? `
                                            <button class="btn btn-outline-primary btn-sm me-2" onclick="app.playAudio('${pieza.audio_url}', '${pieza.titulo}')">
                                                <i class="fas fa-play me-1"></i>Reproducir
                                            </button>
                                        ` : ''}
                                        ${pieza.youtube_url ? `
                                            <a href="${pieza.youtube_url}" target="_blank" class="btn btn-outline-danger btn-sm">
                                                <i class="fab fa-youtube me-1"></i>Ver en YouTube
                                            </a>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Próximas Actuaciones -->
            <div class="col-12 mb-5">
                <h4 class="mb-4"><i class="fas fa-calendar-alt me-2"></i>Próximas Actuaciones</h4>
                <div class="row">
                    ${actuaciones.map(actuacion => `
                        <div class="col-lg-4 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h6 class="card-title">${actuacion.titulo}</h6>
                                    <p class="card-text text-muted small">${actuacion.descripcion}</p>
                                    <div class="mb-2">
                                        <small><i class="fas fa-calendar me-1"></i> ${new Date(actuacion.fecha).toLocaleDateString('es-ES')}</small><br>
                                        <small><i class="fas fa-clock me-1"></i> ${actuacion.hora}</small><br>
                                        <small><i class="fas fa-map-marker-alt me-1"></i> ${actuacion.lugar}</small>
                                    </div>
                                    <span class="badge bg-${actuacion.tipo === 'desfile' ? 'primary' : actuacion.tipo === 'concierto' ? 'success' : 'info'}">${actuacion.tipo}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Instrumentos -->
            <div class="col-12">
                <h4 class="mb-4"><i class="fas fa-guitar me-2"></i>Instrumentos de la Banda</h4>
                <div class="row">
                    ${instrumentos.map(instrumento => `
                        <div class="col-lg-4 col-md-6 mb-3">
                            <div class="card">
                                <div class="card-body text-center">
                                    <i class="fas fa-music fa-2x text-primary mb-2"></i>
                                    <h6 class="card-title">${instrumento.nombre}</h6>
                                    <p class="card-text small text-muted">${instrumento.descripcion}</p>
                                    <span class="badge bg-secondary">${instrumento.cantidad} unidades</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Videos de YouTube -->
            <div class="col-12 mt-5">
                <h4 class="mb-4"><i class="fab fa-youtube me-2 text-danger"></i>Videos de YouTube</h4>
                <div class="row">
                    ${repertorio.filter(pieza => pieza.youtube_url).map(pieza => `
                        <div class="col-lg-6 mb-4">
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title">${pieza.titulo}</h6>
                                    <p class="card-text text-muted small">${pieza.descripcion}</p>
                                    <div class="ratio ratio-16x9">
                                        <iframe src="${app.getYouTubeEmbedUrl(pieza.youtube_url)}" 
                                                title="${pieza.titulo}" 
                                                frameborder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowfullscreen>
                                        </iframe>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderMusicaDefault(container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle fa-2x mb-3"></i>
                    <h5>Información Musical</h5>
                    <p>Los datos musicales se cargarán próximamente.</p>
                </div>
            </div>
        `;
    }

    // Función para reproducir audio
    playAudio(audioUrl, titulo) {
        try {
            const audio = new Audio(audioUrl);
            audio.play().then(() => {
                this.showNotification(`Reproduciendo: ${titulo}`, 'success');
            }).catch(error => {
                console.error('Error reproduciendo audio:', error);
                this.showNotification('Error al reproducir el audio', 'error');
            });
        } catch (error) {
            console.error('Error creando audio:', error);
            this.showNotification('Error al reproducir el audio', 'error');
        }
    }

    // Función para convertir URL de YouTube a URL de embed
    getYouTubeEmbedUrl(youtubeUrl) {
        if (!youtubeUrl) return '';
        
        // Extraer ID del video de diferentes formatos de URL de YouTube
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = youtubeUrl.match(regex);
        
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }
        
        return youtubeUrl; // Retornar URL original si no se puede extraer el ID
    }

    // ===== CARGA DE LIBRO =====
    async loadLibro() {
        const container = document.getElementById('libro-container');
        if (!container) return;

        this.renderLibroDefault(container);
    }

    renderLibroDefault(container) {
        container.innerHTML = `
            <div class="text-center">
                <div class="book-preview">
                    <i class="fas fa-book fa-5x text-primary mb-4"></i>
                    <h4>Libro Digital de la Filá</h4>
                    <p class="lead">Descubre la historia completa de la Filá Mariscales en nuestro libro digital interactivo.</p>
                    <button class="btn btn-primary btn-lg" onclick="app.showLibroModal()">
                        <i class="fas fa-book-open me-2"></i>Abrir Libro
                    </button>
                </div>
            </div>
        `;
    }

    // ===== CARGA DE DESCARGAS =====
    async loadDescargas() {
        const container = document.getElementById('descargas-container');
        if (!container) return;

        this.renderDescargasDefault(container);
    }

    renderDescargasDefault(container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="row">
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-file-pdf fa-3x text-danger mb-3"></i>
                                <h5 class="card-title">Estatutos</h5>
                                <p class="card-text">Estatutos oficiales de la Filá Mariscales</p>
                                <button class="btn btn-outline-danger">
                                    <i class="fas fa-download me-2"></i>Descargar
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-file-word fa-3x text-primary mb-3"></i>
                                <h5 class="card-title">Reglamento</h5>
                                <p class="card-text">Reglamento interno de la Filá</p>
                                <button class="btn btn-outline-primary">
                                    <i class="fas fa-download me-2"></i>Descargar
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-file-image fa-3x text-success mb-3"></i>
                                <h5 class="card-title">Logotipos</h5>
                                <p class="card-text">Logotipos oficiales en alta resolución</p>
                                <button class="btn btn-outline-success">
                                    <i class="fas fa-download me-2"></i>Descargar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== CARGA DE PRODUCTOS =====
    async loadProductos() {
        const container = document.getElementById('productos-container');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}productos.json`);
            const productos = await response.json();
            this.renderProductos(productos, container);
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.renderProductosDefault(container);
        }
    }

    renderProductos(productos, container) {
        container.innerHTML = productos.map(producto => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card h-100">
                    <img src="${producto.imagen_url}" class="card-img-top" alt="${producto.nombre}" style="height: 200px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text flex-grow-1">${producto.descripcion}</p>
                        <div class="product-price mb-3">
                            ${producto.precio_oferta > 0 ? 
                                `<span class="h5 text-danger">${producto.precio_oferta}€</span> <small class="text-muted text-decoration-line-through">${producto.precio}€</small>` :
                                `<span class="h5 text-primary">${producto.precio}€</span>`
                            }
                        </div>
                        <button class="btn btn-primary w-100" onclick="app.addToCart(${producto.id}, '${producto.nombre}', ${producto.precio_oferta || producto.precio})">
                            <i class="fas fa-shopping-cart me-2"></i>Añadir al carrito
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderProductosDefault(container) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No hay productos disponibles en este momento.</p>
            </div>
        `;
    }

    // ===== CARGA DE PATROCINADORES =====
    async loadPatrocinadores() {
        const container = document.getElementById('patrocinadores-container');
        if (!container) return;

        this.renderPatrocinadoresDefault(container);
    }

    renderPatrocinadoresDefault(container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="row justify-content-center">
                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-building fa-3x text-primary mb-3"></i>
                                <h6 class="card-title">Patrocinador 1</h6>
                                <p class="card-text small">Empresa colaboradora</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-store fa-3x text-success mb-3"></i>
                                <h6 class="card-title">Patrocinador 2</h6>
                                <p class="card-text small">Comercio local</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-industry fa-3x text-warning mb-3"></i>
                                <h6 class="card-title">Patrocinador 3</h6>
                                <p class="card-text small">Industria local</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== CARGA DE HERMANAMIENTOS =====
    async loadHermanamientos() {
        const container = document.getElementById('hermanamientos-container');
        if (!container) return;

        this.renderHermanamientosDefault(container);
    }

    renderHermanamientosDefault(container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="row">
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-handshake fa-3x text-primary mb-3"></i>
                                <h5 class="card-title">Filá Hermana 1</h5>
                                <p class="card-text">Mantenemos una estrecha relación de hermandad con esta filá.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-users fa-3x text-success mb-3"></i>
                                <h5 class="card-title">Filá Hermana 2</h5>
                                <p class="card-text">Colaboramos en eventos y actividades conjuntas.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== CARGA DE SOCIOS =====
    async loadSocios() {
        const container = document.getElementById('socios-container');
        if (!container) return;

        this.renderSociosDefault(container);
    }

    renderSociosDefault(container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="row">
                    <div class="col-lg-4 mb-4">
                        <div class="card text-center h-100">
                            <div class="card-body d-flex flex-column">
                                <i class="fas fa-user-plus fa-3x text-primary mb-3"></i>
                                <h5 class="card-title">Hazte Socio</h5>
                                <p class="card-text flex-grow-1">Únete a nuestra familia templaria y forma parte de la tradición.</p>
                                <button class="btn btn-primary mt-auto" data-bs-toggle="modal" data-bs-target="#solicitudSocioModal">
                                    <i class="fas fa-envelope me-2"></i>Más información
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4">
                        <div class="card text-center h-100">
                            <div class="card-body d-flex flex-column">
                                <i class="fas fa-percent fa-3x text-success mb-3"></i>
                                <h5 class="card-title">Ventajas</h5>
                                <p class="card-text flex-grow-1">Disfruta de descuentos y ventajas exclusivas para socios.</p>
                                <button class="btn btn-success mt-auto btn-ver-ventajas">
                                    <i class="fas fa-gift me-2"></i>Ver ventajas
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4">
                        <div class="card text-center h-100">
                            <div class="card-body d-flex flex-column">
                                <i class="fas fa-calendar-check fa-3x text-warning mb-3"></i>
                                <h5 class="card-title">Actividades</h5>
                                <p class="card-text flex-grow-1">Participa en actividades exclusivas para socios.</p>
                                <a href="#eventos" class="btn btn-warning mt-auto">
                                    <i class="fas fa-calendar-alt me-2"></i>Ver actividades
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir funcionalidad al botón "Ver ventajas"
        setTimeout(() => {
            const btnVentajas = container.querySelector('.btn-ver-ventajas');
            if (btnVentajas) {
                btnVentajas.addEventListener('click', () => {
                    this.mostrarVentajasSocios();
                });
            }
        }, 100);
    }
    
    mostrarVentajasSocios() {
        const ventajas = [
            { icono: 'fa-tags', titulo: 'Descuentos Exclusivos', descripcion: 'Descuentos en productos oficiales de la filá' },
            { icono: 'fa-ticket-alt', titulo: 'Entradas Prioritarias', descripcion: 'Acceso prioritario a eventos y actividades' },
            { icono: 'fa-users', titulo: 'Eventos Exclusivos', descripcion: 'Invitaciones a eventos solo para socios' },
            { icono: 'fa-newspaper', titulo: 'Boletín Informativo', descripcion: 'Recibe noticias y novedades antes que nadie' },
            { icono: 'fa-handshake', titulo: 'Red de Contactos', descripcion: 'Conecta con otros socios y hermandades' },
            { icono: 'fa-trophy', titulo: 'Reconocimientos', descripcion: 'Participación en premios y reconocimientos anuales' }
        ];
        
        const ventajasHTML = ventajas.map(v => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="d-flex align-items-start">
                    <i class="fas ${v.icono} fa-2x text-success me-3"></i>
                    <div>
                        <h6 class="mb-1">${v.titulo}</h6>
                        <p class="text-muted small mb-0">${v.descripcion}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        const modalHTML = `
            <div class="modal fade" id="ventajasModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-star me-2"></i>Ventajas de ser Socio
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                ${ventajasHTML}
                            </div>
                            <hr>
                            <div class="text-center">
                                <p class="mb-3">¿Quieres formar parte de nuestra hermandad?</p>
                                <a href="#contacto" class="btn btn-success" data-bs-dismiss="modal">
                                    <i class="fas fa-envelope me-2"></i>Contacta con nosotros
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal anterior si existe
        const oldModal = document.getElementById('ventajasModal');
        if (oldModal) oldModal.remove();
        
        // Añadir nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Obtener elemento del modal
        const modalElement = document.getElementById('ventajasModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // Manejar eventos del modal para accesibilidad
        modalElement.addEventListener('shown.bs.modal', () => {
            modalElement.removeAttribute('aria-hidden');
        });
        
        modalElement.addEventListener('hidden.bs.modal', () => {
            // Eliminar el modal del DOM cuando se cierra
            modalElement.remove();
        });
        
        // Mostrar modal
        modal.show();
    }

    // ===== CARGA DE EVENTOS =====
    async loadEventos() {
        const container = document.getElementById('eventos-container');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}eventos.json`);
            const eventos = await response.json();
            // Filtro por categoría desde query ?category=
            let filtered = eventos;
            try {
                const params = new URLSearchParams(window.location.search);
                const category = params.get('category');
                if (category) {
                    filtered = eventos.filter(e => String(e.tipo || '').toLowerCase() === String(category).toLowerCase());
                }
            } catch (e) { /* noop */ }

            this.renderEventos(filtered, container);

            // Click en tarjetas de categorías
            document.querySelectorAll('.evento-categoria[data-tipo]').forEach(card => {
                card.addEventListener('click', () => {
                    const tipo = card.getAttribute('data-tipo');
                    if (!tipo) return;
                    const url = new URL(window.location.href);
                    url.searchParams.set('category', tipo);
                    window.location.href = url.toString();
                });
            });
        } catch (error) {
            console.error('Error cargando eventos:', error);
            this.renderEventosDefault(container);
        }
    }

    renderEventos(eventos, container) {
        container.innerHTML = eventos.map(evento => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100">
                    <img src="${evento.imagen_url}" class="card-img-top" alt="${evento.titulo}" style="height: 200px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                    <div class="card-body">
                        <h5 class="card-title">${evento.titulo}</h5>
                        <p class="card-text">${evento.descripcion}</p>
                        <div class="event-details">
                            <div class="mb-2">
                                <i class="fas fa-calendar-alt text-primary me-2"></i>
                                <strong>Fecha:</strong> ${this.formatDate(evento.fecha)}
                            </div>
                            <div class="mb-2">
                                <i class="fas fa-clock text-primary me-2"></i>
                                <strong>Hora:</strong> ${evento.hora}
                            </div>
                            <div class="mb-2">
                                <i class="fas fa-map-marker-alt text-primary me-2"></i>
                                <strong>Lugar:</strong> ${evento.lugar}
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-0 pb-3 px-3">
                        <a class="btn btn-primary w-100" href="reservas.html?eventId=${encodeURIComponent(evento.id)}">
                            <i class="fas fa-ticket-alt me-2"></i>Reservar
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderEventosDefault(container) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No hay eventos programados en este momento.</p>
            </div>
        `;
    }

    // ===== FUNCIONES DE UTILIDAD =====
    formatDate(dateString) {
        return Utils.formatDate(dateString);
    }

    groupEventsByMonth(eventos) {
        const eventosPorMes = {};
        eventos.forEach(evento => {
            const fecha = new Date(evento.fecha);
            const mes = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
            if (!eventosPorMes[mes]) {
                eventosPorMes[mes] = [];
            }
            eventosPorMes[mes].push(evento);
        });
        return eventosPorMes;
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            const href = anchor.getAttribute('href');
            // Skip if href is just '#'
            if (href === '#') {
                return;
            }
            
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                try {
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                } catch (error) {
                    console.warn('Error en scroll suave:', error);
                }
            });
        });
    }

    setupNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    navbar.classList.add('navbar-scrolled');
                } else {
                    navbar.classList.remove('navbar-scrolled');
                }
            });
        }
    }

    setupFormHandlers() {
        // Validación en tiempo real
        document.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this));
            input.addEventListener('input', this.clearFieldError.bind(this));
        });
    }

    setupAnimations() {
        // Configuración de animaciones
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        });

        document.querySelectorAll('.card, .gallery-item').forEach(el => {
            this.observer.observe(el);
        });
    }

    // ===== MANEJO DE EVENTOS =====
    handleNavClick(event) {
        // Solo cerrar menú móvil si se hace clic en un enlace (no en dropdowns)
        const target = event.target;
        const isDropdownToggle = target.classList.contains('dropdown-toggle') || target.closest('.dropdown-toggle');
        const isDropdownMenu = target.closest('.dropdown-menu');
        
        // Solo cerrar si es un enlace directo, no un dropdown
        if (!isDropdownToggle && !isDropdownMenu) {
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                const navbarToggler = document.querySelector('.navbar-toggler');
                if (navbarToggler) {
                    navbarToggler.click();
                }
            }
        }
    }

    handleScroll() {
        // Efectos de scroll
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.hero-section');
        
        if (parallax) {
            const speed = scrolled * 0.5;
            parallax.style.transform = `translateY(${speed}px)`;
        }
    }

    handleResize() {
        // Manejo de redimensionamiento
        this.setupAnimations();
    }

    // ===== MANEJO DE FORMULARIOS =====
    async handleContactForm(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
            nombre: formData.get('nombre') || document.getElementById('nombre').value,
            email: formData.get('email') || document.getElementById('email').value,
            mensaje: formData.get('mensaje') || document.getElementById('mensaje').value
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}contacto.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Mensaje enviado correctamente. Te responderemos pronto.');
                event.target.reset();
            } else {
                this.showError(result.message || 'Error al enviar el mensaje.');
            }
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            this.showError('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
        }
    }

    // ===== VALIDACIÓN DE FORMULARIOS =====
    validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        // Limpiar errores previos
        this.clearFieldError(event);
        
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

    clearFieldError(event) {
        const field = event.target;
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('is-invalid');
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-danger small mt-1';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    isValidEmail(email) {
        return Utils.isValidEmail(email);
    }

    // ===== MODALES =====
    showNoticiaModal(titulo, contenido) {
        this.createModal('Noticia', `
            <h4>${titulo}</h4>
            <div class="mt-3">${contenido}</div>
        `);
    }

    showImageModal(imageUrl, title) {
        this.createModal('Galería', `
            <div class="text-center">
                <img src="${imageUrl}" class="img-fluid" alt="${title}">
                <h5 class="mt-3">${title}</h5>
            </div>
        `);
    }

    showLibroModal() {
        this.createModal('Libro Digital', `
            <div class="text-center">
                <i class="fas fa-book fa-5x text-primary mb-4"></i>
                <h4>Libro Digital de la Filá</h4>
                <p>El libro digital está en desarrollo. Próximamente estará disponible.</p>
                <button class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `);
    }

    createModal(title, content) {
        // Crear modal dinámicamente
        const modalHtml = `
            <div class="modal fade" id="dynamicModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('dynamicModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Añadir nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
        modal.show();

        // Limpiar modal cuando se cierre
        document.getElementById('dynamicModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // ===== CARRITO DE COMPRAS =====
    addToCart(productId, productName, price) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: price,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        this.showSuccess(`${productName} añadido al carrito`);
        this.updateCartBadge();
    }

    updateCartBadge() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        let badge = document.querySelector('.cart-badge');
        if (!badge) {
            // Crear badge si no existe
            const cartLink = document.querySelector('a[href*="cart"]');
            if (cartLink) {
                badge = document.createElement('span');
                badge.className = 'cart-badge badge bg-danger position-absolute top-0 start-100 translate-middle';
                cartLink.appendChild(badge);
            }
        }
        
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    // ===== NOTIFICACIONES =====
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        return Utils.showNotification(message, type);
    }
    
    // ===== CARGA DE TEXTOS =====
    async loadTextos() {
        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}textos.json`);
            const textos = await response.json();
            
            // Almacenar textos globalmente
            window.TEXTOS = textos;
            
            // Aplicar textos a la página
            this.applyTextos(textos);
            
            console.log('Textos cargados correctamente');
        } catch (error) {
            console.error('Error cargando textos:', error);
            // Usar textos por defecto si hay error
            this.applyDefaultTextos();
        }
    }

    // ===== FONDOS DE PÁGINA =====
    async loadFondos() {
        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}fondos.json`, { cache: 'no-store' });
            if (!response.ok) throw new Error('No se pudieron cargar los fondos');
            const fondos = await response.json();
            
            // Aplicar fondos con un pequeño retraso para asegurar que el DOM esté listo
            setTimeout(() => {
                this.applyFondos(fondos);
            }, 100);
        } catch (error) {
            console.warn('Fondos no disponibles o error cargando:', error);
            // Aplicar fondo por defecto si no se puede cargar el JSON
            this.applyDefaultFondo();
        }
    }

    applyDefaultFondo() {
        console.log('Aplicando fondo por defecto...');
        // Aplicar fondo.jpg por defecto a todas las páginas
        document.body.style.setProperty('background-image', 'url("assets/images/backgrounds/fondo.jpg")', 'important');
        document.body.style.setProperty('background-size', 'cover', 'important');
        document.body.style.setProperty('background-position', 'center', 'important');
        document.body.style.setProperty('background-repeat', 'no-repeat', 'important');
        document.body.style.setProperty('background-attachment', 'fixed', 'important');
        
        // Aplicar efectos de transparencia
        this.applyPageEffects(this.getCurrentPageKey());
    }

    applyFondos(fondos) {
        if (!Array.isArray(fondos) || fondos.length === 0) {
            console.log('No hay fondos disponibles');
            return;
        }

        const current = this.getCurrentPageKey();
        console.log('Aplicando fondos para página:', current);

        // Buscar el último fondo activo que aplique a esta página
        const applicable = fondos.filter(f => {
            if (f.activo === false) return false;
            if (!f.paginas) return false;
            const pages = String(f.paginas)
                .split(',')
                .map(p => p.trim().toLowerCase())
                .filter(Boolean);
            return pages.includes(current);
        });

        console.log('Fondos aplicables:', applicable);

        if (applicable.length === 0) {
            console.log('No hay fondos aplicables para esta página');
            return;
        }

        const fondo = applicable[applicable.length - 1];
        console.log('Aplicando fondo:', fondo);

        // Aplicar según tipo
        if (fondo.tipo === 'imagen' && fondo.imagen_url) {
            // Forzar aplicación del fondo
            document.body.style.setProperty('background-image', `url('${fondo.imagen_url}')`, 'important');
            document.body.style.setProperty('background-size', 'cover', 'important');
            document.body.style.setProperty('background-position', 'center', 'important');
            document.body.style.setProperty('background-repeat', 'no-repeat', 'important');
            document.body.style.setProperty('background-attachment', 'fixed', 'important');
            console.log('✅ Fondo de imagen aplicado:', fondo.imagen_url);
        } else if (fondo.tipo === 'color' && fondo.color) {
            document.body.style.setProperty('background', fondo.color, 'important');
            console.log('✅ Fondo de color aplicado:', fondo.color);
        } else if (fondo.tipo === 'gradiente' && fondo.color && fondo.color_secundario) {
            document.body.style.setProperty('background-image', `linear-gradient(135deg, ${fondo.color}, ${fondo.color_secundario})`, 'important');
            document.body.style.setProperty('background-attachment', 'fixed', 'important');
            console.log('✅ Fondo de gradiente aplicado');
        }

        // Aplicar transparencias y efectos según el tipo de página
        this.applyPageEffects(current);
    }

    applyPageEffects(pageKey) {
        try {
            // Aplicar efectos uniformes para todas las páginas (igual que historia)
            const effects = {
                'historia': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'directiva': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'socios': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'eventos': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'galeria': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'noticias': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'contacto': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'calendario': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'musica': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'recursos': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'lafila': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'libro': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                },
                'actividades': {
                    overlay: 'rgba(0, 0, 0, 0.2)',
                    contentOpacity: '0.6',
                    blur: '2px'
                }
            };

            const effect = effects[pageKey];
            if (!effect) return;

            // Crear overlay si no existe con verificación
            let overlay = document.getElementById('page-overlay');
            if (!overlay && document.body) {
                overlay = document.createElement('div');
                overlay.id = 'page-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: -1;
                    pointer-events: none;
                `;
                document.body.appendChild(overlay);
            }

            // Aplicar overlay con verificación
            if (overlay) {
                overlay.style.backgroundColor = effect.overlay;
            }

            // Aplicar efectos a secciones y contenedores con verificación
            const sections = document.querySelectorAll('section, .container, .card, .timeline, .historia-content, .historia-image');
            sections.forEach(section => {
                if (section && section.style) {
                    // Forzar aplicación de estilos
                    section.style.setProperty('background', `rgba(255, 255, 255, ${effect.contentOpacity})`, 'important');
                    section.style.setProperty('backdrop-filter', `blur(${effect.blur})`, 'important');
                    section.style.setProperty('-webkit-backdrop-filter', `blur(${effect.blur})`, 'important');
                    section.style.setProperty('border-radius', '10px', 'important');
                    section.style.setProperty('box-shadow', '0 4px 6px rgba(0,0,0,0.1)', 'important');
                    section.style.setProperty('position', 'relative', 'important');
                    section.style.setProperty('z-index', '10', 'important');
                }
            });

            // Efectos específicos para timeline (historia) con verificación
            if (pageKey === 'historia') {
                const timelineItems = document.querySelectorAll('.timeline-item');
                timelineItems.forEach(item => {
                    if (item && item.style) {
                        item.style.background = 'rgba(255, 255, 255, 0.5)';
                        item.style.backdropFilter = 'blur(0.5px)';
                        item.style.webkitBackdropFilter = 'blur(0.5px)';
                        item.style.borderRadius = '8px';
                        item.style.border = '1px solid rgba(220, 20, 60, 0.3)';
                    }
                });
            }
        } catch (error) {
            console.warn('Error aplicando efectos de página:', error);
        }
    }

    getCurrentPageKey() {
        // Obtiene el nombre de archivo sin extensión: p.ej. historia.html => 'historia'
        const path = window.location.pathname;
        const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        const base = file.toLowerCase().split('?')[0].split('#')[0];
        const key = base.endsWith('.html') ? base.replace('.html', '') : base || 'index';
        return key;
    }
    
    applyTextos(textos) {
        // Aplicar textos del home
        if (textos.home) {
            this.updateElementText('hero-title', textos.home.titulo_principal);
            this.updateElementText('hero-subtitle', textos.home.subtitulo_principal);
            this.updateElementText('hero-description', textos.home.descripcion_hero);
            this.updateElementText('welcome-text', textos.home.texto_bienvenida);
        }
        
        // Aplicar textos de historia
        if (textos.historia) {
            this.updateElementText('historia-title', textos.historia.titulo);
            this.updateElementText('historia-subtitle', textos.historia.subtitulo);
            this.updateElementText('historia-description', textos.historia.descripcion);
            this.updateElementText('fecha-fundacion', textos.historia.fecha_fundacion);
            this.updateElementText('fundadores', textos.historia.fundadores);
        }
        
        // Aplicar textos de directiva
        if (textos.directiva) {
            this.updateElementText('directiva-title', textos.directiva.titulo);
            this.updateElementText('directiva-subtitle', textos.directiva.subtitulo);
            this.updateElementText('directiva-description', textos.directiva.descripcion);
        }
        
        // Aplicar textos de socios
        if (textos.socios) {
            this.updateElementText('socios-title', textos.socios.titulo);
            this.updateElementText('socios-subtitle', textos.socios.subtitulo);
            this.updateElementText('socios-description', textos.socios.descripcion);
        }
        
        // Aplicar textos de eventos
        if (textos.eventos) {
            this.updateElementText('eventos-title', textos.eventos.titulo);
            this.updateElementText('eventos-subtitle', textos.eventos.subtitulo);
            this.updateElementText('eventos-description', textos.eventos.descripcion);
        }
        
        // Aplicar textos de galería
        if (textos.galeria) {
            this.updateElementText('galeria-title', textos.galeria.titulo);
            this.updateElementText('galeria-subtitle', textos.galeria.subtitulo);
            this.updateElementText('galeria-description', textos.galeria.descripcion);
        }
        
        // Aplicar textos de noticias
        if (textos.noticias) {
            this.updateElementText('noticias-title', textos.noticias.titulo);
            this.updateElementText('noticias-subtitle', textos.noticias.subtitulo);
            this.updateElementText('noticias-description', textos.noticias.descripcion);
        }
        
        // Aplicar textos de contacto
        if (textos.contacto) {
            this.updateElementText('contacto-title', textos.contacto.titulo);
            this.updateElementText('contacto-subtitle', textos.contacto.subtitulo);
            this.updateElementText('contacto-description', textos.contacto.descripcion);
            this.updateElementText('contacto-direccion', textos.contacto.direccion);
            this.updateElementText('contacto-email', textos.contacto.email);
            this.updateElementText('contacto-telefono', textos.contacto.telefono);
            this.updateElementText('contacto-horario', textos.contacto.horario_atencion);
        }
        
        // Aplicar textos del footer
        if (textos.footer) {
            this.updateElementText('footer-copyright', textos.footer.texto_copyright);
            this.updateElementText('footer-description', textos.footer.descripcion);
        }
        
        // Aplicar meta tags
        if (textos.meta) {
            this.updateMetaTags(textos.meta);
        }
    }
    
    updateElementText(selector, text) {
        const element = document.getElementById(selector);
        if (element && text) {
            element.textContent = text;
        }
    }
    
    updateMetaTags(meta) {
        // Actualizar meta description
        if (meta.descripcion_seo) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.content = meta.descripcion_seo;
        }
        
        // Actualizar meta keywords
        if (meta.keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.name = 'keywords';
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.content = meta.keywords;
        }
    }
    
    applyDefaultTextos() {
        // Textos por defecto si no se pueden cargar
        console.log('Aplicando textos por defecto');
    }
}

    // ===== INICIALIZACIÓN =====
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new FilaMariscalesApp();
    
    // Hacer app accesible globalmente después de la inicialización
    window.app = app;
    
    // Actualizar badge del carrito al cargar
    app.updateCartBadge();
    
    // Configurar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Función global para recargar textos desde el admin
    window.reloadTextos = function() {
        if (app && app.loadTextos) {
            app.loadTextos();
            console.log('Textos recargados desde el admin');
        }
    };
    
    // Función global para recargar fondos
    window.reloadFondos = function() {
        if (app && app.loadFondos) {
            app.loadFondos();
            console.log('Fondos recargados');
        }
    };
    
    // Escuchar actualizaciones de textos desde otras pestañas
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('textos-update');
        channel.addEventListener('message', (event) => {
            if (event.data.type === 'textos-updated') {
                console.log('Recibida actualización de textos desde otra pestaña');
                window.reloadTextos();
            }
        });
    }
    
    // También escuchar cambios en localStorage
    window.addEventListener('storage', (event) => {
        if (event.key === 'textos-updated') {
            console.log('Recibida actualización de textos desde localStorage');
            window.reloadTextos();
        }
    });
    
    // Aplicar fondo inmediatamente
    if (app && app.applyDefaultFondo) {
        console.log('Aplicando fondo inmediatamente...');
        app.applyDefaultFondo();
    }
    
    // Forzar recarga de fondos después de 2 segundos para páginas existentes
    setTimeout(() => {
        if (app && app.loadFondos) {
            console.log('Recargando fondos automáticamente...');
            app.loadFondos();
        }
    }, 2000);
    
    // Remover atributos de Bootstrap que interfieren con dropdowns
    setTimeout(() => {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        dropdownToggles.forEach(toggle => {
            if (toggle) {
                // Remover atributos de Bootstrap que interfieren
                toggle.removeAttribute('data-bs-toggle');
                toggle.removeAttribute('data-bs-auto-close');
                toggle.removeAttribute('aria-expanded');
            }
        });
    }, 1000);
});

// ===== FUNCIONES GLOBALES PARA COMPARTIR Y DESCARGAR =====

// Función para descargar PDF
function downloadPDF() {
    // Simular descarga del PDF
    const link = document.createElement('a');
    link.href = 'assets/docs/libro-fila-mariscales.pdf';
    link.download = 'Libro_Fila_Mariscales.pdf';
    link.click();
    
    // Mostrar notificación
    if (typeof showNotification === 'function') {
        showNotification('Descargando PDF...', 'info');
    } else {
        alert('Descargando PDF...');
    }
}

// Función para compartir libro
function shareBook() {
    const shareData = {
        title: 'Libro de la Filá Mariscales',
        text: 'Descubre la historia y tradiciones de la Filá Mariscales en nuestro libro interactivo',
        url: window.location.href
    };

    // Verificar si el navegador soporta Web Share API
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData)
            .then(() => {
                if (typeof showNotification === 'function') {
                    showNotification('¡Libro compartido exitosamente!', 'success');
                } else {
                    alert('¡Libro compartido exitosamente!');
                }
            })
            .catch((error) => {
                console.error('Error compartiendo:', error);
                showFallbackShare();
            });
    } else {
        // Fallback para navegadores que no soportan Web Share API
        showFallbackShare();
    }
}

// Función de fallback para compartir
function showFallbackShare() {
    const shareModal = document.createElement('div');
    shareModal.className = 'modal fade';
    shareModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-share me-2"></i>Compartir Libro
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6><i class="fas fa-link me-2"></i>Enlace Directo</h6>
                            <div class="input-group mb-3">
                                <input type="text" class="form-control" id="share-url" value="${window.location.href}" readonly>
                                <button class="btn btn-outline-secondary" type="button" onclick="copyToClipboard('share-url')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="fas fa-qrcode me-2"></i>Código QR</h6>
                            <div class="text-center">
                                <div id="qr-code" class="mb-3"></div>
                                <button class="btn btn-sm btn-outline-primary" onclick="downloadQR()">
                                    <i class="fas fa-download me-1"></i>Descargar QR
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <h6><i class="fas fa-envelope me-2"></i>Compartir por Email</h6>
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="shareByEmail()">
                                <i class="fas fa-envelope me-2"></i>Enviar por Email
                            </button>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="fas fa-mobile-alt me-2"></i>Compartir por WhatsApp</h6>
                            <button class="btn btn-outline-success w-100 mb-2" onclick="shareByWhatsApp()">
                                <i class="fab fa-whatsapp me-2"></i>Compartir en WhatsApp
                            </button>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <h6><i class="fab fa-facebook me-2"></i>Redes Sociales</h6>
                            <div class="btn-group w-100" role="group">
                                <button class="btn btn-outline-primary" onclick="shareOnFacebook()">
                                    <i class="fab fa-facebook-f"></i>
                                </button>
                                <button class="btn btn-outline-info" onclick="shareOnTwitter()">
                                    <i class="fab fa-twitter"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="shareOnLinkedIn()">
                                    <i class="fab fa-linkedin-in"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="fas fa-copy me-2"></i>Texto para Copiar</h6>
                            <textarea class="form-control" id="share-text" rows="3" readonly>Descubre la historia y tradiciones de la Filá Mariscales en nuestro libro interactivo: ${window.location.href}</textarea>
                            <button class="btn btn-outline-secondary btn-sm mt-2" onclick="copyToClipboard('share-text')">
                                <i class="fas fa-copy me-1"></i>Copiar Texto
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(shareModal);
    const bsModal = new bootstrap.Modal(shareModal);
    bsModal.show();

    // Generar código QR
    generateQRCode();

    // Limpiar modal cuando se cierre
    shareModal.addEventListener('hidden.bs.modal', () => {
        if (document.body.contains(shareModal)) {
            document.body.removeChild(shareModal);
        }
    });
}

// Función para copiar al portapapeles
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    element.setSelectionRange(0, 99999); // Para móviles
    
    try {
        document.execCommand('copy');
        if (typeof showNotification === 'function') {
            showNotification('¡Copiado al portapapeles!', 'success');
        } else {
            alert('¡Copiado al portapapeles!');
        }
    } catch (err) {
        // Fallback para navegadores modernos
        navigator.clipboard.writeText(element.value).then(() => {
            if (typeof showNotification === 'function') {
                showNotification('¡Copiado al portapapeles!', 'success');
            } else {
                alert('¡Copiado al portapapeles!');
            }
        }).catch(() => {
            if (typeof showNotification === 'function') {
                showNotification('No se pudo copiar automáticamente', 'error');
            } else {
                alert('No se pudo copiar automáticamente');
            }
        });
    }
}

// Función para generar código QR
function generateQRCode() {
    // Crear QR simple con canvas
    const qrContainer = document.getElementById('qr-code');
    if (qrContainer) {
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        qrContainer.appendChild(canvas);
        
        // Generar QR simple
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 150, 150);
        ctx.fillStyle = '#fff';
        ctx.fillRect(10, 10, 130, 130);
        
        // Texto en el centro
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', 75, 75);
    }
}

// Función para descargar QR
function downloadQR() {
    const canvas = document.querySelector('#qr-code canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'qr-libro-fila-mariscales.png';
        link.href = canvas.toDataURL();
        link.click();
    }
}

// Función para compartir por email
function shareByEmail() {
    const subject = 'Libro de la Filá Mariscales';
    const body = `Descubre la historia y tradiciones de la Filá Mariscales en nuestro libro interactivo: ${window.location.href}`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
}

// Función para compartir por WhatsApp
function shareByWhatsApp() {
    const text = `Descubre la historia y tradiciones de la Filá Mariscales en nuestro libro interactivo: ${window.location.href}`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappLink, '_blank');
}

// Función para compartir en Facebook
function shareOnFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

// Función para compartir en Twitter
function shareOnTwitter() {
    const text = 'Descubre la historia y tradiciones de la Filá Mariscales';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

// Función para compartir en LinkedIn
function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

// ===== SISTEMA DE BÚSQUEDA =====

// Función para buscar contenido
async function buscarContenido(event) {
    event.preventDefault();
    
    const query = document.getElementById('search-input').value;
    if (!query.trim()) return;
    
    try {
        const response = await fetch(`/fila-mariscales-web/api/busqueda.php?q=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (result.success) {
            mostrarResultadosBusqueda(result.data);
        } else {
            mostrarMensaje('Error en la búsqueda: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error buscando:', error);
        mostrarMensaje('Error de conexión en la búsqueda', 'error');
    }
}

// Mostrar resultados de búsqueda
function mostrarResultadosBusqueda(data) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-search me-2"></i>Resultados de Búsqueda
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted">Se encontraron ${data.total} resultados para "${data.query}"</p>
                    <div class="list-group">
                        ${data.resultados.map(item => `
                            <a href="${item.url}" class="list-group-item list-group-item-action">
                                <div class="d-flex w-100 justify-content-between">
                                    <h6 class="mb-1">${item.titulo}</h6>
                                    <small class="text-muted">${item.tipo}</small>
                                </div>
                                <p class="mb-1">${item.descripcion}</p>
                                <small>${item.fecha || ''}</small>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear toast o alert
    const toast = document.createElement('div');
    toast.className = `alert alert-${tipo === 'error' ? 'danger' : tipo} alert-dismissible fade show position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
    toast.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 5000);
}