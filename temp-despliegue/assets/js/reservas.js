// Sistema de Reservas - Filá Mariscales
class ReservasApp {
    constructor() {
        this.eventos = [];
        this.reservas = [];
        this.init();
    }

    async init() {
        console.log('Inicializando sistema de reservas...');
        await this.loadEventos();
        await this.loadReservas();
        this.setupEventListeners();
        this.renderEventos();
        this.updateHeroStats();
        // Si viene eventId en la URL, abrir modal precargado
        try {
            const params = new URLSearchParams(window.location.search);
            const eventId = params.get('eventId');
            if (eventId) {
                // Esperar pequeño tiempo para asegurar render
                setTimeout(() => this.abrirModalReserva(eventId), 300);
            }
        } catch (e) {
            console.warn('No se pudo leer eventId:', e);
        }
    }

    async loadEventos() {
        try {
            const response = await fetch('data/eventos.json');
            if (!response.ok) throw new Error('Error cargando eventos');
            this.eventos = await response.json();
            console.log('Eventos cargados:', this.eventos.length);
        } catch (error) {
            console.error('Error cargando eventos:', error);
            this.showError('Error cargando eventos. Por favor, recarga la página.');
        }
    }

    async loadReservas() {
        try {
            const response = await fetch('api/reservas.php');
            if (!response.ok) throw new Error('Error cargando reservas');
            this.reservas = await response.json();
            console.log('Reservas cargadas:', this.reservas.length);
        } catch (error) {
            console.error('Error cargando reservas:', error);
        }
    }

