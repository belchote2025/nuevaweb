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

        // Eventos de scroll
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    // ===== CARGA DE DATOS INICIALES =====
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadCarousel(),
                this.loadDirectiva(),
                this.loadNoticias(),
                this.loadBlog(),
                this.loadCalendario(),
                this.loadGaleria(),
                this.loadMusica(),
                this.loadLibro(),
                this.loadDescargas(),
                this.loadProductos(),
                this.loadPatrocinadores(),
                this.loadHermanamientos(),
                this.loadSocios(),
                this.loadEventos()
            ]);
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showError('Error al cargar los datos. Por favor, recarga la página.');
        }
    }

    // ===== CARRUSEL HOME =====
    async loadCarousel() {
        const container = document.getElementById('home-carousel');
        if (!container) return;

        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}carousel.json`);
            const data = await response.json();
            this.renderCarousel(data, container);
        } catch (error) {
            console.error('Error cargando carrusel:', error);
            container.innerHTML = '';
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

        // Efectos de transición personalizados
        carousel.addEventListener('slide.bs.carousel', (e) => {
            const activeItem = e.target.querySelector('.carousel-item.active');
            const nextItem = e.relatedTarget;
            
            // Añadir clase de animación
            if (activeItem) activeItem.classList.add('fade-out');
            if (nextItem) nextItem.classList.add('fade-in');
        });

        carousel.addEventListener('slid.bs.carousel', (e) => {
            // Limpiar clases de animación
            e.target.querySelectorAll('.carousel-item').forEach(item => {
                item.classList.remove('fade-out', 'fade-in');
            });
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
        container.innerHTML = imagenes.map(imagen => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="gallery-item" onclick="app.showImageModal('${imagen.imagen_url}', '${imagen.titulo}')">
                    <img src="${imagen.thumb_url}" alt="${imagen.titulo}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" onerror="this.src='https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
            </div>
        `).join('');
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

        this.renderMusicaDefault(container);
    }

    renderMusicaDefault(container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="row">
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-music fa-3x text-primary mb-3"></i>
                                <h5 class="card-title">Banda de la Filá</h5>
                                <p class="card-text">Nuestra banda musical interpreta las melodías tradicionales de los Caballeros Templarios.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-headphones fa-3x text-primary mb-3"></i>
                                <h5 class="card-title">Repertorio</h5>
                                <p class="card-text">Disfruta de nuestro repertorio musical en los eventos y desfiles de la Filá.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
            this.renderEventos(eventos, container);
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
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
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
        // Cerrar menú móvil si está abierto
        const navbarCollapse = document.querySelector('.navbar-collapse');
        if (navbarCollapse.classList.contains('show')) {
            const navbarToggler = document.querySelector('.navbar-toggler');
            navbarToggler.click();
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
});