// Main JavaScript for Андрей Орлов Portfolio
class PortfolioApp {
    constructor() {
        this.projects = [];
        this.about = {};
        this.currentImageIndex = 0;
        this.filteredProjects = [];
        this.lightboxImages = [];
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderProjects();
        this.renderAbout();
        this.setupAnimations();
        this.setupRouting();
        this.setupLightbox();
    }
    
    async loadData() {
        try {
            const [projectsResponse, aboutResponse] = await Promise.all([
                fetch('projects.json'),
                fetch('about.json')
            ]);
            
            this.projects = await projectsResponse.json();
            this.about = await aboutResponse.json();
            this.filteredProjects = [...this.projects];
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback data
            this.projects = this.getFallbackProjects();
            this.about = this.getFallbackAbout();
            this.filteredProjects = [...this.projects];
        }
    }
    
    getFallbackProjects() {
        return [
            {
                id: "proj_001",
                title: "Барон Мюнхгаузен",
                slug: "1-baron",
                description: "Памятник барону Мюнхгаузену у станции метро Молодежная",
                images: ["resources/projects/1-baron-01.jpg"],
                category: "monuments",
                year: "2004"
            },
            {
                id: "proj_012",
                title: "Шерлок Холмс и доктор Ватсон",
                slug: "5-sherlock",
                description: "Памятник знаменитым литературным героям",
                images: ["resources/projects/5-sherlock-01.jpeg"],
                category: "monuments",
                year: "2007"
            }
        ];
    }
    
