class EventOrganizer {
    constructor() {
        this.events = [];
        this.currentFilter = 'all';
        this.currentSort = 'date-asc';
        this.editingEventId = null;
        this.init();
    }

    init() {
        this.loadEvents();
        this.setupEventListeners();
        this.renderEvents();
    }

    setupEventListeners() {
        // Modal
        document.getElementById('addEventBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        // Formulaire
        document.getElementById('eventForm').addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });
        
        // Tri
        document.getElementById('sortSelect').addEventListener('change', (e) => this.handleSort(e));
        
        // Modal backdrop click
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') {
                this.closeModal();
            }
        });
    }

    loadEvents() {
        const stored = localStorage.getItem('events');
        if (stored) {
            this.events = JSON.parse(stored);
        }
    }

    saveEvents() {
        localStorage.setItem('events', JSON.stringify(this.events));
    }

    openModal(eventId = null) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('eventForm');
        
        if (eventId) {
            const event = this.events.find(e => e.id === eventId);
            if (event) {
                modalTitle.textContent = 'Modifier un événement';
                document.getElementById('eventTitle').value = event.title;
                document.getElementById('eventDate').value = event.date;
                document.getElementById('eventTime').value = event.time;
                document.getElementById('eventLocation').value = event.location;
                document.getElementById('eventDescription').value = event.description || '';
                this.editingEventId = eventId;
            }
        } else {
            modalTitle.textContent = 'Ajouter un événement';
            form.reset();
            this.editingEventId = null;
        }
        
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('active');
        document.getElementById('eventForm').reset();
        this.editingEventId = null;
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const eventData = {
            id: this.editingEventId || Date.now().toString(),
            title: document.getElementById('eventTitle').value.trim(),
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            location: document.getElementById('eventLocation').value.trim(),
            description: document.getElementById('eventDescription').value.trim(),
            createdAt: this.editingEventId ? 
                this.events.find(e => e.id === this.editingEventId).createdAt : 
                new Date().toISOString()
        };
        
        if (this.editingEventId) {
            const index = this.events.findIndex(e => e.id === this.editingEventId);
            this.events[index] = eventData;
        } else {
            this.events.push(eventData);
        }
        
        this.saveEvents();
        this.renderEvents();
        this.closeModal();
    }

    deleteEvent(eventId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.renderEvents();
        }
    }

    handleFilter(e) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderEvents();
    }

    handleSort(e) {
        this.currentSort = e.target.value;
        this.renderEvents();
    }

    getFilteredEvents() {
        const now = new Date();
        let filtered = [...this.events];
        
        // Filtrage
        switch (this.currentFilter) {
            case 'upcoming':
                filtered = filtered.filter(event => new Date(`${event.date}T${event.time}`) > now);
                break;
            case 'past':
                filtered = filtered.filter(event => new Date(`${event.date}T${event.time}`) <= now);
                break;
        }
        
        // Tri
        filtered.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            
            switch (this.currentSort) {
                case 'date-asc':
                    return dateA - dateB;
                case 'date-desc':
                    return dateB - dateA;
                case 'name':
                    return a.title.localeCompare(b.title);
                default:
                    return dateA - dateB;
            }
        });
        
        return filtered;
    }

    getCountdown(eventDate, eventTime) {
        const now = new Date();
        const event = new Date(`${eventDate}T${eventTime}`);
        const diff = event - now;
        
        if (diff <= 0) {
            return 'Événement terminé';
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days}j ${hours}h ${minutes}min`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}min`;
        } else {
            return `${minutes}min`;
        }
    }

    formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('fr-FR', options);
    }

    formatTime(time) {
        return time.substring(0, 5);
    }

    isEventPast(date, time) {
        return new Date(`${date}T${time}`) <= new Date();
    }

    renderEvents() {
        const eventsGrid = document.getElementById('eventsGrid');
        const emptyState = document.getElementById('emptyState');
        const filteredEvents = this.getFilteredEvents();
        
        if (filteredEvents.length === 0) {
            eventsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        eventsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        eventsGrid.innerHTML = filteredEvents.map(event => {
            const isPast = this.isEventPast(event.date, event.time);
            const countdown = this.getCountdown(event.date, event.time);
            
            return `
                <div class="event-card ${isPast ? 'past' : ''}">
                    <div class="event-header">
                        <div>
                            <h3 class="event-title">${this.escapeHtml(event.title)}</h3>
                        </div>
                    </div>
                    
                    <div class="event-date">
                        📅 ${this.formatDate(event.date)} à ${this.formatTime(event.time)}
                    </div>
                    
                    <div class="event-location">
                        📍 ${this.escapeHtml(event.location)}
                    </div>
                    
                    ${event.description ? `
                        <div class="event-description">
                            ${this.escapeHtml(event.description)}
                        </div>
                    ` : ''}
                    
                    <div class="event-countdown">
                        ${isPast ? 'Événement passé' : ` ${countdown}`}
                    </div>
                    
                    <div class="event-actions">
                        <button class="btn btn-sm btn-secondary" onclick="eventOrganizer.openModal('${event.id}')">
                            Modifier
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eventOrganizer.deleteEvent('${event.id}')">
                            Supprimer
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialiser l'application
const eventOrganizer = new EventOrganizer();

// Mettre à jour les compteurs toutes les minutes
setInterval(() => {
    eventOrganizer.renderEvents();
}, 60000);
