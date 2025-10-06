// ===== CONFIGURACIÓN =====
const ADMIN_CONFIG = {
    API_BASE_URL: '../api/',
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
            'contactos': 'Contactos'
        };
        
        document.getElementById('section-title').textContent = titles[section] || 'Dashboard';
        
        // Show/hide content
        if (section === 'dashboard') {
            document.getElementById('dashboard-content').style.display = 'block';
            document.getElementById('section-content').style.display = 'none';
            document.getElementById('add-item-btn').style.display = 'none';
            this.loadDashboardData();
        } else {
            document.getElementById('dashboard-content').style.display = 'none';
            document.getElementById('section-content').style.display = 'block';
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
        const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php?type=${type}`);
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
            ]
        };
        
        return configs[section] || [];
    }

    // ===== MODALES =====
    showAddModal() {
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
            
            return `
                <div class="mb-3">
                    <label for="${field.key}" class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
                    ${inputHtml}
                </div>
            `;
        }).join('');
        
        const modal = new bootstrap.Modal(document.getElementById('itemModal'));
        modal.show();
    }

    getFormFields(section) {
        const fields = {
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
            
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php`, {
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
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php`, {
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
}

// ===== INICIALIZACIÓN =====
let adminApp;

document.addEventListener('DOMContentLoaded', function() {
    adminApp = new AdminApp();
});

// ===== FUNCIONES GLOBALES =====
window.adminApp = adminApp;
