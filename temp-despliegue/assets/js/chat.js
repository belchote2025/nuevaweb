(function(){
    const ChatApp = {
        state: {
            rooms: [],
            currentRoomId: 'general',
            currentRoomName: 'General',
            sinceTs: 0,
            pollIntervalMs: 5000,
            pollHandle: null,
            privateWithId: null,
            isPrivate: false
        },

        init() {
            this.cacheEls();
            this.bindEvents();
            this.loadRooms().then(() => {
                this.switchRoom('general', 'General');
            });
            this.startPolling();
        },

        cacheEls() {
            this.$roomsList = document.getElementById('rooms-list');
            this.$messages = document.getElementById('messages');
            this.$form = document.getElementById('form-send');
            this.$input = document.getElementById('input-text');
            this.$currentRoomName = document.getElementById('current-room-name');
            this.$currentRoomId = document.getElementById('current-room-id');
            this.$badgeUnread = document.getElementById('badge-unread');
            this.$openPrivate = document.getElementById('open-private');
            this.$privateToId = document.getElementById('private-to-id');
            this.$btnRefresh = document.getElementById('btn-refresh');
            this.$privateList = document.getElementById('private-list');
        },

        bindEvents() {
            if (this.$form) {
                this.$form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSend();
                });
            }
            if (this.$openPrivate) {
                this.$openPrivate.addEventListener('click', () => {
                    const toId = (this.$privateToId.value || '').trim();
                    if (!toId) return;
                    this.state.isPrivate = true;
                    this.state.privateWithId = toId;
                    this.state.sinceTs = 0;
                    this.$currentRoomName.textContent = 'Privado con ' + toId;
                    this.$currentRoomId.textContent = '#private';
                    this.$messages.innerHTML = '';
                    this.fetchMessages();
                });
            }
            // Cargar usuarios para selector de privados
            this.loadUsers();
            if (this.$btnRefresh) {
                this.$btnRefresh.addEventListener('click', () => {
                    this.fetchMessages();
                    this.updateNotifications();
                });
            }
        },

        async loadUsers() {
            try {
                const res = await fetch('api/chat.php?action=getUsers', { credentials: 'include' });
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    this.renderUsers(json.data);
                }
            } catch (e) {
                // noop
            }
        },

        renderUsers(users) {
            if (!this.$privateToId) return;
            // Convertir input en datalist si no existe
            let list = document.getElementById('users-datalist');
            if (!list) {
                list = document.createElement('datalist');
                list.id = 'users-datalist';
                document.body.appendChild(list);
                this.$privateToId.setAttribute('list', 'users-datalist');
            }
            list.innerHTML = users.map(u => `<option value="${u.id}">${u.nombre} (${u.rol})</option>`).join('');
        },

        async loadRooms() {
            try {
                const res = await fetch('api/chat.php?action=getRooms', { credentials: 'include' });
                const json = await res.json();
                if (json.success) {
                    this.state.rooms = json.data || [];
                    this.renderRooms();
                }
            } catch (e) {
                console.error('Error cargando salas', e);
            }
        },

        renderRooms() {
            if (!this.$roomsList) return;
            this.$roomsList.innerHTML = (this.state.rooms || []).map(r => `
                <li class="list-group-item d-flex justify-content-between align-items-center room-item" data-id="${r.id}" data-name="${r.nombre}">
                    <span><i class="fas fa-hashtag me-2 text-muted"></i>${r.nombre}</span>
                </li>
            `).join('');
            this.$roomsList.querySelectorAll('.room-item').forEach(li => {
                li.addEventListener('click', () => {
                    this.state.isPrivate = false;
                    this.state.privateWithId = null;
                    const id = li.getAttribute('data-id');
                    const name = li.getAttribute('data-name');
                    this.switchRoom(id, name);
                });
            });
        },

        switchRoom(id, name) {
            this.state.currentRoomId = id;
            this.state.currentRoomName = name;
            this.state.sinceTs = 0;
            if (this.$currentRoomName) this.$currentRoomName.textContent = name;
            if (this.$currentRoomId) this.$currentRoomId.textContent = '#' + id;
            if (this.$messages) this.$messages.innerHTML = '';
            this.fetchMessages();
        },

        async fetchMessages() {
            try {
                let url;
                if (this.state.isPrivate && this.state.privateWithId) {
                    url = `api/chat.php?action=getPrivate&with_id=${encodeURIComponent(this.state.privateWithId)}&since=${this.state.sinceTs}`;
                } else {
                    url = `api/chat.php?action=getMessages&room_id=${encodeURIComponent(this.state.currentRoomId)}&since=${this.state.sinceTs}`;
                }
                const res = await fetch(url, { credentials: 'include' });
                const json = await res.json();
                if (json.success) {
                    const msgs = json.data || [];
                    if (msgs.length > 0) {
                        msgs.forEach(m => this.appendMessage(m));
                        this.state.sinceTs = Math.max(this.state.sinceTs, ...msgs.map(m => m.ts || 0));
                        this.scrollToBottom();
                    }
                }
            } catch (e) {
                console.error('Error obteniendo mensajes', e);
            }
            this.updateNotifications();
        },

        async handleSend() {
            const text = (this.$input.value || '').trim();
            if (!text) return;
            try {
                const body = this.state.isPrivate && this.state.privateWithId
                    ? { to_id: this.state.privateWithId, text }
                    : { room_id: this.state.currentRoomId, text };
                const action = this.state.isPrivate ? 'postPrivate' : 'postMessage';
                const res = await fetch(`api/chat.php?action=${action}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(body)
                });
                const json = await res.json();
                if (json.success) {
                    this.$input.value = '';
                    // Añadir inmediatamente
                    this.appendMessage(json.data);
                    this.state.sinceTs = Math.max(this.state.sinceTs, json.data.ts || 0);
                    this.scrollToBottom();
                }
            } catch (e) {
                console.error('Error enviando', e);
            }
        },

        appendMessage(m) {
            if (!this.$messages) return;
            const date = new Date((m.ts || 0) * 1000);
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');
            const who = m.user_name || m.from_name || 'Anon';
            const text = (m.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const mine = (m.user_id && window.USER_ID && String(m.user_id) === String(window.USER_ID)) || (m.from_id && window.USER_ID && String(m.from_id) === String(window.USER_ID));
            const align = mine ? 'text-end' : 'text-start';
            const badge = mine ? 'bg-primary' : 'bg-secondary';
            const bubble = `
                <div class="${align} mb-2">
                    <div class="d-inline-block px-2 py-1 rounded ${badge} text-white">
                        <small class="opacity-75">${who}</small><br>${text}
                    </div>
                    <div><small class="text-muted">${hh}:${mm}</small></div>
                </div>`;
            this.$messages.insertAdjacentHTML('beforeend', bubble);
        },

        scrollToBottom() {
            try { this.$messages.scrollTop = this.$messages.scrollHeight; } catch (e) {}
        },

        startPolling() {
            if (this.state.pollHandle) clearInterval(this.state.pollHandle);
            this.state.pollHandle = setInterval(() => {
                this.fetchMessages();
            }, this.state.pollIntervalMs);
            this.updateNotifications();
        },

        async updateNotifications() {
            try {
                const res = await fetch('api/chat.php?action=getNotifications', { credentials: 'include' });
                const json = await res.json();
                if (json.success && this.$badgeUnread) {
                    this.$badgeUnread.textContent = (json.data?.private_unread ?? 0);
                }
            } catch (e) {
                // noop
            }
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        // Optional: exponer USER_ID si existe en sesión vía endpoint auth.php (ya implementado en el proyecto)
        ChatApp.init();
    });
})();