    setupEventListeners() {
        // Búsqueda de eventos
        const searchInput = document.getElementById('searchEventos');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterEventos();
            });
        }

        // Filtro por categoría
        const filterSelect = document.getElementById('filterCategoria');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterEventos();
            });
        }

        // Formulario de reserva
        const reservaForm = document.getElementById('reservaForm');
        if (reservaForm) {
            reservaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReservaSubmit();
            });
        }

        // Botón confirmar reserva
        const confirmarBtn = document.getElementById('confirmarReserva');
        if (confirmarBtn) {
            confirmarBtn.addEventListener('click', () => {
                this.handleReservaSubmit();
            });
        }
    }

    renderEventos() {
        const container = document.getElementById('eventosContainer');
        if (!container) return;

        const eventosFiltrados = this.getEventosFiltrados();
        
        if (eventosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        <i class="fas fa-calendar-times fa-3x mb-3"></i>
                        <h5>No hay eventos disponibles</h5>
                        <p>Próximamente se publicarán nuevos eventos.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = eventosFiltrados.map(evento => this.createEventoCard(evento)).join('');
    }

    createEventoCard(evento) {
        const fecha = new Date(evento.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const horaFormateada = fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Verificar si ya hay reservas para este evento
        const reservasEvento = this.reservas.filter(r => r.evento_id === evento.id);
        const plazasDisponibles = evento.aforo_maximo - reservasEvento.length;
        const puedeReservar = plazasDisponibles > 0 && new Date(evento.fecha) > new Date();

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-header bg-primary text-white">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-calendar-check me-2"></i>
                            ${evento.titulo}
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <i class="fas fa-calendar-alt text-primary me-2"></i>
                            <strong>${fechaFormateada}</strong>
                        </div>
                        <div class="mb-3">
                            <i class="fas fa-clock text-primary me-2"></i>
                            <strong>${horaFormateada}</strong>
                        </div>
                        <div class="mb-3">
                            <i class="fas fa-map-marker-alt text-primary me-2"></i>
                            ${evento.ubicacion}
                        </div>
                        <div class="mb-3">
                            <i class="fas fa-users text-primary me-2"></i>
                            <span class="badge ${plazasDisponibles > 0 ? 'bg-success' : 'bg-danger'}">
                                ${plazasDisponibles} plazas disponibles
                            </span>
                        </div>
                        <p class="card-text">${evento.descripcion}</p>
                    </div>
                    <div class="card-footer">
                        ${puedeReservar ? `
                            <button class="btn btn-primary w-100" onclick="reservasApp.abrirModalReserva('${evento.id}')">
                                <i class="fas fa-ticket-alt me-2"></i>Reservar Plaza
                            </button>
                        ` : `
                            <button class="btn btn-secondary w-100" disabled>
                                <i class="fas fa-times me-2"></i>
                                ${plazasDisponibles <= 0 ? 'Sin plazas disponibles' : 'Evento pasado'}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    getEventosFiltrados() {
        let eventos = [...this.eventos];
        
        // Filtrar por búsqueda
        const searchTerm = document.getElementById('searchEventos')?.value.toLowerCase() || '';
        if (searchTerm) {
            eventos = eventos.filter(evento => 
                evento.titulo.toLowerCase().includes(searchTerm) ||
                evento.descripcion.toLowerCase().includes(searchTerm) ||
                evento.ubicacion.toLowerCase().includes(searchTerm)
            );
        }

        // Filtrar por categoría
        const categoria = document.getElementById('filterCategoria')?.value || '';
        if (categoria) {
            eventos = eventos.filter(evento => evento.categoria === categoria);
        }

        // Ordenar por fecha
        eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        return eventos;
    }

    filterEventos() {
        this.renderEventos();
    }

    abrirModalReserva(eventoId) {
        const evento = this.eventos.find(e => e.id === eventoId);
        if (!evento) return;

        // Llenar información del evento en el modal
        document.getElementById('eventoId').value = eventoId;
        document.getElementById('eventoTitulo').textContent = evento.titulo;
        
        const fecha = new Date(evento.fecha);
        document.getElementById('eventoFecha').textContent = 
            fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        
        document.getElementById('eventoUbicacion').textContent = evento.ubicacion;

        // Limpiar formulario
        document.getElementById('reservaForm').reset();
        document.getElementById('eventoId').value = eventoId;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('reservaModal'));
        modal.show();
    }

    async handleReservaSubmit() {
        const form = document.getElementById('reservaForm');
        if (!form) return;

        // Validar formulario
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Verificar términos y condiciones
        const aceptoTerminos = document.getElementById('aceptoTerminos');
        if (!aceptoTerminos.checked) {
            this.showError('Debe aceptar los términos y condiciones');
            return;
        }

        // Recopilar datos del formulario
        const formData = new FormData(form);
        const reservaData = {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            evento_id: formData.get('evento_id'),
            num_personas: parseInt(formData.get('num_personas')),
            comentarios: formData.get('comentarios')
        };

        try {
            // Mostrar loading
            const confirmarBtn = document.getElementById('confirmarReserva');
            const originalText = confirmarBtn.innerHTML;
            confirmarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
            confirmarBtn.disabled = true;

            // Enviar reserva
            const response = await fetch('api/reservas.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservaData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccess('¡Reserva realizada exitosamente! Recibirá un email de confirmación.');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('reservaModal'));
                modal.hide();

                // Recargar datos
                await this.loadReservas();
                this.renderEventos();
            } else {
                this.showError(result.error || 'Error al procesar la reserva');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión. Por favor, inténtelo de nuevo.');
        } finally {
            // Restaurar botón
            confirmarBtn.innerHTML = originalText;
            confirmarBtn.disabled = false;
        }
    }

    showSuccess(message) {
        // Crear alerta de éxito
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    showError(message) {
        // Crear alerta de error
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    updateHeroStats() {
        // Actualizar total de eventos disponibles
        const eventosDisponibles = this.eventos.filter(evento => new Date(evento.fecha) > new Date());
        const totalEventosEl = document.getElementById('totalEventos');
        if (totalEventosEl) {
            totalEventosEl.textContent = eventosDisponibles.length;
        }

        // Actualizar total de reservas
        const totalReservasEl = document.getElementById('totalReservas');
        if (totalReservasEl) {
            totalReservasEl.textContent = this.reservas.length;
        }

        // Actualizar próximo evento
        const proximoEventoEl = document.getElementById('proximoEvento');
        if (proximoEventoEl && eventosDisponibles.length > 0) {
            const proximoEvento = eventosDisponibles.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];
            const fecha = new Date(proximoEvento.fecha);
            const diasRestantes = Math.ceil((fecha - new Date()) / (1000 * 60 * 60 * 24));
            proximoEventoEl.textContent = `${diasRestantes} días`;
        }
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    if (typeof ReservasApp !== 'undefined') {
        window.reservasApp = new ReservasApp();
    }
});
