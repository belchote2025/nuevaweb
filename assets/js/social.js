// ===== CONFIGURACIÓN DE REDES SOCIALES =====
const SOCIAL_CONFIG = {
    API_BASE_URL: 'api/',
    SHARE_BUTTONS_ENABLED: true,
    SOCIAL_FEED_ENABLED: true,
    AUTO_SHARE_ENABLED: true
};

// ===== CLASE PRINCIPAL DE REDES SOCIALES =====
class SocialManager {
    constructor() {
        this.config = null;
        this.stats = null;
        this.posts = [];
        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            await this.loadStats();
            await this.loadPosts();
            this.setupEventListeners();
            this.renderSocialElements();
        } catch (error) {
            console.error('Error inicializando redes sociales:', error);
        }
    }

    // ===== CARGA DE DATOS =====
    async loadConfig() {
        try {
            const response = await fetch(`${SOCIAL_CONFIG.API_BASE_URL}social.php?action=config`);
            const result = await response.json();
            
            if (result.success) {
                this.config = result.data;
            } else {
                console.error('Error cargando configuración de redes sociales:', result.message);
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${SOCIAL_CONFIG.API_BASE_URL}social.php?action=stats`);
            const result = await response.json();
            
            if (result.success) {
                this.stats = result.data;
            } else {
                console.error('Error cargando estadísticas:', result.message);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    async loadPosts() {
        try {
            const response = await fetch(`${SOCIAL_CONFIG.API_BASE_URL}social.php?action=posts&limit=10`);
            const result = await response.json();
            
            if (result.success) {
                this.posts = result.data;
            } else {
                console.error('Error cargando posts:', result.message);
            }
        } catch (error) {
            console.error('Error cargando posts:', error);
        }
    }

    // ===== RENDERIZADO DE ELEMENTOS =====
    renderSocialElements() {
        this.renderShareButtons();
        this.renderFollowButtons();
        this.renderSocialFeed();
        this.renderSocialStats();
    }

    renderShareButtons() {
        if (!SOCIAL_CONFIG.SHARE_BUTTONS_ENABLED) return;

        const shareContainers = document.querySelectorAll('.social-share-container');
        
        shareContainers.forEach(container => {
            const data = this.extractShareData(container);
            const shareUrls = this.generateShareUrls(data);
            
            container.innerHTML = this.createShareButtonsHTML(shareUrls);
        });
    }

    renderFollowButtons() {
        if (!this.config || !this.config.platforms) return;

        const followContainers = document.querySelectorAll('.social-follow-container');
        
        followContainers.forEach(container => {
            container.innerHTML = this.createFollowButtonsHTML();
        });
    }

    renderSocialFeed() {
        if (!SOCIAL_CONFIG.SOCIAL_FEED_ENABLED || !this.posts.length) return;

        const feedContainers = document.querySelectorAll('.social-feed-container');
        
        feedContainers.forEach(container => {
            container.innerHTML = this.createSocialFeedHTML();
        });
    }

    renderSocialStats() {
        if (!this.stats) return;

        const statsContainers = document.querySelectorAll('.social-stats-container');
        
        statsContainers.forEach(container => {
            container.innerHTML = this.createSocialStatsHTML();
        });
    }

    // ===== GENERACIÓN DE HTML =====
    createShareButtonsHTML(shareUrls) {
        const platforms = [
            { key: 'facebook', name: 'Facebook', icon: 'fab fa-facebook-f' },
            { key: 'twitter', name: 'Twitter', icon: 'fab fa-twitter' },
            { key: 'whatsapp', name: 'WhatsApp', icon: 'fab fa-whatsapp' },
            { key: 'telegram', name: 'Telegram', icon: 'fab fa-telegram-plane' },
            { key: 'linkedin', name: 'LinkedIn', icon: 'fab fa-linkedin-in' },
            { key: 'pinterest', name: 'Pinterest', icon: 'fab fa-pinterest-p' }
        ];

        return `
            <div class="social-share-buttons">
                ${platforms.map(platform => `
                    <a href="${shareUrls[platform.key]}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="social-share-btn ${platform.key}"
                       title="Compartir en ${platform.name}">
                        <i class="${platform.icon}"></i>
                        <span>${platform.name}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    createFollowButtonsHTML() {
        if (!this.config || !this.config.platforms) return '';

        const enabledPlatforms = Object.entries(this.config.platforms)
            .filter(([key, platform]) => platform.enabled)
            .map(([key, platform]) => ({ key, ...platform }));

        return `
            <div class="social-follow-buttons">
                ${enabledPlatforms.map(platform => `
                    <a href="${platform.url}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="social-follow-btn"
                       style="background: ${platform.color};"
                       title="Síguenos en ${platform.name}">
                        <i class="${platform.icon}"></i>
                        <span>Seguir en ${platform.name}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    createSocialFeedHTML() {
        if (!this.posts.length) {
            return `
                <div class="social-feed">
                    <div class="text-center py-4">
                        <i class="fas fa-rss fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay posts recientes</h5>
                        <p class="text-muted">Síguenos en nuestras redes sociales</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="social-feed">
                <div class="social-feed-header">
                    <h3 class="social-feed-title">Últimas Publicaciones</h3>
                    <button class="social-feed-refresh" onclick="socialManager.refreshFeed()">
                        <i class="fas fa-sync"></i>
                    </button>
                </div>
                <div class="social-posts-container">
                    ${this.posts.map(post => this.createSocialPostHTML(post)).join('')}
                </div>
            </div>
        `;
    }

    createSocialPostHTML(post) {
        const platformConfig = this.config?.platforms?.[post.platform];
        const platformName = platformConfig?.name || post.platform;
        const platformIcon = platformConfig?.icon || 'fas fa-share';
        const platformColor = platformConfig?.color || '#666';

        return `
            <div class="social-post">
                <div class="social-post-header">
                    <div class="social-post-platform ${post.platform}" style="background: ${platformColor};">
                        <i class="${platformIcon}"></i>
                    </div>
                    <div class="social-post-info">
                        <h6 class="social-post-platform-name">${platformName}</h6>
                        <p class="social-post-date">${this.formatDate(post.published_at || post.created_at)}</p>
                    </div>
                </div>
                <div class="social-post-content">${post.content}</div>
                ${post.media ? `<img src="${post.media}" alt="Post media" class="social-post-media">` : ''}
                ${post.engagement ? `
                    <div class="social-post-engagement">
                        <span><i class="fas fa-heart"></i> ${post.engagement.likes}</span>
                        <span><i class="fas fa-share"></i> ${post.engagement.shares}</span>
                        <span><i class="fas fa-comment"></i> ${post.engagement.comments}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    createSocialStatsHTML() {
        if (!this.stats) return '';

        const platforms = [
            { key: 'facebook', name: 'Facebook', icon: 'fab fa-facebook-f', color: '#1877F2' },
            { key: 'twitter', name: 'Twitter', icon: 'fab fa-twitter', color: '#1DA1F2' },
            { key: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F' },
            { key: 'youtube', name: 'YouTube', icon: 'fab fa-youtube', color: '#FF0000' }
        ];

        return `
            <div class="social-stats">
                ${platforms.map(platform => {
                    const stats = this.stats[platform.key];
                    if (!stats) return '';
                    
                    return `
                        <div class="social-stat-card">
                            <div class="social-stat-icon" style="background: ${platform.color};">
                                <i class="${platform.icon}"></i>
                            </div>
                            <div class="social-stat-number">${this.formatNumber(stats.followers || stats.subscribers || 0)}</div>
                            <div class="social-stat-label">${platform.key === 'youtube' ? 'Suscriptores' : 'Seguidores'}</div>
                            <div class="social-stat-change positive">
                                <i class="fas fa-arrow-up"></i> +${stats.engagement || 0}%
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ===== FUNCIONES UTILITARIAS =====
    extractShareData(container) {
        const title = container.dataset.title || document.title;
        const description = container.dataset.description || '';
        const url = container.dataset.url || window.location.href;
        const image = container.dataset.image || '';

        return { title, description, url, image };
    }

    generateShareUrls(data) {
        const encodedTitle = encodeURIComponent(data.title);
        const encodedDescription = encodeURIComponent(data.description);
        const encodedUrl = encodeURIComponent(data.url);
        const encodedImage = encodeURIComponent(data.image);

        return {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedDescription}`
        };
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // ===== EVENTOS =====
    setupEventListeners() {
        // Auto-share para noticias y eventos
        if (SOCIAL_CONFIG.AUTO_SHARE_ENABLED) {
            this.setupAutoShare();
        }
    }

    setupAutoShare() {
        // Observar cambios en el DOM para detectar nuevos elementos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Añadir botones de compartir a nuevos elementos
                        const shareContainers = node.querySelectorAll('.social-share-container');
                        shareContainers.forEach(container => {
                            if (!container.querySelector('.social-share-buttons')) {
                                const data = this.extractShareData(container);
                                const shareUrls = this.generateShareUrls(data);
                                container.innerHTML = this.createShareButtonsHTML(shareUrls);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ===== ACCIONES =====
    async refreshFeed() {
        try {
            await this.loadPosts();
            this.renderSocialFeed();
            this.showNotification('Feed actualizado', 'success');
        } catch (error) {
            console.error('Error actualizando feed:', error);
            this.showNotification('Error actualizando feed', 'error');
        }
    }

    async shareContent(platform, data) {
        try {
            const shareUrls = this.generateShareUrls(data);
            const url = shareUrls[platform];
            
            if (url) {
                window.open(url, '_blank', 'width=600,height=400');
            }
        } catch (error) {
            console.error('Error compartiendo contenido:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // ===== API DE ADMINISTRACIÓN =====
    async createPost(platform, content, media = null) {
        try {
            const response = await fetch(`${SOCIAL_CONFIG.API_BASE_URL}social.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_post',
                    platform: platform,
                    content: content,
                    media: media
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Post creado correctamente', 'success');
                await this.loadPosts();
                this.renderSocialFeed();
                return result.data;
            } else {
                this.showNotification(result.message, 'error');
                return null;
            }
        } catch (error) {
            console.error('Error creando post:', error);
            this.showNotification('Error creando post', 'error');
            return null;
        }
    }

    async schedulePost(postId, scheduledAt) {
        try {
            const response = await fetch(`${SOCIAL_CONFIG.API_BASE_URL}social.php`, {
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
                await this.loadPosts();
                this.renderSocialFeed();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error programando post:', error);
            this.showNotification('Error programando post', 'error');
        }
    }

    async publishPost(postId) {
        try {
            const response = await fetch(`${SOCIAL_CONFIG.API_BASE_URL}social.php`, {
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
                await this.loadPosts();
                this.renderSocialFeed();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error publicando post:', error);
            this.showNotification('Error publicando post', 'error');
        }
    }
}

// ===== INICIALIZACIÓN =====
let socialManager;

document.addEventListener('DOMContentLoaded', function() {
    socialManager = new SocialManager();
});

// ===== FUNCIONES GLOBALES =====
window.socialManager = socialManager;

// Función para compartir contenido específico
window.shareContent = function(platform, title, description, url, image) {
    if (socialManager) {
        socialManager.shareContent(platform, { title, description, url, image });
    }
};

// Función para crear post desde el admin
window.createSocialPost = function(platform, content, media) {
    if (socialManager) {
        return socialManager.createPost(platform, content, media);
    }
};
