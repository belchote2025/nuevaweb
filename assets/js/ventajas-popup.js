// Función para inicializar el popup de ventajas
function initVentajasPopup() {
    // Crear el elemento del popup si no existe
    if (!document.getElementById('ventajasPopup')) {
        const popupHTML = `
            <div id="ventajasPopup" class="ventajas-popup">
                <div class="ventajas-content">
                    <span class="close-popup">&times;</span>
                    <h3><i class="fas fa-star me-2"></i>Ventajas Exclusivas para Socios</h3>
                    <ul class="ventajas-list">
                        <li><i class="fas fa-check-circle text-success me-2"></i>Descuentos exclusivos en eventos y actividades</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Acceso prioritario a entradas para festividades</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Participación en actividades exclusivas</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Descuentos en tiendas y establecimientos asociados</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Acceso a zona VIP en eventos de la Filá</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Participación en sorteos y promociones especiales</li>
                    </ul>
                    <button class="btn btn-primary mt-3" id="btnHacerseSocio">¡Hazte Socio Ahora!</button>
                </div>
            </div>
            <style>
                .ventajas-popup {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    z-index: 2000;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    padding: 15px;
                    box-sizing: border-box;
                }

                .ventajas-popup.show {
                    display: flex;
                    opacity: 1;
                }

                .ventajas-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    text-align: center;
                    position: relative;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    border: 2px solid #DC143C;
                }

                .ventajas-popup.show .ventajas-content {
                    transform: scale(1);
                }

                .ventajas-content h3 {
                    color: #DC143C;
                    margin-bottom: 1.5rem;
                    font-weight: 600;
                    font-size: 1.8rem;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 10px;
                }

                .ventajas-list {
                    list-style: none;
                    padding: 0 1rem;
                    text-align: left;
                    margin: 1.5rem 0;
                }

                .ventajas-list li {
                    padding: 0.8rem 0;
                    color: #333;
                    font-size: 1.05rem;
                    display: flex;
                    align-items: flex-start;
                    border-bottom: 1px dashed #eee;
                }

                .ventajas-list li:last-child {
                    border-bottom: none;
                }

                .ventajas-list i {
                    margin-top: 4px;
                    margin-right: 10px;
                    flex-shrink: 0;
                }

                .close-popup {
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                    transition: color 0.3s;
                    background: none;
                    border: none;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }

                .close-popup:hover {
                    color: #DC143C;
                    background-color: #f8f9fa;
                }

                #btnHacerseSocio {
                    background-color: #DC143C;
                    border: none;
                    padding: 10px 25px;
                    font-weight: 600;
                    font-size: 1.1rem;
                    transition: all 0.3s ease;
                }

                #btnHacerseSocio:hover {
                    background-color: #b01030;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(220, 20, 60, 0.3);
                }

                @media (max-width: 576px) {
                    .ventajas-content {
                        padding: 1.5rem;
                        width: 100%;
                    }
                    
                    .ventajas-list li {
                        font-size: 1rem;
                    }

                    .ventajas-content h3 {
                        font-size: 1.5rem;
                        padding-right: 30px;
                    }
                }
            </style>
        `;

        // Agregar el popup al final del body
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // Inicializar eventos del popup
        const ventajasPopup = document.getElementById('ventajasPopup');
        const closePopup = document.querySelector('.close-popup');
        const btnHacerseSocio = document.getElementById('btnHacerseSocio');

        // Función para abrir el popup
        window.openVentajasPopup = function() {
            ventajasPopup.classList.add('show');
            document.body.style.overflow = 'hidden';
        };

        // Función para cerrar el popup
        function closeVentajasPopup() {
            ventajasPopup.classList.remove('show');
            document.body.style.overflow = '';
        }

        // Evento para cerrar con la X
        if (closePopup) {
            closePopup.addEventListener('click', closeVentajasPopup);
        }

        // Cerrar al hacer clic fuera del contenido
        if (ventajasPopup) {
            ventajasPopup.addEventListener('click', function(e) {
                if (e.target === ventajasPopup) {
                    closeVentajasPopup();
                }
            });
        }

        // Cerrar con la tecla ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && ventajasPopup.classList.contains('show')) {
                closeVentajasPopup();
            }
        });

        // Botón "Hacerse Socio"
        if (btnHacerseSocio) {
            btnHacerseSocio.addEventListener('click', function() {
                closeVentajasPopup();
                const solicitudBtn = document.querySelector('[data-bs-target="#solicitudSocioModal"]');
                if (solicitudBtn) {
                    solicitudBtn.click();
                }
            });
        }
    }

    // Asignar el evento al botón de ventajas
    const btnVerVentajas = document.getElementById('btnVerVentajas');
    if (btnVerVentajas) {
        btnVerVentajas.addEventListener('click', function(e) {
            e.preventDefault();
            window.openVentajasPopup();
        });
    }
}

// Inicializar el popup cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVentajasPopup);
} else {
    initVentajasPopup();
}
