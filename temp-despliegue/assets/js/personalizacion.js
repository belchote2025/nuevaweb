// ===== SISTEMA DE PERSONALIZACIÓN =====
class PersonalizacionManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadUserPreferences();
        this.setupThemeSelector();
        this.setupLayoutOptions();
        this.setupNotificationPreferences();
    }

    // Cargar preferencias del usuario
    loadUserPreferences() {
        const prefs = localStorage.getItem('user_preferences');
        if (prefs) {
            const preferences = JSON.parse(prefs);
            this.applyPreferences(preferences);
        }
    }

    // Aplicar preferencias
    applyPreferences(preferences) {
        if (preferences.tema) {
            this.applyTheme(preferences.tema);
        }
        if (preferences.layout) {
            this.applyLayout(preferences.layout);
        }
        if (preferences.notificaciones) {
            this.applyNotificationSettings(preferences.notificaciones);
        }
    }

    // Aplicar tema
    applyTheme(temaId) {
        fetch('/fila-mariscales-web/data/temas.json')
            .then(response => response.json())
            .then(temas => {
                const tema = temas.find(t => t.id === temaId);
                if (tema) {
                    const root = document.documentElement;
                    root.style.setProperty('--color-primario', tema.colores.primario);
                    root.style.setProperty('--color-secundario', tema.colores.secundario);
                    root.style.setProperty('--color-fondo', tema.colores.fondo);
                    root.style.setProperty('--color-texto', tema.colores.texto);
                }
            });
    }

    // Aplicar layout
    applyLayout(layout) {
        document.body.className = document.body.className.replace(/layout-\w+/g, '');
        document.body.classList.add(`layout-${layout}`);
    }

    // Configurar selector de tema
    setupThemeSelector() {
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
                this.savePreference('tema', e.target.value);
            });
        }
    }

    // Configurar opciones de layout
    setupLayoutOptions() {
        const layoutOptions = document.querySelectorAll('input[name="layout"]');
        layoutOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                this.applyLayout(e.target.value);
                this.savePreference('layout', e.target.value);
            });
        });
    }

    // Configurar preferencias de notificaciones
    setupNotificationPreferences() {
        const notificationOptions = document.querySelectorAll('input[name="notificaciones"]');
        notificationOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                this.savePreference('notificaciones', {
                    email: document.getElementById('notif-email').checked,
                    push: document.getElementById('notif-push').checked,
                    sms: document.getElementById('notif-sms').checked
                });
            });
        });
    }

    // Guardar preferencia
    savePreference(key, value) {
        const prefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
        prefs[key] = value;
        localStorage.setItem('user_preferences', JSON.stringify(prefs));
    }

    // Obtener tema actual
    getCurrentTheme() {
        const prefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
        return prefs.tema || 'tema-clasico';
    }

    // Resetear preferencias
    resetPreferences() {
        localStorage.removeItem('user_preferences');
        location.reload();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.personalizacionManager = new PersonalizacionManager();
});
