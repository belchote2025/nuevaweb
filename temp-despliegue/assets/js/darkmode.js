// ===== SISTEMA DE MODO OSCURO =====
class DarkModeSystem {
    constructor() {
        this.isDarkMode = false;
        this.init();
    }

    init() {
        this.loadDarkModePreference();
        this.setupDarkModeUI();
        this.setupEventListeners();
        this.applyDarkMode();
    }

    // ===== CARGA DE PREFERENCIAS =====
    loadDarkModePreference() {
        // Verificar preferencia guardada
        const savedPreference = localStorage.getItem('darkMode');
        if (savedPreference !== null) {
            this.isDarkMode = savedPreference === 'true';
        } else {
            // Usar preferencia del sistema
            this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    }

    // ===== CONFIGURACIÓN DE UI =====
    setupDarkModeUI() {
        // Crear botón de modo oscuro en navbar
        const navbar = document.querySelector('.navbar .container');
        if (navbar) {
            const darkModeButton = document.createElement('button');
            darkModeButton.className = 'btn btn-outline-light me-2';
            darkModeButton.id = 'dark-mode-toggle';
            darkModeButton.innerHTML = '<i class="fas fa-moon"></i>';
            darkModeButton.title = 'Cambiar modo oscuro';
            
            navbar.appendChild(darkModeButton);
        }

        // Crear estilos CSS para modo oscuro
        this.createDarkModeStyles();
    }

    createDarkModeStyles() {
        const darkModeCSS = `
            <style id="dark-mode-styles">
                /* Variables CSS para modo oscuro */
                :root {
                    --bs-body-bg: #ffffff;
                    --bs-body-color: #212529;
                    --bs-primary: #0d6efd;
                    --bs-secondary: #6c757d;
                    --bs-success: #198754;
                    --bs-info: #0dcaf0;
                    --bs-warning: #ffc107;
                    --bs-danger: #dc3545;
                    --bs-light: #f8f9fa;
                    --bs-dark: #212529;
                    --bs-white: #ffffff;
                    --bs-black: #000000;
                }

                [data-bs-theme="dark"] {
                    --bs-body-bg: #1a1a1a;
                    --bs-body-color: #e9ecef;
                    --bs-primary: #0d6efd;
                    --bs-secondary: #6c757d;
                    --bs-success: #198754;
                    --bs-info: #0dcaf0;
                    --bs-warning: #ffc107;
                    --bs-danger: #dc3545;
                    --bs-light: #343a40;
                    --bs-dark: #f8f9fa;
                    --bs-white: #212529;
                    --bs-black: #ffffff;
                }

                /* Estilos específicos para modo oscuro */
                [data-bs-theme="dark"] body {
                    background-color: var(--bs-body-bg);
                    color: var(--bs-body-color);
                }

                [data-bs-theme="dark"] .navbar {
                    background-color: #2d3748 !important;
                    border-bottom: 1px solid #4a5568;
                }

                [data-bs-theme="dark"] .card {
                    background-color: #2d3748;
                    border-color: #4a5568;
                    color: var(--bs-body-color);
                }

                [data-bs-theme="dark"] .card-header {
                    background-color: #4a5568;
                    border-bottom-color: #718096;
                }

                [data-bs-theme="dark"] .list-group-item {
                    background-color: #2d3748;
                    border-color: #4a5568;
                    color: var(--bs-body-color);
                }

                [data-bs-theme="dark"] .table {
                    color: var(--bs-body-color);
                }

                [data-bs-theme="dark"] .table-striped > tbody > tr:nth-of-type(odd) > td,
                [data-bs-theme="dark"] .table-striped > tbody > tr:nth-of-type(odd) > th {
                    background-color: rgba(255, 255, 255, 0.05);
                }

                [data-bs-theme="dark"] .form-control {
                    background-color: #4a5568;
                    border-color: #718096;
                    color: var(--bs-body-color);
                }

                [data-bs-theme="dark"] .form-control:focus {
                    background-color: #4a5568;
                    border-color: #3182ce;
                    color: var(--bs-body-color);
                    box-shadow: 0 0 0 0.2rem rgba(49, 130, 206, 0.25);
                }

                [data-bs-theme="dark"] .form-select {
                    background-color: #4a5568;
                    border-color: #718096;
                    color: var(--bs-body-color);
                }

                [data-bs-theme="dark"] .modal-content {
                    background-color: #2d3748;
                    border-color: #4a5568;
                }

                [data-bs-theme="dark"] .modal-header {
                    border-bottom-color: #4a5568;
                }

                [data-bs-theme="dark"] .modal-footer {
                    border-top-color: #4a5568;
                }

                [data-bs-theme="dark"] .dropdown-menu {
                    background-color: #2d3748;
                    border-color: #4a5568;
                }

                [data-bs-theme="dark"] .dropdown-item {
                    color: var(--bs-body-color);
                }

                [data-bs-theme="dark"] .dropdown-item:hover {
                    background-color: #4a5568;
                }

                [data-bs-theme="dark"] .alert {
                    border-color: transparent;
                }

                [data-bs-theme="dark"] .alert-primary {
                    background-color: rgba(13, 110, 253, 0.2);
                    color: #93c5fd;
                }

                [data-bs-theme="dark"] .alert-success {
                    background-color: rgba(25, 135, 84, 0.2);
                    color: #86efac;
                }

                [data-bs-theme="dark"] .alert-danger {
                    background-color: rgba(220, 53, 69, 0.2);
                    color: #fca5a5;
                }

                [data-bs-theme="dark"] .alert-warning {
                    background-color: rgba(255, 193, 7, 0.2);
                    color: #fde047;
                }

                [data-bs-theme="dark"] .alert-info {
                    background-color: rgba(13, 202, 240, 0.2);
                    color: #7dd3fc;
                }

                [data-bs-theme="dark"] .text-muted {
                    color: #a0aec0 !important;
                }

                [data-bs-theme="dark"] .bg-light {
                    background-color: #4a5568 !important;
                }

                [data-bs-theme="dark"] .border {
                    border-color: #4a5568 !important;
                }

                [data-bs-theme="dark"] .border-top {
                    border-top-color: #4a5568 !important;
                }

                [data-bs-theme="dark"] .border-bottom {
                    border-bottom-color: #4a5568 !important;
                }

                [data-bs-theme="dark"] .border-start {
                    border-left-color: #4a5568 !important;
                }

                [data-bs-theme="dark"] .border-end {
                    border-right-color: #4a5568 !important;
                }

                /* Transiciones suaves */
                * {
                    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
                }

                /* Estilos específicos para elementos personalizados */
                [data-bs-theme="dark"] .hero-section {
                    background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
                }

                [data-bs-theme="dark"] .gallery-overlay {
                    background: rgba(0, 0, 0, 0.7);
                }

                [data-bs-theme="dark"] .search-result-card {
                    background-color: #2d3748;
                    border-color: #4a5568;
                }

                [data-bs-theme="dark"] .search-result-card:hover {
                    background-color: #4a5568;
                }

                /* Scrollbar personalizado para modo oscuro */
                [data-bs-theme="dark"] ::-webkit-scrollbar {
                    width: 8px;
                }

                [data-bs-theme="dark"] ::-webkit-scrollbar-track {
                    background: #2d3748;
                }

                [data-bs-theme="dark"] ::-webkit-scrollbar-thumb {
                    background: #4a5568;
                    border-radius: 4px;
                }

                [data-bs-theme="dark"] ::-webkit-scrollbar-thumb:hover {
                    background: #718096;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', darkModeCSS);
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Botón de toggle
        const toggleButton = document.getElementById('dark-mode-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }

        // Escuchar cambios en preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('darkMode') === null) {
                this.isDarkMode = e.matches;
                this.applyDarkMode();
            }
        });

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + D para toggle
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleDarkMode();
            }
        });
    }

    // ===== TOGGLE MODO OSCURO =====
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.saveDarkModePreference();
        this.applyDarkMode();
        this.updateToggleButton();
        this.showNotification();
    }

    applyDarkMode() {
        const html = document.documentElement;
        
        if (this.isDarkMode) {
            html.setAttribute('data-bs-theme', 'dark');
        } else {
            html.removeAttribute('data-bs-theme');
        }

        this.updateToggleButton();
    }

    updateToggleButton() {
        const toggleButton = document.getElementById('dark-mode-toggle');
        if (toggleButton) {
            const icon = toggleButton.querySelector('i');
            if (this.isDarkMode) {
                icon.className = 'fas fa-sun';
                toggleButton.title = 'Cambiar a modo claro';
            } else {
                icon.className = 'fas fa-moon';
                toggleButton.title = 'Cambiar a modo oscuro';
            }
        }
    }

    saveDarkModePreference() {
        localStorage.setItem('darkMode', this.isDarkMode.toString());
    }

    // ===== NOTIFICACIÓN =====
    showNotification() {
        const message = this.isDarkMode ? 'Modo oscuro activado' : 'Modo claro activado';
        Utils.showNotification(message, 'info');
    }

    // ===== API PÚBLICA =====
    getDarkMode() {
        return this.isDarkMode;
    }

    setDarkMode(isDark) {
        this.isDarkMode = isDark;
        this.saveDarkModePreference();
        this.applyDarkMode();
    }

    // ===== DETECCIÓN AUTOMÁTICA =====
    detectSystemPreference() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // ===== RESET =====
    resetToSystemPreference() {
        this.isDarkMode = this.detectSystemPreference();
        this.saveDarkModePreference();
        this.applyDarkMode();
    }
}

// ===== INICIALIZACIÓN =====
let darkModeSystem;

document.addEventListener('DOMContentLoaded', function() {
    darkModeSystem = new DarkModeSystem();
});

// ===== FUNCIONES GLOBALES =====
window.darkModeSystem = darkModeSystem;

