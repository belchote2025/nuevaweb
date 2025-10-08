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
        this.initDarkMode();
    }

    // ===== CONFIGURACIÓN DE EVENTOS =====
    setupEventListeners() {
        // Navegación suave
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', this.handleSmoothScroll.bind(this));
        });

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
                <div class="carousel-image" style="background-image: url('${s.imagen_url}');"></div>
                <div class="carousel-overlay" style="opacity: ${s.overlay_opacity || 0.4};"></div>
                <div class="carousel-caption d-none d-md-block">
                    <div class="carousel-content">
                        <h2 class="display-4 fw-bold mb-3 carousel-title">${s.titulo}</h2>
                        <p class="lead mb-4 carousel-subtitle">${s.subtitulo || ''}</p>
                        ${s.enlace ? `<a href="${s.enlace}" class="btn btn-primary btn-lg carousel-btn" onclick="app.handleCarouselClick('${s.enlace}')">
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
                    <img src="${noticia.imagen_url}" class="card-img-top" alt="${noticia.titulo}" style="height: 200px; object-fit: cover;">
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
                    <img src="${articulo.imagen_url}" class="card-img-top" alt="${articulo.titulo}" style="height: 200px; object-fit: cover;">
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
        try {
            const response = await fetch(`${CONFIG.DATA_BASE_URL}eventos.json`);
            const eventos = await response.json();
            this.events = eventos;
            this.currentDate = new Date();
            this.renderCalendar();
        } catch (error) {
            console.error('Error cargando calendario:', error);
            this.renderCalendarDefault();
        }
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
        // Almacenar imágenes para el lightbox
        this.galleryImages = imagenes;
        
        container.innerHTML = `
            <div class="gallery-grid">
                ${imagenes.map((imagen, index) => `
                    <div class="gallery-item" onclick="app.openLightbox(${index})">
                        <img src="${imagen.thumb_url}" alt="${imagen.titulo}">
                        <div class="gallery-overlay">
                            <div class="gallery-info">
                                <div class="gallery-title">${imagen.titulo}</div>
                                <div class="gallery-description">${imagen.descripcion}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
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
                    <img src="${producto.imagen_url}" class="card-img-top" alt="${producto.nombre}" style="height: 200px; object-fit: cover;">
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
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-user-plus fa-3x text-primary mb-3"></i>
                                <h5 class="card-title">Hazte Socio</h5>
                                <p class="card-text">Únete a nuestra familia templaria y forma parte de la tradición.</p>
                                <button class="btn btn-primary">Más información</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-percent fa-3x text-success mb-3"></i>
                                <h5 class="card-title">Ventajas</h5>
                                <p class="card-text">Disfruta de descuentos y ventajas exclusivas para socios.</p>
                                <button class="btn btn-success">Ver ventajas</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-calendar-check fa-3x text-warning mb-3"></i>
                                <h5 class="card-title">Actividades</h5>
                                <p class="card-text">Participa en actividades exclusivas para socios.</p>
                                <button class="btn btn-warning">Ver actividades</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
                    <img src="${evento.imagen_url}" class="card-img-top" alt="${evento.titulo}" style="height: 200px; object-fit: cover;">
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
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
    handleSmoothScroll(event) {
        event.preventDefault();
        const targetId = event.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

    showNotification(message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
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

    // ===== LIGHTBOX GALLERY =====
    openLightbox(index) {
        if (!this.galleryImages || this.galleryImages.length === 0) return;
        
        this.currentImageIndex = index;
        this.updateLightbox();
        this.showLightbox();
    }

    showLightbox() {
        const overlay = document.getElementById('lightbox-overlay');
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        }
    }

    closeLightbox() {
        const overlay = document.getElementById('lightbox-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll
        }
    }

    updateLightbox() {
        if (!this.galleryImages || this.currentImageIndex === undefined) return;
        
        const image = this.galleryImages[this.currentImageIndex];
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDescription = document.getElementById('lightbox-description');
        const lightboxCurrent = document.getElementById('lightbox-current');
        const lightboxTotal = document.getElementById('lightbox-total');
        
        if (lightboxImage) lightboxImage.src = image.imagen_url;
        if (lightboxImage) lightboxImage.alt = image.titulo;
        if (lightboxTitle) lightboxTitle.textContent = image.titulo;
        if (lightboxDescription) lightboxDescription.textContent = image.descripcion;
        if (lightboxCurrent) lightboxCurrent.textContent = this.currentImageIndex + 1;
        if (lightboxTotal) lightboxTotal.textContent = this.galleryImages.length;
    }

    nextImage() {
        if (!this.galleryImages || this.galleryImages.length === 0) return;
        
        this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
        this.updateLightbox();
    }

    prevImage() {
        if (!this.galleryImages || this.galleryImages.length === 0) return;
        
        this.currentImageIndex = this.currentImageIndex === 0 
            ? this.galleryImages.length - 1 
            : this.currentImageIndex - 1;
        this.updateLightbox();
    }

    // Manejar teclado para navegación del lightbox
    handleLightboxKeyboard(event) {
        if (!document.getElementById('lightbox-overlay').classList.contains('active')) return;
        
        switch(event.key) {
            case 'Escape':
                this.closeLightbox();
                break;
            case 'ArrowLeft':
                this.prevImage();
                break;
            case 'ArrowRight':
                this.nextImage();
                break;
        }
    }

    // ===== DARK MODE =====
    initDarkMode() {
        // Cargar preferencia guardada
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }

    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Guardar preferencia
        localStorage.setItem('theme', newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateDarkModeButton(theme);
    }

    updateDarkModeButton(theme) {
        const icon = document.getElementById('dark-mode-icon');
        const text = document.getElementById('dark-mode-text');
        
        if (theme === 'dark') {
            if (icon) icon.className = 'fas fa-sun me-1';
            if (text) text.textContent = 'Modo Claro';
        } else {
            if (icon) icon.className = 'fas fa-moon me-1';
            if (text) text.textContent = 'Modo Oscuro';
        }
    }

    // ===== CALENDAR FUNCTIONS =====
    renderCalendar() {
        this.updateCalendarTitle();
        this.renderCalendarGrid();
        this.renderEventsList();
    }

    updateCalendarTitle() {
        const title = document.getElementById('calendar-title');
        if (title) {
            const monthNames = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            title.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    }

    renderCalendarGrid() {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Primer día del mes y último día del mes anterior
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // Generar días del calendario
        const days = [];
        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        // Headers de días
        days.push(dayHeaders.map(day => `<div class="calendar-day-header">${day}</div>`).join(''));
        
        // Días del calendario
        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = this.isToday(currentDate);
                const hasEvents = this.hasEventsOnDate(currentDate);
                
                let dayClass = 'calendar-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                if (isToday) dayClass += ' today';
                if (hasEvents) dayClass += ' has-events';
                
                days.push(`
                    <div class="${dayClass}" onclick="app.selectDate('${currentDate.toISOString().split('T')[0]}')">
                        ${currentDate.getDate()}
                        ${hasEvents ? '<div class="calendar-event-dot"></div>' : ''}
                    </div>
                `);
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        grid.innerHTML = days.join('');
    }

    renderEventsList() {
        const eventsList = document.getElementById('events-list');
        if (!eventsList) return;

        const monthEvents = this.getEventsForMonth();
        
        if (monthEvents.length === 0) {
            eventsList.innerHTML = '<p class="text-muted text-center">No hay eventos programados para este mes.</p>';
            return;
        }

        eventsList.innerHTML = monthEvents.map(event => `
            <div class="event-item">
                <div class="event-date">
                    <i class="fas fa-calendar me-2"></i>
                    ${this.formatEventDate(event.fecha)} - ${event.hora}
                </div>
                <div class="event-title">${event.titulo}</div>
                <div class="event-description">${event.descripcion}</div>
                <div class="event-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${event.lugar}
                </div>
            </div>
        `).join('');
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    selectDate(dateString) {
        const selectedDate = new Date(dateString);
        const dayEvents = this.getEventsForDate(selectedDate);
        
        if (dayEvents.length > 0) {
            // Mostrar eventos del día seleccionado
            this.showDayEvents(selectedDate, dayEvents);
        }
    }

    showDayEvents(date, events) {
        const eventsList = document.getElementById('events-list');
        if (!eventsList) return;

        const dateStr = date.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        eventsList.innerHTML = `
            <h5 class="mb-3">Eventos del ${dateStr}</h5>
            ${events.map(event => `
                <div class="event-item">
                    <div class="event-date">
                        <i class="fas fa-clock me-2"></i>
                        ${event.hora}
                    </div>
                    <div class="event-title">${event.titulo}</div>
                    <div class="event-description">${event.descripcion}</div>
                    <div class="event-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${event.lugar}
                    </div>
                </div>
            `).join('')}
            <button class="btn btn-outline-primary btn-sm mt-3" onclick="app.renderEventsList()">
                <i class="fas fa-arrow-left me-2"></i>Ver todos los eventos del mes
            </button>
        `;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    hasEventsOnDate(date) {
        if (!this.events) return false;
        const dateStr = date.toISOString().split('T')[0];
        return this.events.some(event => event.fecha === dateStr);
    }

    getEventsForMonth() {
        if (!this.events) return [];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        
        return this.events.filter(event => {
            const eventDate = new Date(event.fecha);
            return eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month;
        }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }

    getEventsForDate(date) {
        if (!this.events) return [];
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => event.fecha === dateStr);
    }

    formatEventDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long' 
        });
    }

    renderCalendarDefault() {
        const grid = document.getElementById('calendar-grid');
        const eventsList = document.getElementById('events-list');
        
        if (grid) {
            grid.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Error al cargar el calendario.</p></div>';
        }
        
        if (eventsList) {
            eventsList.innerHTML = '<p class="text-muted text-center">No se pudieron cargar los eventos.</p>';
        }
    }

    // ===== ANIMACIONES AVANZADAS =====
    setupAnimations() {
        this.setupScrollAnimations();
        this.setupHoverAnimations();
        this.setupLoadingAnimations();
    }

    setupScrollAnimations() {
        // Crear observer para animaciones de scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    
                    // Añadir delay escalonado para elementos múltiples
                    const siblings = entry.target.parentElement.children;
                    Array.from(siblings).forEach((sibling, index) => {
                        if (sibling.classList.contains('animate-on-scroll')) {
                            setTimeout(() => {
                                sibling.classList.add('animated');
                            }, index * 100);
                        }
                    });
                }
            });
        }, observerOptions);

        // Observar elementos con animación de scroll
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        // Añadir clases de animación a elementos específicos
        this.addAnimationClasses();
    }

    addAnimationClasses() {
        // Añadir animaciones a las secciones
        const sections = document.querySelectorAll('section');
        sections.forEach((section, index) => {
            if (index > 0) { // Saltar la primera sección (hero)
                section.classList.add('animate-on-scroll');
            }
        });

        // Añadir animaciones a las cards
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.classList.add('animate-on-scroll');
            card.style.animationDelay = `${index * 0.1}s`;
        });

        // Añadir animaciones a los elementos de la galería
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach((item, index) => {
            item.classList.add('animate-on-scroll');
            item.style.animationDelay = `${index * 0.1}s`;
        });

        // Añadir animaciones a los elementos del calendario
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach((day, index) => {
            day.classList.add('animate-fade-in-scale');
            day.style.animationDelay = `${index * 0.02}s`;
        });
    }

    setupHoverAnimations() {
        // Animaciones especiales para botones
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.classList.add('animate-pulse');
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.classList.remove('animate-pulse');
            });
        });

        // Animaciones para cards
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('templar-glow');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('templar-glow');
            });
        });
    }

    setupLoadingAnimations() {
        // Animación de carga para elementos dinámicos
        this.showLoadingAnimation = (element) => {
            if (element) {
                element.innerHTML = `
                    <div class="text-center">
                        <div class="loading-spinner spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                `;
            }
        };

        // Animación de entrada para notificaciones
        this.showNotification = (message, type = 'info') => {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show notification-enter`;
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            // Añadir al contenedor de notificaciones
            let container = document.getElementById('notifications-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notifications-container';
                container.style.position = 'fixed';
                container.style.top = '20px';
                container.style.right = '20px';
                container.style.zIndex = '9999';
                document.body.appendChild(container);
            }
            
            container.appendChild(notification);
            
            // Auto-remover después de 5 segundos
            setTimeout(() => {
                notification.classList.add('notification-exit');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 5000);
        };
    }

    // Animaciones especiales para eventos
    animateElement(element, animationClass, delay = 0) {
        setTimeout(() => {
            element.classList.add(animationClass);
        }, delay);
    }

    // Animación de entrada para el carrusel
    animateCarouselSlide(slide) {
        slide.classList.add('animate-fade-in-scale');
        setTimeout(() => {
            slide.classList.remove('animate-fade-in-scale');
        }, 600);
    }

    // Animación de entrada para elementos de la galería
    animateGalleryItem(item, index) {
        item.classList.add('animate-fade-in-up');
        item.style.animationDelay = `${index * 0.1}s`;
    }
}

// ===== INICIALIZACIÓN =====
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new FilaMariscalesApp();
    
    // Actualizar badge del carrito al cargar
    app.updateCartBadge();
    
    // Configurar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Configurar eventos del lightbox
    document.addEventListener('keydown', function(event) {
        if (app && app.handleLightboxKeyboard) {
            app.handleLightboxKeyboard(event);
        }
    });

    // Cerrar lightbox al hacer clic en el overlay
    document.getElementById('lightbox-overlay')?.addEventListener('click', function(event) {
        if (event.target === this) {
            app.closeLightbox();
        }
    });
});

// ===== FUNCIONES GLOBALES =====
window.app = app;