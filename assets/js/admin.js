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
                    credentials: 'include',
                    method: 'GET',
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
            
            if (!value && field.default) {
                value = field.default;
            }
        })();
        
        return this.authCheckPromise;
    }


    async logout() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}auth.php?action=logout`, {
                credentials: 'include'
            });
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
                const estadoBtn = e.target.closest('button[data-action="estado"]');
                const resetPasswordBtn = e.target.closest('.btn-reset-password');
                const estadoSolicitudBtn = e.target.closest('button[data-action="estado-solicitud"]');
                const approveSolicitudBtn = e.target.closest('.btn-approve-solicitud');
                const rejectSolicitudBtn = e.target.closest('.btn-reject-solicitud');
                const replyContactBtn = e.target.closest('.btn-reply-contact');
                const viewMessageBtn = e.target.closest('.btn-view-message');
                const changeStatusBtn = e.target.closest('.btn-change-status');
                const applyThemeBtn = e.target.closest('.btn-apply-theme');
                
                if (editBtn) {
                    e.preventDefault();
                    const id = editBtn.dataset.id;
                    this.editItem(id);
                } else if (deleteBtn) {
                    e.preventDefault();
                    const id = deleteBtn.dataset.id;
                    this.deleteItem(id);
                } else if (estadoBtn) {
                    e.preventDefault();
                    const id = estadoBtn.dataset.id;
                    const estado = estadoBtn.dataset.estado;
                    this.updateReservaEstado(id, estado);
                } else if (resetPasswordBtn) {
                    e.preventDefault();
                    const socioId = resetPasswordBtn.dataset.socioId || resetPasswordBtn.dataset.id;
                    const nombre = resetPasswordBtn.dataset.nombre;
                    const email = resetPasswordBtn.dataset.email;
                    if (!socioId) {
                        this.showNotification('No se pudo identificar el socio para resetear la contraseña', 'error');
                        return;
                    }
                    this.resetSocioPassword(socioId, nombre, email);
                } else if (estadoSolicitudBtn) {
                    e.preventDefault();
                    const id = estadoSolicitudBtn.dataset.id;
                    const estado = estadoSolicitudBtn.dataset.estado;
                    this.updateSolicitudEstado(id, estado);
                } else if (approveSolicitudBtn) {
                    e.preventDefault();
                    const id = approveSolicitudBtn.dataset.id;
                    const nombre = approveSolicitudBtn.dataset.nombre;
                    const email = approveSolicitudBtn.dataset.email;
                    this.approveSolicitud(id, nombre, email);
                } else if (rejectSolicitudBtn) {
                    e.preventDefault();
                    const id = rejectSolicitudBtn.dataset.id;
                    const nombre = rejectSolicitudBtn.dataset.nombre;
                    const email = rejectSolicitudBtn.dataset.email;
                    this.rejectSolicitud(id, nombre, email);
                } else if (replyContactBtn) {
                    e.preventDefault();
                    const id = replyContactBtn.dataset.id;
                    const nombre = replyContactBtn.dataset.nombre;
                    const email = replyContactBtn.dataset.email;
                    const asunto = replyContactBtn.dataset.asunto;
                    this.replyToContact(id, nombre, email, asunto);
                } else if (viewMessageBtn) {
                    e.preventDefault();
                    const id = viewMessageBtn.dataset.id;
                    const nombre = viewMessageBtn.dataset.nombre;
                    const mensaje = viewMessageBtn.dataset.mensaje;
                    this.viewContactMessage(id, nombre, mensaje);
                } else if (changeStatusBtn) {
                    e.preventDefault();
                    const id = changeStatusBtn.dataset.id;
                    const estado = changeStatusBtn.dataset.estado;
                    this.changeContactStatus(id, estado);
                } else if (applyThemeBtn) {
                    e.preventDefault();
                    const id = applyThemeBtn.dataset.id;
                    this.applyTheme(id);
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

        // Filtros específicos de contactos
        const estadoFilter = document.getElementById('estado-filter');
        if (estadoFilter) {
            estadoFilter.addEventListener('change', () => {
                this.applyContactFilters();
            });
        }

        const prioridadFilter = document.getElementById('prioridad-filter');
        if (prioridadFilter) {
            prioridadFilter.addEventListener('change', () => {
                this.applyContactFilters();
            });
        }

        const fechaFilter = document.getElementById('fecha-filter');
        if (fechaFilter) {
            fechaFilter.addEventListener('change', () => {
                this.applyContactFilters();
            });
        }

        const clearContactFilters = document.getElementById('clear-contact-filters');
        if (clearContactFilters) {
            clearContactFilters.addEventListener('click', () => {
                this.clearContactFilters();
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
    quickAction(section) {
        console.log(`🚀 Acción rápida ejecutada: ${section}`);
        
        // Navegar a la sección
        this.showSection(section);
        
        // Mostrar notificación específica para cada acción
        const messages = {
            'noticias': 'Creando nueva noticia...',
            'eventos': 'Creando nuevo evento...',
            'galeria': 'Subiendo nueva imagen...',
            'musica': 'Añadiendo nueva música...',
            'productos': 'Creando nuevo producto...',
            'contactos': 'Cargando contactos...',
            'reservas': 'Cargando reservas...'
        };
        
        if (messages[section]) {
            this.showNotification(messages[section], 'info');
        }
        
        // Secciones que abren modal de añadir
        const sectionsWithModal = ['noticias', 'eventos', 'galeria', 'musica', 'productos'];
        
        // Solo abrir modal para secciones que lo requieren
        if (sectionsWithModal.includes(section)) {
            setTimeout(() => {
                console.log(`📝 Abriendo modal para: ${section}`);
                this.showAddModal();
            }, 200);
        } else {
            console.log(`📋 Navegando a sección de visualización: ${section}`);
        }
    }

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
            'temas': 'Temas',
            'galeria': 'Galería',
            'productos': 'Productos',
            'directiva': 'Directiva',
            'contactos': 'Contactos',
            'users': 'Usuarios',
            'musica': 'Música',
            'carousel': 'Carrusel',
            'textos': 'Textos',
            'fondos': 'Fondos',
            'reservas': 'Reservas'
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
        } else if (section === 'fondos') {
            document.getElementById('dashboard-content').style.display = 'none';
            document.getElementById('section-content').style.display = 'block';
            document.getElementById('textos-content').style.display = 'none';
            document.getElementById('add-item-btn').style.display = 'block';
            document.getElementById('search-filter-bar').style.display = 'block';
            document.getElementById('table-actions').style.display = 'inline-flex';
            this.loadSectionData(section);
        } else if (section === 'reservas') {
            document.getElementById('dashboard-content').style.display = 'none';
            document.getElementById('section-content').style.display = 'block';
            document.getElementById('textos-content').style.display = 'none';
            document.getElementById('add-item-btn').style.display = 'none';
            document.getElementById('search-filter-bar').style.display = 'block';
            document.getElementById('table-actions').style.display = 'inline-flex';
            this.loadSectionData(section);
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
            // Esperar a que se complete la autenticación
            await this.checkAuth();
            
            const [noticias, eventos, productos, contactos, galeria, usuarios, musica, reservas] = await Promise.all([
                this.fetchData('noticias'),
                this.fetchData('eventos'),
                this.fetchData('productos'),
                this.fetchData('contactos'),
                this.fetchData('galeria'),
                this.fetchData('users'),
                this.fetchData('musica'),
                this.fetchData('reservas')
            ]);

            const socios = (usuarios || []).filter(user => (user.role || '').toLowerCase() === 'socio');

            // Actualizar contadores
            document.getElementById('noticias-count').textContent = noticias.length;
            document.getElementById('eventos-count').textContent = eventos.length;
            document.getElementById('productos-count').textContent = productos.length;
            document.getElementById('contactos-count').textContent = contactos.length;
            document.getElementById('galeria-count').textContent = galeria.length;
            document.getElementById('socios-count').textContent = socios.length;
            document.getElementById('musica-count').textContent = musica.length;
            document.getElementById('reservas-count').textContent = reservas.length;

            // Crear gráficos
            this.createActivityChart([noticias, eventos, galeria, musica]);
            this.createContentChart([noticias, eventos, productos, galeria, musica, socios]);

            // Mostrar actividad reciente
            this.showRecentActivity([...noticias, ...eventos, ...productos, ...contactos, ...galeria, ...musica]);
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    }

    // ===== GRÁFICOS DEL DASHBOARD =====
    createActivityChart(dataArrays) {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        // Destruir el gráfico anterior si existe
        if (this.activityChart) {
            this.activityChart.destroy();
        }

        const [noticias, eventos, galeria, musica] = dataArrays;
        const labels = ['Noticias', 'Eventos', 'Galería', 'Música'];
        const data = [noticias.length, eventos.length, galeria.length, musica.length];

        this.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cantidad de Elementos',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createContentChart(dataArrays) {
        const ctx = document.getElementById('contentChart');
        if (!ctx) return;

        // Destruir el gráfico anterior si existe
        if (this.contentChart) {
            this.contentChart.destroy();
        }

        const [noticias, eventos, productos, galeria, musica, socios] = dataArrays;
        const data = [
            { label: 'Noticias', value: noticias.length, color: '#007bff' },
            { label: 'Eventos', value: eventos.length, color: '#28a745' },
            { label: 'Productos', value: productos.length, color: '#17a2b8' },
            { label: 'Galería', value: galeria.length, color: '#ffc107' },
            { label: 'Música', value: musica.length, color: '#dc3545' },
            { label: 'Socios', value: socios.length, color: '#6c757d' }
        ];

        this.contentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.label),
                datasets: [{
                    data: data.map(item => item.value),
                    backgroundColor: data.map(item => item.color),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    async loadSectionData(section) {
        try {
            // Esperar a que se complete la autenticación
            await this.checkAuth();
            
            console.log('Cargando datos de la sección:', section);
            let data;
            
            if (section === 'solicitudes') {
                // Cargar solicitudes usando el método específico
                await this.loadSolicitudes();
                return;
            } else {
                data = await this.fetchData(section);
                console.log('Datos cargados:', data);
                ADMIN_CONFIG.CURRENT_DATA = data;
                ADMIN_CONFIG.FILTERED_DATA = data;
                ADMIN_CONFIG.CURRENT_PAGE = 1;
                
                // Configurar filtros según la sección
                this.setupFilters(section);
                
                // Mostrar/ocultar filtros específicos
                this.toggleSectionFilters(section);
                
                // Limpiar búsqueda
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                
                console.log('Renderizando tabla con', data.length, 'elementos');
                this.filterAndRenderTable();
            }
        } catch (error) {
            console.error(`Error cargando datos de ${section}:`, error);
            this.showNotification('Error cargando datos', 'error');
        }
    }

    toggleSectionFilters(section) {
        // Ocultar todos los filtros específicos
        const contactosFilters = document.getElementById('contactos-filters');
        const contactosPriorityFilter = document.getElementById('contactos-priority-filter');
        const contactosDateFilter = document.getElementById('contactos-date-filter');
        const contactosClearFilters = document.getElementById('contactos-clear-filters');
        
        if (contactosFilters) contactosFilters.style.display = 'none';
        if (contactosPriorityFilter) contactosPriorityFilter.style.display = 'none';
        if (contactosDateFilter) contactosDateFilter.style.display = 'none';
        if (contactosClearFilters) contactosClearFilters.style.display = 'none';
        
        // Mostrar filtros específicos según la sección
        if (section === 'contactos') {
            if (contactosFilters) contactosFilters.style.display = 'block';
            if (contactosPriorityFilter) contactosPriorityFilter.style.display = 'block';
            if (contactosDateFilter) contactosDateFilter.style.display = 'block';
            if (contactosClearFilters) contactosClearFilters.style.display = 'block';
        }
    }

    applyContactFilters() {
        if (ADMIN_CONFIG.CURRENT_SECTION !== 'contactos') return;

        const estadoFilter = document.getElementById('estado-filter');
        const prioridadFilter = document.getElementById('prioridad-filter');
        const fechaFilter = document.getElementById('fecha-filter');
        
        const estadoValue = estadoFilter ? estadoFilter.value : '';
        const prioridadValue = prioridadFilter ? prioridadFilter.value : '';
        const fechaValue = fechaFilter ? fechaFilter.value : '';

        let filteredData = ADMIN_CONFIG.CURRENT_DATA.filter(item => {
            // Filtro por estado
            if (estadoValue && item.estado !== estadoValue) {
                return false;
            }
            
            // Filtro por prioridad
            if (prioridadValue && item.prioridad !== prioridadValue) {
                return false;
            }
            
            // Filtro por fecha
            if (fechaValue && item.fecha) {
                const itemDate = new Date(item.fecha).toISOString().split('T')[0];
                if (itemDate !== fechaValue) {
                    return false;
                }
            }
            
            return true;
        });

        ADMIN_CONFIG.FILTERED_DATA = filteredData;
        ADMIN_CONFIG.CURRENT_PAGE = 1;
        
        console.log(`Filtros aplicados: Estado=${estadoValue}, Prioridad=${prioridadValue}, Fecha=${fechaValue}`);
        console.log(`Resultados: ${filteredData.length} de ${ADMIN_CONFIG.CURRENT_DATA.length}`);
        
        this.filterAndRenderTable();
    }

    clearContactFilters() {
        const estadoFilter = document.getElementById('estado-filter');
        const prioridadFilter = document.getElementById('prioridad-filter');
        const fechaFilter = document.getElementById('fecha-filter');
        
        if (estadoFilter) estadoFilter.value = '';
        if (prioridadFilter) prioridadFilter.value = '';
        if (fechaFilter) fechaFilter.value = '';
        
        // Restaurar todos los datos
        ADMIN_CONFIG.FILTERED_DATA = ADMIN_CONFIG.CURRENT_DATA;
        ADMIN_CONFIG.CURRENT_PAGE = 1;
        
        console.log('Filtros de contactos limpiados');
        this.filterAndRenderTable();
    }

    async fetchData(type) {
        let endpoint;
        if (type === 'users') {
            endpoint = 'users.php';
        } else if (type === 'fondos') {
            endpoint = 'fondos.php';
        } else if (type === 'reservas') {
            endpoint = 'reservas.php';
        } else {
            endpoint = 'admin.php';
        }
        
        const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}${type === 'fondos' ? '' : `?type=${type}`}`, {
            credentials: 'include'
        });
        const result = await response.json();
        
        // El endpoint de reservas devuelve un array plano (sin { success, data })
        if (type === 'reservas') {
            if (Array.isArray(result)) return result;
            if (result && result.success && Array.isArray(result.data)) return result.data;
            throw new Error((result && (result.message || result.error)) || 'Error cargando reservas');
        }
        
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
                    
                    // Si hay un formatter personalizado, usarlo primero
                    if (col.formatter && typeof col.formatter === 'function') {
                        return `<td>${col.formatter(value, item)}</td>`;
                    }
                    
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
                    
                // Acciones rápidas para reservas (cambiar estado)
                if (ADMIN_CONFIG.CURRENT_SECTION === 'reservas' && col.key === 'estado') {
                    return `<td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-secondary" data-action="estado" data-id="${item.id}" data-estado="pendiente">Pendiente</button>
                            <button class="btn btn-outline-success" data-action="estado" data-id="${item.id}" data-estado="confirmada">Confirmar</button>
                            <button class="btn btn-outline-danger" data-action="estado" data-id="${item.id}" data-estado="cancelada">Cancelar</button>
                        </div>
                        <div class="mt-1"><span class="badge ${value==='confirmada'?'bg-success':value==='cancelada'?'bg-danger':'bg-warning text-dark'}">${value||'pendiente'}</span></div>
                    </td>`;
                }
                // Acciones rápidas para solicitudes (cambiar estado)
                if (ADMIN_CONFIG.CURRENT_SECTION === 'solicitudes' && col.key === 'estado') {
                    return `<td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-warning" data-action="estado-solicitud" data-id="${item.id}" data-estado="pendiente">Pendiente</button>
                            <button class="btn btn-outline-success" data-action="estado-solicitud" data-id="${item.id}" data-estado="aprobada">Aprobar</button>
                            <button class="btn btn-outline-danger" data-action="estado-solicitud" data-id="${item.id}" data-estado="rechazada">Rechazar</button>
                        </div>
                        <div class="mt-1">${value}</div>
                    </td>`;
                }
                return `<td>${value}</td>`;
                }).join('')}
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-id="${item.id ?? item.imagen_id ?? item._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${ADMIN_CONFIG.CURRENT_SECTION === 'users' && (((item.role || '').toLowerCase() === 'socio') || (item.sources && item.sources.socios)) ? `
                        <button class="btn btn-sm btn-outline-warning me-1 btn-reset-password" data-id="${item.id}" data-socio-id="${item.socio_id || ''}" data-nombre="${item.name || item.nombre || ''}" data-email="${item.email || ''}">
                            <i class="fas fa-key"></i>
                        </button>
                    ` : ''}
                    ${ADMIN_CONFIG.CURRENT_SECTION === 'solicitudes' ? `
                        <button class="btn btn-sm btn-outline-success me-1 btn-approve-solicitud" data-id="${item.id}" data-nombre="${item.nombre}" data-email="${item.email}">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger me-1 btn-reject-solicitud" data-id="${item.id}" data-nombre="${item.nombre}" data-email="${item.email}">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    ${ADMIN_CONFIG.CURRENT_SECTION === 'contactos' ? `
                        <button class="btn btn-sm btn-outline-success me-1 btn-reply-contact" data-id="${item.id}" data-nombre="${item.nombre}" data-email="${item.email}" data-asunto="${item.asunto}">
                            <i class="fas fa-reply"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info me-1 btn-view-message" data-id="${item.id}" data-nombre="${item.nombre}" data-mensaje="${item.mensaje}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning me-1 btn-change-status" data-id="${item.id}" data-estado="${item.estado}">
                            <i class="fas fa-flag"></i>
                        </button>
                    ` : ''}
                    ${ADMIN_CONFIG.CURRENT_SECTION === 'temas' ? `
                        <button class="btn btn-sm btn-outline-success me-1 btn-apply-theme" data-id="${item.id ?? item._id}">
                            <i class="fas fa-fill-drip me-1"></i>${item.activo ? 'Activo' : 'Aplicar'}
                        </button>
                    ` : ''}
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
                { key: 'name', title: 'Nombre', type: 'text' },
                { key: 'email', title: 'Email', type: 'text' },
                { key: 'role', title: 'Rol', type: 'text' },
                { key: 'telefono', title: 'Teléfono', type: 'text', formatter: (value) => value || '—' },
                { key: 'numero_socio', title: 'Número Socio', type: 'text', formatter: (value) => value || '—' },
                { 
                    key: 'fecha_ingreso', 
                    title: 'Fecha Ingreso', 
                    type: 'date',
                    formatter: (value) => value ? new Date(value).toLocaleDateString('es-ES') : '—'
                },
                { key: 'direccion', title: 'Dirección', type: 'text', formatter: (value) => value || '—' },
                { 
                    key: 'origin', 
                    title: 'Origen', 
                    type: 'text',
                    formatter: (value, item) => {
                        if (item?.sources?.users && item?.sources?.socios) return 'Usuarios + Socios';
                        if (item?.sources?.socios) return 'Socios';
                        return 'Usuarios';
                    }
                },
                { 
                    key: 'created_at', 
                    title: 'Fecha Creación', 
                    type: 'date',
                    formatter: (value) => value ? new Date(value).toLocaleDateString('es-ES') : ''
                },
                { 
                    key: 'updated_at', 
                    title: 'Última Actualización', 
                    type: 'date',
                    formatter: (value) => value ? new Date(value).toLocaleDateString('es-ES') : ''
                },
                { 
                    key: 'active', 
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
                { 
                    key: 'youtube_url', 
                    title: 'YouTube', 
                    type: 'text',
                    formatter: (value) => value ? '<a href="' + value + '" target="_blank" class="btn btn-sm btn-danger"><i class="fab fa-youtube"></i> Ver</a>' : ''
                },
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
            'reservas': [
                { key: 'id', title: 'ID', type: 'text' },
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'email', title: 'Email', type: 'text' },
                { key: 'telefono', title: 'Teléfono', type: 'text' },
                { key: 'evento_id', title: 'Evento', type: 'text' },
                { key: 'num_personas', title: 'Plazas', type: 'number' },
                { key: 'estado', title: 'Estado', type: 'text' },
                { key: 'fecha_reserva', title: 'Fecha Reserva', type: 'date' }
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
                { 
                    key: 'observaciones', 
                    title: 'Observaciones', 
                    type: 'text',
                    formatter: (value) => value || 'Sin observaciones'
                },
                { key: 'revisado_por', title: 'Revisado por', type: 'text' }
            ],
            'fondos': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'tipo', title: 'Tipo', type: 'text' },
                { key: 'imagen_url', title: 'Imagen', type: 'image' },
                { key: 'color', title: 'Color', type: 'text' },
                { key: 'paginas', title: 'Páginas', type: 'text' },
                { key: 'activo', title: 'Activo', type: 'boolean' }
            ],
            'imagenes-sitio': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'descripcion', title: 'Descripción', type: 'text' },
                { key: 'url', title: 'URL de la Imagen', type: 'text' },
                { key: 'pagina', title: 'Página', type: 'text' },
                { key: 'activa', title: 'Activa', type: 'boolean' }
            ],
            'temas': [
                { key: 'nombre', title: 'Nombre', type: 'text' },
                { key: 'descripcion', title: 'Descripción', type: 'text', formatter: (value) => value || '—' },
                { 
                    key: 'colores', 
                    title: 'Paleta', 
                    type: 'custom',
                    formatter: (value, item) => {
                        const colors = value || item.colores || {};
                        const primario = colors.primario || '#DC143C';
                        const secundario = colors.secundario || '#FFD700';
                        const fondo = colors.fondo || '#F8F9FA';
                        const texto = colors.texto || '#212529';
                        return `
                            <div class="d-flex align-items-center gap-2 flex-wrap">
                                ${[
                                    { label: 'Primario', color: primario },
                                    { label: 'Secundario', color: secundario },
                                    { label: 'Fondo', color: fondo },
                                    { label: 'Texto', color: texto }
                                ].map(c => `
                                    <div class="d-flex align-items-center">
                                        <span title="${c.label}: ${c.color}" style="
                                            display:inline-block;
                                            width:18px;
                                            height:18px;
                                            border-radius:50%;
                                            border:1px solid #dee2e6;
                                            background:${c.color};
                                            margin-right:4px;
                                        "></span>
                                        <small class="text-muted">${c.label}</small>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }
                },
                { 
                    key: 'activo', 
                    title: 'Estado', 
                    type: 'boolean',
                    formatter: (value) => value
                        ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Activo</span>'
                        : '<span class="badge bg-secondary">Inactivo</span>'
                }
            ],
            'alertas': [
                { key: 'titulo', title: 'Título', type: 'text' },
                { key: 'mensaje', title: 'Mensaje', type: 'text' },
                { key: 'tipo', title: 'Tipo', type: 'text', formatter: (value) => {
                    const badges = {
                        'info': '<span class="badge bg-info"><i class="fas fa-info-circle me-1"></i>Info</span>',
                        'warning': '<span class="badge bg-warning text-dark"><i class="fas fa-exclamation-triangle me-1"></i>Warning</span>',
                        'success': '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Success</span>',
                        'error': '<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i>Error</span>'
                    };
                    return badges[value] || `<span class="badge bg-secondary">${value || 'N/A'}</span>`;
                }},
                { key: 'fecha', title: 'Fecha', type: 'date' },
                { key: 'leida', title: 'Leída', type: 'boolean', formatter: (value) => {
                    return value === true || value === 'true' 
                        ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Leída</span>'
                        : '<span class="badge bg-warning text-dark"><i class="fas fa-envelope me-1"></i>No leída</span>';
                }},
                { key: 'accion_requerida', title: 'Acción Requerida', type: 'boolean', formatter: (value) => {
                    return value === true || value === 'true'
                        ? '<span class="badge bg-danger"><i class="fas fa-exclamation-circle me-1"></i>Sí</span>'
                        : '<span class="badge bg-secondary"><i class="fas fa-check me-1"></i>No</span>';
                }},
                { key: 'enlace', title: 'Enlace', type: 'text', formatter: (value) => {
                    if (!value) return '<span class="text-muted">-</span>';
                    return `<a href="${value}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-external-link-alt me-1"></i>Ver
                    </a>`;
                }}
            ],
            'musica': [
                { key: 'titulo', title: 'Título', type: 'text' },
                { key: 'compositor', title: 'Compositor', type: 'text' },
                { key: 'año', title: 'Año', type: 'number' },
                { key: 'duracion', title: 'Duración', type: 'text' },
                { key: 'tipo', title: 'Tipo', type: 'text' },
                { 
                    key: 'youtube_url', 
                    title: 'YouTube', 
                    type: 'text',
                    formatter: (value) => value ? '<a href="' + value + '" target="_blank" class="btn btn-sm btn-danger"><i class="fab fa-youtube"></i> Ver</a>' : ''
                },
                { 
                    key: 'favorita', 
                    title: 'Favorita', 
                    type: 'boolean',
                    formatter: (value) => value === true ? '<span class="badge bg-warning"><i class="fas fa-star"></i> Favorita</span>' : ''
                }
            ]
        };
        
        return configs[section] || [];
    }

    // ===== MODALES =====
    showAddModal() {
        console.log('Mostrando modal de añadir para sección:', ADMIN_CONFIG.CURRENT_SECTION);
        
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
            const disabledAttr = field.disabled ? 'disabled' : '';
            
            if (ADMIN_CONFIG.CURRENT_SECTION === 'temas') {
                if (field.key.startsWith('color_')) {
                    const colorKey = field.key.replace('color_', '');
                    value = (data && data.colores && data.colores[colorKey]) || field.default || '#000000';
                } else if (field.key === 'fuente_titulos') {
                    value = data?.tipografia?.titulos || field.default || field.options?.[0]?.value || '';
                } else if (field.key === 'fuente_texto') {
                    value = data?.tipografia?.texto || field.default || field.options?.[0]?.value || '';
                } else if (field.key === 'imagen_fondo') {
                    value = data?.imagen_fondo || '';
                }
            }
            
            // Auto-completar fecha actual para alertas nuevas
            if (!data && field.key === 'fecha' && ADMIN_CONFIG.CURRENT_SECTION === 'alertas') {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
            
            let inputHtml = '';
            
            switch (field.type) {
                case 'text':
                case 'email':
                case 'url':
                case 'password':
                case 'color':
                    inputHtml = `<input type="${field.type}" class="form-control" id="${field.key}" value="${value}" ${field.required ? 'required' : ''} ${disabledAttr}>`;
                    break;
                case 'textarea':
                    inputHtml = `<textarea class="form-control" id="${field.key}" rows="3" ${field.required ? 'required' : ''} ${disabledAttr}>${value}</textarea>`;
                    break;
                case 'number':
                    inputHtml = `<input type="number" class="form-control" id="${field.key}" value="${value}" ${field.required ? 'required' : ''} ${disabledAttr}>`;
                    break;
                case 'date':
                    inputHtml = `<input type="date" class="form-control" id="${field.key}" value="${value}" ${field.required ? 'required' : ''} ${disabledAttr}>`;
                    break;
                case 'datetime-local':
                    // Convertir formato de fecha Y-m-d H:i:s a datetime-local si viene del JSON
                    let datetimeValue = value;
                    if (value && value.includes(' ') && !value.includes('T')) {
                        datetimeValue = value.replace(' ', 'T').substring(0, 16);
                    }
                    inputHtml = `<input type="datetime-local" class="form-control" id="${field.key}" value="${datetimeValue}" ${field.required ? 'required' : ''} ${disabledAttr}>`;
                    break;
                case 'time':
                    inputHtml = `<input type="time" class="form-control" id="${field.key}" value="${value}" ${field.required ? 'required' : ''} ${disabledAttr}>`;
                    break;
                case 'file':
                    inputHtml = `<input type="file" class="form-control" id="${field.key}" ${field.accept ? `accept="${field.accept}"` : ''} ${field.required ? 'required' : ''} ${disabledAttr}>`;
                    break;
                case 'select':
                    const options = field.options.map(opt => 
                        `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                    ).join('');
                    inputHtml = `<select class="form-control" id="${field.key}" ${field.required ? 'required' : ''} ${disabledAttr}>${options}</select>`;
                    break;
                case 'checkbox':
                    inputHtml = `<div class="form-check">
                        <input type="checkbox" class="form-check-input" id="${field.key}" ${value ? 'checked' : ''} ${disabledAttr}>
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
            const isFondos = section === 'fondos';
            const isDirectiva = section === 'directiva';
            const isNews = section === 'noticias';
            const isEvents = section === 'eventos';
            const imageFields = ['imagen_url', 'imagen'].concat(isGallery ? ['thumb_url'] : []);
            
            if (imageFields.includes(field.key) && (isGallery || isCarousel || isProducts || isFondos || isDirectiva || isNews || isEvents)) {
                let uploadType = 'gallery';
                if (isCarousel) uploadType = 'carousel';
                else if (isProducts) uploadType = 'products';
                else if (isFondos) uploadType = 'backgrounds';
                else if (isDirectiva) uploadType = 'directiva';
                else if (isNews) uploadType = 'news';
                else if (isEvents) uploadType = 'events';
                
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
        if (!modalElement) {
            console.error('Modal #itemModal no encontrado');
            return;
        }
        
        if (!modalElement.dataset.listenersAttached) {
        modalElement.addEventListener('shown.bs.modal', () => {
            setTimeout(() => {
                const firstInput = modalElement.querySelector('input:not([type="checkbox"]), textarea, select');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 0);
        });
        
        modalElement.addEventListener('hidden.bs.modal', () => {
            document.getElementById('form-fields').innerHTML = '';
                modalElement.setAttribute('aria-hidden', 'true');
            });
            
            modalElement.dataset.listenersAttached = 'true';
        }
        
        modalElement.setAttribute('aria-hidden', 'false');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
        
        // Event listener para botones de subir imagen y limpiar errores
        setTimeout(() => {
            // Botones de subir imagen
            document.querySelectorAll('.btn-upload-image').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const fieldKey = btn.dataset.field;
                    const uploadType = btn.dataset.type;
                    this.uploadImage(fieldKey, uploadType, btn);
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

    hideItemModal() {
        const modalElement = document.getElementById('itemModal');
        if (!modalElement) {
            console.warn('hideItemModal: modal no encontrado');
                return;
            }
            
        const instance = window.bootstrap ? window.bootstrap.Modal.getInstance(modalElement) : null;
        if (instance) {
            instance.hide();
                } else {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
        }
        
        const formFields = document.getElementById('form-fields');
        if (formFields) {
            formFields.innerHTML = '';
        }
    }

    
    
    
    
    
    
    

    getFormFields(section) {
        const fields = {
            'alertas': [
                { key: 'titulo', label: 'Título', type: 'text', required: true },
                { key: 'mensaje', label: 'Mensaje', type: 'textarea', required: true },
                { key: 'tipo', label: 'Tipo', type: 'select', options: [
                    { value: 'info', label: 'Info' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'success', label: 'Success' },
                    { value: 'error', label: 'Error' }
                ], required: true },
                { key: 'fecha', label: 'Fecha', type: 'datetime-local' },
                { key: 'leida', label: 'Leída', type: 'checkbox' },
                { key: 'accion_requerida', label: 'Acción requerida', type: 'checkbox' },
                { key: 'enlace', label: 'Enlace', type: 'url' }
            ],
            'users': [
                { key: 'name', label: 'Nombre', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'role', label: 'Rol', type: 'select', options: this.getRoleOptions(), required: true },
                { key: 'telefono', label: 'Teléfono', type: 'text' },
                { key: 'direccion', label: 'Dirección', type: 'textarea' },
                { key: 'fecha_ingreso', label: 'Fecha de Ingreso', type: 'date' },
                { key: 'numero_socio', label: 'Número de Socio', type: 'text' },
                { key: 'password', label: 'Contraseña' + (ADMIN_CONFIG.EDITING_ITEM ? ' (dejar en blanco para no cambiar)' : ''), 
                  type: 'password', required: !ADMIN_CONFIG.EDITING_ITEM },
                { key: 'active', label: 'Activo', type: 'checkbox' }
            ],
            'carousel': [
                { key: 'titulo', label: 'Título', type: 'text', required: true },
                { key: 'subtitulo', label: 'Subtítulo', type: 'text' },
                { key: 'imagen_url', label: 'Imagen', type: 'file', accept: 'image/*', uploadType: 'carousel' },
                { key: 'enlace', label: 'Enlace', type: 'text' },
                { key: 'activo', label: 'Activo', type: 'checkbox' }
            ],
            'noticias': [
                { key: 'titulo', label: 'Título', type: 'text', required: true },
                { key: 'resumen', label: 'Resumen', type: 'textarea', required: true },
                { key: 'contenido', label: 'Contenido', type: 'textarea', required: true },
                { key: 'imagen_url', label: 'Imagen', type: 'file', accept: 'image/*', uploadType: 'news' },
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
                { key: 'imagen_url', label: 'Imagen', type: 'file', accept: 'image/*', uploadType: 'events' }
            ],
            'galeria': [
                { key: 'titulo', label: 'Título', type: 'text', required: true },
                { key: 'descripcion', label: 'Descripción', type: 'textarea' },
                { key: 'imagen_url', label: 'Imagen', type: 'file', accept: 'image/*', uploadType: 'gallery', required: true },
                { key: 'youtube_url', label: 'URL de YouTube', type: 'url', placeholder: 'https://www.youtube.com/watch?v=...' },
                { key: 'categoria', label: 'Categoría', type: 'text' },
                { key: 'fecha_subida', label: 'Fecha de Subida', type: 'date', required: true },
                { key: 'orden', label: 'Orden', type: 'number' }
            ],
            'productos': [
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
                { key: 'precio', label: 'Precio', type: 'number', required: true, step: '0.01' },
                { key: 'precio_oferta', label: 'Precio de Oferta', type: 'number', step: '0.01' },
                { key: 'imagen_url', label: 'Imagen', type: 'file', accept: 'image/*', uploadType: 'products' },
                { key: 'categoria', label: 'Categoría', type: 'text' },
                { key: 'stock', label: 'Stock', type: 'number', required: true },
                { key: 'destacado', label: 'Destacado', type: 'checkbox' }
            ],
            'directiva': [
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'cargo', label: 'Cargo', type: 'text', required: true },
                { key: 'imagen', label: 'Imagen', type: 'file', accept: 'image/*', uploadType: 'directiva' },
                { key: 'descripcion', label: 'Descripción', type: 'textarea' }
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
            ],
            'fondos': [
                { key: 'nombre', label: 'Nombre del Fondo', type: 'text', required: true },
                { key: 'tipo', label: 'Tipo de Fondo', type: 'select', options: [
                    { value: 'imagen', label: 'Imagen' },
                    { value: 'color', label: 'Color Sólido' },
                    { value: 'gradiente', label: 'Gradiente' }
                ], required: true },
                { key: 'imagen_url', label: 'URL de Imagen', type: 'text' },
                { key: 'color', label: 'Color (hex)', type: 'text' },
                { key: 'color_secundario', label: 'Color Secundario (para gradientes)', type: 'text' },
                { key: 'paginas', label: 'Páginas (separadas por comas)', type: 'text', required: true },
                { key: 'descripcion', label: 'Descripción', type: 'textarea' },
                { key: 'activo', label: 'Activo', type: 'checkbox' }
            ],
            'solicitudes': [
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'telefono', label: 'Teléfono', type: 'text' },
                { key: 'edad', label: 'Edad', type: 'number' },
                { key: 'motivo', label: 'Motivo de Solicitud', type: 'textarea', required: true },
                { key: 'experiencia', label: 'Experiencia', type: 'textarea' },
                { key: 'estado', label: 'Estado', type: 'select', options: [
                    { value: 'pendiente', label: 'Pendiente' },
                    { value: 'aprobada', label: 'Aprobada' },
                    { value: 'rechazada', label: 'Rechazada' }
                ], required: true },
                { key: 'observaciones', label: 'Observaciones', type: 'textarea' }
            ],
            'imagenes-sitio': [
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'descripcion', label: 'Descripción', type: 'text' },
                { key: 'url', label: 'URL de la Imagen', type: 'url', required: true },
                { key: 'imagen_local', label: 'Imagen Local', type: 'file', accept: 'image/*' },
                { key: 'pagina', label: 'Página', type: 'select', options: [
                    { value: 'historia', label: 'Historia' },
                    { value: 'galeria', label: 'Galería' },
                    { value: 'galeria-destacados', label: 'Galería - Momentos Destacados' },
                    { value: 'eventos', label: 'Eventos' },
                    { value: 'musica', label: 'Música' },
                    { value: 'general', label: 'General' }
                ], required: true },
                { key: 'activa', label: 'Activa', type: 'checkbox' }
            ],
            'temas': [
                { key: 'nombre', label: 'Nombre del tema', type: 'text', required: true },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
                { key: 'color_primario', label: 'Color primario', type: 'color', required: true, default: '#DC143C' },
                { key: 'color_secundario', label: 'Color secundario', type: 'color', required: true, default: '#FFD700' },
                { key: 'color_fondo', label: 'Color de fondo', type: 'color', required: true, default: '#F8F9FA' },
                { key: 'color_texto', label: 'Color de texto', type: 'color', required: true, default: '#212529' },
                { key: 'fuente_titulos', label: 'Fuente para títulos', type: 'select', options: [
                    { value: '"Cinzel", serif', label: 'Cinzel' },
                    { value: '"Playfair Display", serif', label: 'Playfair Display' },
                    { value: '"Montserrat", sans-serif', label: 'Montserrat' },
                    { value: '"Roboto Slab", serif', label: 'Roboto Slab' }
                ], required: true },
                { key: 'fuente_texto', label: 'Fuente para textos', type: 'select', options: [
                    { value: '"Open Sans", sans-serif', label: 'Open Sans' },
                    { value: '"Inter", sans-serif', label: 'Inter' },
                    { value: '"Lato", sans-serif', label: 'Lato' },
                    { value: '"Roboto", sans-serif', label: 'Roboto' }
                ], required: true },
                { key: 'imagen_fondo', label: 'Imagen de fondo (opcional)', type: 'url' },
                { key: 'activo', label: 'Activo (solo lectura)', type: 'checkbox', disabled: true }
            ],
            'reservas': [
                { key: 'id', label: 'ID', type: 'text' },
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'telefono', label: 'Teléfono', type: 'text', required: true },
                { key: 'evento_id', label: 'Evento (ID)', type: 'text', required: true },
                { key: 'num_personas', label: 'Nº Personas', type: 'number', required: true },
                { key: 'comentarios', label: 'Comentarios', type: 'textarea' },
                { key: 'estado', label: 'Estado', type: 'select', options: [
                    { value: 'pendiente', label: 'Pendiente' },
                    { value: 'confirmada', label: 'Confirmada' },
                    { value: 'cancelada', label: 'Cancelada' }
                ], required: true }
            ],
            'musica': [
                { key: 'titulo', label: 'Título de la Pieza', type: 'text', required: true },
                { key: 'compositor', label: 'Compositor', type: 'text', required: true },
                { key: 'año', label: 'Año de Composición', type: 'number', required: true },
                { key: 'duracion', label: 'Duración (mm:ss)', type: 'text', required: true },
                { key: 'tipo', label: 'Tipo', type: 'select', options: [
                    { value: 'marcha', label: 'Marcha' },
                    { value: 'himno', label: 'Himno' },
                    { value: 'canto', label: 'Canto' },
                    { value: 'melodia', label: 'Melodía' }
                ], required: true },
                { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
                { key: 'audio_url', label: 'Archivo de Audio', type: 'file', accept: 'audio/*' },
                { key: 'youtube_url', label: 'URL de YouTube', type: 'url', placeholder: 'https://www.youtube.com/watch?v=...' },
                { key: 'favorita', label: 'Pieza Favorita', type: 'checkbox' }
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
            console.log('Elemento a editar:', ADMIN_CONFIG.EDITING_ITEM);

            if (section === 'users' && ADMIN_CONFIG.EDITING_ITEM?.socio_id) {
                formData.socio_id = ADMIN_CONFIG.EDITING_ITEM.socio_id;
            }
            
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
            
            // Verificar si hay archivos para subir
            const hasFiles = Object.values(formData).some(value => value instanceof File);
            
            let payload;
            let headers = {
                'Content-Type': 'application/json'
            };
            
            if (hasFiles) {
                // Si hay archivos, usar FormData
                const formDataToSend = new FormData();
                formDataToSend.append('type', section);
                
                // Si es una edición, incluir el ID
                if (ADMIN_CONFIG.EDITING_ITEM) {
                    formDataToSend.append('edit_id', this.getItemId(ADMIN_CONFIG.EDITING_ITEM));
                }
                
                // Añadir todos los datos al FormData
                Object.entries(formData).forEach(([key, value]) => {
                    if (value instanceof File) {
                        formDataToSend.append(key, value);
                    } else {
                        formDataToSend.append(key, value);
                    }
                });
                
                payload = formDataToSend;
                headers = {}; // FormData maneja el Content-Type automáticamente
                console.log('Enviando con FormData (archivos incluidos)');
            } else {
                // Si no hay archivos, usar JSON normal
                payload = {
                    type: section,
                    data: formData
                };
                
                // Si es una edición, asegurarse de incluir el ID
                if (ADMIN_CONFIG.EDITING_ITEM) {
                    payload.edit_id = this.getItemId(ADMIN_CONFIG.EDITING_ITEM);
                }
                console.log('Enviando con JSON (sin archivos)');
            }
            
            // Determinar el endpoint correcto
            const isUsers = section === 'users';
            const isFondos = section === 'fondos';
            const endpoint = isUsers ? 'users.php' : (isFondos ? 'fondos.php' : 'admin.php');
            
            // Mostrar indicador de carga
            const saveButton = document.querySelector('#itemModal .btn-primary');
            const originalButtonText = saveButton.innerHTML;
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            
            try {
                // Construir body según endpoint y si hay archivos
                let body;
                let requestHeaders = headers;
                
                if (hasFiles) {
                    // Si hay archivos, usar el payload FormData directamente
                    body = payload;
                    requestHeaders = {}; // FormData maneja el Content-Type
                } else if (isFondos) {
                    // Para fondos sin archivos, incluir el ID en el cuerpo para actualización
                    const fondoData = { ...formData };
                    if (ADMIN_CONFIG.EDITING_ITEM && ADMIN_CONFIG.EDITING_ITEM.id) {
                        fondoData.id = ADMIN_CONFIG.EDITING_ITEM.id;
                        console.log('Editando fondo con ID:', ADMIN_CONFIG.EDITING_ITEM.id);
                        console.log('Datos del fondo:', fondoData);
                    } else {
                        console.error('No se encontró ID del elemento a editar');
                    }
                    body = JSON.stringify(fondoData);
                } else {
                    // Para noticias y otros elementos sin archivos, usar el formato estándar
                    body = isUsers ? JSON.stringify(formData) : JSON.stringify(payload);
                }
                
                const method = isFondos ? 'PUT' : 'POST'; // Para fondos usar PUT (actualizar)
                const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}`, {
                    method: method,
                    headers: requestHeaders,
                    body
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showNotification('Elemento guardado correctamente', 'success');
                    this.hideItemModal();
                    this.loadSectionData(section);
                    
                    // Si es carousel, notificar a otras pestañas para recargar
                    if (section === 'carousel') {
                        this.broadcastCarouselUpdate();
                    }
                    
                    // Limpiar estado de edición DESPUÉS de cargar los datos
                    ADMIN_CONFIG.EDITING_ITEM = null;
                } else {
                    console.error('Error guardando elemento:', result);
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
            } else if (field.type === 'file') {
                // Manejar archivos - priorizar hidden con URL subida
                const hidden = document.getElementById(`${field.key}_uploaded_url`);
                if (hidden && hidden.value) {
                    formData[field.key] = hidden.value;
                    console.log('  - URL de archivo subido:', hidden.value);
                } else if (element.files && element.files.length > 0) {
                    formData[field.key] = element.files[0];
                    console.log('  - Archivo seleccionado:', element.files[0].name);
                } else {
                    formData[field.key] = element.value || '';
                    console.log('  - Valor del campo file:', element.value);
                }
            } else if (field.key === 'password' && isEditing && !element.value) {
                // No incluir la contraseña si estamos editando y el campo está vacío
                console.log('  - Password vacío en edición, no se incluye');
                return;
            } else if (field.type === 'datetime-local' && ADMIN_CONFIG.CURRENT_SECTION === 'alertas' && field.key === 'fecha') {
                // Convertir datetime-local a formato Y-m-d H:i:s para alertas
                const value = element.value.trim();
                if (value) {
                    const date = new Date(value);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    formData[field.key] = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                    console.log('  - Fecha convertida:', formData[field.key]);
                } else {
                    formData[field.key] = value;
                }
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

        if (ADMIN_CONFIG.CURRENT_SECTION === 'temas') {
            formData.colores = {
                primario: formData.color_primario || '#DC143C',
                secundario: formData.color_secundario || '#FFD700',
                fondo: formData.color_fondo || '#F8F9FA',
                texto: formData.color_texto || '#212529'
            };
            formData.tipografia = {
                titulos: formData.fuente_titulos || '"Cinzel", serif',
                texto: formData.fuente_texto || '"Open Sans", sans-serif'
            };
            formData.imagen_fondo = formData.imagen_fondo || '';

            delete formData.color_primario;
            delete formData.color_secundario;
            delete formData.color_fondo;
            delete formData.color_texto;
            delete formData.fuente_titulos;
            delete formData.fuente_texto;
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
            const isFondos = ADMIN_CONFIG.CURRENT_SECTION === 'fondos';
            const endpoint = isUsers ? 'users.php' : (isFondos ? 'fondos.php' : 'admin.php');
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    isUsers
                        ? { id }
                        : isFondos
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
            .slice(0, 8);
        
        if (sortedItems.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay actividad reciente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="timeline">
                ${sortedItems.map((item, index) => {
                    const title = item.titulo || item.nombre || 'Sin título';
                    const date = new Date(item.updated_at || item.fecha_publicacion || item.fecha || item.fecha_subida);
                    const type = this.getItemType(item);
                    const icon = this.getTypeIcon(type);
                    const color = this.getTypeColor(type);
                    
                    return `
                        <div class="timeline-item ${index === 0 ? 'timeline-item-first' : ''}">
                            <div class="timeline-marker bg-${color}">
                                <i class="fas fa-${icon}"></i>
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-title">${title}</div>
                                <div class="timeline-meta">
                                    <span class="badge bg-${color}">${type}</span>
                                    <span class="timeline-date">${this.formatRelativeTime(date)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
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
            'Música': 'music',
            'Elemento': 'file'
        };
        return icons[type] || 'file';
    }

    getTypeColor(type) {
        const colors = {
            'Noticia': 'primary',
            'Evento': 'success',
            'Producto': 'info',
            'Directiva': 'warning',
            'Galería': 'secondary',
            'Contacto': 'dark',
            'Música': 'danger',
            'Elemento': 'light'
        };
        return colors[type] || 'light';
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora mismo';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days < 7) return `Hace ${days} días`;
        return date.toLocaleDateString('es-ES');
    }

    // ===== UTIL: Normalizar ID de item =====
    getItemId(item) {
        if (!item) return null;
        return item.id ?? item.imagen_id ?? item._id ?? null;
    }

    // ===== RESERVAS: CAMBIO RÁPIDO DE ESTADO =====
    async updateReservaEstado(id, estado) {
        if (!id) return;
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}reservas.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ id, estado })
            });
            const result = await response.json();
            if (result && result.success) {
                this.showNotification('Estado actualizado', 'success');
                this.loadSectionData('reservas');
            } else {
                this.showNotification((result && (result.error || result.message)) || 'No se pudo actualizar', 'error');
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
            this.showNotification('Error de conexión', 'error');
        }
    }

    // ===== SUBIDA DE IMÁGENES =====
    async uploadImage(fieldKey, uploadType, triggerButton) {
        // Verificar que el usuario es administrador (excepto para fondos)
        if (uploadType !== 'backgrounds' && !this.isAdmin()) {
            this.showNotification('Solo los administradores pueden subir imágenes', 'error');
            return;
        }

        // Evitar reentradas: si el botón está deshabilitado, salir
        if (triggerButton && triggerButton.disabled) return;

        // Deshabilitar botón mientras se procesa
        if (triggerButton) {
            triggerButton.disabled = true;
            const originalText = triggerButton.innerHTML;
            triggerButton.setAttribute('data-original-text', originalText);
            triggerButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subiendo...';
        }

        // Crear un nuevo input para cada subida para evitar problemas de reutilización
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none'; // Ocultar el input
        
        // Función para limpiar sin causar errores
        const safeCleanup = () => {
            // Rehabilitar botón y restaurar texto
            if (triggerButton) {
                const originalText = triggerButton.getAttribute('data-original-text');
                if (originalText) triggerButton.innerHTML = originalText;
                triggerButton.disabled = false;
                triggerButton.removeAttribute('data-original-text');
            }

            // Remover el input del DOM sin intentar limpiar su valor
            setTimeout(() => {
                if (input && input.parentNode) {
                    input.parentNode.removeChild(input);
                }
            }, 100);
        };
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                // Si no hay archivo, limpiar y salir
                safeCleanup();
                return;
            }

            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('La imagen no puede superar los 5MB', 'error');
                safeCleanup();
                return;
            }

            // Validar tipo
            if (!file.type.startsWith('image/')) {
                this.showNotification('Solo se permiten archivos de imagen', 'error');
                safeCleanup();
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
                    // Siempre crear/actualizar el hidden con la URL subida
                    let hidden = document.getElementById(`${fieldKey}_uploaded_url`);
                    if (!hidden) {
                        hidden = document.createElement('input');
                        hidden.type = 'hidden';
                        hidden.id = `${fieldKey}_uploaded_url`;
                        const container = document.getElementById('form-fields') || document.body;
                        container.appendChild(hidden);
                    }
                    hidden.value = result.data.path;

                    // Solo intentar escribir en el campo si NO es de tipo file
                    const field = document.getElementById(fieldKey);
                    if (field && field.type !== 'file') {
                        try {
                            field.value = result.data.path;
                        } catch (error) {
                            // Ignorar errores de asignación
                        }
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
            finally {
                safeCleanup();
            }
        };

        // Añadir temporalmente al DOM para que funcione correctamente
        document.body.appendChild(input);
        input.click();
    }

    // Función auxiliar para limpiar el input de subida
    cleanupUpload(input, triggerButton) {
        // Rehabilitar botón y restaurar texto
        if (triggerButton) {
            const originalText = triggerButton.getAttribute('data-original-text');
            if (originalText) triggerButton.innerHTML = originalText;
            triggerButton.disabled = false;
            triggerButton.removeAttribute('data-original-text');
        }

        // NO intentar limpiar el valor del input file - esto causa errores
        // Los inputs de tipo file no pueden tener su valor establecido programáticamente
        // excepto a una cadena vacía, y esto puede fallar en algunos navegadores

        // Remover el input del DOM después de un breve retraso
        setTimeout(() => {
            if (input && input.parentNode) {
                input.parentNode.removeChild(input);
            }
        }, 100);
    }

    // Función para subir archivo al servidor
    async uploadFileToServer(file, uploadType) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', uploadType);

            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}upload.php`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    // Función para determinar el tipo de subida basado en el campo
    getUploadTypeForField(fieldKey) {
        // Mapear campos a tipos de subida
        const fieldTypeMap = {
            'imagen_url': 'carousel',
            'imagen': 'gallery',
            'fondo': 'backgrounds',
            'logo': 'imagenes-sitio',
            'avatar': 'imagenes-sitio'
        };
        
        return fieldTypeMap[fieldKey] || 'gallery';
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
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php?type=textos`, {
                credentials: 'include'
            });
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
            'descripcion_detallada': 'Descripción Detallada',
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
                credentials: 'include',
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
                
                // Recargar textos en la web si está disponible
                if (typeof window.reloadTextos === 'function') {
                    window.reloadTextos();
                }
                
                // También intentar recargar en otras pestañas si están abiertas
                this.broadcastTextUpdate();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error guardando textos:', error);
            this.showNotification('Error guardando textos', 'error');
        }
    }
    
    broadcastTextUpdate() {
        // Enviar mensaje a otras pestañas para que recarguen los textos
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('textos-update');
            channel.postMessage({ type: 'textos-updated', timestamp: Date.now() });
            channel.close();
        }
        
        // También usar localStorage como fallback
        localStorage.setItem('textos-updated', Date.now().toString());
    }
    
    broadcastCarouselUpdate() {
        // Enviar mensaje a otras pestañas para que recarguen el carousel
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('carousel-update');
            channel.postMessage({ type: 'carousel-updated', timestamp: Date.now() });
            channel.close();
        }
        
        // También usar localStorage como fallback
        localStorage.setItem('carousel-updated', Date.now().toString());
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
            ],
            'reservas': [
                { value: '', label: 'Todas' },
                { value: 'estado:pendiente', label: 'Pendientes' },
                { value: 'estado:confirmada', label: 'Confirmadas' },
                { value: 'estado:cancelada', label: 'Canceladas' }
            ],
            'solicitudes': [
                { value: '', label: 'Todas' },
                { value: 'estado:pendiente', label: 'Pendientes' },
                { value: 'estado:aprobada', label: 'Aprobadas' },
                { value: 'estado:rechazada', label: 'Rechazadas' }
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
        
        if (data.length === 0) {
            this.showNotification('No hay datos para exportar', 'warning');
            return;
        }
        
        let csv;
        let filename;
        
        if (section === 'contactos') {
            // Exportación específica para contactos con información adicional
            csv = this.exportContactosCSV(data);
            filename = `contactos_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            // Exportación genérica para otras secciones
            const columns = this.getColumnsConfig(section);
            csv = this.exportGenericCSV(data, columns);
            filename = `${section}_${new Date().toISOString().split('T')[0]}.csv`;
        }
        
        // Descargar
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification(`Datos exportados correctamente (${data.length} registros)`, 'success');
    }

    exportContactosCSV(data) {
        // Encabezados específicos para contactos
        const headers = [
            'Nombre',
            'Email', 
            'Teléfono',
            'Asunto',
            'Mensaje',
            'Fecha',
            'Estado',
            'Prioridad',
            'ID'
        ].join(',');
        
        // Crear filas con datos específicos
        const rows = data.map(item => {
            const row = [
                this.escapeCSV(item.nombre || ''),
                this.escapeCSV(item.email || ''),
                this.escapeCSV(item.telefono || ''),
                this.escapeCSV(item.asunto || ''),
                this.escapeCSV(item.mensaje || ''),
                this.escapeCSV(item.fecha || ''),
                this.escapeCSV(item.estado || ''),
                this.escapeCSV(item.prioridad || ''),
                this.escapeCSV(item.id || '')
            ];
            return row.join(',');
        }).join('\n');
        
        // Añadir información de exportación
        const exportInfo = [
            `# Exportación de Contactos - Filá Mariscales`,
            `# Fecha de exportación: ${new Date().toLocaleString('es-ES')}`,
            `# Total de registros: ${data.length}`,
            `# Filtros aplicados: ${this.getActiveFilters()}`,
            `#`,
            ``
        ].join('\n');
        
        return exportInfo + headers + '\n' + rows;
    }

    exportGenericCSV(data, columns) {
        // Crear encabezados
        const headers = columns.map(col => col.title).join(',');
        
        // Crear filas
        const rows = data.map(item => {
            return columns.map(col => {
                let value = item[col.key] || '';
                return this.escapeCSV(value);
            }).join(',');
        }).join('\n');
        
        return headers + '\n' + rows;
    }

    escapeCSV(value) {
        if (typeof value === 'string') {
            value = value.replace(/"/g, '""'); // Escapar comillas
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
        }
        return value;
    }

    getActiveFilters() {
        if (ADMIN_CONFIG.CURRENT_SECTION !== 'contactos') return 'Ninguno';
        
        const estadoFilter = document.getElementById('estado-filter');
        const prioridadFilter = document.getElementById('prioridad-filter');
        const fechaFilter = document.getElementById('fecha-filter');
        
        const filters = [];
        if (estadoFilter && estadoFilter.value) filters.push(`Estado: ${estadoFilter.value}`);
        if (prioridadFilter && prioridadFilter.value) filters.push(`Prioridad: ${prioridadFilter.value}`);
        if (fechaFilter && fechaFilter.value) filters.push(`Fecha: ${fechaFilter.value}`);
        
        return filters.length > 0 ? filters.join(', ') : 'Ninguno';
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

    // Actualizar estado de solicitud
    async updateSolicitudEstado(id, estado) {
        if (!id) {
            console.error('ID no proporcionado');
            return;
        }
        
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}solicitudes.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id,
                    estado: estado
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification(`Solicitud ${estado} exitosamente`, 'success');
                await this.loadSolicitudes();
            } else {
                this.showNotification(result.message || 'Error al actualizar la solicitud', 'error');
            }
        } catch (error) {
            console.error('Error en updateSolicitudEstado:', error);
            this.showNotification('Error de conexión al actualizar solicitud', 'error');
        }
    }

    // Aprobar solicitud
    async approveSolicitud(id, nombre, email) {
        if (!confirm(`¿Estás seguro de que quieres aprobar la solicitud de ${nombre}?`)) {
            return;
        }

        try {
            // Actualizar estado a aprobada
            await this.updateSolicitudEstado(id, 'aprobada');
            
            // Opcional: Crear usuario automáticamente
            if (confirm('¿Quieres crear un usuario automáticamente para este socio?')) {
                await this.createUserFromSolicitud(id, nombre, email);
            }
            
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            this.showNotification('Error al aprobar la solicitud', 'error');
        }
    }

    // Rechazar solicitud
    async rejectSolicitud(id, nombre, email) {
        const motivo = prompt(`¿Motivo del rechazo para ${nombre}? (opcional)`);
        
        try {
            // Actualizar estado a rechazada
            await this.updateSolicitudEstado(id, 'rechazada');
            
            // Agregar observaciones si se proporcionó motivo
            if (motivo) {
                await this.addSolicitudObservaciones(id, motivo);
            }
            
        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            this.showNotification('Error al rechazar la solicitud', 'error');
        }
    }

    // Crear usuario desde solicitud
    async createUserFromSolicitud(solicitudId, nombre, email) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}solicitudes.php?action=aprobar&id=${solicitudId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification('Usuario creado exitosamente', 'success');
            } else {
                this.showNotification(result.message || 'Error al crear usuario', 'error');
            }
        } catch (error) {
            console.error('Error creando usuario:', error);
            this.showNotification('Error de conexión al crear usuario', 'error');
        }
    }

    // Agregar observaciones a solicitud
    async addSolicitudObservaciones(id, observaciones) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}solicitudes.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id,
                    observaciones: observaciones
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification('Observaciones agregadas', 'success');
            } else {
                this.showNotification(result.message || 'Error al agregar observaciones', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error de conexión al agregar observaciones', 'error');
        }
    }

    // ===== SOCIOS - RESETEAR CONTRASEÑA =====
    async resetSocioPassword(id, nombre, email) {
        // Mostrar modal de opciones
        this.showResetPasswordOptions(id, nombre, email);
    }

    async applyTheme(themeId) {
        try {
            const themes = ADMIN_CONFIG.CURRENT_DATA || [];
            const targetTheme = themes.find(theme => String(this.getItemId(theme)) === String(themeId));

            if (!targetTheme) {
                this.showNotification('No se encontró el tema seleccionado', 'error');
                return;
            }

            if (targetTheme.activo) {
                this.showNotification('Este tema ya está activo', 'info');
                return;
            }

            this.showNotification('Aplicando tema...', 'info');

            const updates = [];
            const currentActive = themes.find(theme => theme.activo && this.getItemId(theme) !== this.getItemId(targetTheme));

            if (currentActive) {
                updates.push(this.saveTheme({ ...currentActive, activo: false }));
            }

            updates.push(this.saveTheme({ ...targetTheme, activo: true }));

            await Promise.all(updates);

            this.showNotification(`Tema "${targetTheme.nombre}" aplicado correctamente`, 'success');
            await this.loadSectionData('temas');
        } catch (error) {
            console.error('Error aplicando tema:', error);
            this.showNotification('Error al aplicar el tema', 'error');
        }
    }

    async saveTheme(theme) {
        const payload = {
            type: 'temas',
            data: theme,
            edit_id: this.getItemId(theme)
        };

        const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Error al guardar el tema');
        }
    }

    showResetPasswordOptions(id, nombre, email) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">🔐 Resetear Contraseña</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>¿Cómo quieres enviar la nueva contraseña a <strong>${nombre}</strong>?</p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" id="resetAndShow">
                                <i class="fas fa-eye me-2"></i>Mostrar en pantalla
                            </button>
                            <button class="btn btn-success" id="resetAndEmail">
                                <i class="fas fa-envelope me-2"></i>Enviar por email
                            </button>
                            <button class="btn btn-info" id="resetBoth">
                                <i class="fas fa-eye me-2"></i>Mostrar Y enviar por email
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Event listeners
        modal.querySelector('#resetAndShow').addEventListener('click', () => {
            bsModal.hide();
            this.performPasswordReset(id, nombre, email, 'show');
        });
        
        modal.querySelector('#resetAndEmail').addEventListener('click', () => {
            bsModal.hide();
            this.performPasswordReset(id, nombre, email, 'email');
        });
        
        modal.querySelector('#resetBoth').addEventListener('click', () => {
            bsModal.hide();
            this.performPasswordReset(id, nombre, email, 'both');
        });
        
        // Limpiar modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    async performPasswordReset(id, nombre, email, method) {
        try {
            // Generar nueva contraseña
            const nuevaPassword = this.generatePassword(8);
            
            // Actualizar contraseña en el servidor
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}socios.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    id: id,
                    password: nuevaPassword
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                let emailSent = false;
                
                // Enviar por email si se solicita
                if (method === 'email' || method === 'both') {
                    try {
                        const emailResponse = await fetch(`${ADMIN_CONFIG.API_BASE_URL}send-email.php`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                email: email,
                                nombre: nombre,
                                password: nuevaPassword
                            })
                        });
                        
                        const emailResult = await emailResponse.json();
                        emailSent = emailResponse.ok && emailResult.success;
                    } catch (emailError) {
                        console.error('Error enviando email:', emailError);
                    }
                }
                
                // Mostrar modal si se solicita
                if (method === 'show' || method === 'both') {
                    this.showPasswordModal(nombre, email, nuevaPassword, emailSent);
                } else if (method === 'email') {
                    if (emailSent) {
                        this.showNotification('Contraseña reseteada y enviada por email exitosamente', 'success');
                    } else {
                        this.showNotification('Contraseña reseteada pero error al enviar email', 'warning');
                        this.showPasswordModal(nombre, email, nuevaPassword, false);
                    }
                }
                
                // Recargar datos
                await this.loadSectionData('users');
                
            } else {
                this.showNotification(result.message || 'Error al resetear la contraseña', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error de conexión al resetear contraseña', 'error');
        }
    }

    generatePassword(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    showPasswordModal(nombre, email, password, emailSent = null) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-key me-2"></i>Nueva Contraseña Generada
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6>Credenciales para ${nombre}:</h6>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Contraseña:</strong> <span class="badge bg-warning text-dark fs-6">${password}</span></p>
                        </div>
                        ${emailSent !== null ? `
                            <div class="alert ${emailSent ? 'alert-success' : 'alert-danger'}">
                                <i class="fas ${emailSent ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
                                <strong>Email:</strong> ${emailSent ? 'Enviado exitosamente' : 'Error al enviar'}
                            </div>
                        ` : ''}
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>Importante:</strong> Comunica estas credenciales al socio de forma segura.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="navigator.clipboard.writeText('${password}')">
                            <i class="fas fa-copy me-2"></i>Copiar Contraseña
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Limpiar modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    // ===== CONTACTOS - FUNCIONES ESPECÍFICAS =====
    async replyToContact(id, nombre, email, asunto) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'replyContactModalLabel');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="replyContactModalLabel">
                            <i class="fas fa-reply me-2"></i>Responder a ${nombre}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>Contacto:</strong> ${nombre} (${email})<br>
                            <strong>Asunto original:</strong> ${asunto}
                        </div>
                        <form id="replyForm">
                            <div class="mb-3">
                                <label for="replySubject" class="form-label">Asunto *</label>
                                <input type="text" class="form-control" id="replySubject" 
                                       value="Re: ${asunto}" required>
                            </div>
                            <div class="mb-3">
                                <label for="replyMessage" class="form-label">Mensaje *</label>
                                <textarea class="form-control" id="replyMessage" rows="8" 
                                          placeholder="Escribe tu respuesta aquí..." required></textarea>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="markAsReplied" checked>
                                    <label class="form-check-label" for="markAsReplied">
                                        Marcar como respondido
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="sendReply">
                            <i class="fas fa-paper-plane me-2"></i>Enviar Respuesta
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        
        // Manejar eventos de accesibilidad
        modal.addEventListener('shown.bs.modal', () => {
            modal.removeAttribute('aria-hidden');
            const replySubject = modal.querySelector('#replySubject');
            if (replySubject) {
                replySubject.focus();
            }
        });
        
        modal.addEventListener('hide.bs.modal', () => {
            modal.setAttribute('aria-hidden', 'true');
        });
        
        bsModal.show();
        
        // Event listener para enviar
        modal.querySelector('#sendReply').addEventListener('click', async () => {
            const subject = modal.querySelector('#replySubject').value;
            const message = modal.querySelector('#replyMessage').value;
            const markAsReplied = modal.querySelector('#markAsReplied').checked;
            
            if (!subject || !message) {
                this.showNotification('Por favor completa todos los campos', 'error');
                return;
            }
            
            try {
                // Enviar email
                const emailResponse = await fetch(`${ADMIN_CONFIG.API_BASE_URL}send-email.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: email,
                        nombre: nombre,
                        subject: subject,
                        message: message,
                        type: 'reply'
                    })
                });
                
                const emailResult = await emailResponse.json();
                
                // Actualizar estado si se solicita
                if (markAsReplied) {
                    await this.updateContactStatus(id, 'respondido');
                }
                
                if (emailResponse.ok && emailResult.success) {
                    this.showNotification('Respuesta enviada exitosamente', 'success');
                    bsModal.hide();
                    await this.loadSectionData('contactos');
                } else {
                    this.showNotification('Error al enviar la respuesta: ' + (emailResult.message || 'Error desconocido'), 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error de conexión al enviar respuesta', 'error');
            }
        });
        
        // Limpiar modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    viewContactMessage(id, nombre, mensaje) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'viewMessageModalLabel');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="viewMessageModalLabel">
                            <i class="fas fa-envelope me-2"></i>Mensaje de ${nombre}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="message-content" style="white-space: pre-wrap; line-height: 1.6; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #DC143C;">
                            ${mensaje}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="navigator.clipboard.writeText('${mensaje.replace(/'/g, "\\'")}')">
                            <i class="fas fa-copy me-2"></i>Copiar Mensaje
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        
        // Manejar eventos de accesibilidad
        modal.addEventListener('shown.bs.modal', () => {
            modal.removeAttribute('aria-hidden');
            const closeBtn = modal.querySelector('.btn-secondary');
            if (closeBtn) {
                closeBtn.focus();
            }
        });
        
        modal.addEventListener('hide.bs.modal', () => {
            modal.setAttribute('aria-hidden', 'true');
        });
        
        bsModal.show();
        
        // Limpiar modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    changeContactStatus(id, currentStatus) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'changeStatusModalLabel');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="changeStatusModalLabel">
                            <i class="fas fa-flag me-2"></i>Cambiar Estado
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <p>Selecciona el nuevo estado para este contacto:</p>
                        <div class="btn-group-vertical w-100" role="group">
                            <button type="button" class="btn btn-outline-primary status-btn" data-status="nuevo">
                                <i class="fas fa-circle me-2"></i>Nuevo
                            </button>
                            <button type="button" class="btn btn-outline-info status-btn" data-status="leido">
                                <i class="fas fa-eye me-2"></i>Leído
                            </button>
                            <button type="button" class="btn btn-outline-success status-btn" data-status="respondido">
                                <i class="fas fa-reply me-2"></i>Respondido
                            </button>
                            <button type="button" class="btn btn-outline-secondary status-btn" data-status="cerrado">
                                <i class="fas fa-times me-2"></i>Cerrado
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        
        // Manejar eventos de accesibilidad
        modal.addEventListener('shown.bs.modal', () => {
            // Remover aria-hidden cuando el modal esté visible
            modal.removeAttribute('aria-hidden');
            // Establecer foco en el primer botón de estado
            const firstStatusBtn = modal.querySelector('.status-btn');
            if (firstStatusBtn) {
                firstStatusBtn.focus();
            }
        });
        
        modal.addEventListener('hide.bs.modal', () => {
            // Restaurar aria-hidden cuando el modal se cierre
            modal.setAttribute('aria-hidden', 'true');
        });
        
        bsModal.show();
        
        // Marcar estado actual
        modal.querySelectorAll('.status-btn').forEach(btn => {
            if (btn.dataset.status === currentStatus) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', async () => {
                const newStatus = btn.dataset.status;
                await this.updateContactStatus(id, newStatus);
                bsModal.hide();
            });
        });
        
        // Limpiar modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    async updateContactStatus(id, newStatus) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_BASE_URL}admin.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'contactos',
                    id: id,
                    estado: newStatus
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification(`Estado cambiado a: ${newStatus}`, 'success');
                await this.loadSectionData('contactos');
            } else {
                this.showNotification(result.message || 'Error al actualizar estado', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error de conexión al actualizar estado', 'error');
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
    const modals = document.querySelectorAll('#itemModal');
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
        
        // Hacer la función quickAction disponible globalmente
        window.quickAction = (section) => {
            if (adminApp && adminApp.quickAction) {
                adminApp.quickAction(section);
            } else {
                console.error('❌ adminApp no está disponible');
            }
        };
        
        console.log('✅ AdminApp inicializado y quickAction disponible globalmente');
    });
} else {
    // If the DOM is already loaded, initialize immediately
    adminApp = new AdminApp();
    window.adminApp = adminApp;
    
    // Hacer la función quickAction disponible globalmente
    window.quickAction = (section) => {
        if (adminApp && adminApp.quickAction) {
            adminApp.quickAction(section);
        } else {
            console.error('❌ adminApp no está disponible');
        }
    };
    
    console.log('✅ AdminApp inicializado y quickAction disponible globalmente');
}
