/* ===== Violet Gloss — Firebase Auth Module ===== */
/* This file is type="module" but uses DYNAMIC imports for Firebase.
   If Firebase CDN is blocked, this module fails gracefully —
   the site works fine without auth features (handled by app.js). */

(async function() {
    let app, auth;
    try {
        const fbApp = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js");
        const fbAuth = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js");

        const firebaseConfig = {
            apiKey: "AIzaSyBk8SHgxCOYjIrFkixIFAoy_BRpWsIUd7w",
            authDomain: "violet-gloss.firebaseapp.com",
            projectId: "violet-gloss",
            storageBucket: "violet-gloss.firebasestorage.app",
            messagingSenderId: "330589029963",
            appId: "1:330589029963:web:a4947df92909e6d045afce",
            measurementId: "G-BWF1MNFVBP"
        };
        app = fbApp.initializeApp(firebaseConfig);
        auth = fbAuth.getAuth(app);
    } catch(e) {
        console.warn('Firebase unavailable, auth features disabled:', e.message || e);
        return; // Exit — site works fine without Firebase
    }

    // SVG иконка профиля по умолчанию
    const defaultAvatarSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="white">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .66.54 1.2 1.2 1.2h16.8c.66 0 1.2-.54 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>`;

    function updateAuthUI(user) {
        const authContainer = document.getElementById('auth-buttons');
        const mobileUserBlock = document.getElementById('mobile-user-block');
        const mobileAuthButtons = document.getElementById('mobile-auth-buttons');
        if (!authContainer) return;

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
            const displayName = userName || userEmail.split('@')[0];
            const savedPhone = localStorage.getItem('vg-user-phone') || '';

            if (mobileUserBlock) {
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
            }
            if (mobileAuthButtons) {
                mobileAuthButtons.style.display = 'none';
            }

            // Загрузить данные из Firestore для имени/телефона
            try {
                import('https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js').then(({ getFirestore, doc, getDoc }) => {
                    const db = getFirestore(app);
                    getDoc(doc(db, 'users', user.uid)).then(userDoc => {
                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            const fullName = [data.name, data.surname].filter(Boolean).join(' ');
                            if (mobileUserBlock) {
                                const nameEl = mobileUserBlock.querySelector('.mobile-user-name');
                                const phoneEl = mobileUserBlock.querySelector('.mobile-user-phone');
                                if (nameEl && fullName) nameEl.textContent = fullName;
                                if (phoneEl && data.phone) {
                                    phoneEl.textContent = data.phone;
                                    localStorage.setItem('vg-user-phone', data.phone);
                                }
                            }
                        }
                    }).catch(() => {});
                }).catch(() => {});
            } catch(e) {}

        } else {
            // Десктоп: кнопки входа
            authContainer.innerHTML = `
                <a href="login.html" class="btn-secondary" style="padding: 10px 20px;" data-i18n="nav.login">Войти</a>
                <a href="register.html" class="btn-primary" style="padding: 10px 20px;" data-i18n="nav.register">Регистрация</a>
            `;

            // Мобильные кнопки вверху меню
            if (mobileAuthButtons) {
                mobileAuthButtons.innerHTML = `
                    <a href="login.html" class="btn-secondary" data-i18n="nav.login">Войти</a>
                    <a href="register.html" class="btn-primary" data-i18n="nav.register">Регистрация</a>
                `;
                mobileAuthButtons.style.display = 'flex';
            }
            if (mobileUserBlock) {
                mobileUserBlock.style.display = 'none';
            }

            // Re-apply language
            if (window.applyLanguage) {
                const savedLang = localStorage.getItem('vg-language');
                if (savedLang) window.applyLanguage(savedLang);
            }

            // Гостевые настройки по умолчанию (английский + светлая тема)
            if (localStorage.getItem('vg-theme') !== 'light') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('vg-theme', 'light');
            }
            if (localStorage.getItem('vg-language') !== 'en') {
                if (window.applyLanguage) {
                    window.applyLanguage('en');
                    localStorage.setItem('vg-language', 'en');
                }
            }
        }
    }

    // Listen for auth state changes
    const fbAuth2 = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js");
    fbAuth2.onAuthStateChanged(auth, updateAuthUI);
})();