    getFallbackAbout() {
        return {
            title: "Андрей Орлов — скульптор",
            markdown: "Советский и российский скульптор. Наиболее известен как создатель памятников Шерлоку Холмсу и доктору Ватсону, а также барону Мюнхгаузену в Москве."
        };
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                const section = href.substring(1);
                this.navigateToSection(section);
            });
        });
        
        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu);
        }
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterProjects(filter);
                this.updateFilterButtons(e.target);
            });
        });
        
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProjects(e.target.value);
            });
        }
        
        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactForm);
        }
        
        // Scroll events
        window.addEventListener('scroll', this.handleScroll);
        
        // Lightbox events
        document.getElementById('lightbox-close')?.addEventListener('click', this.closeLightbox);
        document.getElementById('lightbox-prev')?.addEventListener('click', this.prevImage);
        document.getElementById('lightbox-next')?.addEventListener('click', this.nextImage);
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard);
        
        // Click outside lightbox to close
        document.getElementById('lightbox')?.addEventListener('click', (e) => {
            if (e.target.id === 'lightbox') {
                this.closeLightbox();
            }
        });
    }
    
    renderProjects() {
        const grid = document.getElementById('gallery-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.filteredProjects.forEach((project, index) => {
            const projectCard = this.createProjectCard(project, index);
            grid.appendChild(projectCard);
        });
        
        // Animate cards
        anime({
            targets: '.project-card',
            opacity: [0, 1],
            translateY: [30, 0],
            delay: anime.stagger(100),
            duration: 600,
            easing: 'easeOutQuart'
        });
    }
    
    createProjectCard(project, index) {
        const card = document.createElement('div');
        card.className = 'project-card bg-white rounded-lg shadow-lg overflow-hidden';
        card.dataset.category = project.category || 'monuments';
        const imageUrl = project.images?.[0] || 'resources/hero-sculpture.jpg';
        const year = project.year || '2000';
        const markdown = project.markdown || project.description || '';
        const plainText = markdown
            .replace(/```[\s\S]*?```/g, '') // code blocks
            .replace(/`[^`]*`/g, '') // inline code
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
            .replace(/\[[^\]]*\]\([^)]*\)/g, '') // links
            .replace(/[#>*_\-]/g, '') // markdown symbols
            .replace(/\n+/g, ' ') // newlines
            .replace(/\s{2,}/g, ' ') // extra spaces
            .trim();
        const minLen = 300;
        const maxLen = 500;
        let preview = plainText.slice(0, maxLen);
        if (preview.length < plainText.length) {
            // ensure at least minLen but cut at last sentence boundary if possible
            if (preview.length < minLen && plainText.length > minLen) {
                preview = plainText.slice(0, minLen);
            }
            const lastPeriod = preview.lastIndexOf('.');
            if (lastPeriod > minLen * 0.6) {
                preview = preview.slice(0, lastPeriod + 1);
            }
            preview = preview.trim() + '…';
        }
        card.innerHTML = `
            <div class="aspect-w-4 aspect-h-3 bg-gray-200">
                <a href="project.html?slug=${encodeURIComponent(project.slug)}" aria-label="${project.title}">
                    <img src="${imageUrl}" alt="${project.title}" class="w-full h-64 object-cover hover:opacity-90 transition-opacity" loading="lazy">
                </a>
            </div>
            <div class="p-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-bronze font-medium">${year}</span>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">${this.getCategoryName(project.category)}</span>
                </div>
                <h3 class="font-display text-xl font-bold text-charcoal mb-2">
                    <a href="project.html?slug=${encodeURIComponent(project.slug)}" class="hover:text-bronze transition-colors">${project.title}</a>
                </h3>
                <p class="text-gray-600 text-sm leading-relaxed mb-4">${preview}</p>
                <a href="project.html?slug=${encodeURIComponent(project.slug)}" class="inline-block text-bronze text-sm font-medium hover:underline">Читать полностью →</a>
            </div>
        `;
        return card;
    }
    
    getCategoryName(category) {
        const categories = {
            'monuments': 'Памятник',
            'decorative': 'Декоративная',
            'interactive': 'Интерактивная'
        };
        return categories[category] || 'Скульптура';
    }
    
    filterProjects(filter) {
        if (filter === 'all') {
            this.filteredProjects = [...this.projects];
        } else {
            this.filteredProjects = this.projects.filter(project => 
                project.category === filter
            );
        }
        
        this.renderProjects();
    }
    
    updateFilterButtons(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }
    
    searchProjects(query) {
        if (!query.trim()) {
            this.filteredProjects = [...this.projects];
        } else {
            this.filteredProjects = this.projects.filter(project =>
                project.title.toLowerCase().includes(query.toLowerCase()) ||
                project.description.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        this.renderProjects();
    }
    
    renderAbout() {
        const aboutContent = document.getElementById('about-content');
        if (!aboutContent || !this.about.markdown) return;
        const doRender = () => {
            // Configure marked (basic)
            marked.setOptions({
                breaks: true,
                langPrefix: 'language-',
                mangle: false,
                headerIds: true
            });
            // Normalize markdown (ensure line breaks around headings & hr for correct parsing)
            const normalized = this.about.markdown
                .replace(/\r\n?/g, '\n')
                .replace(/^(#+)([^ #])/gm, (m, hashes, rest) => `${hashes} ${rest}`) // ensure space after #
                .replace(/---+/g, '\n---\n');
            const rawHtml = marked.parse(normalized);
            // Inject with basic styling wrappers
            aboutContent.innerHTML = `
                <div class="prose prose-invert max-w-none">
                    ${rawHtml}
                </div>`;
            // Tailwind 'prose' might not be available; add minimal styles dynamically
            this.ensureMarkdownStyles();
        };
        // If marked not loaded yet, load dynamically then render
        if (typeof window.marked === 'undefined') {
            const existing = document.querySelector('script[data-dynamic-marked]');
            if (existing) {
                existing.addEventListener('load', doRender, { once: true });
            } else {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
                script.defer = true;
                script.setAttribute('data-dynamic-marked', 'true');
                script.addEventListener('load', doRender, { once: true });
                script.addEventListener('error', () => {
                    console.error('Failed to load marked.js');
                    aboutContent.textContent = this.about.markdown; // fallback plain text
                }, { once: true });
                document.head.appendChild(script);
            }
        } else {
            doRender();
        }
        
        // Create timeline
        this.createTimeline();
    }

    ensureMarkdownStyles() {
        if (document.getElementById('markdown-styles')) return;
        const style = document.createElement('style');
        style.id = 'markdown-styles';
        style.textContent = `
            #about-content h1, #about-content h2, #about-content h3 { font-family: 'Playfair Display', serif; font-weight:700; margin-top:1.5em; margin-bottom:.75em; }
            #about-content h1 { font-size:2.25rem; }
            #about-content h2 { font-size:1.75rem; }
            #about-content h3 { font-size:1.5rem; }
            #about-content p { margin-bottom:1em; max-width:60ch; }
            #about-content strong { color:#CD7F32; }
            #about-content hr { border:0; border-top:2px solid #e5e7eb; margin:2rem 0; }
            #about-content ul, #about-content ol { padding-left:1.25rem; margin-bottom:1rem; list-style:disc; }
            #about-content blockquote { border-left:4px solid #CD7F32; padding-left:1rem; color:#4b5563; font-style:italic; }
            #about-content a { color:#b45309; text-decoration:underline; }
            #about-content img { max-width:100%; border-radius:.5rem; }
            @media (prefers-color-scheme: dark) { #about-content hr { border-color:#374151; } }
        `;
        document.head.appendChild(style);
    }
    
    createTimeline() {
        const timeline = document.getElementById('timeline');
        if (!timeline) return;
        const timelineData = [
            { year: '1946', event: 'Рождение в Москве' },
            { year: '1960-е', event: 'Обучение в изостудии Дворца культуры ЗИЛ' },
            { year: '1970-е', event: 'Работа во Всесоюзном производственном художественном комбинате' },
            { year: '2004', event: 'Открытие памятника барону Мюнхгаузену' },
            { year: '2007', event: 'Памятник Шерлоку Холмсу и доктору Ватсону' },
            { year: '2010-е', event: 'Создание серии памятников в разных городах России' }
        ];
        timeline.innerHTML = timelineData.map((item, index) => `
            <div class="timeline-item flex items-center mb-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}">
                <div class="flex-1 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}">
                    <div class="bg-white p-6 rounded-lg shadow-lg">
                        <h4 class="font-display text-xl font-bold text-bronze mb-2">${item.year}</h4>
                        <p class="text-gray-700">${item.event}</p>
                    </div>
                </div>
                <div class="w-4 h-4 bg-bronze rounded-full border-4 border-white shadow-lg z-10"></div>
                <div class="flex-1"></div>
            </div>
        `).join('');
    }
    
    setupLightbox() {
        this.lightboxImages = this.projects.flatMap(project => 
            project.images?.map(image => ({
                src: image,
                title: project.title,
                description: project.description
            })) || []
        );
    }
    
    openLightbox(project, index) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDescription = document.getElementById('lightbox-description');
        
        if (!lightbox || !project.images?.[0]) return;
        
        // Find the image index in the flattened array
        let imageIndex = 0;
        for (let i = 0; i < index; i++) {
            imageIndex += this.projects[i].images?.length || 0;
        }
        this.currentImageIndex = imageIndex;
        
        lightboxImage.src = project.images[0];
        lightboxTitle.textContent = project.title;
        lightboxDescription.textContent = project.description;
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Animate in
        anime({
            targets: lightbox,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }
    
    closeLightbox = () => {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) return;
        
        anime({
            targets: lightbox,
            opacity: [1, 0],
            duration: 300,
            easing: 'easeOutQuart',
            complete: () => {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    prevImage = () => {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
        this.updateLightboxImage();
    }
    
    nextImage = () => {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.lightboxImages.length;
        this.updateLightboxImage();
    }
    
    updateLightboxImage() {
        const image = this.lightboxImages[this.currentImageIndex];
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDescription = document.getElementById('lightbox-description');
        
        if (lightboxImage && image) {
            lightboxImage.src = image.src;
            lightboxTitle.textContent = image.title;
            lightboxDescription.textContent = image.description;
        }
    }
    
    handleKeyboard = (e) => {
        const lightbox = document.getElementById('lightbox');
        const isLightboxActive = lightbox && lightbox.classList.contains('active');
        
        if (isLightboxActive) {
            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.prevImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
            }
        }
    }
    
    handleContactForm = (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        
        // Simple validation
        if (!name || !email || !message) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Пожалуйста, введите корректный email', 'error');
            return;
        }
        
        // Create mailto link
        const subject = `Запрос от ${name} - Портфолио Андрея Орлова`;
        const body = `Имя: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AСообщение:%0D%0A${message}`;
        const mailtoLink = `mailto:contact@andreiorlov.ru?subject=${encodeURIComponent(subject)}&body=${body}`;
        
        window.location.href = mailtoLink;
        
        this.showNotification('Спасибо! Открыт email клиент для отправки сообщения.', 'success');
        e.target.reset();
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-24 right-6 z-50 px-6 py-4 rounded-lg shadow-lg text-white max-w-sm ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        anime({
            targets: notification,
            translateX: [300, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
        
        // Remove after 5 seconds
        setTimeout(() => {
            anime({
                targets: notification,
                translateX: [0, 300],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeOutQuart',
                complete: () => {
                    document.body.removeChild(notification);
                }
            });
        }, 5000);
    }
    
    setupAnimations() {
        // Hero text animation
        anime.timeline()
            .add({
                targets: '#hero-title',
                opacity: [0, 1],
                translateY: [50, 0],
                duration: 1000,
                easing: 'easeOutQuart'
            })
            .add({
                targets: '#hero-subtitle',
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 800,
                easing: 'easeOutQuart'
            }, '-=500');
        
        // Scroll animations
        this.observeElements();
    }
    
    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Animate timeline items
                    if (entry.target.classList.contains('timeline-item')) {
                        anime({
                            targets: entry.target,
                            opacity: [0, 1],
                            translateY: [30, 0],
                            duration: 600,
                            easing: 'easeOutQuart'
                        });
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.section, .timeline-item').forEach(el => {
            observer.observe(el);
        });
    }
    
    setupRouting() {
        // Handle hash changes
        window.addEventListener('hashchange', this.handleHashChange);
        
        // Handle initial hash
        if (window.location.hash) {
            this.handleHashChange();
        }
    }
    
    handleHashChange = () => {
        const hash = window.location.hash.substring(1) || 'home';
        this.navigateToSection(hash);
    }
    
    navigateToSection(section) {
        const element = document.getElementById(section);
        if (element) {
            const offsetTop = element.offsetTop - 80; // Account for fixed nav
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[href="#${section}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }
    
    handleScroll = () => {
        // Update active nav based on scroll position
        // Updated order: home, about, gallery, contact
        const sections = ['home', 'about', 'gallery', 'contact'];
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                const offsetTop = element.offsetTop;
                const height = element.offsetHeight;
                
                if (scrollPos >= offsetTop && scrollPos < offsetTop + height) {
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                    });
                    
                    const activeLink = document.querySelector(`[href="#${section}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active');
                    }
                }
            }
        });
    }
    
    toggleMobileMenu = () => {
        // Simple mobile menu toggle (could be expanded)
        alert('Mobile menu functionality - navigate using section links');
    }
}

// Utility function for smooth scrolling
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offsetTop = element.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when page is hidden
        anime.running.forEach(animation => animation.pause());
    } else {
        // Resume animations when page is visible
        anime.running.forEach(animation => animation.play());
    }
});