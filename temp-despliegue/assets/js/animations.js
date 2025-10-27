// ===== SISTEMA DE ANIMACIONES ESPECTACULARES =====
class AnimationController {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupNavbarAnimations();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
        this.setupParticleEffects();
        this.setupTextAnimations();
        this.setupFormAnimations();
        this.setupGalleryAnimations();
    }

    // ===== ANIMACIONES DE SCROLL =====
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    
                    // Animación escalonada para elementos múltiples
                    if (entry.target.classList.contains('stagger-animation')) {
                        const children = entry.target.querySelectorAll('.stagger-item');
                        children.forEach((child, index) => {
                            setTimeout(() => {
                                child.classList.add('animate-fadeInUp');
                            }, index * 100);
                        });
                    }
                }
            });
        }, observerOptions);

        // Observar elementos con animaciones de scroll
        document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .stagger-animation').forEach(el => {
            observer.observe(el);
        });
    }

    // ===== ANIMACIONES DE NAVBAR =====
    setupNavbarAnimations() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let lastScrollY = window.scrollY;
        let ticking = false;

        const updateNavbar = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Efecto parallax en el navbar
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll);
    }

    // ===== EFECTOS HOVER ESPECTACULARES =====
    setupHoverEffects() {
        // Efectos en cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.add('card-animated');
        });

        // Efectos en botones
        document.querySelectorAll('.btn').forEach(btn => {
            btn.classList.add('btn-animated');
        });

        // Efectos en enlaces de navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-2px)';
            });
            
            link.addEventListener('mouseleave', () => {
                link.style.transform = 'translateY(0)';
            });
        });

        // Efectos en iconos
        document.querySelectorAll('.fas, .fab').forEach(icon => {
            icon.addEventListener('mouseenter', () => {
                icon.classList.add('icon-bounce');
            });
            
            icon.addEventListener('mouseleave', () => {
                icon.classList.remove('icon-bounce');
            });
        });
    }

    // ===== ANIMACIONES DE CARGA =====
    setupLoadingAnimations() {
        // Animación de carga para imágenes
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', () => {
                img.classList.add('animate-fadeInScale');
            });
        });

        // Animación de carga para contenido dinámico
        const loadingElements = document.querySelectorAll('.loading-shimmer');
        loadingElements.forEach(el => {
            setTimeout(() => {
                el.classList.remove('loading-shimmer');
                el.classList.add('animate-fadeInUp');
            }, 1000);
        });
    }

    // ===== EFECTOS DE PARTÍCULAS =====
    setupParticleEffects() {
        const heroSection = document.querySelector('.hero, .hero-section');
        if (!heroSection) return;

        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        heroSection.appendChild(particlesContainer);

        // Crear partículas
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // ===== ANIMACIONES DE TEXTO =====
    setupTextAnimations() {
        // Animación de texto revelado
        document.querySelectorAll('.text-reveal').forEach(element => {
            const text = element.textContent;
            element.innerHTML = '';
            
            text.split('').forEach((char, index) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.setProperty('--i', index);
                element.appendChild(span);
            });
        });

        // Animación de títulos principales
        document.querySelectorAll('h1, h2').forEach(title => {
            title.addEventListener('mouseenter', () => {
                title.style.animation = 'pulse 0.5s ease-in-out';
            });
            
            title.addEventListener('animationend', () => {
                title.style.animation = '';
            });
        });
    }

    // ===== ANIMACIONES DE FORMULARIOS =====
    setupFormAnimations() {
        // Animación de focus en inputs
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
        });

        // Animación de validación
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                const inputs = form.querySelectorAll('.form-control');
                inputs.forEach((input, index) => {
                    setTimeout(() => {
                        if (input.checkValidity()) {
                            input.classList.add('valid');
                        } else {
                            input.classList.add('invalid');
                        }
                    }, index * 100);
                });
            });
        });
    }

    // ===== ANIMACIONES DE GALERÍA =====
    setupGalleryAnimations() {
        document.querySelectorAll('.gallery-item, .card').forEach(item => {
            item.classList.add('gallery-item');
            
            // Efecto de entrada escalonada
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationDelay = Math.random() * 0.5 + 's';
                        entry.target.classList.add('animate-fadeInScale');
                    }
                });
            });
            
            observer.observe(item);
        });
    }

    // ===== ANIMACIONES DE MODALES =====
    setupModalAnimations() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('show.bs.modal', () => {
                modal.classList.add('animate-fadeInScale');
            });
        });
    }

    // ===== ANIMACIONES DE CAROUSEL =====
    setupCarouselAnimations() {
        document.querySelectorAll('.carousel').forEach(carousel => {
            carousel.addEventListener('slide.bs.carousel', (e) => {
                const activeItem = e.target.querySelector('.carousel-item.active');
                const nextItem = e.relatedTarget;
                
                if (activeItem) {
                    activeItem.classList.add('animate-fadeOut');
                }
                
                nextItem.classList.add('animate-fadeInScale');
            });
        });
    }

    // ===== UTILIDADES DE ANIMACIÓN =====
    static animateElement(element, animationClass, duration = 1000) {
        element.classList.add(animationClass);
        
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }

    static staggerAnimation(elements, animationClass, delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add(animationClass);
            }, index * delay);
        });
    }

    static createRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    new AnimationController();
    
    // Añadir efectos ripple a botones
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', AnimationController.createRippleEffect);
    });
    
    // Animación de entrada de la página
    document.body.classList.add('animate-fadeInUp');
});

// ===== ANIMACIONES ADICIONALES PARA ELEMENTOS ESPECÍFICOS =====
document.addEventListener('DOMContentLoaded', () => {
    // Animación de entrada para el hero
    const hero = document.querySelector('.hero, .hero-section');
    if (hero) {
        hero.classList.add('animate-slideInFromTop');
    }
    
    // Animación de entrada para secciones
    document.querySelectorAll('section').forEach((section, index) => {
        section.classList.add('scroll-reveal');
        section.style.animationDelay = (index * 0.2) + 's';
    });
    
    // Animación de entrada para cards
    document.querySelectorAll('.card').forEach((card, index) => {
        card.classList.add('scroll-reveal-scale');
        card.style.animationDelay = (index * 0.1) + 's';
    });
    
    // Animación de entrada para botones
    document.querySelectorAll('.btn').forEach((btn, index) => {
        btn.classList.add('animate-fadeInUp');
        btn.style.animationDelay = (index * 0.1) + 's';
    });
});

// ===== EFECTOS ESPECIALES =====
// Efecto de partículas en movimiento
function createFloatingParticles() {
    const container = document.querySelector('.hero, .hero-section');
    if (!container) return;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: var(--templar-red);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 3 + 2}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
            opacity: ${Math.random() * 0.5 + 0.3};
        `;
        container.appendChild(particle);
    }
}

// Inicializar efectos especiales
document.addEventListener('DOMContentLoaded', () => {
    createFloatingParticles();
});
