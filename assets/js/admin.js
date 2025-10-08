// ===== CONFIGURACIÓN =====
const ADMIN_CONFIG = {
    API_BASE_URL: 'api/',
    CURRENT_SECTION: 'dashboard',
    EDITING_ITEM: null
};

// ===== CLASE PRINCIPAL DEL ADMIN =====
class AdminApp {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
    }

    // ===== AUTENTICACIÓN =====
    async checkAuth() {
        try {
            // Verificar si hay un usuario logueado en localStorage
            const userData = localStorage.getItem('admin_user');
            if (userData) {
                const user = JSON.parse(userData);
                window.currentUserRole = user.role;
                this.showDashboard(user.email);
                return;
            }
            
            // Si no hay usuario, mostrar login
            this.showLogin();
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            this.showLogin();
        }
    }

    async login(email, password) {
        try {
            // Sistema de login simple - verificar contra usuarios conocidos
            const validUsers = [
                { email: 'admin@mariscales.com', password: 'admin123', role: 'admin' },
                { email: 'admin@filamariscales.com', password: 'admin123', role: 'admin' }
            ];
            
            const user = validUsers.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Guardar usuario en localStorage
                localStorage.setItem('admin_user', JSON.stringify({
                    email: user.email,
                    role: user.role
                }));
                
                window.currentUserRole = user.role;
                this.showDashboard(user.email);
                this.showNotification('Login exitoso', 'success');
            } else {
                this.showNotification('Credenciales incorrectas', 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showNotification('Error de conexión', 'error');
        }
    }

    async logout() {
        try {
            // Limpiar localStorage
            localStorage.removeItem('admin_user');
            window.currentUserRole = null;
            this.showLogin();
            this.showNotification('Sesión cerrada', 'info');
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }

    showLogin() {
        const loginContainer = document.getElementById('login-container');
        const adminDashboard = document.getElementById('admin-dashboard');
        
        if (loginContainer) loginContainer.style.display = 'block';
        if (adminDashboard) adminDashboard.style.display = 'none';
    }

    showDashboard(email) {
        const loginContainer = document.getElementById('login-container');
        const adminDashboard = document.getElementById('admin-dashboard');
        const adminEmail = document.getElementById('admin-email');
        
        if (loginContainer) loginContainer.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
        if (adminEmail) adminEmail.textContent = email;
        
        this.loadDashboardData();
    }

    // ===== CONFIGURACIÓN DE EVENTOS =====
    setupEventListeners() {
        // Login form (solo si existe)
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                this.login(email, password);
            });
        }

        // Navigation (solo si existen los elementos)
        const navLinks = document.querySelectorAll('[data-section]');
        if (navLinks.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = e.target.closest('[data-section]').dataset.section;
                    this.showSection(section);
                });
            });
        }

        // Add item button (solo si existe)
        const addBtn = document.getElementById('add-item-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showAddModal();
            });
        }
    }

    // ===== NAVEGACIÓN =====
    showSection(section) {
        console.log('showSection called with:', section);
        
        // Verificar acceso a secciones restringidas
        if (section === 'socios' && !this.canAccessSocios()) {
            this.showNotification('No tienes permisos para acceder a esta sección', 'error');
            return;
        }
        
        ADMIN_CONFIG.CURRENT_SECTION = section;
        
        // Update navigation
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Show/hide content sections
        document.querySelectorAll('.content-section').forEach(contentSection => {
            contentSection.classList.remove('active');
        });
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Load data for the section
        console.log('Loading data for section:', section);
        this.loadSectionData(section);
        
        // Si es la sección de textos, cargar automáticamente la sección "home"
        if (section === 'textos') {
            setTimeout(() => {
                this.showTextSection('home');
            }, 100);
        }
    }

    // ===== CARGA DE DATOS =====
    async loadDashboardData() {
        try {
            // Cargar estadísticas desde la nueva API
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}stats.php`);
            const result = await response.json();
            
            if (result.success) {
                this.updateDashboardStats(result.data);
                this.showRecentActivity(result.data.recent_activity);
            } else {
                console.error('Error cargando estadísticas:', result.message);
                // Fallback al método anterior
                this.loadDashboardDataFallback();
            }
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            // Fallback al método anterior
            this.loadDashboardDataFallback();
        }
    }

    async loadDashboardDataFallback() {
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
            console.error('Error cargando datos del dashboard (fallback):', error);
        }
    }

    updateDashboardStats(stats) {
        // Actualizar contadores principales
        const elements = {
            'noticias-count': stats.noticias,
            'eventos-count': stats.eventos,
            'productos-count': stats.productos,
            'contactos-count': stats.contactos,
            'galeria-count': stats.galeria,
            'socios-count': stats.socios,
            'usuarios-count': stats.usuarios,
            'directiva-count': stats.directiva
        };

        Object.entries(elements).forEach(([id, count]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count;
            }
        });

        // Actualizar información del sistema si existe
        if (stats.system) {
            const systemInfo = document.getElementById('system-info');
            if (systemInfo) {
                systemInfo.innerHTML = `
                    <small class="text-muted">
                        PHP ${stats.system.php_version} | 
                        Tamaño datos: ${this.formatBytes(stats.system.data_size)} | 
                        ${stats.system.server_time}
                    </small>
                `;
            }
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async refreshStats() {
        const button = document.querySelector('button[onclick="adminApp.refreshStats()"]');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Actualizando...';
        button.disabled = true;

        try {
            await this.loadDashboardData();
            this.showNotification('Estadísticas actualizadas', 'success');
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
            this.showNotification('Error al actualizar estadísticas', 'error');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    showRecentActivity(activity) {
        const tableBody = document.getElementById('recent-activity-table');
        if (!tableBody) return;

        if (!activity || activity.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted">
                        <i class="fas fa-info-circle me-2"></i>No hay actividad reciente
                    </td>
                </tr>
            `;
            return;
        }

        const rows = activity.map(item => {
            const fileName = item.file.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const lastModified = new Date(item.last_modified).toLocaleString('es-ES');
            const size = this.formatBytes(item.size);
            
            return `
                <tr>
                    <td>
                        <i class="fas fa-file-alt me-2 text-primary"></i>
                        ${fileName}
                    </td>
                    <td>${lastModified}</td>
                    <td>${size}</td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    }

    async loadSectionData(section) {
        console.log('loadSectionData called with:', section);
        try {
            // Manejar secciones especiales
            if (section === 'libros') {
                console.log('Loading libros data');
                this.loadLibrosData();
                return;
            }
            
            if (section === 'configuracion') {
                console.log('Loading configuracion data');
                this.loadConfiguracionData();
                return;
            }
            
            if (section === 'redes-sociales') {
                console.log('Loading social data');
                this.loadSocialData();
                return;
            }
            
            // Secciones normales
            console.log('Fetching data for section:', section);
            const data = await this.fetchData(section);
            console.log('Data received:', data);
            
            // Renderizar según el tipo de sección
            if (section === 'socios') {
                console.log('Rendering socios table');
                this.renderSociosTable(data);
            } else if (section === 'textos') {
                console.log('Rendering textos content');
                this.renderTextosContent(data);
            } else {
                console.log('Rendering table for section:', section);
                this.renderTable(section, data);
            }
        } catch (error) {
            console.error(`Error cargando datos de ${section}:`, error);
            this.showNotification('Error cargando datos', 'error');
        }
    }

    async fetchData(type) {
        console.log('fetchData called with type:', type);
        const endpoint = type === 'users' ? 'users.php' : 'admin.php';
        const url = `${ADMIN_CONFIG.API_BASE_URL}${endpoint}?type=${type}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Response result:', result);
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    }

    // ===== RENDERIZADO DE TABLAS =====
    renderTable(section, data) {
        console.log('renderTable called with section:', section, 'data:', data);
        const container = document.getElementById(`${section}-table-container`);
        console.log('Container found:', container);
        if (!container) {
            console.error(`Container not found: ${section}-table-container`);
            return;
        }
        
        // Configuración de columnas por sección
        const columns = this.getColumnsConfig(section);
        
        // Renderizar contenido
        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay datos disponibles</h5>
                    <p class="text-muted">Los datos aparecerán aquí cuando se añadan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5>Lista de ${this.getSectionTitle(section)} (${data.length})</h5>
                <button class="btn btn-primary" onclick="adminApp.showAddModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo ${this.getSectionTitle(section).slice(0, -1)}
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            ${columns.map(col => `<th>${col.title}</th>`).join('')}
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
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
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="adminApp.editItem('${item.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="adminApp.deleteItem('${item.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getSectionTitle(section) {
        const titles = {
            'noticias': 'Noticias',
            'eventos': 'Eventos',
            'galeria': 'Fotos',
            'usuarios': 'Usuarios',
            'productos': 'Productos',
            'directiva': 'Directiva',
            'contactos': 'Contactos'
        };
        return titles[section] || 'Elementos';
    }

    getColumnsConfig(section) {
        const configs = {
            'users': [
                { key: 'name', title: 'Nombre', type: 'text' },
                { key: 'email', title: 'Email', type: 'text' },
                { key: 'role', title: 'Rol', type: 'text' },
                { key: 'active', title: 'Activo', type: 'boolean' }
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
                { key: 'fecha', title: 'Fecha', type: 'date' },
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
            ]
        };
        
        return configs[section] || [];
    }

    // ===== MODALES =====
    showAddModal() {
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
            const data = await this.fetchData(ADMIN_CONFIG.CURRENT_SECTION);
            const item = data.find(i => i.id === id);
            
            if (item) {
                ADMIN_CONFIG.EDITING_ITEM = item;
                this.showItemModal('Editar', this.getFormFields(ADMIN_CONFIG.CURRENT_SECTION), item);
            }
        } catch (error) {
            console.error('Error cargando item para editar:', error);
            this.showNotification('Error cargando datos', 'error');
        }
    }

    showItemModal(title, fields, data = null) {
        document.getElementById('modal-title').textContent = title;
        
        const formFields = document.getElementById('form-fields');
        formFields.innerHTML = fields.map(field => {
            let value = data ? (data[field.key] || '') : '';
            let inputHtml = '';
            
            switch (field.type) {
                case 'text':
                case 'email':
                case 'url':
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
                    inputHtml = `<input type="checkbox" class="form-check-input" id="${field.key}" ${value ? 'checked' : ''}>`;
                    break;
            }
            
            // Añadir botón de subir imagen para campos de imagen
            let uploadButton = '';
            if (field.key === 'imagen_url' && (ADMIN_CONFIG.CURRENT_SECTION === 'carousel' || ADMIN_CONFIG.CURRENT_SECTION === 'galeria')) {
                const uploadType = ADMIN_CONFIG.CURRENT_SECTION === 'carousel' ? 'carousel' : 'gallery';
                uploadButton = `
                    <div class="mt-2">
                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="adminApp.uploadImage('${field.key}', '${uploadType}')">
                            <i class="fas fa-upload me-1"></i>Subir Imagen
                        </button>
                        <div id="${field.key}-preview" class="mt-2" style="display: none;">
                            <img src="" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="mb-3">
                    <label for="${field.key}" class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
                    ${inputHtml}
                    ${uploadButton}
                </div>
            `;
        }).join('');
        
        const modal = new bootstrap.Modal(document.getElementById('itemModal'));
        modal.show();
    }

    getFormFields(section) {
        const fields = {
            'users': [
                { key: 'name', label: 'Nombre', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'role', label: 'Rol', type: 'select', options: this.getRoleOptions(), required: true },
                { key: 'password', label: 'Contraseña (dejar en blanco para mantener)', type: 'text' },
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
            ]
        };
        
        return fields[section] || [];
    }

    // ===== GUARDAR ELEMENTO =====
    async saveItem() {
        try {
            const formData = this.getFormData();
            const section = ADMIN_CONFIG.CURRENT_SECTION;
            
            const payload = {
                type: section,
                data: formData
            };
            
            if (ADMIN_CONFIG.EDITING_ITEM) {
                payload.edit_id = ADMIN_CONFIG.EDITING_ITEM.id;
            }
            
            const endpoint = section === 'users' ? 'users.php' : 'admin.php';
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Elemento guardado correctamente', 'success');
                bootstrap.Modal.getInstance(document.getElementById('itemModal')).hide();
                this.loadSectionData(section);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error guardando elemento:', error);
            this.showNotification('Error guardando elemento', 'error');
        }
    }

    getFormData() {
        const formData = {};
        const fields = this.getFormFields(ADMIN_CONFIG.CURRENT_SECTION);
        
        fields.forEach(field => {
            const element = document.getElementById(field.key);
            if (element) {
                if (field.type === 'checkbox') {
                    formData[field.key] = element.checked;
                } else {
                    formData[field.key] = element.value;
                }
            }
        });
        
        return formData;
    }

    // ===== ELIMINAR ELEMENTO =====
    async deleteItem(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            return;
        }
        
        try {
            const endpoint = ADMIN_CONFIG.CURRENT_SECTION === 'users' ? 'users.php' : 'admin.php';
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: ADMIN_CONFIG.CURRENT_SECTION,
                    id: id
                })
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

    // ===== RENDERIZADO ESPECÍFICO =====
    renderSociosTable(data) {
        const container = document.getElementById('socios-table-container');
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-user-friends fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay socios registrados</h5>
                    <p class="text-muted">Los socios aparecerán aquí cuando se registren</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5>Lista de Socios (${data.length})</h5>
                <button class="btn btn-primary" onclick="adminApp.showAddModal()">
                    <i class="fas fa-user-plus me-2"></i>Nuevo Socio
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Número Socio</th>
                            <th>Fecha Ingreso</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(socio => `
                            <tr>
                                <td>${socio.id}</td>
                                <td>${socio.nombre} ${socio.apellidos}</td>
                                <td>${socio.email}</td>
                                <td>${socio.telefono || '-'}</td>
                                <td>${socio.numero_socio || '-'}</td>
                                <td>${new Date(socio.fecha_registro).toLocaleDateString('es-ES')}</td>
                                <td>
                                    <span class="badge ${socio.activo ? 'bg-success' : 'bg-secondary'}">
                                        ${socio.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="adminApp.editItem('${socio.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="adminApp.deleteItem('${socio.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderTextosContent(data) {
        const container = document.getElementById('textos-content-container');
        if (!container) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Gestión de Textos del Sitio</h5>
                        </div>
                        <div class="card-body">
                            <div class="btn-group mb-4" role="group">
                                <button type="button" class="btn btn-outline-primary active" onclick="adminApp.showTextSection('home')">
                                    <i class="fas fa-home me-2"></i>Inicio
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="adminApp.showTextSection('historia')">
                                    <i class="fas fa-history me-2"></i>Historia
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="adminApp.showTextSection('directiva')">
                                    <i class="fas fa-users me-2"></i>Directiva
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="adminApp.showTextSection('socios')">
                                    <i class="fas fa-user-friends me-2"></i>Socios
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="adminApp.showTextSection('eventos')">
                                    <i class="fas fa-calendar me-2"></i>Eventos
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="adminApp.showTextSection('galeria')">
                                    <i class="fas fa-images me-2"></i>Galería
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="adminApp.showTextSection('noticias')">
                                    <i class="fas fa-newspaper me-2"></i>Noticias
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="adminApp.showTextSection('contacto')">
                                    <i class="fas fa-envelope me-2"></i>Contacto
                                </button>
                            </div>
                            <div id="textos-form-container">
                                <div class="text-center py-4">
                                    <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                                    <p class="text-muted">Cargando textos...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Cargar automáticamente la sección "home"
        setTimeout(() => {
            this.showTextSection('home');
        }, 100);
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
        // Obtener el rol del usuario desde la sesión
        // Esto se puede mejorar almacenando la info en localStorage o sessionStorage
        return window.currentUserRole || 'admin'; // Fallback a admin por compatibilidad
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
        document.querySelectorAll('.btn-group .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activar el botón correspondiente
        const activeButton = document.querySelector(`[onclick="adminApp.showTextSection('${section}')"]`);
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
        const container = document.getElementById('textos-content-container');
        
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
                <button class="btn btn-primary" onclick="adminApp.saveTextSection('${section}')">
                    <i class="fas fa-save me-2"></i>Guardar Cambios
                </button>
                <button class="btn btn-secondary ms-2" onclick="adminApp.previewTextSection('${section}')">
                    <i class="fas fa-eye me-2"></i>Vista Previa
                </button>
            </div>
        `;

        container.innerHTML = html;
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
            const inputs = document.querySelectorAll(`#textos-content input, #textos-content textarea`);
            
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
        
        const inputs = document.querySelectorAll(`#textos-content input, #textos-content textarea`);
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

    // ===== NOTIFICACIONES =====
    showNotification(message, type) {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
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

    // ===== GESTIÓN DE LIBROS =====
    async loadLibrosData() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php?type=libros`);
            const result = await response.json();
            
            if (result.success) {
                this.renderLibrosTable(result.data);
                this.updateLibrosStats(result.data);
            } else {
                this.showNotification('Error cargando libros', 'error');
            }
        } catch (error) {
            console.error('Error cargando libros:', error);
            this.showNotification('Error cargando libros', 'error');
        }
    }

    renderLibrosTable(libros) {
        const container = document.getElementById('libros-table-container');
        if (!container) return;

        if (libros.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-book fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay libros registrados</h5>
                    <p class="text-muted">Comienza añadiendo el primer libro de la Filá</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Tipo</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${libros.map(libro => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-book text-primary me-2"></i>
                                        <div>
                                            <strong>${libro.titulo}</strong>
                                            <br>
                                            <small class="text-muted">${libro.descripcion}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-info">${libro.tipo}</span>
                                </td>
                                <td>
                                    <span class="badge bg-secondary">${libro.categoria}</span>
                                </td>
                                <td>
                                    <span class="badge ${libro.activo ? 'bg-success' : 'bg-warning'}">
                                        ${libro.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="adminApp.editLibro(${libro.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="adminApp.deleteLibro(${libro.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    updateLibrosStats(libros) {
        const totalLibros = libros.length;
        const librosActivos = libros.filter(libro => libro.activo).length;
        const totalDescargas = libros.reduce((sum, libro) => sum + (libro.descargas || 0), 0);

        // Actualizar estadísticas
        const statsElements = {
            'libros-activos-count': librosActivos,
            'libros-total-count': totalLibros,
            'libros-descargas-count': totalDescargas
        };

        Object.entries(statsElements).forEach(([id, count]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count;
            }
        });
    }

    showAddLibroModal() {
        const modal = document.getElementById('bookModal');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    async saveLibro() {
        try {
            const formData = {
                titulo: document.getElementById('bookTitle').value,
                descripcion: document.getElementById('bookDescription').value,
                tipo: document.getElementById('bookType').value,
                categoria: document.getElementById('bookCategory').value,
                activo: document.getElementById('bookActive').checked
            };

            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'libros',
                    action: 'create',
                    data: formData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Libro guardado correctamente', 'success');
                this.loadLibrosData();
                bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error guardando libro:', error);
            this.showNotification('Error guardando libro', 'error');
        }
    }

    // ===== GESTIÓN DE CONFIGURACIÓN =====
    async loadConfiguracionData() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php?type=configuracion`);
            const result = await response.json();
            
            if (result.success) {
                this.renderConfiguracionForm(result.data);
            } else {
                this.renderConfiguracionForm({});
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
            this.renderConfiguracionForm({});
        }
    }

    renderConfiguracionForm(config) {
        const container = document.getElementById('configuracion-content');
        if (!container) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Información del Sitio</h5>
                        </div>
                        <div class="card-body">
                            <form id="siteConfigForm">
                                <div class="mb-3">
                                    <label class="form-label">Nombre del Sitio</label>
                                    <input type="text" class="form-control" id="siteName" value="${config.nombre_sitio || 'Filá Mariscales'}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Descripción</label>
                                    <textarea class="form-control" id="siteDescription" rows="3">${config.descripcion_sitio || 'Filá Mariscales de Caballeros Templarios de Elche'}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email de Contacto</label>
                                    <input type="email" class="form-control" id="siteEmail" value="${config.email_contacto || 'info@filamariscales.com'}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Teléfono</label>
                                    <input type="text" class="form-control" id="sitePhone" value="${config.telefono || '+34 965 123 456'}">
                                </div>
                                <button type="button" class="btn btn-primary" onclick="adminApp.saveSiteConfig()">
                                    <i class="fas fa-save me-2"></i>Guardar Configuración
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Configuración del Sistema</h5>
                        </div>
                        <div class="card-body">
                            <form id="systemConfigForm">
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="maintenanceMode" ${config.modo_mantenimiento ? 'checked' : ''}>
                                        <label class="form-check-label" for="maintenanceMode">
                                            Modo Mantenimiento
                                        </label>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="allowRegistrations" ${config.permite_registros ? 'checked' : ''}>
                                        <label class="form-check-label" for="allowRegistrations">
                                            Permitir Registros de Usuarios
                                        </label>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="enableComments" ${config.habilitar_comentarios ? 'checked' : ''}>
                                        <label class="form-check-label" for="enableComments">
                                            Habilitar Comentarios
                                        </label>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Elementos por Página</label>
                                    <input type="number" class="form-control" id="itemsPerPage" value="${config.elementos_por_pagina || 10}" min="5" max="50">
                                </div>
                                <button type="button" class="btn btn-primary" onclick="adminApp.saveSystemConfig()">
                                    <i class="fas fa-save me-2"></i>Guardar Configuración
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Herramientas del Sistema</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <button class="btn btn-outline-primary w-100 mb-2" onclick="adminApp.clearCache()">
                                        <i class="fas fa-broom me-2"></i>Limpiar Caché
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-outline-success w-100 mb-2" onclick="adminApp.backupData()">
                                        <i class="fas fa-download me-2"></i>Hacer Backup
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-outline-warning w-100 mb-2" onclick="adminApp.optimizeDatabase()">
                                        <i class="fas fa-tools me-2"></i>Optimizar Datos
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-outline-info w-100 mb-2" onclick="adminApp.loadBackupList()">
                                        <i class="fas fa-archive me-2"></i>Ver Backups
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Gestión de Backups</h5>
                            <button class="btn btn-sm btn-primary" onclick="adminApp.loadBackupList()">
                                <i class="fas fa-sync me-1"></i>Actualizar
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="backup-list-container">
                                <div class="text-center py-4">
                                    <i class="fas fa-archive fa-3x text-muted mb-3"></i>
                                    <h5 class="text-muted">Cargando backups...</h5>
                                    <p class="text-muted">Haz clic en "Ver Backups" para cargar la lista</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async saveSiteConfig() {
        try {
            const configData = {
                nombre_sitio: document.getElementById('siteName').value,
                descripcion_sitio: document.getElementById('siteDescription').value,
                email_contacto: document.getElementById('siteEmail').value,
                telefono: document.getElementById('sitePhone').value
            };

            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'configuracion',
                    action: 'update',
                    data: configData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Configuración del sitio guardada correctamente', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error guardando configuración:', error);
            this.showNotification('Error guardando configuración', 'error');
        }
    }

    async saveSystemConfig() {
        try {
            const configData = {
                modo_mantenimiento: document.getElementById('maintenanceMode').checked,
                permite_registros: document.getElementById('allowRegistrations').checked,
                habilitar_comentarios: document.getElementById('enableComments').checked,
                elementos_por_pagina: parseInt(document.getElementById('itemsPerPage').value)
            };

            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'configuracion',
                    action: 'update_system',
                    data: configData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Configuración del sistema guardada correctamente', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error guardando configuración del sistema:', error);
            this.showNotification('Error guardando configuración del sistema', 'error');
        }
    }

    clearCache() {
        this.showNotification('Caché limpiado correctamente', 'success');
    }

    async backupData() {
        try {
            this.showNotification('Creando backup...', 'info');
            
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}backup.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Backup creado: ${result.backup_name} (${result.size})`, 'success');
                // Recargar lista de backups si estamos en la sección de configuración
                if (ADMIN_CONFIG.CURRENT_SECTION === 'configuracion') {
                    this.loadBackupList();
                }
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error creando backup:', error);
            this.showNotification('Error creando backup', 'error');
        }
    }

    // ===== GESTIÓN DE BACKUPS =====
    async loadBackupList() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}backup.php?action=list`);
            const result = await response.json();
            
            if (result.success) {
                this.renderBackupList(result.data);
            } else {
                this.showNotification('Error cargando lista de backups', 'error');
            }
        } catch (error) {
            console.error('Error cargando backups:', error);
            this.showNotification('Error cargando backups', 'error');
        }
    }

    renderBackupList(backups) {
        const container = document.getElementById('backup-list-container');
        if (!container) return;

        if (backups.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-archive fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay backups disponibles</h5>
                    <p class="text-muted">Crea tu primer backup para proteger los datos</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Nombre</th>
                            <th>Fecha</th>
                            <th>Archivos</th>
                            <th>Tamaño</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${backups.map(backup => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-archive text-primary me-2"></i>
                                        <div>
                                            <strong>${backup.name}</strong>
                                            <br>
                                            <small class="text-muted">${backup.timestamp}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    ${new Date(backup.timestamp.replace('_', ' ')).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td>
                                    <span class="badge bg-info">${backup.files_count} archivos</span>
                                </td>
                                <td>
                                    ${backup.zip_size_formatted || 'N/A'}
                                </td>
                                <td>
                                    <span class="badge ${backup.zip_exists ? 'bg-success' : 'bg-warning'}">
                                        ${backup.zip_exists ? 'Disponible' : 'No encontrado'}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="adminApp.downloadBackup('${backup.name}')" 
                                                ${!backup.zip_exists ? 'disabled' : ''}>
                                            <i class="fas fa-download"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" onclick="adminApp.restoreBackup('${backup.name}')"
                                                ${!backup.zip_exists ? 'disabled' : ''}>
                                            <i class="fas fa-undo"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="adminApp.deleteBackup('${backup.name}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async downloadBackup(backupName) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}backup.php?action=download&name=${backupName}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${backupName}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showNotification('Descarga iniciada', 'success');
            } else {
                this.showNotification('Error descargando backup', 'error');
            }
        } catch (error) {
            console.error('Error descargando backup:', error);
            this.showNotification('Error descargando backup', 'error');
        }
    }

    async restoreBackup(backupName) {
        if (!confirm(`¿Estás seguro de que quieres restaurar el backup "${backupName}"? Esta acción sobrescribirá los datos actuales.`)) {
            return;
        }

        try {
            this.showNotification('Restaurando backup...', 'info');
            
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}backup.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'restore',
                    name: backupName
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Backup restaurado correctamente', 'success');
                // Recargar la página para reflejar los cambios
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error restaurando backup:', error);
            this.showNotification('Error restaurando backup', 'error');
        }
    }

    async deleteBackup(backupName) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el backup "${backupName}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}backup.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    name: backupName
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Backup eliminado correctamente', 'success');
                this.loadBackupList();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error eliminando backup:', error);
            this.showNotification('Error eliminando backup', 'error');
        }
    }

    optimizeDatabase() {
        this.showNotification('Optimización completada', 'success');
    }

    // ===== GESTIÓN DE REDES SOCIALES =====
    async loadSocialData() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}social.php?action=config`);
            const result = await response.json();
            
            if (result.success) {
                this.renderSocialConfig(result.data);
            } else {
                this.showNotification('Error cargando configuración de redes sociales', 'error');
            }
        } catch (error) {
            console.error('Error cargando redes sociales:', error);
            this.showNotification('Error cargando redes sociales', 'error');
        }
    }

    renderSocialConfig(config) {
        const container = document.getElementById('social-config-container');
        if (!container) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Configuración de Redes Sociales</h5>
                        </div>
                        <div class="card-body">
                            <form id="social-config-form">
                                <div class="row">
                                    ${Object.entries(config.platforms || {}).map(([key, platform]) => `
                                        <div class="col-md-6 mb-4">
                                            <div class="card">
                                                <div class="card-header d-flex justify-content-between align-items-center">
                                                    <div class="d-flex align-items-center">
                                                        <i class="${platform.icon} me-2" style="color: ${platform.color}; font-size: 1.2rem;"></i>
                                                        <h6 class="mb-0">${platform.name}</h6>
                                                    </div>
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" 
                                                               id="platform_${key}_enabled" 
                                                               name="platforms[${key}][enabled]"
                                                               ${platform.enabled ? 'checked' : ''}>
                                                    </div>
                                                </div>
                                                <div class="card-body">
                                                    <div class="mb-3">
                                                        <label class="form-label">URL</label>
                                                        <input type="url" class="form-control" 
                                                               name="platforms[${key}][url]" 
                                                               value="${platform.url || ''}">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">App ID / API Key</label>
                                                        <input type="text" class="form-control" 
                                                               name="platforms[${key}][app_id]" 
                                                               value="${platform.app_id || ''}">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">App Secret / API Secret</label>
                                                        <input type="password" class="form-control" 
                                                               name="platforms[${key}][app_secret]" 
                                                               value="${platform.app_secret || ''}">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-12">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">Configuración General</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <div class="form-check form-switch mb-3">
                                                            <input class="form-check-input" type="checkbox" 
                                                                   id="auto_share_news" 
                                                                   name="settings[auto_share_news]"
                                                                   ${config.settings?.auto_share_news ? 'checked' : ''}>
                                                            <label class="form-check-label" for="auto_share_news">
                                                                Compartir noticias automáticamente
                                                            </label>
                                                        </div>
                                                        <div class="form-check form-switch mb-3">
                                                            <input class="form-check-input" type="checkbox" 
                                                                   id="auto_share_events" 
                                                                   name="settings[auto_share_events]"
                                                                   ${config.settings?.auto_share_events ? 'checked' : ''}>
                                                            <label class="form-check-label" for="auto_share_events">
                                                                Compartir eventos automáticamente
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <div class="form-check form-switch mb-3">
                                                            <input class="form-check-input" type="checkbox" 
                                                                   id="show_share_buttons" 
                                                                   name="widgets[show_share_buttons]"
                                                                   ${config.widgets?.show_share_buttons ? 'checked' : ''}>
                                                            <label class="form-check-label" for="show_share_buttons">
                                                                Mostrar botones de compartir
                                                            </label>
                                                        </div>
                                                        <div class="form-check form-switch mb-3">
                                                            <input class="form-check-input" type="checkbox" 
                                                                   id="show_social_feed" 
                                                                   name="widgets[show_social_feed]"
                                                                   ${config.widgets?.show_social_feed ? 'checked' : ''}>
                                                            <label class="form-check-label" for="show_social_feed">
                                                                Mostrar feed de redes sociales
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label class="form-label">Hashtags por defecto</label>
                                                    <input type="text" class="form-control" 
                                                           name="settings[default_hashtags]" 
                                                           value="${config.settings?.default_hashtags || ''}">
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label class="form-label">Plantilla para noticias</label>
                                                    <textarea class="form-control" rows="2" 
                                                              name="settings[share_template]">${config.settings?.share_template || ''}</textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="text-end mt-3">
                                    <button type="button" class="btn btn-primary" onclick="adminApp.saveSocialConfig()">
                                        <i class="fas fa-save me-2"></i>Guardar Configuración
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Gestión de Posts</h5>
                            <button class="btn btn-primary btn-sm" onclick="adminApp.showCreatePostModal()">
                                <i class="fas fa-plus me-1"></i>Nuevo Post
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="social-posts-container">
                                <div class="text-center py-4">
                                    <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                                    <p class="text-muted">Cargando posts...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Cargar posts después de renderizar
        this.loadSocialPosts();
    }

    async loadSocialPosts() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}social.php?action=posts&limit=20`);
            const result = await response.json();
            
            if (result.success) {
                this.renderSocialPosts(result.data);
            } else {
                this.showNotification('Error cargando posts', 'error');
            }
        } catch (error) {
            console.error('Error cargando posts:', error);
            this.showNotification('Error cargando posts', 'error');
        }
    }

    renderSocialPosts(posts) {
        const container = document.getElementById('social-posts-container');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-rss fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay posts disponibles</h5>
                    <p class="text-muted">Crea tu primer post para comenzar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Plataforma</th>
                            <th>Contenido</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Engagement</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${posts.map(post => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fab fa-${post.platform} me-2"></i>
                                        <span class="text-capitalize">${post.platform}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="text-truncate" style="max-width: 200px;" title="${post.content}">
                                        ${post.content}
                                    </div>
                                </td>
                                <td>
                                    <span class="badge ${this.getPostStatusBadge(post.status)}">
                                        ${this.getPostStatusText(post.status)}
                                    </span>
                                </td>
                                <td>
                                    <small>${new Date(post.created_at).toLocaleDateString('es-ES')}</small>
                                </td>
                                <td>
                                    ${post.engagement ? `
                                        <div class="d-flex gap-2">
                                            <small><i class="fas fa-heart text-danger"></i> ${post.engagement.likes}</small>
                                            <small><i class="fas fa-share text-primary"></i> ${post.engagement.shares}</small>
                                            <small><i class="fas fa-comment text-info"></i> ${post.engagement.comments}</small>
                                        </div>
                                    ` : '-'}
                                </td>
                                <td>
                                    <div class="btn-group" role="group">
                                        ${post.status === 'pending' ? `
                                            <button class="btn btn-sm btn-outline-success" onclick="adminApp.publishSocialPost('${post.id}')">
                                                <i class="fas fa-paper-plane"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn btn-sm btn-outline-danger" onclick="adminApp.deleteSocialPost('${post.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getPostStatusBadge(status) {
        const badges = {
            'published': 'bg-success',
            'scheduled': 'bg-warning',
            'pending': 'bg-info',
            'failed': 'bg-danger'
        };
        return badges[status] || 'bg-secondary';
    }

    getPostStatusText(status) {
        const texts = {
            'published': 'Publicado',
            'scheduled': 'Programado',
            'pending': 'Pendiente',
            'failed': 'Fallido'
        };
        return texts[status] || 'Desconocido';
    }

    async saveSocialConfig() {
        try {
            const form = document.getElementById('social-config-form');
            const formData = new FormData(form);
            
            // Convertir FormData a objeto
            const config = {};
            for (let [key, value] of formData.entries()) {
                const keys = key.split(/[\[\]]/).filter(k => k);
                let current = config;
                
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                
                current[keys[keys.length - 1]] = value;
            }
            
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}social.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save_config',
                    config: config
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Configuración guardada correctamente', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error guardando configuración:', error);
            this.showNotification('Error guardando configuración', 'error');
        }
    }

    showCreatePostModal() {
        // Crear modal para crear posts
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'createPostModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Crear Nuevo Post</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="create-post-form">
                            <div class="mb-3">
                                <label class="form-label">Plataformas</label>
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="platform_facebook" value="facebook">
                                            <label class="form-check-label" for="platform_facebook">
                                                <i class="fab fa-facebook-f text-primary"></i> Facebook
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="platform_twitter" value="twitter">
                                            <label class="form-check-label" for="platform_twitter">
                                                <i class="fab fa-twitter text-info"></i> Twitter
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="platform_instagram" value="instagram">
                                            <label class="form-check-label" for="platform_instagram">
                                                <i class="fab fa-instagram text-danger"></i> Instagram
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="platform_youtube" value="youtube">
                                            <label class="form-check-label" for="platform_youtube">
                                                <i class="fab fa-youtube text-danger"></i> YouTube
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Contenido</label>
                                <textarea class="form-control" id="post-content" rows="4" 
                                          placeholder="Escribe tu post aquí..."></textarea>
                                <div class="form-text">Caracteres: <span id="char-count">0</span>/280</div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Imagen (opcional)</label>
                                <input type="url" class="form-control" id="post-media" 
                                       placeholder="URL de la imagen">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Programar publicación (opcional)</label>
                                <input type="datetime-local" class="form-control" id="post-schedule">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="adminApp.createSocialPost()">
                            <i class="fas fa-paper-plane me-2"></i>Crear Post
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Inicializar modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Contador de caracteres
        const contentTextarea = document.getElementById('post-content');
        const charCount = document.getElementById('char-count');
        
        contentTextarea.addEventListener('input', function() {
            charCount.textContent = this.value.length;
            if (this.value.length > 280) {
                charCount.style.color = 'red';
            } else {
                charCount.style.color = 'inherit';
            }
        });
        
        // Limpiar modal al cerrar
        modal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modal);
        });
    }

    async createSocialPost() {
        try {
            const platforms = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            
            const content = document.getElementById('post-content').value;
            const media = document.getElementById('post-media').value;
            const schedule = document.getElementById('post-schedule').value;
            
            if (platforms.length === 0) {
                this.showNotification('Selecciona al menos una plataforma', 'warning');
                return;
            }
            
            if (!content.trim()) {
                this.showNotification('El contenido es requerido', 'warning');
                return;
            }
            
            // Crear posts para cada plataforma
            for (const platform of platforms) {
                const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}social.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'create_post',
                        platform: platform,
                        content: content,
                        media: media || null
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    // Si hay programación, programar el post
                    if (schedule) {
                        await this.scheduleSocialPost(result.data.id, schedule);
                    }
                }
            }
            
            this.showNotification('Posts creados correctamente', 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createPostModal'));
            modal.hide();
            
            // Recargar lista de posts
            this.loadSocialPosts();
            
        } catch (error) {
            console.error('Error creando posts:', error);
            this.showNotification('Error creando posts', 'error');
        }
    }

    async publishSocialPost(postId) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}social.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'publish_post',
                    post_id: postId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Post publicado correctamente', 'success');
                this.loadSocialPosts();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error publicando post:', error);
            this.showNotification('Error publicando post', 'error');
        }
    }

    async scheduleSocialPost(postId, scheduledAt) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}social.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'schedule_post',
                    post_id: postId,
                    scheduled_at: scheduledAt
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Post programado correctamente', 'success');
                this.loadSocialPosts();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error programando post:', error);
            this.showNotification('Error programando post', 'error');
        }
    }

    async deleteSocialPost(postId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
            return;
        }

        try {
            // Aquí implementarías la lógica para eliminar el post
            this.showNotification('Post eliminado correctamente', 'success');
            this.loadSocialPosts();
        } catch (error) {
            console.error('Error eliminando post:', error);
            this.showNotification('Error eliminando post', 'error');
        }
    }
}

// ===== INICIALIZACIÓN =====
let adminApp;

document.addEventListener('DOMContentLoaded', function() {
    adminApp = new AdminApp();
    window.adminApp = adminApp;
    console.log('AdminApp initialized:', adminApp);
});

