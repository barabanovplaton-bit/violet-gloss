import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBk8SHgxCOYjIrFkixIFAoy_BRpWsIUd7w",
    authDomain: "violet-gloss.firebaseapp.com",
    projectId: "violet-gloss",
    storageBucket: "violet-gloss.firebasestorage.app",
    messagingSenderId: "330589029963",
    appId: "1:330589029963:web:a4947df92909e6d045afce",
    measurementId: "G-BWF1MNFVBP"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ===== ТЕМА (сохранение в localStorage) ===== */
function initTheme() {
    const saved = localStorage.getItem('vg-theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (saved === 'light') {
        document.documentElement.removeAttribute('data-theme');
    } else if (saved === 'system') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
    // No saved theme = light (default, no data-theme attribute)
}
initTheme();

/* ===== ПРЕЛОАДЕР ===== */
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 500);
    }
});

/* ===== TOAST УВЕДОМЛЕНИЯ ===== */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ===== REVEAL / SCROLL АНИМАЦИИ (play once) ===== */
function initRevealAnimations() {
    // Legacy .reveal support
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
        const legacyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.15 });
        reveals.forEach(el => legacyObserver.observe(el));
    }

    // New .anim system with once-only and staggered children
    const animEls = document.querySelectorAll('.anim');
    if (!animEls.length) return;

    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                animObserver.unobserve(entry.target); // Play once only
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    animEls.forEach(el => animObserver.observe(el));

    // Auto-stagger children inside [data-anim-children] containers
    document.querySelectorAll('[data-anim-children]').forEach(container => {
        const type = container.dataset.animChildren || 'up'; // up, left, right, scale
        const children = container.children;
        Array.from(children).forEach((child, i) => {
            if (i >= 12) return; // max 12 stagger slots
            child.classList.add('anim', `anim-${type}`, `d${i + 1}`);
            animObserver.observe(child);
        });
    });
}

/* ===== КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК ===== */
function initCustomSelects() {
    // Find all native select elements that should be replaced
    const selects = document.querySelectorAll('select[data-vg-select], select:not([data-no-vg])');

    selects.forEach(select => {
        // Skip if already converted
        if (select.dataset.vgConverted === 'true') return;
        // Skip selects inside vg-select-dropdown (our own custom options)
        if (select.closest('.vg-select-dropdown')) return;
        // Skip hidden selects that already have a vg-select sibling
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('vg-select')) return;

        select.dataset.vgConverted = 'true';

        // Hide native select
        select.style.display = 'none';
        select.style.position = 'absolute';
        select.style.opacity = '0';
        select.style.pointerEvents = 'none';
        select.style.width = '0';
        select.style.height = '0';
        select.style.overflow = 'hidden';

        // Create custom wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'vg-select';
        if (select.id) wrapper.dataset.selectId = select.id;

        // Create trigger button
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'vg-select-trigger';

        const valueSpan = document.createElement('span');
        valueSpan.className = 'vg-select-value';
        const selectedOpt = select.options[select.selectedIndex];
        valueSpan.textContent = selectedOpt ? selectedOpt.textContent : '';

        const arrow = document.createElement('span');
        arrow.className = 'vg-select-arrow';
        arrow.innerHTML = '<svg viewBox="0 0 12 12" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 5l3 3 3-3"/></svg>';

        trigger.appendChild(valueSpan);
        trigger.appendChild(arrow);

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'vg-select-dropdown';

        function buildOptions() {
            dropdown.innerHTML = '';
            Array.from(select.options).forEach((option, idx) => {
                const optDiv = document.createElement('div');
                optDiv.className = 'vg-select-option';
                if (idx === select.selectedIndex) optDiv.classList.add('selected');
                optDiv.dataset.value = option.value;
                optDiv.textContent = option.textContent;

                optDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Update selected state
                    dropdown.querySelectorAll('.vg-select-option').forEach(o => o.classList.remove('selected'));
                    optDiv.classList.add('selected');
                    // Update value span
                    valueSpan.textContent = option.textContent;
                    // Update original select
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    // Close dropdown
                    wrapper.classList.remove('open');
                });

                dropdown.appendChild(optDiv);
            });
        }

        buildOptions();

        wrapper.appendChild(trigger);
        wrapper.appendChild(dropdown);

        // Insert after original select
        if (select.nextSibling) {
            select.parentNode.insertBefore(wrapper, select.nextSibling);
        } else {
            select.parentNode.appendChild(wrapper);
        }

        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close all other dropdowns
            document.querySelectorAll('.vg-select.open').forEach(s => {
                if (s !== wrapper) s.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        });

        // Listen for external changes to the select
        select.addEventListener('change', () => {
            const opt = select.options[select.selectedIndex];
            if (opt) {
                valueSpan.textContent = opt.textContent;
                dropdown.querySelectorAll('.vg-select-option').forEach(o => {
                    o.classList.toggle('selected', o.dataset.value === select.value);
                });
            }
        });

        // Watch for option additions (for dynamic selects like subcategories)
        const observer = new MutationObserver(() => {
            buildOptions();
            const opt = select.options[select.selectedIndex];
            if (opt) valueSpan.textContent = opt.textContent;
        });
        observer.observe(select, { childList: true });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.vg-select')) {
            document.querySelectorAll('.vg-select.open').forEach(s => s.classList.remove('open'));
        }
    });
}

// Re-initialize custom selects when new content is added
function refreshCustomSelects() {
    initCustomSelects();
}

