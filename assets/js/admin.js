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
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}auth.php?action=check`);
            const result = await response.json();
            
            if (result.success) {
                // Almacenar información del usuario
                window.currentUserRole = result.data.role;
                this.showDashboard(result.data.email);
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            this.showLogin();
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            
            if (result.success) {
                // Almacenar información del usuario
                window.currentUserRole = result.data.role;
                this.showDashboard(result.data.email);
                this.showNotification('Login exitoso', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showNotification('Error de conexión', 'error');
        }
    }

    async logout() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}auth.php?action=logout`);
            const result = await response.json();
            
            if (result.success) {
                this.showLogin();
                this.showNotification('Sesión cerrada', 'info');
            }
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }

    showLogin() {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showDashboard(email) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-email').textContent = email;
        
        this.loadDashboardData();
    }

    // ===== CONFIGURACIÓN DE EVENTOS =====
    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            this.login(email, password);
        });

        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            });
        });

        // Add item button
        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.showAddModal();
        });
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
            this.loadDashboardData();
        } else if (section === 'textos') {
            document.getElementById('dashboard-content').style.display = 'none';
            document.getElementById('section-content').style.display = 'none';
            document.getElementById('textos-content').style.display = 'block';
            document.getElementById('add-item-btn').style.display = 'none';
        } else {
            document.getElementById('dashboard-content').style.display = 'none';
            document.getElementById('section-content').style.display = 'block';
            document.getElementById('textos-content').style.display = 'none';
            document.getElementById('add-item-btn').style.display = 'block';
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
            const data = await this.fetchData(section);
            this.renderTable(section, data);
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
        
        // Header
        tableHead.innerHTML = `
            <tr>
                ${columns.map(col => `<th>${col.title}</th>`).join('')}
                <th>Acciones</th>
            </tr>
        `;
        
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
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="adminApp.editItem('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminApp.deleteItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
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
        
        const modal = new bootstrap.Modal(document.getElementById('itemModal'));
        modal.show();
    }

    // Obtener opciones de roles para el formulario de usuarios
    getRoleOptions() {
        return [
            { value: 'admin', label: 'Administrador' },
            { value: 'editor', label: 'Editor' },
            { value: 'socio', label: 'Socio' }
        ];
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
            ]
        };
        
        return fields[section] || [];
    }

    // ===== GUARDAR ELEMENTO =====
    async saveItem() {
        try {
            const formData = this.getFormData();
            const section = ADMIN_CONFIG.CURRENT_SECTION;
            
            // Validación de campos requeridos
            const requiredFields = this.getFormFields(section).filter(f => f.required);
            for (const field of requiredFields) {
                if (field.key !== 'password' && (!formData[field.key] && formData[field.key] !== false)) {
                    this.showNotification(`El campo ${field.label} es requerido`, 'error');
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
                payload.edit_id = ADMIN_CONFIG.EDITING_ITEM.id;
            }
            
            // Determinar el endpoint correcto
            const endpoint = section === 'users' ? 'users.php' : 'admin.php';
            
            // Mostrar indicador de carga
            const saveButton = document.querySelector('#itemModal .btn-primary');
            const originalButtonText = saveButton.innerHTML;
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            
            try {
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
                    const modal = bootstrap.Modal.getInstance(document.getElementById('itemModal'));
                    if (modal) modal.hide();
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
        
        fields.forEach(field => {
            const element = document.getElementById(field.key);
            if (element) {
                if (field.type === 'checkbox') {
                    formData[field.key] = element.checked;
                } else if (field.key === 'password' && isEditing && !element.value) {
                    // No incluir la contraseña si estamos editando y el campo está vacío
                    return;
                } else {
                    formData[field.key] = element.value;
                }
            }
        });
        
        // Añadir el ID si estamos editando
        if (isEditing) {
            formData.id = ADMIN_CONFIG.EDITING_ITEM.id;
        }
        
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
        document.querySelectorAll('.btn-group-vertical .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // Marcar como activo el botón que llama a esta función
        const activeButton = document.querySelector(`[onclick*="adminApp.showTextSection('${section}')"]`);
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

    // ===== NOTIFICACIONES =====
    showNotification(message, type) {
        Utils.showNotification(message, type);
    }
}

// ===== INICIALIZACIÓN =====
let adminApp;

document.addEventListener('DOMContentLoaded', function() {
    adminApp = new AdminApp();
});

// ===== FUNCIONES GLOBALES =====
window.adminApp = adminApp;

