// ===== CONFIGURACIÓN =====
const ADMIN_CONFIG = {
    API_BASE_URL: 'api/',
    CURRENT_SECTION: 'dashboard',
    EDITING_ITEM: null,
    CURRENT_DATA: [],
    FILTERED_DATA: [],
    CURRENT_PAGE: 1,
    ITEMS_PER_PAGE: 25,
    SORT_COLUMN: null,
    SORT_DIRECTION: 'asc'
};

// ===== CLASE PRINCIPAL DEL ADMIN =====
class AdminApp {
    constructor() {
        // Initialize properties
        this.initialized = false;
        this.isAuthenticated = false;
        this.authCheckPromise = null;
        this.loginInProgress = false;
        
        // Initialize the app
        this.init();
    }
    
    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check authentication status
        this.checkAuth();
    }

    // ===== AUTENTICACIÓN =====
    async checkAuth() {
        // If we already have an auth check in progress, return that promise
        if (this.authCheckPromise) {
            return this.authCheckPromise;
        }
        
        this.authCheckPromise = (async () => {
            try {
                const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}auth.php?action=check`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (!response.ok) throw new Error('Network response was not ok');
                
                const result = await response.json();
                
                if (result.success) {
                    this.isAuthenticated = true;
                    window.currentUserRole = result.data.role;
                    // Mostrar dashboard directamente
                    document.getElementById('admin-dashboard').style.display = 'block';
                    document.getElementById('admin-email').textContent = result.data.email;
                    this.loadDashboardData();
                } else {
                    this.isAuthenticated = false;
                    // Redirigir a login.html si no hay sesión
                    window.location.href = 'login.html';
                }
                
                return result.success;
            } catch (error) {
                console.error('Error verificando autenticación:', error);
                this.isAuthenticated = false;
                // Redirigir a login.html si hay error
                window.location.href = 'login.html';
                return false;
            } finally {
                this.authCheckPromise = null;
            }
        })();
        
        return this.authCheckPromise;
    }


    async logout() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}auth.php?action=logout`);
            const result = await response.json();
            
            if (result.success) {
                // Redirigir al login tras cerrar sesión
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }


    // ===== CONFIGURACIÓN DE EVENTOS =====
    setupEventListeners() {

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            });
        });

        // Add item button
        const addBtn = document.getElementById('add-item-btn');
        if (addBtn) {
            console.log('Configurando botón de añadir');
            addBtn.addEventListener('click', () => {
                console.log('Botón de añadir clickeado');
                this.showAddModal();
            });
        } else {
            console.error('Botón de añadir no encontrado');
        }

        // Save item button (modal)
        const saveItemBtn = document.getElementById('save-item-btn');
        if (saveItemBtn) {
            saveItemBtn.addEventListener('click', () => {
                this.saveItem();
            });
        }

        // Delegación de eventos para botones de editar/eliminar en tablas
        const tableBody = document.getElementById('table-body');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');
                
                if (editBtn) {
                    e.preventDefault();
                    const id = editBtn.dataset.id;
                    this.editItem(id);
                } else if (deleteBtn) {
                    e.preventDefault();
                    const id = deleteBtn.dataset.id;
                    this.deleteItem(id);
                }
            });
        }

        // Botones de sección de textos
        document.querySelectorAll('.btn-text-section').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.textSection;
                this.showTextSection(section);
            });
        });

        // Búsqueda en tiempo real
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterAndRenderTable();
            }, 300));
        }

        // Limpiar búsqueda
        const clearSearchBtn = document.getElementById('clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                document.getElementById('search-input').value = '';
                this.filterAndRenderTable();
            });
        }

        // Filtro por categoría/estado
        const filterSelect = document.getElementById('filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.filterAndRenderTable();
            });
        }

        // Items por página
        const itemsPerPage = document.getElementById('items-per-page');
        if (itemsPerPage) {
            itemsPerPage.addEventListener('change', (e) => {
                ADMIN_CONFIG.ITEMS_PER_PAGE = parseInt(e.target.value);
                ADMIN_CONFIG.CURRENT_PAGE = 1;
                this.filterAndRenderTable();
            });
        }

        // Exportar CSV
        const exportCsvBtn = document.getElementById('export-csv-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                this.exportToCSV();
            });
        }

        // Refrescar
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadSectionData(ADMIN_CONFIG.CURRENT_SECTION);
                this.showNotification('Datos actualizados', 'success');
            });
        }
    }

    // ===== NAVEGACIÓN =====
    showSection(section) {
        // Verificar acceso a secciones restringidas
        if (section === 'socios' && !this.canAccessSocios()) {
            this.showNotification('No tienes permisos para acceder a esta sección', 'error');
            return;
        }
        
        ADMIN_CONFIG.CURRENT_SECTION = section;
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update title
        const titles = {
            'dashboard': 'Dashboard',
            'noticias': 'Noticias',
            'eventos': 'Eventos',
            'galeria': 'Galería',
            'productos': 'Productos',
            'directiva': 'Directiva',
            'contactos': 'Contactos',
            'users': 'Usuarios',
            'carousel': 'Carrusel',
            'socios': 'Socios',
            'textos': 'Textos'
        };
        
        document.getElementById('section-title').textContent = titles[section] || 'Dashboard';
        
        // Show/hide content
        if (section === 'dashboard') {
            document.getElementById('dashboard-content').style.display = 'block';
            document.getElementById('section-content').style.display = 'none';
            document.getElementById('textos-content').style.display = 'none';
            document.getElementById('add-item-btn').style.display = 'none';
            document.getElementById('search-filter-bar').style.display = 'none';
            document.getElementById('table-actions').style.display = 'none';
            this.loadDashboardData();
        } else if (section === 'textos') {
            document.getElementById('dashboard-content').style.display = 'none';
            document.getElementById('section-content').style.display = 'none';
            document.getElementById('textos-content').style.display = 'block';
            document.getElementById('add-item-btn').style.display = 'none';
            document.getElementById('search-filter-bar').style.display = 'none';
            document.getElementById('table-actions').style.display = 'none';
        } else {
            document.getElementById('dashboard-content').style.display = 'none';
            document.getElementById('section-content').style.display = 'block';
            document.getElementById('textos-content').style.display = 'none';
            document.getElementById('add-item-btn').style.display = 'block';
            document.getElementById('search-filter-bar').style.display = 'block';
            document.getElementById('table-actions').style.display = 'inline-flex';
            this.loadSectionData(section);
        }
    }

    // ===== CARGA DE DATOS =====
    async loadDashboardData() {
        try {
            const [noticias, eventos, productos, contactos] = await Promise.all([
                this.fetchData('noticias'),
                this.fetchData('eventos'),
                this.fetchData('productos'),
                this.fetchData('contactos')
            ]);

            document.getElementById('noticias-count').textContent = noticias.length;
            document.getElementById('eventos-count').textContent = eventos.length;
            document.getElementById('productos-count').textContent = productos.length;
            document.getElementById('contactos-count').textContent = contactos.length;

            this.showRecentActivity([...noticias, ...eventos, ...productos, ...contactos]);
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    }

    async loadSectionData(section) {
        try {
            let data;
            
            if (section === 'solicitudes') {
                // Cargar solicitudes usando el método específico
                await this.loadSolicitudes();
                return;
            } else {
                data = await this.fetchData(section);
                ADMIN_CONFIG.CURRENT_DATA = data;
                ADMIN_CONFIG.FILTERED_DATA = data;
                ADMIN_CONFIG.CURRENT_PAGE = 1;
                
                // Configurar filtros según la sección
                this.setupFilters(section);
                
                // Limpiar búsqueda
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                
                this.filterAndRenderTable();
            }
        } catch (error) {
            console.error(`Error cargando datos de ${section}:`, error);
            this.showNotification('Error cargando datos', 'error');
        }
    }

    async fetchData(type) {
        const endpoint = type === 'users' ? 'users.php' : 'admin.php';
        const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}?type=${type}`);
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    }

    // ===== RENDERIZADO DE TABLAS =====
    renderTable(section, data) {
        const tableHead = document.getElementById('table-head');
        const tableBody = document.getElementById('table-body');
        
        // Configuración de columnas por sección
        const columns = this.getColumnsConfig(section);
        
        // Header con ordenamiento
        tableHead.innerHTML = `
            <tr>
                ${columns.map(col => {
                    const sortIcon = ADMIN_CONFIG.SORT_COLUMN === col.key 
                        ? (ADMIN_CONFIG.SORT_DIRECTION === 'asc' ? '<i class="fas fa-sort-up ms-1"></i>' : '<i class="fas fa-sort-down ms-1"></i>')
                        : '<i class="fas fa-sort ms-1 text-muted"></i>';
                    return `<th class="sortable" data-column="${col.key}" style="cursor: pointer;">${col.title} ${sortIcon}</th>`;
                }).join('')}
                <th>Acciones</th>
            </tr>
        `;
        
        // Event listeners para ordenamiento
        tableHead.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                this.sortTable(column);
            });
        });
        
        // Body
        if (data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${columns.length + 1}" class="text-center text-muted">
                        No hay datos disponibles
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = data.map(item => `
            <tr>
                ${columns.map(col => {
                    let value = item[col.key] || '';
                    
                    // Formatear valores especiales
                    if (col.type === 'image' && value) {
                        value = `<img src="${value}" style="width: 50px; height: 50px; object-fit: cover;" class="rounded">`;
                    } else if (col.type === 'date' && value) {
                        value = new Date(value).toLocaleDateString('es-ES');
                    } else if (col.type === 'price' && value) {
                        value = `${value}€`;
                    } else if (col.type === 'text' && value.length > 50) {
                        value = value.substring(0, 50) + '...';
                    }
                    
                    return `<td>${value}</td>`;
                }).join('')}
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-id="${item.id ?? item.imagen_id ?? item._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${item.id ?? item.imagen_id ?? item._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getColumnsConfig(section) {
        const configs = {
            'users': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'email', title: 'Email', type: 'text' },
                { key: 'telefono', title: 'Teléfono', type: 'text' },
                { key: 'rol', title: 'Rol', type: 'text' },
                { 
                    key: 'password', 
                    title: 'Contraseña', 
                    type: 'text',
                    formatter: (value) => value ? '••••••••' : ''
                },
                { 
                    key: 'fecha_ingreso', 
                    title: 'Fecha Ingreso', 
                    type: 'date',
                    formatter: (value) => value ? new Date(value).toLocaleDateString('es-ES') : ''
                },
                { 
                    key: 'activo', 
                    title: 'Activo', 
                    type: 'boolean',
                    formatter: (value) => value === true ? 'Sí' : 'No'
                }
            ],
            'carousel': [
                { key: 'titulo', title: 'Título', type: 'text' },
                { key: 'subtitulo', title: 'Subtítulo', type: 'text' },
                { key: 'imagen_url', title: 'Imagen', type: 'image' },
                { key: 'enlace', title: 'Enlace', type: 'text' },
                { key: 'activo', title: 'Activo', type: 'boolean' }
            ],
            'noticias': [
                { key: 'titulo', title: 'Título', type: 'text' },
                { key: 'resumen', title: 'Resumen', type: 'text' },
                { key: 'fecha_publicacion', title: 'Fecha', type: 'date' },
                { key: 'destacada', title: 'Destacada', type: 'boolean' }
            ],
            'eventos': [
                { key: 'titulo', title: 'Título', type: 'text' },
                { key: 'fecha', title: 'Fecha', type: 'date' },
                { key: 'hora', title: 'Hora', type: 'text' },
                { key: 'lugar', title: 'Lugar', type: 'text' }
            ],
            'galeria': [
                { key: 'titulo', title: 'Título', type: 'text' },
                { key: 'imagen_url', title: 'Imagen', type: 'image' },
                { key: 'categoria', title: 'Categoría', type: 'text' },
                { key: 'fecha_subida', title: 'Fecha', type: 'date' }
            ],
            'productos': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'precio', title: 'Precio', type: 'price' },
                { key: 'stock', title: 'Stock', type: 'number' },
                { key: 'categoria', title: 'Categoría', type: 'text' }
            ],
            'directiva': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'cargo', title: 'Cargo', type: 'text' },
                { key: 'imagen', title: 'Imagen', type: 'image' }
            ],
            'contactos': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'email', title: 'Email', type: 'text' },
                { key: 'telefono', title: 'Teléfono', type: 'text' },
                { key: 'asunto', title: 'Asunto', type: 'text' },
                { 
                    key: 'estado', 
                    title: 'Estado', 
                    type: 'text',
                    formatter: (value) => {
                        const estados = {
                            'nuevo': '<span class="badge bg-primary">Nuevo</span>',
                            'leido': '<span class="badge bg-info">Leído</span>',
                            'respondido': '<span class="badge bg-success">Respondido</span>',
                            'cerrado': '<span class="badge bg-secondary">Cerrado</span>'
                        };
                        return estados[value] || value;
                    }
                },
                { 
                    key: 'prioridad', 
                    title: 'Prioridad', 
                    type: 'text',
                    formatter: (value) => {
                        const prioridades = {
                            'baja': '<span class="badge bg-success">Baja</span>',
                            'media': '<span class="badge bg-warning">Media</span>',
                            'alta': '<span class="badge bg-danger">Alta</span>',
                            'urgente': '<span class="badge bg-dark">Urgente</span>'
                        };
                        return prioridades[value] || value;
                    }
                },
                { 
                    key: 'fecha', 
                    title: 'Fecha', 
                    type: 'date',
                    formatter: (value) => value ? new Date(value).toLocaleDateString('es-ES') : ''
                },
                { key: 'mensaje', title: 'Mensaje', type: 'text' }
            ],
            'socios': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'email', title: 'Email', type: 'text' },
                { key: 'telefono', title: 'Teléfono', type: 'text' },
                { key: 'fecha_ingreso', title: 'Fecha de Ingreso', type: 'date' },
                { key: 'activo', title: 'Activo', type: 'boolean' }
            ],
            'textos': [
                { key: 'seccion', title: 'Sección', type: 'text' },
                { key: 'campo', title: 'Campo', type: 'text' },
                { key: 'valor', title: 'Valor', type: 'text' },
                { key: 'descripcion', title: 'Descripción', type: 'text' }
            ],
            'solicitudes': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'email', title: 'Email', type: 'text' },
                { key: 'telefono', title: 'Teléfono', type: 'text' },
                { key: 'edad', title: 'Edad', type: 'number' },
                { key: 'motivo', title: 'Motivo', type: 'text' },
                { key: 'experiencia', title: 'Experiencia', type: 'text' },
                { 
                    key: 'estado', 
                    title: 'Estado', 
                    type: 'text',
                    formatter: (value) => {
                        const estados = {
                            'pendiente': '<span class="badge bg-warning">Pendiente</span>',
                            'aprobada': '<span class="badge bg-success">Aprobada</span>',
                            'rechazada': '<span class="badge bg-danger">Rechazada</span>'
                        };
                        return estados[value] || value;
                    }
                },
                { 
                    key: 'fecha_solicitud', 
                    title: 'Fecha Solicitud', 
                    type: 'date',
                    formatter: (value) => value ? new Date(value).toLocaleDateString('es-ES') : ''
                },
                { 
                    key: 'fecha_revision', 
                    title: 'Fecha Revisión', 
                    type: 'date',
                    formatter: (value) => value ? new Date(value).toLocaleDateString('es-ES') : 'Sin revisar'
                },
                { key: 'revisado_por', title: 'Revisado por', type: 'text' },
                { key: 'observaciones', title: 'Observaciones', type: 'text' }
            ]
        };
        
        return configs[section] || [];
    }

    // ===== MODALES =====
    showAddModal() {
        console.log('Mostrando modal de añadir para sección:', ADMIN_CONFIG.CURRENT_SECTION);
        
        // Verificar permisos para crear socios
        if (ADMIN_CONFIG.CURRENT_SECTION === 'socios' && !this.isAdmin()) {
            this.showNotification('Solo los administradores pueden crear socios', 'error');
            return;
        }
        
        ADMIN_CONFIG.EDITING_ITEM = null;
        this.showItemModal('Añadir', this.getFormFields(ADMIN_CONFIG.CURRENT_SECTION));
    }

    async editItem(id) {
        try {
            console.log('Editando item con ID:', id);
            console.log('Sección actual:', ADMIN_CONFIG.CURRENT_SECTION);
            
            // Usar los datos ya cargados en lugar de hacer una nueva petición
            const data = ADMIN_CONFIG.CURRENT_DATA;
            if (!data || data.length === 0) {
                console.log('No hay datos cargados, cargando...');
                // Si no hay datos cargados, cargarlos
                const freshData = await this.fetchData(ADMIN_CONFIG.CURRENT_SECTION);
                ADMIN_CONFIG.CURRENT_DATA = freshData;
                ADMIN_CONFIG.FILTERED_DATA = [...freshData];
            }
            
            // Buscar por cualquier posible clave de ID y normalizar a string
            const currentData = ADMIN_CONFIG.CURRENT_DATA;
            console.log('Datos disponibles:', currentData.length);
            console.log('Buscando ID:', id, 'Tipo:', typeof id);
            
            const item = currentData.find(i => {
                const itemId = this.getItemId(i);
                console.log('Comparando:', String(itemId), 'con', String(id));
                return String(itemId) === String(id);
            });
            
            if (item) {
                console.log('Item encontrado:', item);
                ADMIN_CONFIG.EDITING_ITEM = item;
                this.showItemModal('Editar', this.getFormFields(ADMIN_CONFIG.CURRENT_SECTION), item);
            } else {
                console.error('Item no encontrado con id:', id);
                console.log('Datos disponibles:', currentData.map(i => ({ 
                    id: this.getItemId(i), 
                    titulo: i.titulo || i.nombre || 'Sin título',
                    tipo: typeof this.getItemId(i)
                })));
                this.showNotification('No se encontró el elemento a editar', 'error');
            }
        } catch (error) {
            console.error('Error cargando item para editar:', error);
            this.showNotification('Error cargando datos', 'error');
        }
    }

    showItemModal(title, fields, data = null) {
        console.log('Mostrando modal con título:', title);
        console.log('Campos:', fields);
        console.log('Datos:', data);
        
        document.getElementById('modal-title').textContent = title;
        
        const formFields = document.getElementById('form-fields');
        formFields.innerHTML = fields.map(field => {
            let value = data ? (data[field.key] || '') : '';
            let inputHtml = '';
            
            switch (field.type) {
                case 'text':
                case 'email':
                case 'url':
                case 'password':
                    inputHtml = `<input type="${field.type}" class="form-control" id="${field.key}" value="${value}" ${field.required ? 'required' : ''}>`;
                    break;
                case 'textarea':
                    inputHtml = `<textarea class="form-control" id="${field.key}" rows="3" ${field.required ? 'required' : ''}>${value}</textarea>`;
                    break;
                case 'number':
                    inputHtml = `<input type="number" class="form-control" id="${field.key}" value="${value}" ${field.required ? 'required' : ''}>`;
                    break;
                case 'date':
                    inputHtml = `<input type="date" class="form-control" id="${field.key}" value="${value}" ${field.required ? 'required' : ''}>`;
                    break;
                case 'time':
                    inputHtml = `<input type="time" class="form-control" id="${field.key}" value="${value}" ${field.required ? 'required' : ''}>`;
                    break;
                case 'select':
                    const options = field.options.map(opt => 
                        `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                    ).join('');
                    inputHtml = `<select class="form-control" id="${field.key}" ${field.required ? 'required' : ''}>${options}</select>`;
                    break;
                case 'checkbox':
                    inputHtml = `<div class="form-check">
                        <input type="checkbox" class="form-check-input" id="${field.key}" ${value ? 'checked' : ''}>
                        <label class="form-check-label" for="${field.key}">
                            ${field.label}
                        </label>
                    </div>`;
                    break;
            }
            
            // Añadir botón de subir imagen para campos de imagen
            let uploadButton = '';
            const section = ADMIN_CONFIG.CURRENT_SECTION;
            const isGallery = section === 'galeria';
            const isCarousel = section === 'carousel';
            const isProducts = section === 'productos';
            const imageFields = ['imagen_url'].concat(isGallery ? ['thumb_url'] : []);
            if (imageFields.includes(field.key) && (isGallery || isCarousel || isProducts)) {
                const uploadType = isCarousel ? 'carousel' : (isProducts ? 'products' : 'gallery');
                uploadButton = `
                    <div class="mt-2">
                        <button type="button" class="btn btn-outline-secondary btn-sm btn-upload-image" data-field="${field.key}" data-type="${uploadType}">
                            <i class="fas fa-upload me-1"></i>Subir Imagen
                        </button>
                        <div id="${field.key}-preview" class="mt-2" style="display: none;">
                            <img src="" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
                        </div>
                    </div>
                `;
            }
            
            // Para checkboxes, no mostrar el label principal ya que está incluido en el input
            const showLabel = field.type !== 'checkbox';
            
            return `
                <div class="mb-3">
                    ${showLabel ? `<label for="${field.key}" class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>` : ''}
                    ${inputHtml}
                    ${uploadButton}
                </div>
            `;
        }).join('');
        
        const modalElement = document.getElementById('itemModal');
        
        // Forzar visibilidad del modal
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');
        
        // Crear backdrop manualmente si no existe
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.style.zIndex = '9998';
            document.body.appendChild(backdrop);
        }
        
        // Prevenir scroll del body
        document.body.classList.add('modal-open');
        
        const modal = new bootstrap.Modal(modalElement);
        
        // Manejar eventos del modal para accesibilidad
        modalElement.addEventListener('shown.bs.modal', () => {
            // Enfocar el primer campo del formulario una vez visible
            setTimeout(() => {
                const firstInput = modalElement.querySelector('input:not([type="checkbox"]), textarea, select');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 0);
        });
        
        modalElement.addEventListener('hidden.bs.modal', () => {
            // Limpiar el formulario cuando se cierra
            document.getElementById('form-fields').innerHTML = '';
            // Remover backdrop
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
        });
        
        // Usar método personalizado en lugar de Bootstrap
        this.showCustomModal();
        
        // Event listener para botones de subir imagen y limpiar errores
        setTimeout(() => {
            // Botones de subir imagen
            document.querySelectorAll('.btn-upload-image').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const fieldKey = btn.dataset.field;
                    const uploadType = btn.dataset.type;
                    this.uploadImage(fieldKey, uploadType);
                });
            });
            
            // Limpiar errores cuando el usuario empieza a escribir
            document.querySelectorAll('#form-fields input, #form-fields textarea, #form-fields select').forEach(input => {
                input.addEventListener('input', (e) => {
                    e.target.classList.remove('is-invalid');
                });
            });
        }, 100);
    }

    // ===== MÉTODO ALTERNATIVO PARA MOSTRAR MODAL =====
    showCustomModal() {
        // Crear modal completamente nuevo
        this.createNewModal();
        console.log('Modal completamente nuevo creado y mostrado');
    }
    
    createNewModal() {
        // Remover modal existente si existe
        const existingModal = document.getElementById('newItemModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Crear el HTML del modal
        const modalHTML = `
            <div id="newItemModal" style="
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background-color: rgba(0, 0, 0, 0.5) !important;
                z-index: 99999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            ">
                <div style="
                    background-color: white !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
                    max-width: 800px !important;
                    width: 90% !important;
                    max-height: 90% !important;
                    overflow-y: auto !important;
                    position: relative !important;
                ">
                    <div style="
                        padding: 20px !important;
                        border-bottom: 1px solid #dee2e6 !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                    ">
                        <h5 id="newModalTitle" style="margin: 0 !important;">Editar</h5>
                        <button id="newModalClose" style="
                            background: none !important;
                            border: none !important;
                            font-size: 24px !important;
                            cursor: pointer !important;
                            color: #6c757d !important;
                        ">&times;</button>
                    </div>
                    <div style="padding: 20px !important;">
                        <form id="newItemForm">
                            <div id="newFormFields">
                                <!-- Los campos se generarán aquí -->
                            </div>
                        </form>
                    </div>
                    <div style="
                        padding: 20px !important;
                        border-top: 1px solid #dee2e6 !important;
                        display: flex !important;
                        justify-content: flex-end !important;
                        gap: 10px !important;
                    ">
                        <button id="newModalCancel" type="button" style="
                            padding: 8px 16px !important;
                            border: 1px solid #6c757d !important;
                            background: white !important;
                            color: #6c757d !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Cancelar</button>
                        <button id="newModalSave" type="button" style="
                            padding: 8px 16px !important;
                            border: none !important;
                            background: #007bff !important;
                            color: white !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar el modal en el body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
        
        // Configurar event listeners
        this.setupNewModalEvents();
        
        // Llenar el modal con los datos
        this.populateNewModal();
    }
    
    setupNewModalEvents() {
        const modal = document.getElementById('newItemModal');
        const closeBtn = document.getElementById('newModalClose');
        const cancelBtn = document.getElementById('newModalCancel');
        const saveBtn = document.getElementById('newModalSave');
        
        // Cerrar con botón X
        closeBtn.onclick = () => this.hideNewModal();
        
        // Cerrar con botón Cancelar
        cancelBtn.onclick = () => this.hideNewModal();
        
        // Guardar
        saveBtn.onclick = () => this.saveNewItem();
        
        // Cerrar con backdrop
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideNewModal();
            }
        };
    }
    
    populateNewModal() {
        const title = document.getElementById('newModalTitle');
        const formFields = document.getElementById('newFormFields');
        
        // Obtener datos del modal original
        const originalTitle = document.getElementById('modal-title').textContent;
        const originalFields = document.getElementById('form-fields').innerHTML;
        
        title.textContent = originalTitle;
        formFields.innerHTML = originalFields;
        
        // Enfocar el primer campo
        setTimeout(() => {
            const firstInput = formFields.querySelector('input:not([type="checkbox"]), textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
    
    hideNewModal() {
        // Remover el modal nuevo
        const modal = document.getElementById('newItemModal');
        if (modal) {
            modal.remove();
        }
        
        // Limpiar cualquier backdrop que pueda haber quedado
        const backdrops = document.querySelectorAll('.modal-backdrop, .custom-modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Remover clases del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Limpiar cualquier estilo que pueda haber quedado
        document.body.removeAttribute('style');
        
        console.log('Nuevo modal ocultado y limpieza completa realizada');
    }
    
    async saveNewItem() {
        try {
            // Obtener los datos del formulario del nuevo modal
            const formData = this.getFormDataFromNewModal();
            const section = ADMIN_CONFIG.CURRENT_SECTION;
            
            console.log('Guardando desde nuevo modal en sección:', section);
            
            // Preparar los datos para el envío
            let payload = {
                type: section,
                data: formData
            };
            
            // Si es una edición, asegurarse de incluir el ID
            if (ADMIN_CONFIG.EDITING_ITEM) {
                payload.edit_id = this.getItemId(ADMIN_CONFIG.EDITING_ITEM);
            }
            
            // Determinar el endpoint correcto
            const isUsers = section === 'users';
            const endpoint = isUsers ? 'users.php' : 'admin.php';
            
            // Mostrar indicador de carga
            const saveButton = document.getElementById('newModalSave');
            const originalButtonText = saveButton.innerHTML;
            saveButton.disabled = true;
            saveButton.innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></span> Guardando...';
            
            try {
                // Construir body según endpoint
                const body = isUsers ? JSON.stringify(formData) : JSON.stringify(payload);
                const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showNotification('Elemento guardado correctamente', 'success');
                    this.hideNewModal();
                    this.loadSectionData(section);
                } else {
                    this.showNotification(result.message || 'Error al guardar el elemento', 'error');
                }
            } finally {
                // Restaurar el botón
                saveButton.disabled = false;
                saveButton.innerHTML = originalButtonText;
            }
        } catch (error) {
            console.error('Error guardando elemento:', error);
            this.showNotification('Error al procesar la solicitud', 'error');
        }
    }
    
    getFormDataFromNewModal() {
        const formData = {};
        const formFields = document.getElementById('newFormFields');
        
        // Obtener todos los inputs del nuevo modal
        const inputs = formFields.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                formData[input.id] = input.checked;
            } else {
                formData[input.id] = input.value;
            }
        });
        
        return formData;
    }
    
    hideCustomModal() {
        const modalElement = document.getElementById('itemModal');
        
        // Ocultar modal
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
        modalElement.removeAttribute('style');
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Limpiar formulario
        const formFields = document.getElementById('form-fields');
        if (formFields) {
            formFields.innerHTML = '';
        }
        
        // Limpiar cualquier backdrop personalizado
        const backdrops = document.querySelectorAll('.custom-modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        console.log('Modal personalizado ocultado');
    }

    getFormFields(section) {
        const fields = {
            'users': [
                { key: 'name', label: 'Nombre', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'role', label: 'Rol', type: 'select', options: this.getRoleOptions(), required: true },
                { key: 'password', label: 'Contraseña' + (ADMIN_CONFIG.EDITING_ITEM ? ' (dejar en blanco para no cambiar)' : ''), 
                  type: 'password', required: !ADMIN_CONFIG.EDITING_ITEM },
                { key: 'active', label: 'Activo', type: 'checkbox' }
            ],
            'carousel': [
                { key: 'titulo', label: 'Título', type: 'text', required: true },
                { key: 'subtitulo', label: 'Subtítulo', type: 'text' },
                { key: 'imagen_url', label: 'URL de Imagen', type: 'url' },
                { key: 'enlace', label: 'Enlace', type: 'text' },
                { key: 'activo', label: 'Activo', type: 'checkbox' }
            ],
            'noticias': [
                { key: 'titulo', label: 'Título', type: 'text', required: true },
                { key: 'resumen', label: 'Resumen', type: 'textarea', required: true },
                { key: 'contenido', label: 'Contenido', type: 'textarea', required: true },
                { key: 'imagen_url', label: 'URL de Imagen', type: 'url' },
                { key: 'fecha_publicacion', label: 'Fecha de Publicación', type: 'date', required: true },
                { key: 'autor', label: 'Autor', type: 'text', required: true },
                { key: 'destacada', label: 'Destacada', type: 'checkbox' }
            ],
            'eventos': [
                { key: 'titulo', label: 'Título', type: 'text', required: true },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
                { key: 'fecha', label: 'Fecha', type: 'date', required: true },
                { key: 'hora', label: 'Hora', type: 'time', required: true },
                { key: 'lugar', label: 'Lugar', type: 'text', required: true },
                { key: 'tipo', label: 'Tipo', type: 'select', options: [
                    { value: 'presentacion', label: 'Presentación' },
                    { value: 'cena', label: 'Cena' },
                    { value: 'ensayo', label: 'Ensayo' },
                    { value: 'desfile', label: 'Desfile' }
                ]},
                { key: 'imagen_url', label: 'URL de Imagen', type: 'url' }
            ],
            'galeria': [
                { key: 'titulo', label: 'Título', type: 'text', required: true },
                { key: 'descripcion', label: 'Descripción', type: 'textarea' },
                { key: 'imagen_url', label: 'URL de Imagen', type: 'url', required: true },
                { key: 'thumb_url', label: 'URL de Miniatura', type: 'url' },
                { key: 'categoria', label: 'Categoría', type: 'text' },
                { key: 'fecha_subida', label: 'Fecha de Subida', type: 'date', required: true },
                { key: 'orden', label: 'Orden', type: 'number' }
            ],
            'productos': [
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
                { key: 'precio', label: 'Precio', type: 'number', required: true, step: '0.01' },
                { key: 'precio_oferta', label: 'Precio de Oferta', type: 'number', step: '0.01' },
                { key: 'imagen_url', label: 'URL de Imagen', type: 'url' },
                { key: 'categoria', label: 'Categoría', type: 'text' },
                { key: 'stock', label: 'Stock', type: 'number', required: true },
                { key: 'destacado', label: 'Destacado', type: 'checkbox' }
            ],
            'directiva': [
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'cargo', label: 'Cargo', type: 'text', required: true },
                { key: 'imagen', label: 'URL de Imagen', type: 'url' },
                { key: 'descripcion', label: 'Descripción', type: 'textarea' }
            ],
            'socios': [
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'telefono', label: 'Teléfono', type: 'text' },
                { key: 'direccion', label: 'Dirección', type: 'textarea' },
                { key: 'fecha_ingreso', label: 'Fecha de Ingreso', type: 'date', required: true },
                { key: 'numero_socio', label: 'Número de Socio', type: 'text' },
                { key: 'activo', label: 'Activo', type: 'checkbox' }
            ],
            'contactos': [
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'telefono', label: 'Teléfono', type: 'text' },
                { key: 'asunto', label: 'Asunto', type: 'text', required: true },
                { key: 'mensaje', label: 'Mensaje', type: 'textarea', required: true },
                { key: 'fecha', label: 'Fecha de Contacto', type: 'date', required: true },
                { key: 'estado', label: 'Estado', type: 'select', options: [
                    { value: 'nuevo', label: 'Nuevo' },
                    { value: 'leido', label: 'Leído' },
                    { value: 'respondido', label: 'Respondido' },
                    { value: 'cerrado', label: 'Cerrado' }
                ], required: true },
                { key: 'prioridad', label: 'Prioridad', type: 'select', options: [
                    { value: 'baja', label: 'Baja' },
                    { value: 'media', label: 'Media' },
                    { value: 'alta', label: 'Alta' },
                    { value: 'urgente', label: 'Urgente' }
                ], required: true },
                { key: 'notas', label: 'Notas Internas', type: 'textarea' }
            ]
        };
        
        return fields[section] || [];
    }

    // ===== GUARDAR ELEMENTO =====
    async saveItem() {
        try {
            const formData = this.getFormData();
            const section = ADMIN_CONFIG.CURRENT_SECTION;
            
            console.log('Guardando item en sección:', section);
            console.log('Datos del formulario:', formData);
            console.log('Modo edición:', !!ADMIN_CONFIG.EDITING_ITEM);
            
            // Validación de campos requeridos
            const requiredFields = this.getFormFields(section).filter(f => f.required);
            console.log('Campos requeridos:', requiredFields.map(f => f.key));
            
            for (const field of requiredFields) {
                // Excluir password en modo edición si está vacío
                if (field.key === 'password' && ADMIN_CONFIG.EDITING_ITEM) {
                    console.log('Saltando validación de password en modo edición');
                    continue;
                }
                
                const value = formData[field.key];
                console.log(`Validando campo ${field.key}:`, value, typeof value);
                
                // Verificar si el valor está vacío (null, undefined, cadena vacía o solo espacios)
                // Para checkboxes, false es un valor válido
                if (field.type === 'checkbox') {
                    continue; // Los checkboxes siempre tienen un valor (true/false)
                }
                
                if (value === null || value === undefined || (typeof value === 'string' && value === '')) {
                    console.error(`Campo ${field.key} está vacío`);
                    this.showNotification(`El campo ${field.label} es requerido`, 'error');
                    // Resaltar el campo con error
                    const element = document.getElementById(field.key);
                    if (element) {
                        element.classList.add('is-invalid');
                        element.focus();
                    }
                    return;
                }
            }
            
            // Validación de email para usuarios
            if (section === 'users' && formData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    this.showNotification('El formato del email no es válido', 'error');
                    return;
                }
            }
            
            // Preparar los datos para el envío
            let payload = {
                type: section,
                data: formData
            };
            
            // Si es una edición, asegurarse de incluir el ID
            if (ADMIN_CONFIG.EDITING_ITEM) {
                payload.edit_id = this.getItemId(ADMIN_CONFIG.EDITING_ITEM);
            }
            
            // Determinar el endpoint correcto
            const isUsers = section === 'users';
            const endpoint = isUsers ? 'users.php' : 'admin.php';
            
            // Mostrar indicador de carga
            const saveButton = document.querySelector('#itemModal .btn-primary');
            const originalButtonText = saveButton.innerHTML;
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            
            try {
                // Construir body según endpoint
                const body = isUsers ? JSON.stringify(formData) : JSON.stringify(payload);
                const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showNotification('Elemento guardado correctamente', 'success');
                    this.hideCustomModal();
                    this.loadSectionData(section);
                } else {
                    this.showNotification(result.message || 'Error al guardar el elemento', 'error');
                }
            } finally {
                // Restaurar el botón
                saveButton.disabled = false;
                saveButton.innerHTML = originalButtonText;
            }
        } catch (error) {
            console.error('Error guardando elemento:', error);
            this.showNotification('Error al procesar la solicitud', 'error');
        }
    }

    getFormData() {
        const formData = {};
        const fields = this.getFormFields(ADMIN_CONFIG.CURRENT_SECTION);
        const isEditing = !!ADMIN_CONFIG.EDITING_ITEM;
        
        console.log('=== INICIO getFormData ===');
        console.log('Sección:', ADMIN_CONFIG.CURRENT_SECTION);
        console.log('Campos a procesar:', fields.map(f => f.key));
        
        fields.forEach(field => {
            const element = document.getElementById(field.key);
            
            console.log(`\nProcesando campo: ${field.key}`);
            console.log('  - Tipo:', field.type);
            console.log('  - Elemento encontrado:', !!element);
            
            if (!element) {
                console.warn(`  ⚠️ Campo no encontrado en DOM: ${field.key}`);
                return;
            }
            
            console.log('  - Valor raw:', element.value);
            console.log('  - Tipo de input:', element.type);
            
            // Limpiar clases de error
            element.classList.remove('is-invalid');
            
            if (field.type === 'checkbox') {
                formData[field.key] = element.checked;
                console.log('  - Valor checkbox:', element.checked);
            } else if (field.key === 'password' && isEditing && !element.value) {
                // No incluir la contraseña si estamos editando y el campo está vacío
                console.log('  - Password vacío en edición, no se incluye');
                return;
            } else {
                const value = element.value.trim();
                formData[field.key] = value;
                console.log('  - Valor procesado:', value);
            }
        });
        
        // Añadir el ID si estamos editando
        if (isEditing) {
            formData.id = this.getItemId(ADMIN_CONFIG.EDITING_ITEM);
        }
        
        console.log('\n=== FIN getFormData ===');
        console.log('FormData final:', formData);
        return formData;
    }

    // ===== ELIMINAR ELEMENTO =====
    async deleteItem(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            return;
        }
        
        try {
            const isUsers = ADMIN_CONFIG.CURRENT_SECTION === 'users';
            const endpoint = isUsers ? 'users.php' : 'admin.php';
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    isUsers
                        ? { id }
                        : { type: ADMIN_CONFIG.CURRENT_SECTION, id }
                )
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Elemento eliminado correctamente', 'success');
                this.loadSectionData(ADMIN_CONFIG.CURRENT_SECTION);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error eliminando elemento:', error);
            this.showNotification('Error eliminando elemento', 'error');
        }
    }

    // ===== ACTIVIDAD RECIENTE =====
    showRecentActivity(items) {
        const container = document.getElementById('recent-activity');
        
        // Ordenar por fecha (más recientes primero)
        const sortedItems = items
            .filter(item => item.updated_at || item.fecha_publicacion || item.fecha || item.fecha_subida)
            .sort((a, b) => {
                const dateA = new Date(a.updated_at || a.fecha_publicacion || a.fecha || a.fecha_subida);
                const dateB = new Date(b.updated_at || b.fecha_publicacion || b.fecha || b.fecha_subida);
                return dateB - dateA;
            })
            .slice(0, 10);
        
        if (sortedItems.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay actividad reciente</p>';
            return;
        }
        
        container.innerHTML = sortedItems.map(item => {
            const title = item.titulo || item.nombre || 'Sin título';
            const date = new Date(item.updated_at || item.fecha_publicacion || item.fecha || item.fecha_subida);
            const type = this.getItemType(item);
            
            return `
                <div class="d-flex align-items-center mb-2">
                    <div class="flex-shrink-0">
                        <i class="fas fa-${this.getTypeIcon(type)} text-primary"></i>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <div class="fw-bold">${title}</div>
                        <small class="text-muted">${date.toLocaleDateString('es-ES')} - ${type}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    getItemType(item) {
        if (item.titulo && item.resumen) return 'Noticia';
        if (item.titulo && item.fecha && item.hora) return 'Evento';
        if (item.nombre && item.precio !== undefined) return 'Producto';
        if (item.nombre && item.cargo) return 'Directiva';
        if (item.titulo && item.imagen_url) return 'Galería';
        if (item.nombre && item.email) return 'Contacto';
        return 'Elemento';
    }

    getTypeIcon(type) {
        const icons = {
            'Noticia': 'newspaper',
            'Evento': 'calendar',
            'Producto': 'shopping-cart',
            'Directiva': 'users',
            'Galería': 'images',
            'Contacto': 'envelope',
            'Elemento': 'file'
        };
        return icons[type] || 'file';
    }

    // ===== UTIL: Normalizar ID de item =====
    getItemId(item) {
        if (!item) return null;
        return item.id ?? item.imagen_id ?? item._id ?? null;
    }

    // ===== SUBIDA DE IMÁGENES =====
    async uploadImage(fieldKey, uploadType) {
        // Verificar que el usuario es administrador
        if (!this.isAdmin()) {
            this.showNotification('Solo los administradores pueden subir imágenes', 'error');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('La imagen no puede superar los 5MB', 'error');
                return;
            }

            // Validar tipo
            if (!file.type.startsWith('image/')) {
                this.showNotification('Solo se permiten archivos de imagen', 'error');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', uploadType);

                this.showNotification('Subiendo imagen...', 'info');

                const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}upload.php`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Rellenar el campo con la URL de la imagen
                    const field = document.getElementById(fieldKey);
                    if (field) {
                        field.value = result.data.path;
                    }

                    // Mostrar preview
                    const preview = document.getElementById(`${fieldKey}-preview`);
                    if (preview) {
                        const img = preview.querySelector('img');
                        if (img) {
                            img.src = result.data.path;
                            preview.style.display = 'block';
                        }
                    }

                    this.showNotification('Imagen subida correctamente', 'success');
                } else {
                    this.showNotification(result.message || 'Error subiendo imagen', 'error');
                }
            } catch (error) {
                console.error('Error subiendo imagen:', error);
                this.showNotification('Error subiendo imagen', 'error');
            }
        };

        input.click();
    }

    isAdmin() {
        // Verificar si el usuario actual es administrador
        // Obtener el rol desde la sesión almacenada
        const userRole = this.getCurrentUserRole();
        return userRole === 'admin';
    }

    getCurrentUserRole() {
        // Obtener el rol del usuario desde la sesión almacenada
        if (window.currentUserRole) {
            return window.currentUserRole;
        }
        
        // Si no está disponible, intentar obtenerlo de la sesión
        // Esto se ejecutará cuando se cargue la página
        return 'admin'; // Fallback a admin por compatibilidad
    }

    getRoleOptions() {
        const currentRole = this.getCurrentUserRole();
        const baseOptions = [
            { value: 'editor', label: 'Editor' },
            { value: 'viewer', label: 'Lector' }
        ];
        
        // Solo los administradores pueden crear otros administradores y socios
        if (currentRole === 'admin') {
            baseOptions.unshift(
                { value: 'admin', label: 'Administrador' },
                { value: 'socio', label: 'Socio' }
            );
        }
        
        return baseOptions;
    }

    canAccessSocios() {
        const currentRole = this.getCurrentUserRole();
        return currentRole === 'admin' || currentRole === 'socio';
    }

    // ===== GESTIÓN DE TEXTOS =====
    async showTextSection(section) {
        // Actualizar botones activos
        document.querySelectorAll('.btn-text-section').forEach(btn => {
            btn.classList.remove('active');
        });
        // Marcar como activo el botón correspondiente
        const activeButton = document.querySelector(`[data-text-section="${section}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php?type=textos`);
            const result = await response.json();
            
            if (result.success) {
                this.renderTextSection(section, result.data);
            } else {
                this.showNotification('Error cargando textos', 'error');
            }
        } catch (error) {
            console.error('Error cargando textos:', error);
            this.showNotification('Error cargando textos', 'error');
        }
    }

    renderTextSection(section, textos) {
        const container = document.getElementById('textos-form-container');
        
        if (!textos[section]) {
            container.innerHTML = '<p class="text-muted">No hay textos configurados para esta sección.</p>';
            return;
        }

        const sectionData = textos[section];
        let html = `<h4>Textos de la sección: ${section}</h4><hr>`;

        Object.entries(sectionData).forEach(([key, value]) => {
            const fieldId = `${section}_${key}`;
            const label = this.getFieldLabel(key);
            
            html += `
                <div class="mb-3">
                    <label for="${fieldId}" class="form-label fw-bold">${label}</label>
                    ${Array.isArray(value) ? 
                        `<textarea class="form-control" id="${fieldId}" rows="3">${value.join('\n')}</textarea>` :
                        `<input type="text" class="form-control" id="${fieldId}" value="${value}">`
                    }
                    <small class="text-muted">Campo: ${key}</small>
                </div>
            `;
        });

        html += `
            <div class="mt-4">
                <button class="btn btn-primary btn-save-text" data-section="${section}">
                    <i class="fas fa-save me-2"></i>Guardar Cambios
                </button>
                <button class="btn btn-secondary ms-2 btn-preview-text" data-section="${section}">
                    <i class="fas fa-eye me-2"></i>Vista Previa
                </button>
            </div>
        `;

        container.innerHTML = html;
        
        // Event listeners para botones de guardar y vista previa
        setTimeout(() => {
            const saveBtn = container.querySelector('.btn-save-text');
            const previewBtn = container.querySelector('.btn-preview-text');
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.saveTextSection(section);
                });
            }
            
            if (previewBtn) {
                previewBtn.addEventListener('click', () => {
                    this.previewTextSection(section);
                });
            }
        }, 100);
    }

    getFieldLabel(key) {
        const labels = {
            'titulo': 'Título',
            'subtitulo': 'Subtítulo',
            'descripcion': 'Descripción',
            'texto_bienvenida': 'Texto de Bienvenida',
            'fecha_fundacion': 'Fecha de Fundación',
            'fundadores': 'Fundadores',
            'beneficios': 'Beneficios (uno por línea)',
            'direccion': 'Dirección',
            'email': 'Email',
            'telefono': 'Teléfono',
            'horario_atencion': 'Horario de Atención',
            'texto_copyright': 'Texto de Copyright',
            'keywords': 'Palabras Clave SEO',
            'descripcion_seo': 'Descripción SEO'
        };
        return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    async saveTextSection(section) {
        try {
            const sectionData = {};
            const inputs = document.querySelectorAll(`#textos-form-container input, #textos-form-container textarea`);
            
            inputs.forEach(input => {
                const key = input.id.replace(`${section}_`, '');
                const value = input.value;
                
                // Si el campo original era un array, convertir de vuelta
                if (input.tagName === 'TEXTAREA' && key === 'beneficios') {
                    sectionData[key] = value.split('\n').filter(line => line.trim());
                } else {
                    sectionData[key] = value;
                }
            });

            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'textos',
                    section: section,
                    data: sectionData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Textos guardados correctamente', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error guardando textos:', error);
            this.showNotification('Error guardando textos', 'error');
        }
    }

    previewTextSection(section) {
        // Crear una ventana de vista previa
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        const sectionData = {};
        
        const inputs = document.querySelectorAll(`#textos-form-container input, #textos-form-container textarea`);
        inputs.forEach(input => {
            const key = input.id.replace(`${section}_`, '');
            const value = input.value;
            
            if (input.tagName === 'TEXTAREA' && key === 'beneficios') {
                sectionData[key] = value.split('\n').filter(line => line.trim());
            } else {
                sectionData[key] = value;
            }
        });

        previewWindow.document.write(`
            <html>
            <head>
                <title>Vista Previa - ${section}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .preview-section { border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
                    h1 { color: #DC143C; }
                    h2 { color: #333; }
                </style>
            </head>
            <body>
                <h1>Vista Previa - Sección ${section}</h1>
                <div class="preview-section">
                    ${this.generatePreviewHTML(section, sectionData)}
                </div>
            </body>
            </html>
        `);
    }

    generatePreviewHTML(section, data) {
        let html = '';
        
        if (data.titulo) html += `<h1>${data.titulo}</h1>`;
        if (data.subtitulo) html += `<h2>${data.subtitulo}</h2>`;
        if (data.descripcion) html += `<p>${data.descripcion}</p>`;
        if (data.texto_bienvenida) html += `<p><em>${data.texto_bienvenida}</em></p>`;
        
        if (data.beneficios && Array.isArray(data.beneficios)) {
            html += '<ul>';
            data.beneficios.forEach(beneficio => {
                html += `<li>${beneficio}</li>`;
            });
            html += '</ul>';
        }
        
        return html;
    }

    // ===== BÚSQUEDA Y FILTRADO =====
    setupFilters(section) {
        const filterSelect = document.getElementById('filter-select');
        if (!filterSelect) return;
        
        // Configurar opciones de filtro según la sección
        const filterOptions = {
            'noticias': [
                { value: '', label: 'Todos' },
                { value: 'destacada:true', label: 'Destacadas' },
                { value: 'destacada:false', label: 'No destacadas' }
            ],
            'eventos': [
                { value: '', label: 'Todos' },
                { value: 'tipo:presentacion', label: 'Presentaciones' },
                { value: 'tipo:cena', label: 'Cenas' },
                { value: 'tipo:ensayo', label: 'Ensayos' },
                { value: 'tipo:desfile', label: 'Desfiles' }
            ],
            'productos': [
                { value: '', label: 'Todos' },
                { value: 'destacado:true', label: 'Destacados' },
                { value: 'stock:>0', label: 'En stock' },
                { value: 'stock:0', label: 'Sin stock' }
            ],
            'users': [
                { value: '', label: 'Todos' },
                { value: 'role:admin', label: 'Administradores' },
                { value: 'role:editor', label: 'Editores' },
                { value: 'role:socio', label: 'Socios' },
                { value: 'active:true', label: 'Activos' },
                { value: 'active:false', label: 'Inactivos' }
            ],
            'socios': [
                { value: '', label: 'Todos' },
                { value: 'activo:true', label: 'Activos' },
                { value: 'activo:false', label: 'Inactivos' }
            ],
            'contactos': [
                { value: '', label: 'Todos' },
                { value: 'estado:nuevo', label: 'Nuevos' },
                { value: 'estado:leido', label: 'Leídos' },
                { value: 'estado:respondido', label: 'Respondidos' },
                { value: 'estado:cerrado', label: 'Cerrados' },
                { value: 'prioridad:urgente', label: 'Urgentes' },
                { value: 'prioridad:alta', label: 'Alta Prioridad' },
                { value: 'prioridad:media', label: 'Media Prioridad' },
                { value: 'prioridad:baja', label: 'Baja Prioridad' }
            ]
        };
        
        const options = filterOptions[section] || [{ value: '', label: 'Todos' }];
        filterSelect.innerHTML = options.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
    }

    filterAndRenderTable() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('filter-select')?.value || '';
        
        // Filtrar datos
        let filtered = ADMIN_CONFIG.CURRENT_DATA.filter(item => {
            // Búsqueda por texto
            if (searchTerm) {
                const searchableText = Object.values(item).join(' ').toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Filtro por categoría/estado
            if (filterValue) {
                const [key, value] = filterValue.split(':');
                if (value === 'true' || value === 'false') {
                    if (item[key] !== (value === 'true')) return false;
                } else if (value.startsWith('>')) {
                    if (!(item[key] > parseInt(value.substring(1)))) return false;
                } else {
                    if (item[key] !== value) return false;
                }
            }
            
            return true;
        });
        
        ADMIN_CONFIG.FILTERED_DATA = filtered;
        
        // Renderizar con paginación
        this.renderTableWithPagination();
    }

    renderTableWithPagination() {
        const section = ADMIN_CONFIG.CURRENT_SECTION;
        const data = ADMIN_CONFIG.FILTERED_DATA;
        const page = ADMIN_CONFIG.CURRENT_PAGE;
        const perPage = ADMIN_CONFIG.ITEMS_PER_PAGE;
        
        // Calcular paginación
        const totalItems = data.length;
        const totalPages = Math.ceil(totalItems / perPage);
        const startIndex = (page - 1) * perPage;
        const endIndex = Math.min(startIndex + perPage, totalItems);
        const pageData = data.slice(startIndex, endIndex);
        
        // Renderizar tabla
        this.renderTable(section, pageData);
        
        // Actualizar info
        const tableInfo = document.getElementById('table-info');
        if (tableInfo) {
            tableInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalItems} elementos`;
        }
        
        // Renderizar paginación
        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const currentPage = ADMIN_CONFIG.CURRENT_PAGE;
        let html = '';
        
        // Botón anterior
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Páginas
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        
        if (startPage > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
        }
        
        // Botón siguiente
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        pagination.innerHTML = html;
        
        // Event listeners para paginación
        pagination.querySelectorAll('a.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
                if (page && page !== ADMIN_CONFIG.CURRENT_PAGE) {
                    ADMIN_CONFIG.CURRENT_PAGE = page;
                    this.renderTableWithPagination();
                }
            });
        });
    }

    // ===== EXPORTACIÓN =====
    exportToCSV() {
        const section = ADMIN_CONFIG.CURRENT_SECTION;
        const data = ADMIN_CONFIG.FILTERED_DATA;
        const columns = this.getColumnsConfig(section);
        
        if (data.length === 0) {
            this.showNotification('No hay datos para exportar', 'warning');
            return;
        }
        
        // Crear encabezados
        const headers = columns.map(col => col.title).join(',');
        
        // Crear filas
        const rows = data.map(item => {
            return columns.map(col => {
                let value = item[col.key] || '';
                
                // Limpiar valores para CSV
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""'); // Escapar comillas
                    if (value.includes(',') || value.includes('\n')) {
                        value = `"${value}"`;
                    }
                }
                
                return value;
            }).join(',');
        }).join('\n');
        
        // Combinar
        const csv = headers + '\n' + rows;
        
        // Descargar
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${section}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Datos exportados correctamente', 'success');
    }

    // ===== ORDENAMIENTO =====
    sortTable(columnKey) {
        if (ADMIN_CONFIG.SORT_COLUMN === columnKey) {
            // Cambiar dirección
            ADMIN_CONFIG.SORT_DIRECTION = ADMIN_CONFIG.SORT_DIRECTION === 'asc' ? 'desc' : 'asc';
        } else {
            ADMIN_CONFIG.SORT_COLUMN = columnKey;
            ADMIN_CONFIG.SORT_DIRECTION = 'asc';
        }
        
        // Ordenar datos
        ADMIN_CONFIG.FILTERED_DATA.sort((a, b) => {
            let aVal = a[columnKey] || '';
            let bVal = b[columnKey] || '';
            
            // Convertir a números si es posible
            if (!isNaN(aVal) && !isNaN(bVal)) {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }
            
            if (aVal < bVal) return ADMIN_CONFIG.SORT_DIRECTION === 'asc' ? -1 : 1;
            if (aVal > bVal) return ADMIN_CONFIG.SORT_DIRECTION === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.renderTableWithPagination();
    }

    // ===== NOTIFICACIONES =====
    showNotification(message, type) {
        Utils.showNotification(message, type);
    }

    // ===== SOLICITUDES =====
    async loadSolicitudes() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}solicitudes.php`);
            const result = await response.json();
            
            if (result.success) {
                ADMIN_CONFIG.CURRENT_DATA = result.data;
                ADMIN_CONFIG.FILTERED_DATA = [...result.data];
                this.renderTableWithPagination();
            } else {
                this.showNotification('Error cargando solicitudes: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
            this.showNotification('Error de conexión al cargar solicitudes', 'error');
        }
    }
}

// ===== MÉTODO DE EMERGENCIA PARA LIMPIAR BACKDROP =====
function clearAllBackdrops() {
    // Remover todos los backdrops posibles
    const backdrops = document.querySelectorAll('.modal-backdrop, .custom-modal-backdrop, .fade, [class*="backdrop"]');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Limpiar body completamente
    document.body.classList.remove('modal-open');
    document.body.removeAttribute('style');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Remover cualquier modal que pueda estar oculto
    const modals = document.querySelectorAll('#itemModal, #newItemModal');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    
    console.log('Limpieza completa de backdrops realizada');
}

// Hacer el método disponible globalmente
window.clearAllBackdrops = clearAllBackdrops;

// ===== INICIALIZACIÓN =====
let adminApp;

// Initialize the app immediately if the DOM is already loaded
if (document.readyState === 'loading') {
    // If the DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', () => {
        adminApp = new AdminApp();
        window.adminApp = adminApp;
    });
} else {
    // If the DOM is already loaded, initialize immediately
    adminApp = new AdminApp();
    window.adminApp = adminApp;
}