/* ===== РЕНДЕР ШАПКИ ===== */
function renderHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    container.innerHTML = `
    <header class="header">
        <a href="index.html" class="logo">
            <span class="logo-full">Violet <span class="accent">Gloss</span></span>
            <span class="logo-mobile"><span class="char-v">V</span><span class="char-g">G</span></span>
        </a>
        <nav class="nav" id="main-nav">
            <button class="nav-close-btn" id="nav-close-btn" aria-label="Close menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <!-- Мобильный блок профиля (виден только когда пользователь вошёл) -->
            <div id="mobile-user-block" class="mobile-user-block" style="display:none;"></div>
            <!-- Мобильные кнопки авторизации (видны только когда пользователь НЕ вошёл) -->
            <div id="mobile-auth-buttons" class="mobile-auth-buttons" style="display:none;"></div>

            <div class="services-menu">
                <a href="services.html" class="nav-link services-trigger" data-i18n="nav.services">Услуги</a>
                <div class="mega-menu">
                    <div class="mega-col">
                        <h4 data-i18n="services.protection">Защита и оклейка</h4>
                        <ul>
                            <li><a href="wrapping.html"><span data-i18n="services.wrapping">Оклейка кузова</span><span class="service-desc" data-i18n="services.wrapping.desc">Винил / PPF</span></a></li>
                            <li><a href="tinting.html"><span data-i18n="services.tinting">Тонировка</span><span class="service-desc" data-i18n="services.tinting.desc">Атермальная плёнка</span></a></li>
                        </ul>
                    </div>
                    <div class="mega-col">
                        <h4 data-i18n="services.interior">Интерьер и уход</h4>
                        <ul>
                            <li><a href="starry-sky.html"><span data-i18n="services.starry">Звёздное небо</span><span class="service-desc" data-i18n="services.starry.desc">Оптоволокно</span></a></li>
                            <li><a href="leather-restoration.html"><span data-i18n="services.leather">Реставрация кожи</span><span class="service-desc" data-i18n="services.leather.desc">Перешив салона</span></a></li>
                            <li><a href="noise-isolation.html"><span data-i18n="services.noise">Шумоизоляция</span><span class="service-desc" data-i18n="services.noise.desc">Комфорт в салоне</span></a></li>
                        </ul>
                    </div>
                    <div class="mega-col">
                        <h4 data-i18n="services.autoservice">Автосервис</h4>
                        <ul>
                            <li><a href="auto-service.html"><span data-i18n="services.maintenance">Техобслуживание</span></a></li>
                            <li><a href="oil-change.html"><span data-i18n="services.oil">Замена масла</span><span class="service-desc" data-i18n="services.oil.desc">Все бренды</span></a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <a href="portfolio.html" class="nav-link" data-i18n="nav.portfolio">Портфолио</a>
            <a href="about.html" class="nav-link" data-i18n="nav.about">О нас</a>
            <a href="contacts.html" class="nav-link" data-i18n="nav.contacts">Контакты</a>
            <a href="reviews.html" class="nav-link" data-i18n="nav.reviews">Отзывы</a>
            <div id="auth-buttons" style="display: flex; gap: 10px; align-items: center;"></div>
        </nav>
        <button class="mobile-toggle" id="mobile-toggle" aria-label="Menu">
            <div class="burger-icon">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </button>
    </header>
    `;
    // Overlay removed — burger menu is now full-screen, no overlay needed

    const authContainer = document.getElementById('auth-buttons');
    const mobileUserBlock = document.getElementById('mobile-user-block');
    const mobileAuthButtons = document.getElementById('mobile-auth-buttons');

    // SVG иконка профиля по умолчанию
    const defaultAvatarSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="white">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .66.54 1.2 1.2 1.2h16.8c.66 0 1.2-.54 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>`;

    function updateAuthUI(user) {
        if (user) {
            const savedAvatar = localStorage.getItem('vg-avatar');
            const avatarContent = savedAvatar
                ? `<img src="${savedAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Avatar">`
                : defaultAvatarSvg;

            // Десктопный аватар
            authContainer.innerHTML = `
                <a href="profile.html" class="user-avatar" title="Профиль">
                    ${avatarContent}
                </a>
            `;

            // Мобильный блок профиля вверху меню
            const userName = user.displayName || '';
            const userEmail = user.email || '';
            // Попробуем загрузить имя из Firestore (отложенно)
            const displayName = userName || userEmail.split('@')[0];
            const savedPhone = localStorage.getItem('vg-user-phone') || '';

            mobileUserBlock.innerHTML = `
                <a href="profile.html" class="mobile-user-block-inner" style="display:flex;align-items:center;gap:14px;text-decoration:none;color:inherit;">
                    <div class="mobile-user-avatar">${avatarContent}</div>
                    <div class="mobile-user-info">
                        <div class="mobile-user-name">${displayName}</div>
                        ${savedPhone ? `<div class="mobile-user-phone">${savedPhone}</div>` : `<div class="mobile-user-phone">${userEmail}</div>`}
                    </div>
                </a>
            `;
            mobileUserBlock.style.display = 'block';
            mobileAuthButtons.style.display = 'none';

            // Загрузить данные из Firestore для имени/телефона
            import('https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js').then(({ getFirestore, doc, getDoc }) => {
                const db = getFirestore(app);
                getDoc(doc(db, 'users', user.uid)).then(userDoc => {
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        const fullName = [data.name, data.surname].filter(Boolean).join(' ');
                        const nameEl = mobileUserBlock.querySelector('.mobile-user-name');
                        const phoneEl = mobileUserBlock.querySelector('.mobile-user-phone');
                        if (nameEl && fullName) nameEl.textContent = fullName;
                        if (phoneEl && data.phone) {
                            phoneEl.textContent = data.phone;
                            localStorage.setItem('vg-user-phone', data.phone);
                        }
                    }
                }).catch(() => {});
            }).catch(() => {});

        } else {
            // Десктоп: кнопки входа
            authContainer.innerHTML = `
                <a href="login.html" class="btn-secondary" style="padding: 10px 20px;" data-i18n="nav.login">Войти</a>
                <a href="register.html" class="btn-primary" style="padding: 10px 20px;" data-i18n="nav.register">Регистрация</a>
            `;

            // Мобильные кнопки вверху меню
            mobileAuthButtons.innerHTML = `
                <a href="login.html" class="btn-secondary" data-i18n="nav.login">Войти</a>
                <a href="register.html" class="btn-primary" data-i18n="nav.register">Регистрация</a>
            `;
            mobileUserBlock.style.display = 'none';
            mobileAuthButtons.style.display = 'flex';

            // Re-apply language
            const savedLang = localStorage.getItem('vg-language');
            if (savedLang) applyLanguage(savedLang);
        }
    }

    onAuthStateChanged(auth, updateAuthUI);

    // ===== МОБИЛЬНОЕ МЕНЮ (slide-in справа, на весь экран, без overlay) =====
    const mobileToggle = document.getElementById('mobile-toggle');
    const mainNav = document.getElementById('main-nav');

    function openMenu() {
        mainNav.classList.add('nav-open');
        document.body.classList.add('no-scroll');
    }

    function closeMenu() {
        mainNav.classList.remove('nav-open');
        document.body.classList.remove('no-scroll');
    }

    if (mobileToggle && mainNav) {
        // Клик по бургеру — ТОЛЬКО открывает меню
        mobileToggle.addEventListener('click', () => {
            if (!mainNav.classList.contains('nav-open')) {
                openMenu();
            }
        });

        // Клик по крестику — закрывает
        const closeBtn = document.getElementById('nav-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeMenu);
        }

        // Закрыть меню при клике на любую ссылку внутри nav
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Свайп влево для закрытия — по ВСЕЙ области экрана
        let touchStartX = 0;
        let touchEndX = 0;
        document.addEventListener('touchstart', (e) => {
            if (mainNav.classList.contains('nav-open')) {
                touchStartX = e.changedTouches[0].screenX;
            }
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            if (mainNav.classList.contains('nav-open')) {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (diff > 60) closeMenu();
            }
        }, { passive: true });

        // При возврате на широкий экран убираем мобильные стили
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) closeMenu();
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mainNav.classList.contains('nav-open')) closeMenu();
        });
    }
}

/* ===== ЯЗЫК ИНТЕРФЕЙСА ===== */
const translations = {
    ru: {
        // Nav
        'nav.services': 'Услуги',
        'nav.portfolio': 'Портфолио',
        'nav.about': 'О нас',
        'nav.contacts': 'Контакты',
        'nav.reviews': 'Отзывы',
        'nav.login': 'Войти',
        'nav.register': 'Регистрация',
        // Services menu
        'services.protection': 'Защита и оклейка',
        'services.interior': 'Интерьер и уход',
        'services.autoservice': 'Автосервис',
        'services.wrapping': 'Оклейка кузова',
        'services.wrapping.desc': 'Винил / PPF',
        'services.tinting': 'Тонировка',
        'services.tinting.desc': 'Атермальная плёнка',
        'services.starry': 'Звёздное небо',
        'services.starry.desc': 'Оптоволокно',
        'services.leather': 'Реставрация кожи',
        'services.leather.desc': 'Перешив салона',
        'services.noise': 'Шумоизоляция',
        'services.noise.desc': 'Комфорт в салоне',
        'services.maintenance': 'Техобслуживание',
        'services.oil': 'Замена масла',
        'services.oil.desc': 'Все бренды',
        // Hero
        'hero.title': 'Премиальный детейлинг в сердце Дубая',
        'hero.subtitle': 'Защищаем и преображаем автомобили с 2017 года. Оклейка, тонировка, звёздное небо и полный спектр детейлинг-услуг.',
        'hero.btn.services': 'Наши услуги',
        'hero.btn.contact': 'Связаться с нами',
        // Footer
        'footer.desc': 'Премиальный детейлинг-центр в Дубае. Защищаем и преображаем автомобили с 2017 года.',
        'footer.services': 'Услуги',
        'footer.contacts': 'Контакты',
        'footer.hours': 'Пн–Сб: 9:00–21:00',
        'footer.rights': 'Все права защищены.',
        // Contacts page
        'contacts.title': 'Контакты',
        'contacts.subtitle': 'Свяжитесь с нами любым удобным способом',
        'contacts.address': 'Адрес',
        'contacts.address.value': 'Дубай, ОАЭAl Quoz Industrial Area 3',
        'contacts.phone': 'Телефон',
        'contacts.email': 'Email',
        'contacts.hours': 'Часы работы',
        'contacts.whatsapp': 'Написать в WhatsApp',
        'contacts.form.name': 'Ваше имя',
        'contacts.form.name.ph': 'Введите имя',
        'contacts.form.phone': 'Телефон',
        'contacts.form.email': 'Email',
        'contacts.form.service': 'Услуга',
        'contacts.form.service.ph': 'Выберите услугу',
        'contacts.form.message': 'Сообщение',
        'contacts.form.message.ph': 'Опишите ваши пожелания...',
        'contacts.form.submit': 'Отправить заявку',
        // Contact services
        'contact.svc.oil': 'Замена масла',
        'contact.svc.maintenance': 'Техобслуживание',
        'contact.svc.leather': 'Реставрация кожи',
        'contact.svc.tinting': 'Тонировка',
        'contact.svc.soundproofing': 'Шумоизоляция',
        'contact.svc.starry': 'Звёздное небо',
        'contact.svc.wrapping': 'Оклейка кузова',
        'contacts.form.service.placeholder': 'Выберите услугу',
        'contacts.form.service.oil-change': 'Замена масла',
        'contacts.form.service.maintenance': 'Техобслуживание',
        'contacts.form.service.leather-restoration': 'Реставрация кожи',
        'contacts.form.service.tinting': 'Тонировка',
        'contacts.form.service.soundproofing': 'Шумоизоляция',
        'contacts.form.service.starry-sky': 'Звёздное небо',
        'contacts.form.service.wrapping': 'Оклейка кузова',
        // About page
        'about.title': 'О нас',
        'about.subtitle': 'Ваш автомобиль заслуживает лучшего ухода',
        // Portfolio page
        'portfolio.title': 'Портфолио',
        'portfolio.subtitle': 'Результаты нашей работы говорят сами за себя',
        // Reviews page
        'reviews.title': 'Отзывы клиентов',
        'reviews.subtitle': 'Что говорят о нас наши клиенты',
        // Services page
        'services.title': 'Наши услуги',
        'services.subtitle': 'Полный спектр премиального детейлинга',
        // Profile
        'profile.settings': 'Настройки',
        'profile.account': 'Аккаунт',
        'profile.personalization': 'Персонализация',
        'profile.security': 'Безопасность',
        'profile.notifications': 'Уведомления',
        'profile.home': 'На главную',
        'profile.personal.data': 'Личные данные',
        'profile.name': 'Имя',
        'profile.surname': 'Фамилия',
        'profile.birthday': 'Дата рождения',
        'profile.phone': 'Телефон',
        'profile.save': 'Сохранить изменения',
        'profile.logout': 'Выйти из аккаунта',
        'profile.theme.title': 'Тема оформления',
        'profile.theme.light': 'Светлая',
        'profile.theme.dark': 'Тёмная',
        'profile.theme.system': 'Системная',
        'profile.language.title': 'Язык интерфейса',
        'profile.password.title': 'Смена пароля',
        'profile.password.current': 'Текущий пароль',
        'profile.password.new': 'Новый пароль',
        'profile.password.confirm': 'Подтвердите новый пароль',
        'profile.password.change': 'Сменить пароль',
        'profile.notif.title': 'Настройки уведомлений',
        'profile.notif.email': 'Email уведомления',
        'profile.notif.email.desc': 'Получать уведомления на почту',
        'profile.notif.sms': 'SMS уведомления',
        'profile.notif.sms.desc': 'Получать уведомления по SMS',
        'profile.notif.push': 'Push-уведомления',
        'profile.notif.push.desc': 'Получать push-уведомления в браузере',
        // Registration
        'reg.title': 'Создайте аккаунт',
        'reg.step.email': 'Далее',
        'reg.password': 'Пароль',
        'reg.password.ph': 'Минимум 6 символов',
        'reg.password.confirm': 'Подтвердите пароль',
        'reg.password.confirm.ph': 'Повторите пароль',
        'reg.name': 'Имя',
        'reg.name.ph': 'Ваше имя',
        'reg.surname': 'Фамилия',
        'reg.surname.ph': 'Ваша фамилия',
        'reg.birthday': 'Дата рождения',
        'reg.phone': 'Телефон',
        'reg.phone.ph': 'XX XXX XXXX',
        'reg.next': 'Далее',
        'reg.back': 'Назад',
        'reg.home': 'На главную',
        'reg.summary': 'Проверьте данные',
        'reg.submit': 'Зарегистрироваться',
        'reg.has.account': 'Уже есть аккаунт?',
        'reg.login': 'Войти',
        // Login
        'login.title': 'Войдите в свой аккаунт',
        'login.email': 'Email',
        'login.password': 'Пароль',
        'login.password.ph': 'Введите пароль',
        'login.submit': 'Войти',
        'login.google': 'Войти через Google',
        'login.or': 'или',
        'login.forgot': 'Забыли пароль?',
        'login.no.account': 'Нет аккаунта?',
        'login.register': 'Зарегистрироваться',
        'login.home': 'На главную',
        // Reset password
        'reset.title': 'Восстановление пароля',
        'reset.email': 'Email',
        'reset.email.ph': 'Введите ваш email',
        'reset.submit': 'Отправить ссылку',
        'reset.back': 'Вернуться к входу',
        'reset.home': 'На главную',
        // Misc
        'misc.day': 'День',
        'misc.month': 'Месяц',
        'misc.year': 'Год',
        'month.01': 'Январь',
        'month.02': 'Февраль',
        'month.03': 'Март',
        'month.04': 'Апрель',
        'month.05': 'Май',
        'month.06': 'Июнь',
        'month.07': 'Июль',
        'month.08': 'Август',
        'month.09': 'Сентябрь',
        'month.10': 'Октябрь',
        'month.11': 'Ноябрь',
        'month.12': 'Декабрь',
        // Service page titles
        'services.wrapping.page.title': 'Оклейка кузова',
        'services.tinting.page.title': 'Тонировка',
        'services.starrysky.page.title': 'Звёздное небо',
        'services.leather.page.title': 'Реставрация кожи',
        'services.noise.page.title': 'Шумоизоляция',
        'services.autoservice.page.title': 'Автосервис',
        'services.oilchange.page.title': 'Замена масла',
        // Validation messages
        'validation.emailRequired': 'Введите email',
        'validation.emailInvalid': 'Некорректный email',
        'validation.passwordRequired': 'Введите пароль',
        'validation.passwordMinLength': 'Пароль должен быть не менее 6 символов',
        'validation.passwordWeak': 'Пароль слишком простой',
        'validation.firstNameRequired': 'Введите имя',
        'validation.lastNameRequired': 'Введите фамилию',
        'validation.dobRequired': 'Укажите дату рождения',
        'validation.dobInvalid': 'Некорректная дата',
        'validation.phoneRequired': 'Введите номер телефона',
        'validation.phoneInvalid': 'Некорректный номер',
        'validation.codeRequired': 'Введите код',
        'validation.codeInvalid': 'Неверный код',
        // Firebase errors
        'error.userNotFound': 'Пользователь не найден',
        'error.wrongPassword': 'Неверный пароль',
        'error.invalidCredential': 'Неверные данные для входа',
        'error.invalidEmail': 'Некорректный email',
        'error.tooManyRequests': 'Слишком много попыток. Попробуйте позже',
        'error.userDisabled': 'Учётная запись заблокирована',
        'error.networkError': 'Ошибка сети',
        'error.emailAlreadyInUse': 'Этот email уже зарегистрирован',
        'error.weakPassword': 'Пароль слишком простой',
        'error.popupClosed': 'Окно авторизации было закрыто',
        'error.accountExists': 'Аккаунт уже существует с другим способом входа',
        // Button states
        'auth.signingIn': 'Вход...',
        'auth.signIn': 'Войти',
        'auth.registering': 'Регистрация...',
        'auth.register': 'Зарегистрироваться',
        'auth.sending': 'Отправка...',
        'auth.verifyEmailNote': 'Письмо с подтверждением отправлено. Проверьте почту (включая спам).',
        'validation.passwordConfirm': 'Подтвердите пароль',
        'validation.passwordMismatch': 'Пароли не совпадают',
        'validation.dobFull': 'Укажите полную дату рождения',
        // Process step
        'process.step.preparation': 'Подготовка',
        // Review authors (index page)
        'review.index.1.author': 'Алексей М.',
        'review.index.2.author': 'Андрей К.',
        'review.index.3.author': 'Ольга В.',
        'review.index.4.author': 'Иван С.',
        'review.index.5.author': 'Татьяна М.',
        'review.index.6.author': 'Павел Г.',
        // About certificates
        'about.cert.xpel': 'Сертифицированный установщик XPEL',
        'about.cert.stek': 'Официальный партнёр STEK',
        'about.cert.3m': 'Авторизованный детейлер 3M',
        'about.cert.suntek': 'Профессионал SunTek',
        // Contact subcategory
        'contact.sub.type': 'Выберите тип',
        'contact.sub.choose': 'Выберите',
        'contact.sub.wrapping.label': 'Тип плёнки',
        'contact.sub.wrapping.ppf': 'Гравийная плёнка (PPF)',
        'contact.sub.wrapping.vinyl': 'Виниловая плёнка',
        'contact.sub.wrapping.ceramic': 'Керамическое покрытие',
        'contact.sub.tinting.label': 'Тип тонировки',
        'contact.sub.tinting.athermal': 'Атермальная плёнка',
        'contact.sub.tinting.standard': 'Стандартная тонировка',
        'contact.sub.tinting.nano': 'Нанопокрытие',
        'contact.sub.starry.label': 'Вариант звёздного неба',
        'contact.sub.starry.standard': 'Стандарт (400 нитей)',
        'contact.sub.starry.premium': 'Премиум (800 нитей)',
        'contact.sub.starry.exclusive': 'Эксклюзив (с метеорами)',
        'contact.sub.leather.label': 'Тип работы',
        'contact.sub.leather.restoration': 'Реставрация кожи',
        'contact.sub.leather.retrim': 'Перешив салона',
        'contact.sub.leather.alcantara': 'Алькантара',
        // Pricing
        'pricing.concierge': 'Консьерж-сервис',
        'pricing.oil.standard': 'Стандарт',
        'pricing.oil.oil_change': 'Замена моторного масла',
        'pricing.oil.oil_filter': 'Замена масляного фильтра',
        'pricing.wrapping.ppf': 'PPF Премиум',
        'pricing.starry.premium': 'Премиум',
        // Partner descriptions
        'partner.suntek.tinting_desc': 'Высокотехнологичные защитные и тонировочные плёнки премиум-класса',
        // Reviews
        'review.leather.3': 'Полный перешив кожей Nappa — результат превзошёл все ожидания. Машина выглядит как новая, а может даже лучше!',
        // Profile page
        'profile.email_verify_title': 'Подтверждение email',
        'profile.email_verify_desc': 'Введите код из письма (тестовый код: 123456)',
        'profile.default_user': 'Пользователь',
        'profile.error.load': 'Ошибка загрузки данных профиля',
        'profile.error.code6': 'Введите 6-значный код',
        'profile.email_verified': 'Email успешно подтверждён!',
        'profile.error.wrong_code': 'Неверный код подтверждения',
        'profile.error.select_image': 'Выберите изображение',
        'profile.error.file_size': 'Размер файла не должен превышать 2 МБ',
        'profile.avatar.select_area': 'Выберите область аватара',
        'profile.avatar.zoom': 'Масштаб',
        'profile.avatar.updated': 'Аватар обновлён',
        'profile.avatar.error': 'Ошибка загрузки аватара',
        'profile.saving': 'Сохранение...',
        'profile.saved': 'Профиль сохранён',
        'profile.error.save': 'Ошибка сохранения профиля',
        'profile.error.logout': 'Ошибка при выходе',
        'profile.error.fill_all': 'Заполните все поля',
        'profile.error.password_min': 'Новый пароль должен содержать минимум 6 символов',
        'profile.error.password_mismatch': 'Пароли не совпадают',
        'profile.password_changed': 'Пароль успешно изменён',
        'profile.error.general': 'Ошибка: ',
        'profile.error.wrong_password': 'Неверный текущий пароль',
        'profile.error.weak_password': 'Новый пароль слишком простой',
        'profile.error.too_many_requests': 'Слишком много попыток. Попробуйте позже',
        'profile.error.recent_login': 'Требуется повторный вход. Выйдите и войдите снова',
        'profile.notifications.on': 'Уведомления включены',
        'profile.notifications.off': 'Уведомления отключены',
        'profile.error.settings_save': 'Ошибка сохранения настроек',
        // Register page - Countries
        'country.UAE': 'ОАЭ',
        'country.RU': 'Россия',
        'country.US': 'США',
        'country.GB': 'Великобритания',
        'country.DE': 'Германия',
        'country.FR': 'Франция',
        'country.UZ': 'Узбекистан',
        'country.KG': 'Кыргызстан',
        'country.TJ': 'Таджикистан',
        'country.TM': 'Туркменистан',
        'country.AZ': 'Азербайджан',
        'country.GE': 'Грузия',
        'country.UA': 'Украина',
        'country.BY': 'Беларусь',
        'country.LT': 'Литва',
        'country.LV': 'Латвия',
        'country.EE': 'Эстония',
        'country.TR': 'Турция',
        'country.SA': 'Саудовская Аравия',
        'country.QA': 'Катар',
        'country.KW': 'Кувейт',
        'country.OM': 'Оман',
        'country.BH': 'Бахрейн',
        // Register summary labels
        'reg.summary.email': 'Email',
        'reg.summary.name': 'Имя',
        'reg.summary.surname': 'Фамилия',
        'reg.summary.birthday': 'Дата рождения',
        'reg.summary.phone': 'Телефон',
        // Month genitive
        'month.gen.01': 'января',
        'month.gen.02': 'февраля',
        'month.gen.03': 'марта',
        'month.gen.04': 'апреля',
        'month.gen.05': 'мая',
        'month.gen.06': 'июня',
        'month.gen.07': 'июля',
        'month.gen.08': 'августа',
        'month.gen.09': 'сентября',
        'month.gen.10': 'октября',
        'month.gen.11': 'ноября',
        'month.gen.12': 'декабря',
        // Reset password page
        'reset.sending': 'Отправка...',
        'reset.error.general': 'Произошла ошибка. Попробуйте ещё раз.',
        'reset.error.user_not_found': 'Пользователь с таким email не найден',
        'reset.error.invalid_email': 'Некорректный email',
        // Reviews page
        'review.page.2026.3': 'Оклейка XPEL — безупречная работа. Ни одного пузырька, все края идеально подогнаны. Рекомендую!',
        'review.page.2025.4': 'Шумоизоляция и тонировка — в салоне стало значительно тише, тонировка идеально ровная. Спасибо команде!',
        'review.page.2024.4': 'Полный комплекс: оклейка, тонировка, шумоизоляция. За три года с плёнкой ни одной царапины. Лучшая инвестиция в защиту авто!',
        'review.page.2023.3': 'Тонировка и шумоизоляция — всё сделано быстро и качественно. Цена полностью соответствует результату.',
        // Existing keys missing from ru
        'about.mission': 'Наша миссия',
        'about.team': 'Наша команда',
        'services.tinting.title': 'Тонировка',
        'services.oil.title': 'Замена масла',
        'services.leather.title': 'Реставрация кожи',
        'services.noise.title': 'Шумоизоляция',
        'services.starry.title': 'Звёздное небо',
        'services.wrapping.title': 'Оклейка кузова',
        'services.maintenance.title': 'Техобслуживание',
        'pricing.title': 'Цены',
        'trust.title': 'Почему выбирают Violet Gloss',
        'trust.advantage': 'Наше преимущество',
        'process.how_we_work': 'Как мы работаем',
        'process.title': 'Как мы работаем',
        'partners.title': 'Наши партнёры и поставщики',
        'partners.subtitle2': 'Мы работаем только с лучшими мировыми брендами',
        'partners.title2': 'Наши партнёры',
        'reviews.clients': 'Отзывы клиентов',
        'map.title': 'Где нас найти',
        'map.zoom_hint': 'Используйте Ctrl + колёсико мыши для зума на карте'
    },
    en: {
        'nav.services': 'Services',
        'nav.portfolio': 'Portfolio',
        'nav.about': 'About',
        'nav.contacts': 'Contacts',
        'nav.reviews': 'Reviews',
        'nav.login': 'Sign In',
        'nav.register': 'Sign Up',
        'services.protection': 'Protection & Wrapping',
        'services.interior': 'Interior & Care',
        'services.autoservice': 'Auto Service',
        'services.wrapping': 'Body Wrapping',
        'services.wrapping.desc': 'Vinyl / PPF',
        'services.tinting': 'Tinting',
        'services.tinting.desc': 'Heat rejection film',
        'services.starry': 'Starry Sky',
        'services.starry.desc': 'Fiber optics',
        'services.leather': 'Leather Restoration',
        'services.leather.desc': 'Interior retrim',
        'services.noise': 'Soundproofing',
        'services.noise.desc': 'Cabin comfort',
        'services.maintenance': 'Maintenance',
        'services.oil': 'Oil Change',
        'services.oil.desc': 'All brands',
        'hero.title': 'Premium Detailing in the Heart of Dubai',
        'hero.subtitle': 'Protecting and transforming cars since 2017. Wrapping, tinting, starry sky and full range of detailing services.',
        'hero.btn.services': 'Our Services',
        'hero.btn.contact': 'Contact Us',
        'footer.desc': 'Premium detailing center in Dubai. Protecting and transforming cars since 2017.',
        'footer.services': 'Services',
        'footer.contacts': 'Contacts',
        'footer.hours': 'Mon–Sat: 9:00–21:00',
        'footer.rights': 'All rights reserved.',
        'contacts.title': 'Contacts',
        'contacts.subtitle': 'Reach us any way you prefer',
        'contacts.address': 'Address',
        'contacts.address.value': 'Dubai, UAEAl Quoz Industrial Area 3',
        'contacts.phone': 'Phone',
        'contacts.email': 'Email',
        'contacts.hours': 'Working Hours',
        'contacts.whatsapp': 'WhatsApp Us',
        'contacts.form.name': 'Your Name',
        'contacts.form.name.ph': 'Enter your name',
        'contacts.form.phone': 'Phone',
        'contacts.form.email': 'Email',
        'contacts.form.service': 'Service',
        'contacts.form.service.ph': 'Choose a service',
        'contacts.form.message': 'Message',
        'contacts.form.message.ph': 'Describe your wishes...',
        'contacts.form.submit': 'Send Request',
        'contact.svc.oil': 'Oil Change',
        'contact.svc.maintenance': 'Maintenance',
        'contact.svc.leather': 'Leather Restoration',
        'contact.svc.tinting': 'Tinting',
        'contact.svc.soundproofing': 'Soundproofing',
        'contact.svc.starry': 'Starry Sky',
        'contact.svc.wrapping': 'Body Wrapping',
        'contacts.form.service.placeholder': 'Choose a service',
        'contacts.form.service.oil-change': 'Oil Change',
        'contacts.form.service.maintenance': 'Maintenance',
        'contacts.form.service.leather-restoration': 'Leather Restoration',
        'contacts.form.service.tinting': 'Tinting',
        'contacts.form.service.soundproofing': 'Soundproofing',
        'contacts.form.service.starry-sky': 'Starry Sky',
        'contacts.form.service.wrapping': 'Body Wrapping',
        'about.title': 'About Us',
        'about.subtitle': 'Your car deserves the best care',
        'portfolio.title': 'Portfolio',
        'portfolio.subtitle': 'Our work speaks for itself',
        'reviews.title': 'Client Reviews',
        'reviews.subtitle': 'What our clients say about us',
        'services.title': 'Our Services',
        'services.subtitle': 'Full range of premium detailing',
        'profile.settings': 'Settings',
        'profile.account': 'Account',
        'profile.personalization': 'Personalization',
        'profile.security': 'Security',
        'profile.notifications': 'Notifications',
        'profile.home': 'Home',
        'profile.personal.data': 'Personal Data',
        'profile.name': 'Name',
        'profile.surname': 'Surname',
        'profile.birthday': 'Date of Birth',
        'profile.phone': 'Phone',
        'profile.save': 'Save Changes',
        'profile.logout': 'Log Out',
        'profile.theme.title': 'Theme',
        'profile.theme.light': 'Light',
        'profile.theme.dark': 'Dark',
        'profile.theme.system': 'System',
        'profile.language.title': 'Interface Language',
        'profile.password.title': 'Change Password',
        'profile.password.current': 'Current Password',
        'profile.password.new': 'New Password',
        'profile.password.confirm': 'Confirm New Password',
        'profile.password.change': 'Change Password',
        'profile.notif.title': 'Notification Settings',
        'profile.notif.email': 'Email Notifications',
        'profile.notif.email.desc': 'Receive email notifications',
        'profile.notif.sms': 'SMS Notifications',
        'profile.notif.sms.desc': 'Receive SMS notifications',
        'profile.notif.push': 'Push Notifications',
        'profile.notif.push.desc': 'Receive push notifications in browser',
        'reg.title': 'Create an Account',
        'reg.step.email': 'Next',
        'reg.password': 'Password',
        'reg.password.ph': 'Minimum 6 characters',
        'reg.password.confirm': 'Confirm Password',
        'reg.password.confirm.ph': 'Repeat password',
        'reg.name': 'Name',
        'reg.name.ph': 'Your name',
        'reg.surname': 'Surname',
        'reg.surname.ph': 'Your surname',
        'reg.birthday': 'Date of Birth',
        'reg.phone': 'Phone',
        'reg.phone.ph': 'XX XXX XXXX',
        'reg.next': 'Next',
        'reg.back': 'Back',
        'reg.home': 'Home',
        'reg.summary': 'Review Your Data',
        'reg.submit': 'Sign Up',
        'reg.has.account': 'Already have an account?',
        'reg.login': 'Sign In',
        'login.title': 'Sign In to Your Account',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.password.ph': 'Enter password',
        'login.submit': 'Sign In',
        'login.google': 'Sign in with Google',
        'login.or': 'or',
        'login.forgot': 'Forgot password?',
        'login.no.account': "Don't have an account?",
        'login.register': 'Sign Up',
        'login.home': 'Home',
        'reset.title': 'Password Recovery',
        'reset.email': 'Email',
        'reset.email.ph': 'Enter your email',
        'reset.submit': 'Send Link',
        'reset.back': 'Back to login',
        'reset.home': 'Home',
        'misc.day': 'Day',
        'misc.month': 'Month',
        'misc.year': 'Year',
        'month.01': 'January',
        'month.02': 'February',
        'month.03': 'March',
        'month.04': 'April',
        'month.05': 'May',
        'month.06': 'June',
        'month.07': 'July',
        'month.08': 'August',
        'month.09': 'September',
        'month.10': 'October',
        'month.11': 'November',
        'month.12': 'December',
        // Service page titles
        'services.wrapping.page.title': 'Body Wrapping',
        'services.tinting.page.title': 'Tinting',
        'services.starrysky.page.title': 'Starry Sky',
        'services.leather.page.title': 'Leather Restoration',
        'services.noise.page.title': 'Soundproofing',
        'services.autoservice.page.title': 'Auto Service',
        'services.oilchange.page.title': 'Oil Change',
        // Subtitles for service pages
        'services.wrapping.page.subtitle': 'Protective and decorative car wrapping. Preserve your car\'s perfect look for years.',
        'services.tinting.page.subtitle': 'Professional window tinting with Llumar, 3M, SunTek, XPEL. Bubble-free installation.',
        'services.starrysky.page.subtitle': 'Install a starry sky in your car ceiling with individual pattern, brightness and color temperature.',
        'services.leather.page.subtitle': 'Restore leather interior to like-new condition: cracks, scuffs, fading. Premium materials Alcantara, Nappa.',
        'services.noise.page.subtitle': 'Complete car soundproofing with world-leading materials. Reduce noise by up to 50%.',
        'services.autoservice.page.subtitle': 'Full vehicle maintenance: diagnostics, replacement of consumables, system checks using Bosch professional equipment.',
        'services.oilchange.page.subtitle': 'Fast and professional oil change using original filters and certified oils from top global brands.',
        // Validation messages
        'validation.emailRequired': 'Enter email',
        'validation.emailInvalid': 'Invalid email',
        'validation.passwordRequired': 'Enter password',
        'validation.passwordMinLength': 'Password must be at least 6 characters',
        'validation.passwordWeak': 'Password is too weak',
        'validation.firstNameRequired': 'Enter your first name',
        'validation.lastNameRequired': 'Enter your last name',
        'validation.dobRequired': 'Enter date of birth',
        'validation.dobInvalid': 'Invalid date',
        'validation.phoneRequired': 'Enter phone number',
        'validation.phoneInvalid': 'Invalid phone number',
        'validation.codeRequired': 'Enter code',
        'validation.codeInvalid': 'Invalid code',
        // Firebase errors
        'error.userNotFound': 'User not found',
        'error.wrongPassword': 'Wrong password',
        'error.invalidCredential': 'Invalid credentials',
        'error.invalidEmail': 'Invalid email',
        'error.tooManyRequests': 'Too many attempts. Try again later',
        'error.userDisabled': 'Account disabled',
        'error.networkError': 'Network error',
        'error.emailAlreadyInUse': 'This email is already registered',
        'error.weakPassword': 'Password is too weak',
        'error.popupClosed': 'Authorization popup was closed',
        'error.accountExists': 'Account already exists with different credential',
        // Button states
        'auth.signingIn': 'Signing in...',
        'auth.signIn': 'Sign In',
        'auth.registering': 'Registering...',
        'auth.register': 'Sign Up',
        'auth.sending': 'Sending...',
        'auth.verifyEmailNote': 'Verification email sent. Check your inbox (including spam).',
        'validation.passwordConfirm': 'Confirm password',
        'validation.passwordMismatch': 'Passwords do not match',
        'validation.dobFull': 'Please enter full date of birth',
        'about.certificates': 'Certificates & Awards',
        'about.mission_title': 'Our Mission',
        'about.our_story': 'Our Story',
        'about.team_title': 'Our Team',
        'avatar.crop_title': 'Select avatar area',
        'avatar.select_image': 'Select an image',
        'avatar.zoom': 'Zoom',
        'profile.email_verify_desc': 'Enter the code from the email (test code: 123456)',
        'profile.email_verify_title': 'Email Verification',
        'profile.password.confirm.ph': 'Repeat new password',
        'profile.password.current.ph': 'Enter current password',
        'profile.password.new.ph': 'Minimum 6 characters',
        'profile.password.note': 'To change your password, you must confirm your current password',
        'reset.success.desc': 'We have sent a password recovery instruction to your email. Check your inbox and Spam folder.',
        'reset.success.title': 'Email Sent!',
        'sms.desc': 'Enter the code from SMS (test code: 123456)',
        'sms.title': 'Phone Verification',
        'footer.copyright': '© 2026 Violet Gloss. All rights reserved.',
        '404.desc': 'Unfortunately, the requested page does not exist or has been moved. Return to the home page to continue.',
        '404.title': 'Page Not Found',
        'about.brief.desc': 'We don\'t just give cars a shine. We create a standard of premium service trusted by Dubai\'s government structures, exclusive car owners, and those who value perfection.',
        'about.brief.title2': 'Violet Gloss — More Than Detailing',
        'about.confidentiality': 'Confidentiality',
        'about.confidentiality.desc': 'Enclosed bays and a strict privacy policy guarantee the complete safety of your vehicle and personal data.',
        'about.paragraph2': 'Over 7 years, we have become the only detailing center trusted by the UAE government. Our masters are certified by the world\'s leading brands, and every project is a work of art.',
        'about.paragraph3': 'Today, Violet Gloss is 12 equipped bays, a team of 30+ professionals, and over 2000 satisfied clients. We continue to grow and improve, staying true to our principles: quality, confidentiality, and individual approach.',
        'about.punctuality': 'Punctuality',
        'about.punctuality.desc': 'We value your time and always complete work within the agreed deadlines. Concierge service for your convenience.',
        'about.quality': 'Quality',
        'about.quality.desc': 'We use only certified materials and advanced technologies to ensure a flawless result.',
        'about.role.ceo': 'Founder & CEO',
        'about.role.client_manager': 'Client Relations Manager',
        'about.role.interior': 'Interior Specialist',
        'about.role.wrapping': 'Head Wrapping Master',
        'about.team.alexey': 'Alexey Kozlov',
        'about.team.dmitry': 'Dmitry Morozov',
        'about.team.igor': 'Igor Smirnov',
        'about.team.maria': 'Maria Petrova',
        'badge.recommended': 'Recommended',
        'btn.apply': 'Apply',
        'btn.back_home': '← Home',
        'btn.calculate_price': 'Calculate Price',
        'btn.cancel': 'Cancel',
        'btn.choose': 'Choose',
        'btn.details': 'Learn More',
        'btn.home': 'Home',
        'btn.more_reviews': 'More Reviews',
        'btn.verify': 'Verify',
        'contact.form.success': 'Request sent! We will contact you shortly.',
        'contact.sub.choose': 'Choose',
        'contact.sub.leather.alcantara': 'Alcantara',
        'contact.sub.leather.label': 'Work Type',
        'contact.sub.leather.restoration': 'Leather Restoration',
        'contact.sub.leather.retrim': 'Interior Retrim',
        'contact.sub.starry.exclusive': 'Exclusive (with meteors)',
        'contact.sub.starry.label': 'Starry Sky Option',
        'contact.sub.starry.premium': 'Premium (800 strands)',
        'contact.sub.starry.standard': 'Standard (400 strands)',
        'contact.sub.tinting.athermal': 'Athermal Film',
        'contact.sub.tinting.label': 'Tinting Type',
        'contact.sub.tinting.nano': 'Nano Coating',
        'contact.sub.tinting.standard': 'Standard Tinting',
        'contact.sub.wrapping.ceramic': 'Ceramic Coating',
        'contact.sub.wrapping.label': 'Film Type',
        'contact.sub.wrapping.ppf': 'Gravel Film (PPF)',
        'contact.sub.wrapping.vinyl': 'Vinyl Film',
        'contacts.address.value2': 'Dubai, UAE<br>Al Quoz Industrial Area 3',
        'contacts.hours.value': 'Mon–Sat: 9:00–21:00<br>Sun: closed',
        'counter.bays': 'guarded bays',
        'counter.clients': 'happy clients',
        'counter.years': 'years of experience',
        'filter.all': 'All',
        'filter.autoservice': 'Auto Service',
        'filter.interior': 'Interior & Care',
        'filter.interior_portfolio': 'Interior',
        'filter.protection': 'Protection & Wrapping',
        'filter.tinting_portfolio': 'Tinting',
        'filter.wrapping': 'Wrapping',
        'footer.dubai': 'Dubai, UAE',
        'footer.service.leather': 'Leather Restoration',
        'footer.service.oil': 'Oil Change',
        'footer.service.soundproofing': 'Soundproofing',
        'footer.service.tinting': 'Tinting',
        'footer.service.wrapping': 'Body Wrapping',
        'map.zoom_hint': 'Use Ctrl + mouse wheel to zoom on the map',
        'partner.3m.desc': 'Vinyl films',
        'partner.3m.full_desc': 'Legendary brand with over 100 years of innovation history',
        'partner.alcantara.desc': 'Interior materials',
        'partner.alcantara.full_desc2': 'Italian premium material for exclusive car interior finishing',
        'partner.bosch.desc': 'Spare parts & filters',
        'partner.bosch.full_desc': 'Professional diagnostic equipment and spare parts for auto service',
        'partner.castrol.desc': 'Motor oils',
        'partner.castrol.full_desc': 'World leader in motor oil and lubricant manufacturing',
        'partner.colourlock.full_desc': 'Precision color matching and leather surface repair systems of any complexity',
        'partner.cosmic.full_desc': 'Innovative lighting solutions with a realistic starry sky effect',
        'partner.dynamat.desc': 'Premium soundproofing',
        'partner.dynamat.full_desc': 'American brand — world leader in vibration and sound insulation',
        'partner.fiberlight.full_desc': 'Premium fiber optic strands with high brightness and durability',
        'partner.hushmat.full_desc': 'Professional soundproofing solutions with thermal insulation properties',
        'partner.leatherique.full_desc': 'Professional compounds for leather restoration, cleaning, and conditioning',
        'partner.liquimoly.desc': 'Additives & auto chemicals',
        'partner.liquimoly.full_desc': 'German premium motor oils, additives, and auto chemicals',
        'partner.llumar.desc': 'Athermal films',
        'partner.llumar.full_desc': 'Premium tinting films with excellent UV and heat protection',
        'partner.lumina.full_desc': 'Lighting control systems with mobile app and RGB modes',
        'partner.mobil1.desc': 'Synthetic oils',
        'partner.mobil1.full_desc': 'Premium quality synthetic motor oils for maximum engine protection',
        'partner.nappa.full_desc': 'Soft and durable top-grade leather for premium car interior retrim',
        'partner.noico.full_desc': 'Affordable and effective soundproofing materials with excellent characteristics',
        'partner.shell.full_desc': 'One of the largest oil and gas companies with advanced lubricant technologies',
        'partner.starlight.full_desc': 'Specialized fiber optic systems for car ceilings',
        'partner.stek.desc': 'Polyurethane coatings',
        'partner.stek.full_desc': 'Innovative PPF films with nano-coating and self-healing',
        'partner.stp.desc': 'Soundproofing',
        'partner.stp.full_desc': 'Leading Russian manufacturer of automotive soundproofing materials',
        'partner.suntek.desc': 'Anti-gravel films',
        'partner.suntek.full_desc': 'High-tech premium protective and tinting films',
        'partner.xpel.desc': 'Protective films',
        'partner.xpel.full_desc': 'World leader in protective film manufacturing for vehicles',
        'partner.xpel.tinting_desc': 'World leader in protective and tinting film manufacturing',
        'partners.subtitle': 'We work only with trusted global brands, guaranteeing the quality of materials and work.',
        'partners.subtitle2': 'We work only with the best global brands',
        'partners.title2': 'Our Partners',
        'portfolio.interior.1.desc': 'Full interior retrim with Nappa leather and Alcantara. Custom stitching, preserving seat heating.',
        'portfolio.starry.1.desc': 'Starry sky installation with 800 fiber optic strands + shooting meteors. RGB lighting with remote.',
        'portfolio.starry.2.desc': 'Exclusive starry sky with constellation pattern. Over 600 strands, music synchronization.',
        'portfolio.tag.retrim': 'Interior Retrim',
        'portfolio.tag.starry': 'Starry Sky',
        'portfolio.tag.tinting': 'Tinting',
        'portfolio.tag.wrapping_ppf': 'PPF Wrapping',
        'portfolio.tag.wrapping_vinyl': 'Vinyl Wrapping',
        'portfolio.tinting.1.desc': 'Athermal tinting with Llumar Air 80. IR protection without darkening the windows.',
        'portfolio.wrapping.1.desc': 'Full body wrapping with XPEL Ultimate Plus polyurethane film. Protection against chips, sand, and UV.',
        'portfolio.wrapping.2.desc': 'Vinyl wrapping with 3M Gloss Flip Deep Space. Color-shift effect and deep texture.',
        'pricing.autoservice.basic': 'Basic Maintenance',
        'pricing.autoservice.basic.f1': 'Oil and oil filter replacement',
        'pricing.autoservice.basic.f2': 'Fluid level check',
        'pricing.autoservice.basic.f3': 'Visual suspension inspection',
        'pricing.autoservice.basic.f4': 'Brake pad check',
        'pricing.autoservice.complex_diag': 'Comprehensive Diagnostics',
        'pricing.autoservice.complex_diag.f1': 'Engine computer diagnostics',
        'pricing.autoservice.complex_diag.f2': 'Automatic transmission diagnostics',
        'pricing.autoservice.complex_diag.f3': 'Electrical systems check',
        'pricing.autoservice.complex_diag.f4': 'Full condition report',
        'pricing.autoservice.complex_diag.f5': 'Repair recommendations',
        'pricing.autoservice.computer_diag': 'Computer diagnostics',
        'pricing.autoservice.extended': 'Extended Maintenance',
        'pricing.autoservice.extended.f1': 'Everything from basic maintenance',
        'pricing.autoservice.extended.f4': 'Chassis inspection',
        'pricing.autoservice.extended.f5': 'Electrical system check',
        'pricing.autoservice.subtitle': 'Choose the best maintenance option for your vehicle',
        'pricing.concierge_vip': 'Concierge service + VIP bay',
        'pricing.leather.local': 'Local Repair',
        'pricing.leather.local.f1': 'Crack and scuff repair',
        'pricing.leather.local.f2': 'Color and texture matching',
        'pricing.leather.local.f3': 'Repair of one or two elements',
        'pricing.leather.restoration': 'Restoration',
        'pricing.leather.restoration.f1': 'Full leather color restoration',
        'pricing.leather.restoration.f2': 'Removal of all defects',
        'pricing.leather.restoration.f3': 'Treatment of all seats',
        'pricing.leather.restoration.f4': 'Protective coating',
        'pricing.leather.retrim': 'Full Retrim',
        'pricing.leather.retrim.f1': 'Complete seat upholstery replacement',
        'pricing.leather.retrim.f2': 'Premium Nappa leather / Alcantara',
        'pricing.leather.retrim.f3': 'Custom design and stitching',
        'pricing.leather.retrim.f4': 'Door cards and steering wheel retrim',
        'pricing.leather.retrim.f5': 'Protective coating + ceramic',
        'pricing.leather.subtitle': 'Choose the best restoration option for your vehicle',
        'pricing.noise.doors': 'Doors',
        'pricing.noise.doors.f1': 'Soundproofing of all doors',
        'pricing.noise.doors.f2': 'Vibration & sound insulation',
        'pricing.noise.doors.f3': 'StP / Noico materials',
        'pricing.noise.floor': 'Floor + Trunk',
        'pricing.noise.floor.f1': 'Floor and trunk soundproofing',
        'pricing.noise.floor.f2': 'Double layer of vibration insulation',
        'pricing.noise.floor.f3': 'StP / Dynamat materials',
        'pricing.noise.floor.f4': 'Maximum road noise reduction',
        'pricing.noise.full': 'Full Package',
        'pricing.noise.full.f1': 'Full vehicle soundproofing',
        'pricing.noise.full.f2': 'Doors, floor, trunk, ceiling',
        'pricing.noise.full.f3': 'Triple layer insulation',
        'pricing.noise.full.f4': 'Premium Dynamat / HushMat materials',
        'pricing.noise.full.f5': 'Noise reduction up to 50%',
        'pricing.noise.subtitle': 'Choose the best soundproofing option for your vehicle',
        'pricing.oil.all_filters': 'All filters replacement',
        'pricing.oil.brake_check': 'Brake system check',
        'pricing.oil.cabin_filter': 'Cabin filter replacement',
        'pricing.oil.economy': 'Economy',
        'pricing.oil.economy.f1': 'Engine oil change',
        'pricing.oil.economy.f2': 'Shell / Liqui Moly oil',
        'pricing.oil.fluid_check': 'Fluid level check',
        'pricing.oil.full_diagnostics': 'Full fluid diagnostics',
        'pricing.oil.oil_filter': 'Oil filter replacement',
        'pricing.oil.premium': 'Premium',
        'pricing.oil.premium.f2': 'Synthetic Mobil 1 / Castrol Edge oil',
        'pricing.oil.standard.f2': 'Castrol / Mobil 1 oil',
        'pricing.oil.subtitle': 'Choose the best oil change option for your vehicle',
        'pricing.oil.visual_inspection': 'Visual inspection',
        'pricing.starry.exclusive': 'Exclusive',
        'pricing.starry.exclusive.f1': 'Custom constellation pattern',
        'pricing.starry.exclusive.f2': 'Up to 1000+ light points',
        'pricing.starry.exclusive.f3': 'Smooth color and brightness change',
        'pricing.starry.exclusive.f4': 'Mobile app control',
        'pricing.starry.exclusive.f5': 'Shooting stars effect',
        'pricing.starry.premium.f1': 'Premium fiber optics',
        'pricing.starry.premium.f2': 'Up to 500 light points',
        'pricing.starry.premium.f3': 'Brightness control',
        'pricing.starry.premium.f4': 'Multiple color modes',
        'pricing.starry.standard': 'Standard',
        'pricing.starry.standard.f1': 'Fiber optic strands',
        'pricing.starry.standard.f2': 'Up to 200 light points',
        'pricing.starry.standard.f3': 'Single-color glow',
        'pricing.starry.subtitle': 'Choose the best starry sky option for your vehicle',
        'pricing.tinting.athermal': 'Athermal Comfort',
        'pricing.tinting.athermal.f1': 'Athermal tinting of all windows',
        'pricing.tinting.athermal.f2': 'Premium XPEL Prime film',
        'pricing.tinting.athermal.f4': 'Maximum heat protection',
        'pricing.tinting.athermal.f5': 'Cabin temperature reduction up to 40%',
        'pricing.tinting.premium': 'Premium',
        'pricing.tinting.premium.f1': 'All windows tinting',
        'pricing.tinting.premium.f2': 'XPEL / SunTek film',
        'pricing.tinting.premium.f4': 'UV & infrared protection',
        'pricing.tinting.standard': 'Standard',
        'pricing.tinting.standard.f1': 'Side window tinting',
        'pricing.tinting.standard.f2': 'Llumar / 3M film',
        'pricing.tinting.standard.f4': 'UV protection',
        'pricing.tinting.subtitle': 'Choose the best tinting option for your vehicle',
        'pricing.title': 'Pricing',
        'pricing.warranty_1': '1-year warranty',
        'pricing.warranty_2': '2-year warranty',
        'pricing.warranty_3': '3-year warranty',
        'pricing.warranty_5': '5-year warranty',
        'pricing.warranty_7': '7-year warranty',
        'pricing.wrapping.ppf.f1': 'Polyurethane protective film',
        'pricing.wrapping.ppf.f2': 'Full body wrapping',
        'pricing.wrapping.ppf.f4': 'Self-healing layer',
        'pricing.wrapping.ppf.f5': 'Chip & gravel protection',
        'pricing.wrapping.subtitle': 'Choose the best wrapping option for your vehicle',
        'pricing.wrapping.ultimate': 'Ultimate Full Body',
        'pricing.wrapping.ultimate.f1': 'Premium PPF + vinyl combination',
        'pricing.wrapping.ultimate.f2': 'Full wrapping including wheels',
        'pricing.wrapping.ultimate.f4': 'Free ceramic coating',
        'pricing.wrapping.ultimate.f5': 'Custom design',
        'pricing.wrapping.vinyl_optimal': 'Vinyl Optimal',
        'pricing.wrapping.vinyl_optimal.f1': 'Premium vinyl film',
        'pricing.wrapping.vinyl_optimal.f2': 'Full body wrapping',
        'pricing.wrapping.vinyl_optimal.f4': 'Scratch & UV protection',
        'pricing.wrapping.vinyl_standard': 'Vinyl Standard',
        'pricing.wrapping.vinyl_standard.f1': 'Decorative vinyl film',
        'pricing.wrapping.vinyl_standard.f2': 'Wrapping of main body elements',
        'pricing.wrapping.vinyl_standard.f4': 'Protection against minor scratches',
        'privacy.desc': 'We respect your privacy. The data you provide (name, email, phone) is used solely for booking services and contacting you. We do not share it with third parties. You can request deletion of your data by writing to info@violetgloss.ae.',
        'privacy.title': 'Privacy Policy',
        'process.autoservice.control.desc': 'Follow-up diagnostics, test drive, and quality check of completed work before client handover.',
        'process.autoservice.diagnostics': 'Diagnostics',
        'process.autoservice.diagnostics.desc': 'Computer diagnostics of all vehicle systems on professional Bosch equipment.',
        'process.autoservice.inspection.desc': 'Visual vehicle inspection, owner interview about issues, and work plan preparation.',
        'process.autoservice.repair': 'Repair / Maintenance',
        'process.autoservice.repair.desc': 'Performing necessary work: consumable replacement, unit and assembly repair per agreed plan.',
        'process.how_we_work': 'How We Work',
        'process.title': 'How We Work',
        'process.index.step1': 'Inspection & Consultation',
        'process.index.step1.desc': 'We assess the condition of the body and interior, select materials.',
        'process.index.step2.desc': 'Washing, degreasing, removal of parts.',
        'process.index.step3': 'Work in the Shop',
        'process.index.step3.desc': 'Wrapping, restoration or service — all in a sterile shop.',
        'process.index.step4': 'Quality Control & Delivery',
        'process.index.step4.desc': 'Final check under UV lamp, vehicle return.',
        'process.leather.control.desc': 'Final quality check, protective coating application, and client result inspection.',
        'process.leather.inspection.desc': 'Detailed leather interior condition assessment, scope determination, and material selection.',
        'process.leather.preparation.desc': 'Deep leather cleaning, old coating removal, and surface preparation for restoration.',
        'process.leather.work': 'Restoration / Retrim',
        'process.leather.work.desc': 'Color and texture restoration or full retrim using selected materials.',
        'process.noise.control.desc': 'Interior reassembly, test drive for result evaluation, and installation quality check.',
        'process.noise.inspection.desc': 'Noise level diagnostics, problem zone identification, and optimal material selection.',
        'process.noise.insulation': 'Insulation Application',
        'process.noise.insulation.desc': 'Multi-layer application of vibration, sound, and thermal insulation materials per specification.',
        'process.noise.preparation.desc': 'Partial removal of interior elements for access to body metal surfaces.',
        'process.oil.control.desc': 'Oil level check, engine start, pressure monitoring, and leak inspection.',
        'process.oil.drain': 'Drain Used Oil',
        'process.oil.drain.desc': 'Complete old oil drain, drain plug and magnetic washer inspection for metal shavings.',
        'process.oil.inspection.desc': 'Oil level and condition check, determining the required type and volume for your engine.',
        'process.oil.refill': 'Refill',
        'process.oil.refill.desc': 'Oil and other filters replacement, filling with new certified oil of exact volume.',
        'process.starry.control.desc': 'All light points functionality check, brightness and color mode setup, ceiling reassembly.',
        'process.starry.inspection.desc': 'Ceiling structure assessment, fiber optic type selection, and desired pattern discussion with the client.',
        'process.starry.installation': 'Fiber Optic Installation',
        'process.starry.installation.desc': 'Fiber optic strand installation per custom design, controller connection, and mode setup.',
        'process.starry.preparation.desc': 'Ceiling upholstery removal, surface preparation, and fiber optic installation point marking.',
        'process.step.control': 'Quality Control',
        'process.step.inspection': 'Inspection',
        'process.step.preparation': 'Preparation',
        'process.tinting.application': 'Tinting',
        'process.tinting.application.desc': 'Professional film application in a sterile bay with precise fitting to glass contour.',
        'process.tinting.control.desc': 'Final quality check, bubble-free verification, and uniformity inspection.',
        'process.tinting.inspection.desc': 'Glass condition check, light transmittance measurement, and optimal film selection.',
        'process.tinting.preparation.desc': 'Thorough cleaning and degreasing of glass for perfect tinting film adhesion.',
        'process.wrapping.application': 'Wrapping',
        'process.wrapping.application.desc': 'Professional film application in a sterile bay with temperature and humidity control.',
        'process.wrapping.control.desc': 'Final quality check, elimination of the smallest defects, and vehicle handover to the client.',
        'process.wrapping.inspection.desc': 'Detailed body inspection, paintwork condition assessment, and optimal film selection.',
        'process.wrapping.preparation.desc': 'Thorough washing, degreasing, and body surface preparation for perfect film adhesion.',
        'profile.avatar.change': 'Change',
        'profile.default_user': 'User',
        'profile.language.select': 'Select language',
        'review.autoservice.1': 'Extended maintenance on Mercedes — found a suspension issue the dealer missed. Professionalism at the highest level!',
        'review.autoservice.2': 'Comprehensive diagnostics before buying a used Range Rover. Identified hidden defects and helped save on repairs.',
        'review.autoservice.3': 'Basic maintenance done quickly and with quality. Would like more transparency in spare parts pricing, but overall satisfied.',
        'review.index.1': '"Best service in Dubai! Wrapped Range Rover with XPEL film — car looks brand new."',
        'review.index.2': '"Ordered full wrapping + ceramic. The guys are professionals, everything is spot on."',
        'review.index.3': '"Had detailing done before selling — car was picked up in 3 days, shining!"',
        'review.index.4': '"Soundproofing exceeded expectations, it\'s as quiet as a premium sedan inside!"',
        'review.index.5': '"Nappa leather interior retrim is a work of art."',
        'review.index.6': '"Oil change in 30 minutes with complimentary coffee — top-notch service."',
        'review.leather.1': 'Full Nappa leather retrim — the result exceeded all expectations. The car looks like new, or maybe even better!',
        'review.leather.2': 'Came for leather interior restoration. Masters are very attentive to details, excellent result. The only thing — had to wait a couple of days.',
        'review.noise.1': 'Full soundproofing and tinting. The cabin became significantly quieter, and the tinting is perfectly even. Thanks to the Violet Gloss team!',
        'review.noise.2': 'Had full soundproofing package on Escalade. Now I can listen to music on a completely different level — clean sound, no vibrations.',
        'review.noise.3': 'Door soundproofing — there\'s a difference, but expected more. For maximum effect, go with the full package.',
        'review.oil.1': 'Mobil 1 oil change — fast, professional, no queues. Concierge picked up and returned the car in a couple of hours. Convenient!',
        'review.oil.2': 'Regularly change oil here. Always original filters and oil, the mechanic shows the old oil condition. Honest service!',
        'review.oil.3': 'Good service, oil change with all filters replacement. A bit more expensive than regular service, but the quality is worth it.',
        'review.page.2019.1': 'One of the first Violet Gloss clients. Since then, I service all my cars only here. Consistently high quality!',
        'review.page.2019.2': 'Soundproofing and tinting. Good result, although had to wait due to workload. Overall satisfied.',
        'review.page.2021.1': 'Full package: wrapping, tinting, soundproofing. In three years with the film, not a single scratch. Best investment in car protection!',
        'review.page.2021.2': 'Leather restoration after 3 years of use — the interior looks better than new. True professionals!',
        'review.page.2022.1': 'XPEL film wrapping — perfect coating, every detail worked out to the millimeter. Very satisfied with the result!',
        'review.page.2022.2': 'Starry sky — incredible atmosphere in the cabin! Kids are thrilled, and I admire it every time. Thanks to the masters!',
        'review.page.2023.1': 'Tinting and soundproofing — everything done quickly and with quality. The price fully matches the result.',
        'review.page.2023.2': 'Oil change and maintenance. Professional approach, everything explained and shown. Will come back again.',
        'review.page.2024.1': 'Comprehensive detailing: wrapping, tinting, starry sky. All in one place with amazing quality. Best service in Dubai!',
        'review.page.2024.2': 'STEK film wrapping — excellent result. The guys know their craft 100%. The car looks like it\'s from a show!',
        'review.page.2024.3': 'Had soundproofing done for the family car. Now kids sleep peacefully on the road — road noise is almost inaudible. Huge thanks!',
        'review.page.2025.1': 'Full soundproofing and tinting. The cabin became significantly quieter, and the tinting is perfectly even. Thanks to the Violet Gloss team!',
        'review.page.2025.2': 'Leather restoration and starry sky — done as if for themselves. The leather looks brand new, and the ceiling is simply cosmic!',
        'review.page.2025.3': 'Came for leather interior restoration. Masters are very attentive to details, excellent result. The only thing — had to wait a couple of days.',
        'review.page.2026.1': 'XPEL film wrapped the entire body. Work done flawlessly — not a single bubble, all edges perfectly fitted. Recommended!',
        'review.page.2026.2': 'Had tinting and starry sky done. The result exceeded expectations! Concierge service at the highest level — picked up and returned the car on time.',
        'review.starry.1': 'Leather restoration and starry sky — done as if for themselves. The leather looks brand new, and the ceiling is simply cosmic!',
        'review.starry.2': 'Installed exclusive starry sky with an app. The kids are thrilled, and so am I! Controlling colors from a smartphone is something incredible.',
        'review.starry.3': 'Premium starry sky — looks stunning. The only note — would like more instructions on controlling the modes.',
        'review.tinting.1': 'Had tinting and starry sky done. The result exceeded expectations! Concierge service at the highest level — picked up and returned the car on time.',
        'review.tinting.2': 'Full athermal tinting. The cabin became significantly cooler, and the exterior look is just gorgeous. Thanks Violet Gloss!',
        'review.tinting.3': 'Excellent tinting quality, no bubbles or streaks. The only thing — had to wait a day due to workload. But the result is super!',
        'review.wrapping.1': 'XPEL film wrapped the entire Porsche body. Work done flawlessly — not a single bubble, all edges perfectly fitted. Recommended!',
        'review.wrapping.2': 'Had full PPF wrapping on Mercedes-AMG. After six months, the film is like new, not a single chip. Masters know their craft!',
        'review.wrapping.3': 'Carbon vinyl wrapping — looks amazing. The only thing, had to wait a couple of days due to queue. The result is worth it.',
        'reviews.clients': 'Client Reviews',
        'services.leather.title': 'Leather Restoration',
        'services.maintenance.desc': 'Honest auto service: oil change, diagnostics, chassis repair.',
        'services.maintenance.title': 'Maintenance',
        'services.noise.title': 'Soundproofing',
        'services.oil.title': 'Oil Change',
        'services.starry.title': 'Starry Sky',
        'services.wrapping.title': 'Body Wrapping',
        'terms.desc': 'The Violet Gloss website provides information about detailing and auto service. By booking through the website, you agree to the processing of personal data according to the Privacy Policy. We reserve the right to change the terms, notifying users through the website.',
        'terms.title': 'Terms of Use',
        'trust.advantage': 'Our Advantage',
        'trust.closed_boxes': 'Enclosed Sterile Bays',
        'trust.closed_boxes.desc': 'Full confidentiality and security of your vehicle in an individual enclosed sterile bay during all work.',
        'trust.closed_boxes.desc.index': 'Each vehicle is stored in a guarded room with air filtration — no dust, no prying eyes.',
        'trust.concierge': 'Concierge Service',
        'trust.concierge.desc': 'We pick up and deliver your vehicle at a convenient time and place. You don\'t need to go anywhere — we\'ll do everything for you.',
        'trust.concierge.desc.index': 'We will pick up your car from anywhere in Dubai, provide a replacement vehicle, and return it with a full report.',
        'trust.masters.desc.index': 'Our specialists have worked with premium brands in Europe and Asia, knowing everything about materials and technologies.',
        'trust.masters_7': '7+ Year Masters',
        'trust.masters_7.desc': 'Our specialists have over 7 years of experience and certification from the world\'s leading detailing industry brands.',
        'trust.masters_7_plus': 'Masters with 7+ Years Experience',
        // Review authors (index page)
        'review.index.1.author': 'Alexey M.',
        'review.index.2.author': 'Andrey K.',
        'review.index.3.author': 'Olga V.',
        'review.index.4.author': 'Ivan S.',
        'review.index.5.author': 'Tatyana M.',
        'review.index.6.author': 'Pavel G.',
        // About certificates
        'about.cert.xpel': 'XPEL Certified Installer',
        'about.cert.stek': 'STEK Official Partner',
        'about.cert.3m': '3M Approved Detailer',
        'about.cert.suntek': 'SunTek Professional',
        // Contact subcategory
        'contact.sub.type': 'Choose type',
        // Pricing
        'pricing.concierge': 'Concierge service',
        'pricing.oil.standard': 'Standard',
        'pricing.oil.oil_change': 'Engine oil change',
        'pricing.oil.oil_filter': 'Oil filter replacement',
        'pricing.wrapping.ppf': 'PPF Premium',
        'pricing.starry.premium': 'Premium',
        // Partner descriptions
        'partner.suntek.tinting_desc': 'High-tech premium protective and tinting films',
        // Reviews
        'review.leather.3': 'Full Nappa leather retrim — the result exceeded all expectations. The car looks like new, or maybe even better!',
        // Profile page
        'profile.error.load': 'Error loading profile data',
        'profile.error.code6': 'Enter 6-digit code',
        'profile.email_verified': 'Email successfully verified!',
        'profile.error.wrong_code': 'Wrong verification code',
        'profile.error.select_image': 'Select an image',
        'profile.error.file_size': 'File size must not exceed 2 MB',
        'profile.avatar.select_area': 'Select avatar area',
        'profile.avatar.zoom': 'Zoom',
        'profile.avatar.updated': 'Avatar updated',
        'profile.avatar.error': 'Avatar upload error',
        'profile.saving': 'Saving...',
        'profile.saved': 'Profile saved',
        'profile.error.save': 'Error saving profile',
        'profile.error.logout': 'Error logging out',
        'profile.error.fill_all': 'Fill in all fields',
        'profile.error.password_min': 'New password must be at least 6 characters',
        'profile.error.password_mismatch': 'Passwords do not match',
        'profile.password_changed': 'Password changed successfully',
        'profile.error.general': 'Error: ',
        'profile.error.wrong_password': 'Wrong current password',
        'profile.error.weak_password': 'New password is too weak',
        'profile.error.too_many_requests': 'Too many attempts. Try again later',
        'profile.error.recent_login': 'Recent login required. Please sign out and sign in again',
        'profile.notifications.on': 'Notifications enabled',
        'profile.notifications.off': 'Notifications disabled',
        'profile.error.settings_save': 'Error saving settings',
        // Register page - Countries
        'country.UAE': 'UAE',
        'country.RU': 'Russia',
        'country.US': 'USA',
        'country.GB': 'United Kingdom',
        'country.DE': 'Germany',
        'country.FR': 'France',
        'country.UZ': 'Uzbekistan',
        'country.KG': 'Kyrgyzstan',
        'country.TJ': 'Tajikistan',
        'country.TM': 'Turkmenistan',
        'country.AZ': 'Azerbaijan',
        'country.GE': 'Georgia',
        'country.UA': 'Ukraine',
        'country.BY': 'Belarus',
        'country.LT': 'Lithuania',
        'country.LV': 'Latvia',
        'country.EE': 'Estonia',
        'country.TR': 'Turkey',
        'country.SA': 'Saudi Arabia',
        'country.QA': 'Qatar',
        'country.KW': 'Kuwait',
        'country.OM': 'Oman',
        'country.BH': 'Bahrain',
        // Register summary labels
        'reg.summary.email': 'Email',
        'reg.summary.name': 'Name',
        'reg.summary.surname': 'Surname',
        'reg.summary.birthday': 'Date of Birth',
        'reg.summary.phone': 'Phone',
        // Month genitive
        'month.gen.01': 'January',
        'month.gen.02': 'February',
        'month.gen.03': 'March',
        'month.gen.04': 'April',
        'month.gen.05': 'May',
        'month.gen.06': 'June',
        'month.gen.07': 'July',
        'month.gen.08': 'August',
        'month.gen.09': 'September',
        'month.gen.10': 'October',
        'month.gen.11': 'November',
        'month.gen.12': 'December',
        // Reset password page
        'reset.sending': 'Sending...',
        'reset.error.general': 'An error occurred. Please try again.',
        'reset.error.user_not_found': 'User with this email not found',
        'reset.error.invalid_email': 'Invalid email',
        // Reviews page
        'review.page.2026.3': 'XPEL wrapping — flawless work. Not a single bubble, all edges perfectly fitted. Recommended!',
        'review.page.2025.4': 'Soundproofing and tinting — the cabin became significantly quieter, tinting is perfectly even. Thanks to the team!',
        'review.page.2024.4': 'Full package: wrapping, tinting, soundproofing. In three years with the film, not a single scratch. Best investment in car protection!',
        'review.page.2023.3': 'Tinting and soundproofing — everything done quickly and with quality. The price fully matches the result.',
        // Existing keys missing from en
        'about.mission': 'Our Mission',
        'about.team': 'Our Team',
        'services.tinting.title': 'Tinting',
        'trust.title': 'Why Choose Violet Gloss',
        'partners.title': 'Our Partners & Suppliers',
        'map.title': 'Where to Find Us'
    },
    
};

function applyLanguage(lang) {
    const t = translations[lang] || translations.en;

    // Update ALL data-i18n elements across the page
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Update placeholders with data-i18n-ph
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });

    // Update native select options that have data-i18n attributes
    document.querySelectorAll('select option[data-i18n]').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (t[key]) {
            opt.textContent = t[key];
        }
    });

    // Refresh custom selects to reflect updated text
    document.querySelectorAll('.vg-select').forEach(vs => {
        const selectId = vs.dataset.selectId;
        if (selectId) {
            const nativeSelect = document.getElementById(selectId);
            if (nativeSelect) {
                const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
                const valueSpan = vs.querySelector('.vg-select-value');
                if (valueSpan && selectedOpt) {
                    valueSpan.textContent = selectedOpt.textContent;
                }
                // Rebuild options in the custom dropdown
                const dropdown = vs.querySelector('.vg-select-dropdown');
                if (dropdown) {
                    dropdown.querySelectorAll('.vg-select-option').forEach((optDiv, idx) => {
                        if (nativeSelect.options[idx]) {
                            optDiv.textContent = nativeSelect.options[idx].textContent;
                        }
                    });
                }
            }
        }
    });

    // Save preference
    localStorage.setItem('vg-language', lang);

    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

function initLanguage() {
    const saved = localStorage.getItem('vg-language') || 'ru';
    applyLanguage(saved);
}

document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    initRevealAnimations();
    initLanguage();
    // Initialize custom selects after a small delay to let dynamic content load
    setTimeout(() => {
        initCustomSelects();
    }, 100);
});

/* ===== GLOBAL EXPORTS ===== */
window.applyLanguage = applyLanguage;
window.initLanguage = initLanguage;
window.initCustomSelects = initCustomSelects;
window.refreshCustomSelects = refreshCustomSelects;

// Translation helper — returns translated string for current language
window.t = function(key) {
    const lang = localStorage.getItem('vg-language') || 'ru';
    const t = translations[lang] || translations.en;
    return t[key] || key;
};
function setDefaultGuestSettings() {
    // Установить светлую тему (удалить атрибут data-theme)
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('vg-theme', 'light');
    
    // Установить английский язык
    applyLanguage('en');
    localStorage.setItem('vg-language', 'en');
}
// Гостевые настройки по умолчанию (английский + светлая тема)
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Гость: если текущая тема не светлая – сбросить
        if (localStorage.getItem('vg-theme') !== 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('vg-theme', 'light');
        }
        // Гость: если текущий язык не английский – сбросить
        if (localStorage.getItem('vg-language') !== 'en') {
            applyLanguage('en');
            localStorage.setItem('vg-language', 'en');
        }
    } else {
        // Пользователь вошёл – ничего не делаем, настройки загрузятся из профиля
        // Но на всякий случай синхронизируем тему и язык из localStorage
        initTheme();
        initLanguage();
    }
});
document.getElementById('form-step-4').addEventListener('submit', (e) => {
    e.preventDefault();
    const phoneInput = document.getElementById('reg-phone');
    const rawPhone = phoneInput.value;
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 15) {
        const group = phoneInput.closest('.form-group');
        group.classList.add('error');
        let msg = group.querySelector('.error-message');
        if (!msg) {
            msg = document.createElement('span');
            msg.className = 'error-message';
            group.appendChild(msg);
        }
        msg.textContent = window.t ? window.t('validation.phoneInvalid') : 'Некорректный номер телефона';
        return;
    }
    regData.countryCode = document.getElementById('reg-country-code').value;
    regData.phone = digits;
    goToStep(5);
});


/* ===== ДУБЛИРОВАННЫЙ ОБРАБОТЧИК БУРГЕРА ===== */
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('mobile-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('nav-open');
            document.body.style.overflow = nav.classList.contains('nav-open') ? 'hidden' : '';
        });
    }
});
