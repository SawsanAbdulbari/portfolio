// Current language (default: English; localStorage overrides)
let currentLanguage = 'en';

/** Set while project modal is open; used to re-render content after switchLanguage */
let projectModalLastDetailsButton = null;
/** Assigned in initializeModals — re-runs openProjectDetails with last button */
let refreshProjectModalContent = null;

const THEME_STORAGE_KEY = 'theme';

let skillsChartInstance = null;
let skillsChartReady = false;

// Language switching function
function switchLanguage(lang) {
    if (typeof translations === 'undefined') {
        console.warn('translations.js failed to load; language UI skipped.');
        return;
    }

    currentLanguage = lang;

    const langLabel = document.getElementById('lang-current-label');
    if (langLabel) {
        langLabel.textContent = lang === 'fi' ? 'FI' : lang === 'en' ? 'EN' : 'AR';
    }
    document.querySelectorAll('.lang-option').forEach((opt) => {
        const isSel = opt.getAttribute('data-lang') === lang;
        opt.classList.toggle('active', isSel);
        opt.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });
    const langToggle = document.getElementById('lang-dropdown-toggle');
    if (langToggle) langToggle.classList.add('active');

    closeLanguageDropdown();

    // Update HTML lang + text direction (Arabic RTL)
    document.documentElement.lang = lang === 'ar' ? 'ar' : lang === 'fi' ? 'fi' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Update all translatable elements
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            const text = translations[lang][key];
            const tag = element.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        }
    });

    document.querySelectorAll('[data-aria-key]').forEach(element => {
        const key = element.getAttribute('data-aria-key');
        if (translations[lang] && translations[lang][key]) {
            element.setAttribute('aria-label', translations[lang][key]);
        }
    });
    
    // Store language preference
    localStorage.setItem('preferred-language', lang);
    
    // Refresh skills chart after first paint (lazy init)
    if (typeof Chart !== 'undefined' && skillsChartReady) {
        initializeSkillsChart();
    }

    // Rebuild project modal copy if it is open (stories, labels, demo/repo text)
    if (typeof refreshProjectModalContent === 'function' && projectModalLastDetailsButton) {
        const pm = document.getElementById('project-modal');
        if (pm && pm.classList.contains('active')) {
            refreshProjectModalContent();
        }
    }
}

function resolveTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
        return stored;
    }
    return 'dark';
}

function initializeSkillsChart() {
    const canvas = document.getElementById('skillsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const prefersReducedMotion =
        typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const textColor = isDark ? '#e8f4fd' : '#2c3e50';
    const gridColor = isDark ? 'rgba(232, 244, 253, 0.1)' : 'rgba(44, 62, 80, 0.1)';
    
    const L = translations[currentLanguage] || translations.en;
    const isRtl = document.documentElement.dir === 'rtl';
    const labelFontFamily = isRtl ? "'Noto Sans Arabic', sans-serif" : 'Inter';
    const data = {
        labels: [
            L['skills-ml'] || 'Machine Learning',
            L['skills-data'] || 'Data Science',
            L['skills-leadership'] || 'Leadership',
            L['skills-business'] || 'Business'
        ],
        datasets: [{
            label: L['skills-chart-level'] || 'Expertise Level',
            data: [80, 85, 80, 90],
            fill: true,
            backgroundColor: isDark ? 'rgba(243, 156, 18, 0.22)' : 'rgba(243, 156, 18, 0.2)',
            borderColor: '#f39c12',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#f39c12',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#f39c12'
        }]
    };

    if (skillsChartInstance) {
        skillsChartInstance.destroy();
    }

    skillsChartInstance = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            animation: {
                duration: prefersReducedMotion ? 0 : 1100,
                easing: 'easeOutQuart'
            },
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: {
                        color: textColor,
                        font: { size: 13, weight: '600', family: labelFontFamily },
                        padding: 8
                    },
                    ticks: {
                        display: false,
                        stepSize: 20
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(44, 62, 80, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 10,
                    displayColors: false,
                    callbacks: {
                        title(items) {
                            return items[0]?.label || '';
                        },
                        label(ctx) {
                            const v = ctx.parsed.r != null ? ctx.parsed.r : ctx.raw;
                            return `${v}%`;
                        }
                    }
                }
            }
        }
    });
    skillsChartReady = true;
}

function initializeSkillsChartWhenVisible() {
    const viz = document.querySelector('.skills-viz');
    const canvas = document.getElementById('skillsChart');
    if (!viz || !canvas) return;

    const run = () => {
        if (!skillsChartReady) {
            initializeSkillsChart();
        }
    };

    const rect = viz.getBoundingClientRect();
    const inView = rect.top < window.innerHeight + 120 && rect.bottom > -80;
    if (inView) {
        run();
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    run();
                    observer.disconnect();
                }
            });
        },
        { threshold: 0.08, rootMargin: '0px 0px 100px 0px' }
    );
    observer.observe(viz);
}

// Particle Background for Hero
async function initializeHeroParticles() {
    if (typeof tsParticles === 'undefined' || !document.getElementById('hero-particles')) return;
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const color = isDark ? '#ffffff' : '#2c3e50';
    
    await tsParticles.load("hero-particles", {
        fpsLimit: 60,
        particles: {
            number: {
                value: 80,
                density: { enable: true, area: 800 }
            },
            color: { value: color },
            shape: { type: "circle" },
            opacity: {
                value: 0.3,
                random: false
            },
            size: {
                value: { min: 1, max: 3 },
                random: true
            },
            links: {
                enable: true,
                distance: 150,
                color: color,
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 1,
                direction: "none",
                random: false,
                straight: false,
                outModes: { default: "out" }
            }
        },
        interactivity: {
            events: {
                onHover: { enable: true, mode: "grab" },
                resize: true
            },
            modes: {
                grab: { distance: 140, links: { opacity: 0.5 } }
            }
        },
        detectRetina: true
    });
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    } else {
        root.removeAttribute('data-theme');
    }
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        const icon = btn.querySelector('i');
        if (theme === 'dark') {
            if (icon) icon.className = 'fas fa-sun';
            btn.setAttribute('aria-label', 'Switch to light mode');
        } else {
            if (icon) icon.className = 'fas fa-moon';
            btn.setAttribute('aria-label', 'Switch to dark mode');
        }
    }
    if (typeof Chart !== 'undefined' && skillsChartReady) {
        initializeSkillsChart();
    }
    // Refresh particles on theme change
    initializeHeroParticles();
}

function initializeTheme() {
    applyTheme(resolveTheme());
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_STORAGE_KEY, next);
        applyTheme(next);
    });
}

function closeLanguageDropdown() {
    const menu = document.getElementById('lang-menu');
    const toggle = document.getElementById('lang-dropdown-toggle');
    const dropdown = document.getElementById('lang-dropdown');
    if (menu) menu.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (dropdown) dropdown.classList.remove('is-open');
}

function initializeLanguageDropdown() {
    const dropdown = document.getElementById('lang-dropdown');
    const toggle = document.getElementById('lang-dropdown-toggle');
    const menu = document.getElementById('lang-menu');
    if (!dropdown || !toggle || !menu) return;

    function openMenu() {
        menu.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        dropdown.classList.add('is-open');
    }

    function toggleMenu(e) {
        if (e) e.stopPropagation();
        if (menu.hidden) openMenu();
        else closeLanguageDropdown();
    }

    toggle.addEventListener('click', toggleMenu);

    menu.querySelectorAll('.lang-option').forEach((opt) => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = opt.getAttribute('data-lang');
            if (lang) switchLanguage(lang);
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) closeLanguageDropdown();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.hidden) closeLanguageDropdown();
    });
}

// Initialize language on page load
function initializeLanguage() {
    // Check for stored language preference, default to Finnish
    const storedLang = localStorage.getItem('preferred-language') || 'en';
    switchLanguage(storedLang);
}

const PROJECT_IMAGE_PLACEHOLDER = 'images/placeholder.svg';

/** When a project screenshot is missing (404), show a neutral branded placeholder. */
function initializeProjectImageFallbacks() {
    document.querySelectorAll('.project-image img[src]').forEach((img) => {
        img.addEventListener('error', function onImageError() {
            this.removeEventListener('error', onImageError);
            if (this.getAttribute('data-fallback-tried') === '1') return;
            this.setAttribute('data-fallback-tried', '1');
            this.src = PROJECT_IMAGE_PLACEHOLDER;
        });
    });
}

// Mobile navigation toggle
function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    const toggleMenu = () => {
        const isActive = navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', isActive);
    };

    navToggle.addEventListener('click', toggleMenu);
    
    navToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
        }
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Smooth scrolling for navigation links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function scrollToTopSmooth() {
    const hero = document.getElementById('hero');
    if (hero) {
        hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function initializeBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    const threshold = 380;

    const updateVisibility = () => {
        if (window.scrollY > threshold) {
            btn.classList.add('is-visible');
        } else {
            btn.classList.remove('is-visible');
        }
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateVisibility();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    updateVisibility();

    btn.addEventListener('click', () => {
        scrollToTopSmooth();
        btn.blur();
    });

    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            scrollToTopSmooth();
        }
    });
}

// Navbar background on scroll with enhanced effects
function initializeNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    const heroBackground = document.querySelector('.hero-background');
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                
                if (currentScrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                
                // Hide/show navbar on scroll
                if (currentScrollY > lastScrollY && currentScrollY > 200) {
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateY(0)';
                }
                
                lastScrollY = currentScrollY;
                
                // Parallax effect for hero background
                if (heroBackground) {
                    heroBackground.style.transform = `translateY(${currentScrollY * 0.3}px)`;
                }
                
                ticking = false;
            });
            ticking = true;
        }
    });
}

// Animate elements on scroll with enhanced effects
function initializeScrollAnimations() {
    const narrow =
        typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches;
    // iOS Safari often fails to intersect with negative bottom rootMargin; keep desktop-only shrink
    const observerOptions = {
        threshold: narrow ? 0.05 : 0.1,
        rootMargin: narrow ? '0px 0px 0px 0px' : '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.closest && entry.target.closest('[data-experience-details]')) {
                    return;
                }
                entry.target.classList.add('animate-in');
                
                // Add staggered animation for children
                const children = entry.target.querySelectorAll('.skill-item, .stat-item, .project-card, .experience-item, .highlight-item, .interest-item, .education-item');
                children.forEach((child, index) => {
                    if (child.closest && child.closest('[data-experience-details]')) {
                        return;
                    }
                    setTimeout(() => {
                        child.style.opacity = '1';
                        child.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }
        });
    }, observerOptions);
    
    // Observe all sections and cards
    document.querySelectorAll('section, .project-card, .experience-item, .skill-category, .interest-item, .education-item').forEach(el => {
        observer.observe(el);
    });
}

// Typing animation for hero title
function initializeTypingAnimation() {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        heroTitle.classList.add('typing-animation');
    }
}

// CV Download functionality
function downloadCV() {
    const cvWindow = window.open('Sawsan_Abdulbari_CV_Print_Ready.html', '_blank');
    if (!cvWindow) {
        window.location.href = 'Sawsan_Abdulbari_CV_Print_Ready.html';
        return;
    }
    cvWindow.addEventListener(
        'load',
        function onCvLoad() {
            cvWindow.removeEventListener('load', onCvLoad);
            setTimeout(() => {
                try {
                    cvWindow.print();
                } catch (err) {
                    /* print may fail if window closed */
                }
            }, 500);
        },
        { once: true }
    );
}

const projectData = {
    'project-dd': {
        title: {
            fi: '📊 Data Diwan — treidauspäätökset, ei signaaleja',
            en: '📊 Data Diwan — trade decisions, not trade signals',
            ar: '📊 داتا ديوان — قرارات تداول، لا إشارات'
        },
        image: 'images/datadiwan-hero.png',
        demo: 'https://datadiwan.com/',
        repo: null,
        category: 'data',
        metrics: {
            Product: 'Data Diwan (trading)',
            Stack: 'Vite, React, Supabase',
            Live: 'datadiwan.com'
        },
        impact: {
            fi: 'Verkkopohjainen treidausjärjestelmä, joka tukee riskitietoista päätöksentekoa: positoinnit, säännöt ja käyttäytyminen ennen oikeaa pääomaa—ei myytyjä “signaaleja”, vaan työkaluja hallintaan.',
            en: 'A web-based trading system that supports risk-aware decisions: sizing, self-defined rules, and behaviour before real capital—tools for control, not packaged “signals.”',
            ar: 'نظام تداول ويب يركّز على القرار الواعي بالمخاطر: أحجام، قواعد، وسلوك قبل المال الحقيقي—أدوات للتحكّم لا «إشارات» جاهزة.'
        },
        features: {
            en: [
                'Position-size calculator: balance, risk %, pips, margin, and symbol-aware math',
                'Full experience: home, blog, legal pages, dark mode, PWA, English/Arabic UI, and guided onboarding',
                'Pre-trade focus: checklists, permission prompts, risk and discipline views, and post-trade reflection',
                'Planning: trading-plan builder, strategy library, weekly scorecards, Kelly sizing, and Monte Carlo-style analysis (charts via Recharts)',
                'Journaling: trade history with review prompts, user profile, and data synced through Supabase',
                'Product fit: Stripe subscriptions, tier access, and automated tests (Vitest, Playwright) with production monitoring (Sentry)'
            ],
            fi: [
                'Positiolaskuri: saldo, riski-%, pips, marginaali, symboolikohtaiset laskelmat',
                'Kokonaisuus: koti, blogi, oikeudelliset sivut, tumma tila, PWA, kielet (esim. EN/AR), perehdytys',
                'Ennen treidiä: tarkistuslistat, vahvistuskehotteet, riski- ja kurinäkymät, jälkeinen reflektio',
                'Suunnittelu: treidaussuunnitelma, strategiat, viikkoraportit, Kelly, Monte Carlo -näkymät (Recharts)',
                'Säilytys: treidihistoria, katselmointi, profiili; tieto Supabaseen',
                'Tuote: Stripe-tilaukset, taso-oikeudet, automaattiset testit (Vitest, Playwright) ja Sentry seurannassa'
            ],
            ar: [
                'حاسبة حجم المركز: الرصيد، نسبة المخاطرة، النقاط، الهامش، وحسابات تفصيلية حسب الأداة',
                'تجربة كاملة: رئيسية ومدونة ووثائق قانونية ووضع ليلي وتطبيق ويب تقدمي وواجهة عربي/إنجليزي وإرشاد',
                'قبل التداول: قوائم، تأكيدات، لوحات مخاطر وانضباط، وتأمل بعد الصفقة',
                'تخطيط: مُنشئ خطة تداول ومكتبة استراتيجيات وتقارير أسبوعية و Kelly وتحليل Monte Carlo (Recharts)',
                'سجل ومراجعة: تاريخ صفقات وملف مستخدم ومزامنة عبر Supabase',
                'المنتج: اشتراكات Stripe، صلاحيات المستوى، اختبارات (Vitest وPlaywright) ومراقبة (Sentry)'
            ]
        },
        tech: ['Vite', 'React', 'TypeScript', 'Tailwind', 'Supabase', 'Stripe', 'Recharts', 'i18next', 'PWA', 'Vitest', 'Playwright', 'Sentry'],
        story: {
            problem: {
                en: 'Retail traders often chase signals and emotions; the real need is a disciplined pre-trade check: lot size, risk status, and alignment with self-defined rules before committing capital.',
                fi: 'Vähittäiskauppiaat etsivät usein “signaaleja” ja reagoivat tunteella; oikea tarve on kurinalainen tarkistus ennen treidiä: lotin koko, riskin tila ja omat säännöt ennen pääoman sitomista.',
                ar: 'يُسرِع كثير من المتداولين وراء الإشارات والعواطف؛ والحاجة الحقيقية فحص منضبط قبل الصفقة: حجم العقد، حالة المخاطرة، وتوافق قواعدك قبل ربط رأس المال.'
            },
            data: {
                en: 'The live product at datadiwan.com is a full trading workspace—position sizing, behavioural guardrails, and history—rather than a single marketing landing page alone.',
                fi: 'Julkinen palvelu datadiwan.com on täysi treidaustyötila—positiointi, käyttäytymisen rajat ja historia—ei pelkkä yksisivuinen myyntisivu.',
                ar: 'المنتج الحي على datadiwan.com مساحة تداول كاملة—أحجام، ضوابط سلوكية، وسجلات—وليست صفحة تسويق بسيطة وحدها.'
            },
            approach: {
                en: 'Vite, React, and TypeScript front end with Tailwind; Supabase for authentication and data; Stripe for paid tiers; English and Arabic in the interface; PWA; charts (including Recharts) and heavier analytics (e.g. Monte Carlo) in dedicated modules. Vitest, Playwright, and Sentry support reliable releases.',
                fi: 'Vite-, React- ja TypeScript-käyttöliittymä Tailwindilla; Supabase tunnistautumiseen ja dataan; Stripe maksullisiin tasoihin; käyttöliittymäkielinä englanti ja arabia; PWA; kaaviot (mm. Recharts) ja raskaammat analyysit omina moduuleina. Vitest, Playwright ja Sentry tukevat vakaita julkaisuja.',
                ar: 'واجهة بـVite وReact وTypeScript وTailwind؛ Supabase للمصادقة والبيانات؛ Stripe للمستويات المدفوعة؛ عربي وإنجليزي في الواجهة؛ PWA؛ مخططات (منها Recharts) وتحليلات أثقل في وحدات مخصصة. Vitest وPlaywright وSentry لدعم الإصدارات بثقة.'
            },
            results: {
                en: 'In production at https://datadiwan.com, traders use calculator-based sizing, rule-aware checks, a readable trade history, and planning tools—underpinned by automated tests and monitoring.',
                fi: 'Tuotannossa (https://datadiwan.com) käytössä laskentapohjainen koko, sääntöpohjaiset tarkistukset, selkeä historia ja suunnittelutyökalut—pohjalla automaattiset testit ja seuranta.',
                ar: 'على https://datadiwan.com: حجوم من الحاسبة، وفحوص تلائم القواعد، وتاريخ صفقات واضح، وأدوات تخطيط—مدعومة باختبارات ومراقبة تلقائية.'
            }
        }
    },
    project1: {
        title: { fi: '🏦 Kiva-laina EDA Dashboard', en: '🏦 Kiva Loan EDA Dashboard', ar: '🏦 لوحة تحليل استكشافي لقروض كيفا' },
        image: 'images/kiva_dashboard.png',
        demo: null,
        repo: 'https://github.com/SawsanAbdulbari/Kiva_Loan_Dashboard',
        category: 'data',
        metrics: { 'Data Points': '670k+', 'Tools': 'Streamlit, Plotly', 'Type': 'Exploratory Data Analysis' },
        impact: { fi: 'Analysoi mikrolainojen jakautumista globaalisti auttaen tunnistamaan rahoitusvajeita.', en: 'Analyzed microloan distribution globally to identify funding gaps and demographic trends.', ar: 'تحليل توزيع القروض الصغيرة عالميًا لمعرفة فجوات التمويل والاتجاهات السكانية.' },
        tech: ['Python', 'Pandas', 'Plotly', 'Streamlit'],
        story: {
            problem: {
                en: 'Microfinance needs clear visibility into where capital flows and which borrower and country patterns are under-served; flat spreadsheets do not support interactive exploration of 670k+ points.',
                fi: 'Mikrorahoituksessa tarvitaan näkyvyyttä siihen, minne pääoma virtaa ja mitkä lainaajat ja maat jäävät vajaasti palvelluiksi; tavalliset taulukot eivät tue yli 670 000 rivin interaktiivista tutkimista.',
                ar: 'يحتاج التمويل الأصغر رؤية واضحة لتدفق رأس المال والمقترضين والدول الأقل تغطية؛ الجداول البسيطة لا تدعم استكشافًا تفاعليًا لأكثر من 670 ألف سجل.'
            },
            data: {
                en: 'Kiva’s public microloan data: 670,000+ records with country, sector, term, and borrower-facing fields for segmentation and EDA.',
                fi: 'Kivan julkinen mikrolainadata: yli 670 000 riviä maa-, sektori-, laina-ajan ja lainaajakentillä segmentointiin ja EDA:han.',
                ar: 'بيانات كيفا العامة: أكثر من 670 ألف سجل مع الحقول القطرية والقطاعية والمدة وبيانات المقترضين للتقسيم والتحليل الاستكشافي.'
            },
            approach: {
                en: 'Python and Pandas for cleaning and feature cuts; Plotly for linked charts; Streamlit to ship a self-service dashboard analysts can hand to non-technical stakeholders.',
                fi: 'Python ja Pandas puhdistukseen ja leikkauksiin; Plotly linkitettyihin kaavioihin; Streamlit itsepalvelunäkymäksi, jonka analyytikot voivat antaa ei-teknisille sidosryhmille.',
                ar: 'بايثون وبانداس للتنظيف والتقطيع؛ بلوطلي للمخططات المترابطة؛ ستريملت لواجهة يحملها المحللون لغير التقنيين.'
            },
            results: {
                en: 'A deployable EDA app that highlights geographic and sectoral funding gaps, framed for inclusion and program discussions rather than one-off static slides.',
                fi: 'Käyttöön vietävä EDA-sovellus, joka tuo esiin maantieteellisiä ja sektorikohtaisia rahoituskuiluja—sopii osallisuus- ja ohjelmakeskusteluihin, ei vain kertaluonteisiin dioihin.',
                ar: 'تطبيق EDA جاهز للنشر يبرز فجوات التمويل جغرافيًا وقطاعيًا، مُؤطرًا لنقاش الإدماج والبرامج لا لعروض ثابتة لمرة واحدة.'
            }
        }
    },
    project2: {
        title: { fi: '🦠 COVID-19-tapausten ennustejärjestelmä', en: '🦠 COVID-19 Case Prediction System', ar: '🦠 نظام تنبؤ بحالات كوفيد-19' },
        image: 'images/covid_prediction.png',
        demo: 'https://omdenakitwecovid19.streamlit.app/',
        repo: 'https://github.com/SawsanAbdulbari/Omdena_KitweChapter_ForecastingCOVID19Dynamics',
        category: 'ml',
        metrics: { 'Primary model': 'XGBoost', 'Evaluation': 'MAE, RMSE, R²', 'UI': 'Streamlit' },
        impact: {
            fi: 'Ennusti tapaus- ja kuolemalukuja (Kitwe / Sambia, Omdena) XGBoost-malleilla; Streamlit-sovellus ja validointi kuten julkisessa repositoriossa (MAE, RMSE, R²).',
            en: 'COVID-19 imputed cases and deaths forecasting for the Kitwe (Zambia) Omdena chapter using trained XGBoost models, with a Streamlit app and MAE/RMSE/R² evaluation as in the public GitHub repository.',
            ar: 'تنبؤ بحالات ووفيات مُدخَلة (كيتوي/زامبيا، أومدينا) بعائيات XGBoost مدرَّبة، وواجهة ستريملت والتحقق بـMAE وRMSE وR² كما في المستودع العلني.'
        },
        tech: ['Python', 'XGBoost', 'scikit-learn', 'Streamlit', 'pandas'],
        story: {
            problem: {
                en: 'Health authorities in low-capacity settings need short-horizon case and outcome signals, not only backward counts, to stage supplies, beds, and communications before peaks hit.',
                fi: 'Matalan kapasiteetin terveysviranomaiset tarvitsevat lyhyen horisontin tapaus- ja tulosignaaleja, eivät vain menneitä lukuja, jotta varusteet, vuoteet ja viestintä ehditään ennen piikkejä.',
                ar: 'في بيئات محدودة الإمكانات تحتاج السلطات الصحية لإشارات قصيرة الأجل للحالات والنتائج، لا أعدادًا رجعية فقط، لتأمين المستلزمات والأسرّة والتواصل قبل الذروة.'
            },
            data: {
                en: 'Time-series of reported COVID-19 dynamics scoped to the Kitwe / Zambia Omdena chapter use case, with signals suitable for public-health decision support.',
                fi: 'Aikasarja raportoiduista COVID-19-dynamiikoista, rajattu Omdenan Kitwe / Sambia -käyttötapaukseen, signaaleilla jotka tukevat julkisen terveyden päätöksentekoa.',
                ar: 'سلاسل زمنية لديناميكيات كوفيد-19 المبلغ عنها في سياق فصل أومدينا في كيتوي/زامبيا، بإشارات تصلح لدعم قرارات الصحة العامة.'
            },
            approach: {
                en: 'Omdena-style collaboration at global scale: gradient boosting (XGBoost) for imputed case and death targets, with preprocessing and feature work as in the repo; multi-page Streamlit app for exploration and deployment.',
                fi: 'Omdenan tyyppinen yhteistyö: gradient boosting (XGBoost) imputoituille tapaus- ja kuolemalukumäärille, esikäsittely ja piirteet kuten repositoriossa; monisivuinen Streamlit-tuotos.',
                ar: 'تعاون بأسلوب أومدينا: تعزيز تدرج (XGBoost) لأهداف الحالات والوفيات، مع تمهيد مسبق ومعالجة ميزات كما في المستودع؛ تطبيق ستريملت متعدد الصفحات للاستكشاف والنشر.'
            },
            results: {
                en: 'Public Streamlit deployment for scenario planning; model quality is reported with standard regression metrics (MAE, RMSE, R²) in the repository README—aligned with the shipped code, not a single marketing percentage.',
                fi: 'Julkinen Streamlit-tuotos skenaariotyöhön; mallin laatu on README:ssa tavanomaisilla regressiometriikoilla (MAE, RMSE, R²)—linjassa koodin kanssa.',
                ar: 'نشر ستريملت علني للتخطيط للسيناريوهات؛ جودة النموذج مذكورة في README بمقاييس انحدار قياسية (MAE، RMSE، R²) متوافقة مع المشفَّر لا رقم تسويقي واحد.'
            }
        }
    },
    project3: {
        title: { fi: '🏠 Kalifornian asuntojen hintojen ennustin', en: '🏠 California Housing Price Predictor', ar: '🏠 مُتنبّئ بأسعار المساكن في كاليفورنيا' },
        image: 'images/housing_predictor.png',
        demo: null,
        repo: 'https://github.com/SawsanAbdulbari/california_housing_price_predictor',
        category: 'ml',
        metrics: { 'Algorithm': 'Random Forest', 'Optimization': 'Hyperparameter Tuning', 'Features': 'Geospatial' },
        impact: { fi: 'Optimoi kiinteistöjen arvonmääritystä tarkalla regressiomallilla, joka huomioi sijaintikohtaiset muuttujat.', en: 'Optimized real estate valuation using a high-precision regression model that accounts for complex geospatial variables.', ar: 'تحسين تقييم العقارات باستخدام نموذج انحدار عالي الدقة يراعي المتغيرات الجغرافية المعقدة.' },
        tech: ['Python', 'Scikit-learn', 'Pandas', 'Matplotlib'],
        story: {
            problem: {
                en: 'In California, median house value depends on block-level context (density, location, room counts); lenders and data teams need defensible value estimates, not a single global average.',
                fi: 'Kaliforniassa asunnon mediaaniarvo riippuu korttelitason kontekstista (tiheys, sijainti, huoneiden määrä); rahoittajat ja data-tiimit tarvitsevat perusteltuja arvioita, eivät yhtä globaalia keskiarvoa.',
                ar: 'في كاليفورنيا يعتمد متوسط سعر المسكن على سياق المبنى (الكثافة والموقع وعدد الغرف)؛ يحتاج المقرضون وفرق البيانات لتقديرات قابلة للدفاع لا متوسطًا عالميًا واحدًا.'
            },
            data: {
                en: 'The classic California housing table: medians, population and housing block stats, and latitude-longitude to encode spatial structure.',
                fi: 'Klassinen Kalifornian asuntotaulukko: mediaanit, väestö- ja asuntolohkotiedot, leveys- ja pituusasteet spatiaalirakenteen koodaamiseen.',
                ar: 'جدول كاليفورنيا الكلاسيكي: الوسائط وإحصاءات السكان والمباني وخطوط العرض/الطول لترميز البنية المكانية.'
            },
            approach: {
                en: 'Random Forest regression with grid/random hyperparameter search; engineered geospatial and demographic features; Matplotlib and EDA before training to check skew and regional bias.',
                fi: 'Satunnaismetsäregressio ruudukko-/satunnaisella hyperparametrihaulla; rakennetut geospatiaaliset ja demografiset piirteet; Matplotlib ja EDA ennen harjoitusta harhaumien ja alueellisen vinouman tarkistukseen.',
                ar: 'انحدار غابة عشوائية مع ضبط فرطي بشبكة أو عشوائي؛ ميزات جغرافية وديموغرافية مُهندَسة؛ EDA بماتبلوتليب قبل التدريب للتحقق من الانحداء والانحياز الإقليمي.'
            },
            results: {
                en: 'A reproducible pipeline that explains “why this block is priced here” and serves as a strong baseline for further gradient-boosting or deep experiments.',
                fi: 'Uudelleentuotettava putki, joka selittää, miksi tämän korttelin hinta on tässä, ja toimii vahvana vertailukohtana gradient-boosting- tai syväkokeiluille.',
                ar: 'مسار قابل لإعادة الإنتاج يشرح «لماذا يُسعَّر هذا المبنى هنا» ويُمثّل أساسًا قويًا لخبرات تعزيز التدرج أو التعلم العميق لاحقًا.'
            }
        }
    },
    project4: {
        title: { fi: '👥 Asiakassegmentointi Dashboard', en: '👥 Customer Segmentation Dashboard', ar: '👥 لوحة تجزئة العملاء' },
        image: 'images/customer_segmentation.png',
        demo: 'https://customer-segmentation-dashboard.streamlit.app/',
        repo: 'https://github.com/SawsanAbdulbari/Customer-Segmentation-Dashboard',
        category: 'data',
        metrics: { 'Method': 'K-Means Clustering', 'RFM Score': 'Implemented', 'Optimization': 'Elbow Method' },
        impact: { fi: 'Auttaa yrityksiä kohdentamaan markkinointia tunnistamalla erilaisia asiakasryhmiä.', en: 'Helps businesses target marketing by identifying distinct customer segments using behavioral data.', ar: 'يساعد على استهداف التسويق عبر تحديد شرائح عملاء بواسطة سلوكهم.' },
        tech: ['Python', 'Scikit-learn', 'Plotly', 'Streamlit'],
        story: {
            problem: {
                en: 'One-size RFM or broad “VIP” rules waste budget; growth teams need distinct behavioral clusters and clear segment boundaries they can re-target each quarter.',
                fi: 'Yhtenäiset RFM- tai leveät \"VIP\"-säännöt tuhlaavat budjettia; kasvutiimit tarvitsevat erillisiä käyttäytymisryhmiä ja selkeitä rajoja, joihin voi uudelleenkohdentaa joka neljännes.',
                ar: 'قواعد RFM \"للجميع\" أو مسميات VIP عريضة تهدر الميزانيات؛ يحتاج فريقو النمو لشرائح سلوكية متميزة وحدود واضحة لإعادة الاستهداف كل ربع.'
            },
            data: {
                en: 'Transaction- and event-style records for recency, frequency, monetary and derived behavioral features, shaped as k-means–ready matrices after scaling.',
                fi: 'Tapahtuma- ja transaktio-tyyppiset tietueet: ajankohtaisuus, taajuus, rahamäärä ja johdetut piirteet, skaalauksen jälkeen k-means-ystävällisiä matriiseja varten.',
                ar: 'سجلات على شكل معاملات وأحداث للأحداث والتكرر والنقد وسلوكيات مشتقة، مُشكّلة كمصفوفات جاهزة لk-means بعد التحجيم.'
            },
            approach: {
                en: 'RFM feature engineering, elbow-informed choice of k for K-Means, Plotly+Streamlit for live exploration of who lands in which cluster.',
                fi: 'RFM-ominaisuuksien rakennus, k:n valinta elbow-menetelmän (kyynärmurtuma) mukaan K-meansille, Plotly+Streamlit live-tarkasteluun siitä, kuka päätyy mihinkin klusteriin.',
                ar: 'هندسة ميزات RFM واختيار k مُرشدًا بطريقة المرفق (elbow) لk-means، مع Plotly+Streamlit لاستكشاف مَن ينتقل لأي عنقود حيًا.'
            },
            results: {
                en: 'A marketing-facing dashboard with explicit elbow-method optimization, so “segment 3” is defensible, not a black box.',
                fi: 'Markkinointinäkymä, jossa kyynärpäämenetelmä on eksplisiittisesti mukana, jotta esimerkiksi \"segmentti 3\" on perusteltu, ei musta laatikko.',
                ar: 'لوحة موجهة للتسويق مع تحسين صريح بطريقة المرفق، بحيث تكون مثلًا «القسم 3» قابلة للتبرير لا صندوقًا أسود.'
            }
        }
    },
    project5: {
        title: { fi: '🚕 NYC-taksimatkan keston ennustin', en: '🚕 NYC Taxi Trip Duration Prediction', ar: '🚕 تنبؤ بمدة رحلات التاكسي في نيويورك' },
        image: 'images/taxi_duration.png',
        demo: 'https://nyctaxi.streamlit.app/',
        repo: 'https://github.com/SawsanAbdulbari/nyc_taxi_trip_duration',
        category: 'ml',
        metrics: { 'Algorithm': 'XGBoost', 'Training Set': '1.4M rows', 'Performance': 'High Accuracy' },
        impact: { fi: 'Optimoi reittisuunnittelua ja matka-ajan arviointia suurkaupunkiympäristössä.', en: 'Optimized route planning and travel time estimation in a complex urban environment.', ar: 'يُحسّن تخطيط المسارات وتقدير مدة الرحلة في بيئة حضرية معقدة.' },
        tech: ['Python', 'XGBoost', 'Folium', 'Pandas'],
        story: {
            problem: {
                en: 'NYC trip duration is driven by time-of-day, origin–destination, and city-scale congestion patterns; simple averages mis-price ETAs in operations.',
                fi: 'NYC-taksimatkan kestoa säätelevät vuorokaudenaika, lähtö–määränpää ja kaupungin mittakaavan ruuhkakuviot; yksinkertaiset keskiarvot vääristävät saapumisaikojen (ETA) arviointia.',
                ar: 'تُحكَم مدة رحلة تاكسي نيويورك بوقت اليوم ونقطة الانطلاق والوصول وتضخم المدينة؛ تُسعّر المتوسطات البسيطة تقديرات الوصول بشكل خاطئ في التشغيل.'
            },
            data: {
                en: 'Around 1.4 million training rows as listed in the project, with pick-up/drop-off, timestamps, and tabular context typical of a large urban taxi log.',
                fi: 'Noin 1,4 miljoonaa opetusriviä kuten projektissa, nouto- ja jättöpisteet, aikaleimat ja taulukkomainen tausta tyypillistä isoa kaupunkitaksilokia varten.',
                ar: 'نحو 1.4 مليون صف تدريب كما في المشروع: نقاط الالتقاء والنزول والطوابع الزمنية وجداول مماثلة لسجل تاكسي حضري كبير.'
            },
            approach: {
                en: 'XGBoost on engineered temporal and location features, Folium for geo sanity checks, Pandas for leak-safe splits and data hygiene.',
                fi: 'XGBoost aika- ja sijaintipiirteillä, Folium maantieteellisiin tarkistuksiin, Pandas jaot vuotosuojatuiksi ja datan laadulle.',
                ar: 'XGBoost على ميزات زمنية ومكانية مُهندَسة، وفوليوم لمراجعة جغرافية، وبانداس لتقسيمات بلا تسرّب ونظافة بيانات.'
            },
            results: {
                en: 'A high-accuracy duration model on messy real data—credible as a routing or driver-ETA back-end prototype, not a toy notebook.',
                fi: 'Kestomalli, jolla on korkea tarkkuus sotkuisella oikealla datalla—usottava reititys- tai kuljettaja-ETA -taustan prototyypiksi, ei leikkimuistikirjaksi.',
                ar: 'نموذج مدة عالي الدقة على بيانات فوضوية حقيقية—جدير بالثقة كنموذج أولي لخلفية التوجيه أو وصول السائق، لا مفكرة ترفيهية.'
            }
        }
    },
    project6: {
        title: { fi: '💵 Setelien autenttisuuden tarkistus', en: '💵 Bank Note Authentication', ar: '💵 التحقق من أصالة الأوراق النقدية' },
        image: 'images/banknote_auth.png',
        demo: 'https://banknote.streamlit.app/',
        repo: 'https://github.com/SawsanAbdulbari/SVM',
        category: 'ml',
        metrics: { 'Models': 'SVM, KNN, LogReg, DT', 'Data': 'UCI (4 features)', 'UI': 'Streamlit' },
        impact: { fi: 'Rinnastaa useita luokittimia pankkiseteleille ja julkaisee interaktiivisen Streamlit-sovelluksen; koulutus ja ristiinvalidointi kuten repositorion README.', en: 'Trains and compares SVM, k-NN, logistic regression, and decision trees on the UCI banknote task, with cross-validation and a Streamlit deployment—as documented in the public repository.', ar: 'يُدرّب ويقارن بين SVM وk-NN والانحدار اللوغيستي وأشجار القرار على بيانات UCI، مع تحقق متقاطع ونشر عبر ستريملت—كما في المستودع العلني.' },
        tech: ['Python', 'scikit-learn', 'Streamlit', 'pandas'],
        story: {
            problem: {
                en: 'Fraud and cash-handling points need a fast, interpretable check on real banknote sensor features without sending images to a third-party API.',
                fi: 'Käteispisteen tarkistukset ja petosten torjunta tarvitsevat nopean, tulkittavan toimen oikeille setelitunnisteeseen, ilman kuvien lähettämistä ulkoiseen API:in.',
                ar: 'تحتاج نقاط الاحتيال ومعالجة النقد فحصًا سريعًا وقابلا للتفسير لخصائص الاستشعار دون إرسال صور لطرف ثالث.'
            },
            data: {
                en: 'UCI banknote data: four wavelet-style numeric features per note for genuine vs forged, low-dimensional but classifiable.',
                fi: 'UCI setelidata: neljä aallonmuunnospiirrettä per seteli, aito vs. väärennys; vähäulotteinen mutta eroteltavissa.',
                ar: 'بيانات UCI للأوراق: أربع خصائص رقمية بأسلوب موجات لكل ورقة (حقيقي مقابل مزيف)؛ بُعد منخفض لكنه قابل للتصنيف.'
            },
            approach: {
                en: 'Per the SVM repository README: several sklearn classifiers are trained and compared (SVM, KNN, logistic regression, decision tree) with standardization, cross-validation, and confusion-matrix style evaluation; the Streamlit app exposes predictions from the training outcome.',
                fi: 'SVM-repositorion README:n mukaan: useita scikit-learn-luokittimia (SVM, kNN, logistinen regressio, päätöspuu), standardointi, ristiinvalidointi ja sekoitusmatriisi-tyyppinen arviointi; Streamlit-sovellus julkaistu julkisesti.',
                ar: 'حسب README لمستودع SVM: تدريب ومقارنة عدة مصنفات (SVM وk-NN وانحدار لوجيستي وشجرة قرار) مع تييع وتحقق متقاطع وتقييم بمصفوفة ارتباك؛ واجهة ستريملت للتنبؤات.'
            },
            results: {
                en: 'A documented educational deployment on Streamlit Community Cloud, suitable for kiosks or demos; headline accuracy is left to the model comparison in the repo rather than a single fixed percentage on the page.',
                fi: 'Dokumentoitu koulutuskäyttöinen Streamlit-näkyvyys: tarkkuus ilmenee repositorion mallivertailusta, ei yhdestä kiinteästä prosenttiluvusta sivulla.',
                ar: 'نشر تعليمي موثق على Streamlit: الدقة مُستخلصة من مقارنة النماذج في المستودع لا من رقم واحد ثابت في الصفحة.'
            }
        }
    },
    project7: {
        title: { fi: '🛒 E-commerce-analytiikka Dashboard', en: '🛒 E-commerce Analytics Dashboard', ar: '🛒 لوحة تحليلات التجارة الإلكترونية' },
        image: 'images/shopping_dashboard.png',
        demo: 'https://shopping-dashboard.streamlit.app/Overview',
        repo: 'https://github.com/SawsanAbdulbari/Shopping_Dashboard',
        category: 'data',
        metrics: { 'Visuals': '15+ Charts', 'KPIs': 'CLV, Churn, Revenue', 'Interactivity': 'Full' },
        impact: { fi: 'Tarjoaa kattavan näkymän myyntiin ja asiakkaiden käyttäytymiseen.', en: 'Provides a comprehensive view of sales performance and customer behavior patterns.', ar: 'رؤية شاملة للمبيعات وسلوك العملاء.' },
        tech: ['Python', 'Pandas', 'Plotly', 'Streamlit'],
        story: {
            problem: {
                en: 'E-commerce and growth teams juggle many KPIs—revenue, CLV, churn, product mix—without one interactive place to filter cohorts and time ranges.',
                fi: 'Verkkokaupan ja kasvun tiimeillä on useita tunnuslukuja—liikevaihto, CLV, kato, tuotemix—ilman yhtä interaktiivista näkymää, josta voi suodattaa kohortteja ja aikavälejä.',
                ar: 'تتعدد مؤشرات أداء التجارة الإلكترونية والنمو—الإيراد وCLV وانقطاع الاستهلاك ومزيج المنتجات—دون مكان تفاعلي واحد لترشيح الفئات والفترات.'
            },
            data: {
                en: 'Retail-style fact tables aligned with the public Shopping_Dashboard repository (consumer behavior and shopping-habit style analytics) feeding the 15+ chart views, including CLV, churn, and product trends.',
                fi: 'Vähittäisdataa julkisen Shopping_Dashboard-repositorion hengessä (kuluttajakäyttäytyminen, ostotottumukset), yli 15 kaavionäkymää: CLV, kato, tuotetrendit.',
                ar: 'جداول بأسلوب بيع مزود بالمستودع العلني Shopping_Dashboard (سلوك المستهلك وعادات التسوّق) تغذي 15+ مخططًا: CLV وانقطاع الاستهلاك واتجاهات المنتج.'
            },
            approach: {
                en: 'Pandas for aggregation and data prep, Plotly for interactivity, Streamlit for “Overview”-style pages with linked filters.',
                fi: 'Pandas koosteisiin ja datavalmisteluun, Plotly interaktiivisuuteen, Streamlit yleisnäkymä-tyyppisille sivuille yhdistetyillä suodattimilla.',
                ar: 'بانداس للتجميع وتحضير البيانات وبلوطلي للتفاعل وستريملت لصفحات بأسلوب \"نظرة عامة\" مع مرشحات مترابطة.'
            },
            results: {
                en: 'A single surface for operational reviews, aimed at regular business use rather than a one-off static report.',
                fi: 'Yksi pinta toistuviin toimintakatsauksiin, tarkoitettu jatkuvaan liiketoimintakäyttöön, ei kertaluonteiseen staattiseen raporttiin.',
                ar: 'سطح واحد لمراجعات التشغيل، موجه لاستعمال أعمالي متكرر لا تقريرًا ثابتًا لمرة واحدة.'
            }
        }
    },
    project8: {
        title: { fi: '🤖 Älykäs AI-dokumentti Chatbot RAG:lla', en: '🤖 Smart AI Document Chatbot with RAG', ar: '🤖 روبوت محادثة ذكي للوثائق مع RAG' },
        image: 'images/chatbot_rag.png',
        demo: 'https://huggingface.co/spaces/SA7/smart-ai-rag',
        repo: 'https://github.com/SawsanAbdulbari/smart-ai-rag',
        category: 'nlp',
        metrics: { 'Architecture': 'RAG', 'Vector store': 'FAISS', 'LLM & embeddings': 'Gemma-2B, MiniLM' },
        impact: { fi: 'RAG-järjestelmä: FAISS-haku, lauseupotukset, avoimen lähdekoodin LLM (README) ja julkiset kokeiluympäristöt; valinnainen API-avain paikalliseen kokeiluun.', en: 'RAG with FAISS retrieval, sentence embeddings, and an open-weights LLM path documented in the public README (Gemma-2B + MiniLM class); optional API keys for experiments; Hugging Face Space demo.', ar: 'RAG مع FAISS وتضمين جمل ومسار نموذج مفتوح (جيما-2B ومينيLM) كما في README؛ مفاتيح API اختيارية للتجارب وعرض على هاجينغ فيس.' },
        tech: ['Python', 'FAISS', 'sentence-transformers', 'PyTorch', 'Gradio', 'Jupyter'],
        story: {
            problem: {
                en: 'Users cannot safely paste long PDFs into a generic LLM: answers must be grounded in retrieved chunks, and knowledge must update when documents change.',
                fi: 'Pitkiä PDF-tiedostoja ei voi liittää yleiseen LLM:ään tietoturvallisesti: vastausten tulee perustua noudettuihin lohkoihin, ja tieto päivittyy kun asiakirjat muuttuvat.',
                ar: 'لا يمكن لصق ملفات PDF طويلة بأمان في نموذج لغوي عام: يجب تأسيس الإجابات على المقاطع المسترجَعة، وتحديث المعرفة عند تغيير المستندات.'
            },
            data: {
                en: 'Documents chunked for embeddings; FAISS index for similarity search; top-k passages fed to the generator, following the public smart-ai-rag README (MiniLM + Gemma-2B stack).',
                fi: 'Asiakirjat lohkottu upotuksia varten, FAISS-indeksi samankaltaisuushakuun, top-k repositorion README:n mukaisella pinolla (MiniLM + Gemma-2B).',
                ar: 'مستندات مُقسّمة، وفهرس FAISS للتشابه، وممرات top-k إلى المولد وفق README (MiniLM + جيما-2B).'
            },
            approach: {
                en: 'Multi-strategy RAG and prompt patterns in the course notebooks; default README stack uses FAISS, all-MiniLM-L6-v2–style embeddings, and Gemma-2B (4-bit) generation—OpenAI or other APIs only where you configure .env, matching the “open LLM” course framing.',
                fi: 'Monistrateginen RAG ja prompt-kokeet kursseissa; oletusstack README:ssä: FAISS, MiniLM-tyyppiset upotukset, Gemma-2B; OpenAI vain .env:llä—linjassa “avoimen LLM”-kurssin kanssa.',
                ar: 'أنماط RAG واستراتيجيات prompt في دفاتر المقرر؛ الافتراضي في README: FAISS وMiniLM وGemma-2B؛ بقية واجهات البرمجة عبر ‎.env—بروح النماذج المفتوحة.'
            },
            results: {
                en: 'A portfolio-ready Hugging Face Space plus reproducible notebooks; the deployment stack may differ from any single “GPT-4 only” blurb because the public repo centers open models and FAISS.',
                fi: 'Hugging Face Space -demo ja toistettavat muistikirjat; julkisessa repositoriossa avoimet mallit + FAISS, ei yhtä “vain-GPT-4” -kuvausta.',
                ar: 'مساحة عرض ودفاتر قابلة للتكرار؛ المستودع يركّز على نماذج مفتوحة وFAISS لا على سطر تسويقي لـGPT-4 وحدَه.'
            }
        }
    },
    project9: {
        title: { fi: '📰 Uutisten sentimentti- ja avainsana-analyysi Dashboard', en: '📰 News Sentiment & Keyword Analysis Dashboard', ar: '📰 لوحة تحليل المشاعر والكلمات المفتاحية في الأخبار' },
        image: 'images/news_analysis_dashboard.png',
        demo: 'https://newssentimentkeyword.streamlit.app/',
        repo: 'https://github.com/SawsanAbdulbari/news_app',
        category: 'nlp',
        metrics: { 'Analysis': 'VADER Sentiment', 'Extraction': 'RAKE/NLTK', 'Real-time': 'API Integration' },
        impact: { fi: 'Seuraa yleistä mielipidettä ja keskeisiä puheenaiheita uutisvirrasta automaattisesti.', en: 'Tracks public sentiment and key talking points from news feeds automatically.', ar: 'تتبع المشاعر العامة والموضوعات الرئيسية من الأخبار تلقائيًا.' },
        tech: ['Python', 'NLTK', 'Pandas', 'Streamlit'],
        story: {
            problem: {
                en: 'PR and research teams drown in headlines; they need machine-scale sentiment and extractive “what is being said,” not manual reading.',
                fi: 'Viestintä- ja tutkimusryhmät hukkuvat otsikkoihin: tarvitaan koneen mitassa tunneanalyysiä ja avainfraasien poimintaa, ei manuaalista lukemista.',
                ar: 'يغرق فريقا العلاقات العامة والبحث في العناوين؛ يحتاجان مشاعر على نطاق الآلة واستخراج «ما المُقال»، لا القراءة اليدوية.'
            },
            data: {
                en: 'News article text in bulk, structured for VADER at sentence and article level and for RAKE/NLTK key-phrase mining.',
                fi: 'Uutisartikkelitekstiä suurin erin, rakenne VADERille lause- ja artikkelitasolla sekä RAKE/NLTK-avainfraaseille.',
                ar: 'نص مقالات أخبار بالجملة، مُنظّم لـVADER على مستوى الجملة والمقال ولـRAKE/NLTK لاستخراج عبارات مفتاحية.'
            },
            approach: {
                en: 'VADER for polarity, RAKE/NLTK for keywords, Pandas+Streamlit for time filters, topics, and optional live-style data hooks.',
                fi: 'VADER napaisuudelle, RAKE/NLTK avainsanoille, Pandas+Streamlit aikajänteille, aiheille ja valinnaisille reaaliaikadataliitännäisille.',
                ar: 'VADER لقطبية، RAKE/NLTK للكلمات، بانداس+ستريملت لمرشحات زمن ومواضيع وربط اختياري ببيانات بأسلوب مباشر.'
            },
            results: {
                en: 'A single dashboard to monitor sentiment and keyword momentum—usable for perception checks or as a market-intelligence pilot.',
                fi: 'Yksi valvontanäkymä mielialan ja avainsanavirran seurantaan: sopii maineen tarkistuksiin tai markkinatiedon kokeiluun.',
                ar: 'لوحة واحدة لرصد دفعة المشاعر والكلمات—قابلة لاختبار الانطباع أو كطيار للذكاء السوقي.'
            }
        }
    },
    project10: {
        title: { fi: '😊 Tunnetunnistusprojekti', en: '😊 Emotion Recognition Project', ar: '😊 مشروع التعرف على المشاعر' },
        image: 'images/ml_pipeline.png',
        demo: null,
        repo: 'https://github.com/SawsanAbdulbari/emotion_recognition_mobile_app',
        category: 'vision',
        metrics: { 'Backbone': 'EfficientNet-B0', 'Quantization': 'INT8', 'Deployment': 'Mobile Optimized' },
        impact: { fi: 'Kehitti reaaliaikaisen tunnistusjärjestelmän, joka on optimoitu mobiilikäyttöön INT8-kvantisoinnilla säilyttäen korkean tarkkuuden.', en: 'Developed a real-time emotion recognition pipeline optimized for mobile via INT8 quantization, maintaining high accuracy on edge devices.', ar: 'تطوير مسار تعرّف على المشاعر لحظي محسّن للجوال عبر تكميم INT8 مع الحفاظ على دقة عالية.' },
        tech: ['Python', 'PyTorch', 'EfficientNet', 'OpenCV'],
        story: {
            problem: {
                en: 'On-device emotion UX needs a small model without giving up FER-2013/RAF-DB-level accuracy; cloud-only APIs are a privacy and latency non-starter for some products.',
                fi: 'Laitetason tunnekokemus vaatii pientä mallia ilman FER-2013/RAF-DB-tason tarkkuuden menetystä; pelkkä pilvi-API ei sovi yksityisyyden ja viiveen vuoksi kaikkiin tapauksiin.',
                ar: 'واجهة المشاعر على الجهاز تحتاج نموذجًا صغيرًا دون التفريط بدقة FER-2013/RAF-DB؛ واجهات سحابية فحسب غير جيدة لخصوصية الأجهزة ومهلة الاستجابة.'
            },
            data: {
                en: 'FER-2013 for backbone selection, RAF-DB fine-tuning as described, image tensors into EfficientNet-B0 with a mobile resolution budget.',
                fi: 'FER-2013 rungon valintaan, RAF-DB hienosäätö kuten kuvattu, kuvatensorit EfficientNet-B0:ään matalan mobiiliresoluution puitteissa.',
                ar: 'FER-2013 لاختيار العمود الفقري وضبط دقيق لـRAF-DB، ومموّهات في EfficientNet-B0 بدقة مناسبة للهاتف.'
            },
            approach: {
                en: 'PyTorch training, full INT8 quantization for edge inference, OpenCV in the camera path for a deployable real-time feel.',
                fi: 'PyTorch-harjoittelu, INT8-kvantisointi reunapäättelyyn, OpenCV kamerapolulle todellisen reaaliaikaisuuden takaamiseksi.',
                ar: 'تدريب بايتورتش تكميم INT8 كامل للاستدلال الحافة، وOpenCV في مسار الكاميرا لإحساس لحظي جاهز للنشر.'
            },
            results: {
                en: 'A mobile-aimed path that preserves “high accuracy in metrics” while meeting battery and latency via integer inference—credible for edge deployment talks.',
                fi: 'Mobiilille suunnattu reitti, joka säilyttää korkean tarkkuuden mitoissa ja leikkaa latenssia sekä virrankulutusta kokonaislukuihin — uskottava reunan käyttöönoton keskusteluihin.',
                ar: 'مسار يستهدف الجوال ويحافظ على «دقة عالية في المقاييس» مع ضبط استهلاك البطارية وزمن الاستجابة عبر الاستدلال الصحيح—جديرٌ لحديث نشر في الحافة.'
            }
        }
    },
    project11: {
        title: { fi: '🌱 Hiilipetosten löytö järjestelmä', en: '🌱 Carbon Fraud Detection Network', ar: '🌱 شبكة كشف احتيال أسواق الكربون' },
        image: 'images/carbon_fraud.png',
        demo: null,
        repo: null,
        category: 'ml',
        metrics: { 'System': 'Multi-Agent AI', 'Efficiency': '70% faster', 'Architecture': 'Consensus Agents' },
        impact: { fi: 'Vähensi manuaalista tarkistusaikaa 70 % ja tunnisti automaattisesti epäilyttävät päästöilmoitukset tekoälyagenttien avulla.', en: 'Architected a multi-agent AI system that reduced manual verification time by 70% while improving fraud detection precision in carbon markets.', ar: 'تصميم نظام ذكاء اصطناعي متعدد الوكلاء قلل من وقت التحقق اليدوي بنسبة 70% مع تحسين دقة كشف الاحتيال.' },
        tech: ['Python', 'FastAPI', 'Google Cloud', 'Vertex AI'],
        story: {
            problem: {
                en: 'Voluntary carbon markets cannot scale if every project claim and emission sheet is read by hand; policy-aligned checks need to run in parallel.',
                fi: 'Vapaaehtoiset hiilimarkkinat eivät skaalaudu, jos jokainen projekti-ilmoitus ja päästölaskelma luetaan käsin; politiikkaan linjatut tarkistukset on ajettava rinnakkain.',
                ar: 'لا يمكن توسيع أسواق الكربون الطوعية إن قُرئ كل مطالبة مشروع وكل ورقة انبعاثات يدويًا؛ يلزم تزامن فحوصات متوافقة مع السياسة.'
            },
            data: {
                en: 'Emissions claims, project metadata, and multi-source evidence lines (e.g. CLIMATIQ-style, weather, and satellite where integrated in the Omdena-style design).',
                fi: 'Päästöilmoitukset, projektin metatiedot ja monilähdetoiset evidenssiviivat (esim. CLIMATIQ-tyyli, sää ja satelliitti, missä Omdenan tyyppiseen rakennukseen yhdistetty).',
                ar: 'مطالبات بالانبعاثات ووصف بيانات للمشروع وخطوط أدلة متعددة المصادر (مثلا بأسلوب CLIMATIQ وطقس وقمر عند الدمج كما في أومدينا).'
            },
            approach: {
                en: 'Multi-agent network with specialist roles, consensus and adjudication steps, FastAPI services, Google Cloud and Vertex AI for the heavy model paths.',
                fi: 'Moniagenttiverkko rooleilla, yhteismerkitys- ja ratkaisuvaiheet, FastAPI-palvelut, Google Cloud ja Vertex AI raskaille mallipoluille.',
                ar: 'شبكة وكلاء متعددة بأدوار تخصصية وإجماع وتحكيم وخدمات FastAPI وغوغل كلاود وفيرتекс للمسارات النموذجية الثقيلة.'
            },
            results: {
                en: 'A claimed 70% reduction in manual verification time with tighter fraud and inconsistency catch rates—framed for pilot with registry or auditor workflows.',
                fi: 'Väitetyt 70 % lyhyempi manuaalinen tarkistusaika, tiukemmat epäjohdonmukaisuuksien kaappaukset—kehyksenä kokeilu rekisteri- tai tarkastustyönkulkuihin.',
                ar: 'انخفاض مُدّعى 70% في زمن التحقق اليدوي مع معدلات أشد لاكتشاف الاحتيال وعدم الاتساق—مُؤطرٌ لطيار مع السجل أو مُراجعي العمل.'
            }
        }
    },
    project12: {
        title: { fi: '🍳 AI Recipe Finder', en: '🍳 AI Recipe Finder', ar: '🍳 الباحث عن الوصفات بالذكاء الاصطناعي' },
        image: 'images/recipe_finder.png',
        demo: 'https://huggingface.co/spaces/SA7/ai-recipe-finder',
        repo: 'https://github.com/SawsanAbdulbari/recipe_finder',
        category: 'nlp',
        metrics: { 'Speech': 'Whisper', 'LLM': 'Groq / FLAN-T5', 'UI': 'Gradio' },
        impact: { fi: 'Luo reseptejä puheen perusteella helpottaen ruoanlaiton suunnittelua.', en: 'Generates recipes based on voice input, simplifying meal planning.', ar: 'توليد وصفات من الإدخال الصوتي لتسهيل تخطيط الوجبات.' },
        tech: ['Python', 'Whisper', 'Groq', 'Gradio'],
        story: {
            problem: {
                en: 'Cooks on the go need hands-free “what can I make?” without typing ingredients; the loop must be fast enough to feel like a real assistant.',
                fi: 'Kokkaajat liikkeessä tarvitsevat kädet vapaana kysymykseen \"mitä voin tehdä?\" ilman raaka-aineiden näppäilyä; silmukan on oltava nopea kuin oikealla avustajalla.',
                ar: 'يحتاج من يطهى أثناء التنقل وضعًا بلا أيدٍ لسؤال «ماذا أطبخ؟» دون كتابة المقادير؛ يلزم أن يشعر الحلق بالسرعة مثل المساعد الحقيقي.'
            },
            data: {
                en: 'Whisper for speech-to-text on ingredient phrases; free-form text for Groq (or local FLAN-T5) to expand into a structured recipe.',
                fi: 'Whisper puheesta tekstiksi ainesfraaseihin; vapaamuotoinen teksti Groqille (tai paikalliselle FLAN-T5) strukturoidun reseptin avaamiseen.',
                ar: 'ويسبير للنص من الكلام لعبارة المقادير؛ ونص حر لـGroq (أو FLAN-T5 محلي) ليتوسع إلى وصفة منظّمة.'
            },
            approach: {
                en: 'Gradio UI on Hugging Face Spaces, optional local model to avoid sending audio off-device, balanced latency vs. quality.',
                fi: 'Gradio-käyttöliittymä Hugging Face Spacesilla, valinnainen paikallinen malli äänen pitämiseksi laitteella, viiveen ja laadun tasapaino.',
                ar: 'واجهة Gradio في مساحة هاجينغ فيس، اختيار نموذج محلي لعدم إرسال الصوت خارج الجهاز، بتوازن بين التأخير والجودة.'
            },
            results: {
                en: 'A one-click Space demo: speak → list → recipe, ready for home users or as a product prototype conversation starter.',
                fi: 'Yhden klikkauksen Space-demo: puhu → lista → resepti, koti- tai tuoteprototyypin aloituskeskusteluun.',
                ar: 'عرض ديمو بضغطة: تكلّم ← قائمة ← وصفة، جاهز للمنزل أو بروتو منتج يلاقي المستخدمين.'
            }
        }
    },
    project13: {
        title: {
            fi: '🏥 PIRHA: Kuntoutumisopas toimenpidettä edeltäen',
            en: '🏥 PIRHA Pre-Procedure Rehabilitation Guide',
            ar: '🏥 دليل PIRHA للتأهيل قبل الإجراء'
        },
        image: 'images/pirha_ict_guide.png',
        demo: 'https://ict-project-pirha.vercel.app/',
        repo: null,
        category: 'data',
        metrics: { 'Region': 'Pirkanmaa (PIRHA)', 'Deployment': 'Vercel', 'Type': 'Public Health ICT' },
        impact: {
            fi: 'Tukee potilaita ja läheisiä toimenpidettä edeltävässä kuntoutumisessa Pirkanmaan hyvinvointialueella.',
            en: 'Supports patients and families with pre-procedure rehabilitation guidance for the Pirkanmaa wellbeing region.',
            ar: 'يدعم المرضى والعائلات بتوجيه التأهيل قبل الإجراء في منطقة بيركانما لرفاهية السكان.'
        },
        tech: ['Vercel', 'Web', 'Accessibility'],
        story: {
            problem: {
                en: 'Before procedures, patients and families in Pirkanmaa (PIRHA) need clear, accessible pre-rehab information—not scattered PDFs or ward-only handouts.',
                fi: 'Toimenpiteiden edellä potilaat ja läheiset PIRHAssa (Pirkanmaa) tarvitsevat selkeän, tavoitettavan kuntoutumistiedon ennen toimenpidettä—ei hajautuneita PDF:itä vain osastolle.',
                ar: 'قبل الإجراءات يحتاج المرضى وعائلاتهم في بيركانما (PIRHA) لمعلومات واضحة عن التأهيل المسبق—لا ملفات PDF مبعثرة ولا تعليمات تقتصر على المستشفى.'
            },
            data: {
                en: 'Region-specific, non-sensitive public health copy and structure suitable for a static site; no patient identifiers, aligned to ICT course delivery.',
                fi: 'Alueen mukainen, ei-arkkaluokkaista julkista terveystekstiä ja rakenne staattiselle sivustolle; ei potilastunnisteita, linjassa ICT-kurssin toimitukseen.',
                ar: 'نص صحي عام غير حساس مُوجَّه منطقياً ومناسب لموقع ساكن؛ بلا مُعرّفات مرضى، مُلائم لتسليم محتوى جامعي للتقنية.'
            },
            approach: {
                en: 'Vercel deployment with accessibility-first layout and content hierarchy so guidance works on phones in waiting rooms and at home.',
                fi: 'Vercel-julkaisu saavutettavuus edellä, sisällön selkeys niin, että ohjeet toimivat odotushuoneen puhelimilla ja kotona.',
                ar: 'نشر على Vercel بتخطيط يضع إمكانية الوصول أولاً وهرمية محتوى لتعمل الإرشادات على الهاتف في الانتظار وفي المنزل.'
            },
            results: {
                en: 'A live, linkable public health product that extends care coordination beyond the hospital, cited as the portfolio deployment.',
                fi: 'Julkinen, linkitettävä terveyttä tukeva valmis tuote, joka laajentaa hoidon koordinointia sairaalan ulkopuolelle; portfolion Vercel-julkaisu.',
                ar: 'منتج صحي مباشر وقابل للربط يوسّع تنسيق الرعاية خارج المستشفى، مُدرَجا كنشر في المعرض.'
            }
        }
    },
    project14: {
        title: {
            fi: '🌳 Puun lajitunnistin',
            en: '🌳 Tree Classifier',
            ar: '🌳 مُصنّف أشجار'
        },
        image: 'images/tree_classifier.png',
        demo: 'https://tree-classifier-rh9k1vmsu-sawsanabdulbaris-projects.vercel.app',
        repo: null,
        category: 'ml',
        metrics: { 'Model': 'MobileNetV3', 'Accuracy': '95.92%', 'Platforms': 'Web & Mobile' },
        impact: {
            fi: 'Mahdollistaa puulajien tunnistamisen verkossa ja mobiilissa, tukemaan ympäristö- ja metsäalan sovelluksia.',
            en: 'Enables interactive tree species identification on the web and on mobile to support environmental and forestry-related use cases.',
            ar: 'يُمكّن من تصنيف أنواع الأشجار بشكل تفاعلي على الويب والهاتف لدعم حالات الاستخدام البيئية والغابات.'
        },
        tech: ['Python', 'MobileNetV3', 'Vercel', 'Web', 'Mobile'],
        story: {
            problem: {
                en: 'Field and citizen science users need a species label from a phone photo without a data-center GPU; heavy backbones are the wrong default.',
                fi: 'Maaston ja kansalaistieteen käyttäjät tarvitsevat lajinimityksen puhelimen kuvasta ilman datakeskuksen GPU:ta; raskaat selkärangat ovat väärä oletus.',
                ar: 'يحتاج ميدان العلوم المدنية تسمية نوع من صورة هاتف دون معالج بيانات ضخم؛ العمود الفقري الثقيل ليس الافتراض الصحيح.'
            },
            data: {
                en: 'Course-scoped image data with labeled tree species, sized for phone cameras and HAMK project constraints.',
                fi: 'Kurssiin rajattua kuva-aineistoa merkityillä puulajeilla, mobiilikameran ja HAMK-projektin rajauksiin sopivaa.',
                ar: 'صور ضمن المقرر بأنواع أشجار موصوفة، بحجم يناسب كاميرات الهاتف وقيود مشروع HAMK.'
            },
            approach: {
                en: 'MobileNetV3 for an accuracy–latency sweet spot, training in Python, Vercel for the web app and a parallel mobile path for in-hand capture.',
                fi: 'MobileNetV3 tarkkuuden ja viiveen kompromissiin, harjoitus Pythonilla, Vercel web-sovellukselle ja rinnakkainen mobiilipolku kuvaukseen kädessä.',
                ar: 'MobileNetV3 لتوازن دقة وزمن استجابة، تدريب ببايثون، Vercel للويب ومسار موبايل موازٍ للتقاط الصور مباشرة.'
            },
            results: {
                en: '95.92% accuracy in portfolio claims—framed as the best outcome in the HAMK course—with public web demo and mobile use case stories for forestry and environment contexts.',
                fi: '95,92 % tarkkuus portfolion mukaan—kehystettynä HAMK-kurssin parhaaksi tulokseksi—julkinen web-demo ja mobiilitarinat metsä- ja ympäristökonteksteihin.',
                ar: 'دقة 95.92% في المعرض—مُقدَّمة كأفضل نتيجة في مقرر HAMK—مع عرض ويب عام وسيناريوهات موبايل لسياق الغابات والبيئة.'
            }
        }
    }
};

function initializeModals() {
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('#project-modal .modal-close');
    if (!modal || !modalBody || !closeBtn) return;

    let lastFocusedEl = null;

    const CATEGORY_LABELS = {
        data:   { en: 'Data Science',      fi: 'Data Science',   ar: 'علم البيانات' },
        ml:     { en: 'Machine Learning',  fi: 'Koneoppiminen',  ar: 'تعلّم الآلة' },
        nlp:    { en: 'NLP & Chatbots',    fi: 'NLP & Chatbotit', ar: 'NLP ومحادثات' },
        vision: { en: 'Computer Vision',   fi: 'Konenäkö',       ar: 'رؤية حاسوبية' }
    };

    const STORY_BEATS = [
        { key: 'problem',  icon: 'fa-bullseye',  labelKey: 'modal-problem' },
        { key: 'data',     icon: 'fa-database',  labelKey: 'modal-data' },
        { key: 'approach', icon: 'fa-cogs',      labelKey: 'modal-approach' },
        { key: 'results',  icon: 'fa-chart-line', labelKey: 'modal-results' }
    ];

    function escModal(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function openProjectDetails(btn) {
        lastFocusedEl = btn;
        projectModalLastDetailsButton = btn;
        const projectId = btn.getAttribute('data-project');
        const data = projectData[projectId];
        if (!data) {
            projectModalLastDetailsButton = null;
            console.error(`Missing data for project ID: ${projectId}`);
            return;
        }

        const lang = currentLanguage || 'en';
        const title  = (typeof data.title === 'string') ? data.title : (data.title[lang] || data.title.en || 'Project Details');
        const impact = data.impact[lang] || data.impact.en || '';
        const Lm = translations[lang] || translations.en;

        const cat = data.category || '';
        const catLabel = (CATEGORY_LABELS[cat] || {})[lang] || (CATEGORY_LABELS[cat] || {}).en || '';
        const safeTitle = String(title).replace(/"/g, '&quot;');
        const catHtml  = catLabel ? `<span class="modal-category-badge">${catLabel}</span>` : '';

        const heroHtml = data.image
            ? `<div class="modal-hero" style="background-image:url('${data.image}')" role="img" aria-label="${safeTitle}">${catHtml}</div>`
            : (catHtml ? `<div class="modal-hero modal-hero-placeholder">${catHtml}</div>` : '');

        let actionsHtml = '';
        if (data.demo || data.repo) {
            const demoTxt = Lm['project-demo-text'] || 'Demo';
            const repoTxt = Lm['project-repo-text']  || 'Repository';
            actionsHtml = '<div class="modal-actions">';
            if (data.demo) {
                actionsHtml += `<a href="${data.demo}" target="_blank" rel="noopener noreferrer" class="modal-btn modal-btn-demo"><i class="fas fa-external-link-alt" aria-hidden="true"></i> ${demoTxt}</a>`;
            }
            if (data.repo) {
                actionsHtml += `<a href="${data.repo}" target="_blank" rel="noopener noreferrer" class="modal-btn modal-btn-repo"><i class="fab fa-github" aria-hidden="true"></i> ${repoTxt}</a>`;
            }
            actionsHtml += '</div>';
        }

        const metrics = data.metrics || {};
        let metricsHtml = '<div class="modal-metrics-grid">';
        for (const [key, value] of Object.entries(metrics)) {
            metricsHtml += `<div class="modal-metric-card"><span class="modal-metric-value">${escModal(value)}</span><span class="modal-metric-key">${escModal(key)}</span></div>`;
        }
        metricsHtml += '</div>';

        let techHtml = '<div class="tech-tags modal-tech-tags">';
        (data.tech || []).forEach(t => { techHtml += `<span class="tech-tag">${escModal(t)}</span>`; });
        techHtml += '</div>';

        const impactLabel  = Lm['modal-impact']       || 'Impact';
        const metricsLabel = Lm['modal-metrics']      || 'Metrics';
        const techLabel    = Lm['modal-technologies'] || 'Technologies';
        const featuresLabel = Lm['modal-features']    || 'Features';

        let featuresHtml = '';
        if (data.features && typeof data.features === 'object') {
            const featureLines = data.features[lang] || data.features.en;
            if (Array.isArray(featureLines) && featureLines.length) {
                const items = featureLines.map((line) => `<li>${escModal(line)}</li>`).join('');
                featuresHtml = `
                <div class="modal-section modal-features-section">
                    <h3 class="modal-section-label">${escModal(featuresLabel)}</h3>
                    <ul class="modal-features-list">${items}</ul>
                </div>`;
            }
        }

        let storyHtml = '';
        if (data.story) {
            const storyLines = STORY_BEATS
                .map((b) => {
                    const row = data.story[b.key];
                    const text = row ? String(row[lang] || row.en || '').trim() : '';
                    return text ? { ...b, text } : null;
                })
                .filter(Boolean);
            if (storyLines.length) {
                const storyTitle = Lm['modal-story'] || 'Project Story';
                const beats = storyLines.map((b) => `
                    <div class="modal-story-beat" role="listitem">
                        <div class="modal-story-icon" aria-hidden="true"><i class="fas ${b.icon}"></i></div>
                        <div class="modal-story-content">
                            <h4 class="modal-story-beat-label">${escModal(Lm[b.labelKey] || b.key)}</h4>
                            <p class="modal-story-beat-text">${escModal(b.text)}</p>
                        </div>
                    </div>
                `).join('');
                storyHtml = `
                <div class="modal-section modal-story-section">
                    <h3 class="modal-section-label">${escModal(storyTitle)}</h3>
                    <div class="modal-story-timeline" role="list">${beats}</div>
                </div>`;
            }
        }

        modalBody.innerHTML = `
            ${heroHtml}
            <div class="modal-inner">
                <h2 id="modal-title" class="modal-title">${escModal(title)}</h2>
                ${actionsHtml}
                <hr class="modal-divider">
                <div class="modal-section">
                    <h3 class="modal-section-label">${escModal(impactLabel)}</h3>
                    <p class="modal-impact-text">${escModal(impact)}</p>
                </div>
                ${featuresHtml}
                ${storyHtml}
                <div class="modal-section">
                    <h3 class="modal-section-label">${escModal(metricsLabel)}</h3>
                    ${metricsHtml}
                </div>
                <div class="modal-section">
                    <h3 class="modal-section-label">${escModal(techLabel)}</h3>
                    ${techHtml}
                </div>
            </div>
        `;

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => closeBtn.focus(), 60);
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.details-link');
        if (!btn) return;
        openProjectDetails(btn);
    });

    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        projectModalLastDetailsButton = null;
        if (lastFocusedEl) {
            try { lastFocusedEl.focus(); } catch (_) { /* ignore */ }
            lastFocusedEl = null;
        }
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    modal.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active') || e.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null);
        if (focusable.length < 2) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
    });

    refreshProjectModalContent = function () {
        if (projectModalLastDetailsButton) {
            openProjectDetails(projectModalLastDetailsButton);
        }
    };
}

function tForm(key) {
    const lang = currentLanguage || 'en';
    if (translations[lang] && translations[lang][key]) return translations[lang][key];
    if (translations.en && translations.en[key]) return translations.en[key];
    return key;
}

function showMailtoFallback(status, mailto) {
    status.textContent = '';
    status.style.color = '#27ae60';

    const p = document.createElement('p');
    p.className = 'form-status-msg';
    p.textContent = tForm('form-mailto-success');

    const link = document.createElement('a');
    link.href = mailto;
    link.className = 'form-mailto-link';
    link.textContent = tForm('form-mailto-open-link');
    link.rel = 'noopener noreferrer';

    status.appendChild(p);
    status.appendChild(link);

    const trigger = document.createElement('a');
    trigger.href = mailto;
    trigger.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none';
    document.body.appendChild(trigger);
    trigger.click();
    setTimeout(() => {
        if (trigger.parentNode) trigger.parentNode.removeChild(trigger);
    }, 0);
}

function initializeContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const name = (formData.get('name') || '').trim();
        const emailFrom = (formData.get('email') || '').trim();
        const message = (formData.get('message') || '').trim();

        const web3Key = (
            form.getAttribute('data-web3forms-access-key') ||
            (typeof window !== 'undefined' && window.__WEB3FORMS_ACCESS_KEY__) ||
            ''
        ).trim();
        const formId = (form.getAttribute('data-formspree') || '').trim();

        if (web3Key) {
            status.textContent = tForm('form-sending');
            status.style.color = '';
            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_key: web3Key,
                        subject: `Portfolio contact: ${name || 'Visitor'}`,
                        name,
                        email: emailFrom,
                        message,
                    }),
                });
                const data = await res.json().catch(() => ({}));
                if (data.success) {
                    status.textContent = tForm('form-success');
                    status.style.color = '#27ae60';
                    form.reset();
                } else {
                    const msg = data.message || JSON.stringify(data);
                    status.textContent = `${tForm('form-error')} (${msg})`;
                    status.style.color = '#e74c3c';
                }
            } catch (err) {
                status.textContent = tForm('form-error');
                status.style.color = '#e74c3c';
            }
            return;
        }

        if (formId) {
            formData.append('_subject', `Portfolio contact: ${name}`.trim() || 'Portfolio contact form');

            status.textContent = tForm('form-sending');
            status.style.color = '';

            try {
                const res = await fetch(`https://formspree.io/f/${encodeURIComponent(formId)}`, {
                    method: 'POST',
                    body: formData,
                    headers: { Accept: 'application/json' },
                });

                const payload = await res.json().catch(() => ({}));

                if (res.ok) {
                    status.textContent = tForm('form-success');
                    status.style.color = '#27ae60';
                    form.reset();
                } else {
                    const detail = payload.error || payload.errors?.map((x) => x.message).join(' ') || res.statusText;
                    status.textContent = `${tForm('form-error')}${detail ? ` (${detail})` : ''}`;
                    status.style.color = '#e74c3c';
                }
            } catch (err) {
                status.textContent = tForm('form-error');
                status.style.color = '#e74c3c';
            }
            return;
        }

        const toEmail = (form.getAttribute('data-contact-email') || 'sawsan.abdulbari@gmail.com').trim();
        if (!toEmail) {
            status.textContent = tForm('form-not-configured');
            status.style.color = '#e74c3c';
            return;
        }

        const subject = `Portfolio contact: ${name || 'Visitor'}`;
        const bodyLines = [
            `Name: ${name}`,
            `Reply-to: ${emailFrom}`,
            '',
            message,
        ];
        const mailto = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        if (mailto.length > 2048) {
            status.textContent = tForm('form-error');
            status.style.color = '#e74c3c';
            return;
        }

        showMailtoFallback(status, mailto);
    });
}

// Stat Counters Animation
function initializeStatCounters() {
    const stats = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateValue(entry.target, 0, target, 2000);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    stats.forEach(stat => observer.observe(stat));

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            obj.innerHTML = value + (end === 15 || end === 80 ? '+' : '');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
}

// Project Filtering Logic
function initializeProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                const raw = (card.getAttribute('data-category') || '').trim();
                const categories = raw ? raw.split(/\s+/).filter(Boolean) : [];
                if (filter === 'all' || categories.includes(filter)) {
                    card.classList.remove('hidden');
                    setTimeout(() => {
                        card.style.display = 'block';
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                        card.classList.add('hidden');
                    }, 500);
                }
            });
        });
    });
}

// Static FAQ replies (per site language) — matches portfolio content
const CHAT_KNOWLEDGE_BASE = {
    fi: {
        help: 'Olen sivuston pikavastain—en erillistä kielimallia. Voin kertoa taidoista, kokemuksesta, koulutuksesta, kielistä, yhteystiedoista ja nimetyistä projekteista. Kokeile painikkeita tai kirjoita esim. Data Diwan, Kiva, COVID, RAG, PIRHA, tunnetunnistus, Kalifornia-asunnot, setelit, hiilipetos, resepti, puu—avaan tietoikkunan kun tunnistan projektin.',
        skills: 'Sawsanilla on vahva osaaminen koneoppimisessa (PyTorch, TensorFlow, Scikit-learn), datatieteessä (Pandas, Plotly) ja RAG-arkkitehtuureissa.',
        experience: 'Hänellä on yli 3 vuotta kokemusta, ja Omdenalla hän on toiminut teknisenä yhteistyökumppanina globaaleissa tiimeissä (15+ osallistujaa), maailmanlaajuisesti jakautuneissa projekteissa.',
        contact: 'Voit ottaa yhteyttä Sawsaniin sähköpostitse: sawsan.abdulbari@gmail.com tai LinkedInin kautta.',
        education: 'Sawsan on suorittanut Tietojenkäsittely tradenomi -tutkinnon (Data Science) HAMKissa, Google Data Analytics -spesialisoinnin, Climate Change AI (CCAI) -kesäkoulun ja Liiketoiminnan perustutkinnon Tredussa.',
        languages: 'Hän puhuu sujuvasti suomea, englantia ja arabiaa (äidinkieli).',
        projects: 'Hänellä on 15 merkittävää projektia. Kokeile nimiä: Data Diwan, Kiva, COVID, RAG, tunnetunnistus, hiilipetos, PIRHA, resepti, Kalifornia, seteli, NYC-taksi, segmentointi, e-commerce, uutisdashboard, mobiilinen sovellus, puu.',
        project_datadiwan: { text: 'Data Diwan on treidausjärjestelmä (Vite, Supabase) riski- ja sääntötietoiseen päätöksentekoon—ei myytyjä signaaleja. Avaan tiedot...', action: 'project-dd' },
        project_kiva: { text: 'Kiva-laina dashboard analysoi 670k+ mikrolainaa globaalisti. Avaan projektin tiedot sinulle...', action: 'project1' },
        project_covid: { text: 'COVID-19 ennustejärjestelmä toimitti kriittisiä ennusteita Sambian terveydenhuollolle. Avaan tiedot...', action: 'project2' },
        project_housing: { text: 'Kalifornian asuntojen hintaennustin: regressio ja geospatia. Avaan tiedot...', action: 'project3' },
        project_rag: { text: 'RAG-dokumenttichatbot: FAISS-haku ja avoimen lähdekoodin LLM-polku. Avaan tiedot...', action: 'project8' },
        project_bank: { text: 'Setelien autenttisuus: SVM, k-NN, päätöspuu UCI-datasetillä. Avaan tiedot...', action: 'project6' },
        project_emotion: { text: 'Tunnetunnistus: EfficientNet-B0, FER/RAF, mobiilivalmius. Avaan tiedot...', action: 'project10' },
        project_carbon: { text: 'Hiilipetosten havaitsemisverkosto käyttää monimutkaista AI-agenttiverkostoa. Avaan tiedot...', action: 'project11' },
        project_recipe: { text: 'AI Recipe Finder käyttää Whisperia ja Groqia reseptien luomiseen puheesta. Avaan tiedot...', action: 'project12' },
        project_pirha: { text: 'PIRHA-projekti on kuntoutumisopas, joka on toteutettu Pirkanmaan hyvinvointialueelle. Avaan tiedot...', action: 'project13' },
        project_tree: { text: 'Puun lajitunnistin on koneoppimiseen perustuva sovellus lajien tunnistamiseen. Avaan tiedot...', action: 'project14' },
        default: 'Kiitos! Valitse painike tai nimeä projekti (esim. Data Diwan, RAG, Kiva). Voin kertoa myös taidoista, työkokemuksesta ja yhteystiedoista.'
    },
    en: {
        help: 'I am a small FAQ for this portfolio—not a generative chat model. I can summarize skills, experience, education, languages, how to contact Sawsan, and **named projects**. Use the chips, or type a name (e.g. Data Diwan, Kiva, RAG, COVID, PIRHA, housing, bank note, emotion, tree). I will open the project details when I recognize a match.',
        skills: 'Sawsan has deep expertise in Machine Learning (PyTorch, TensorFlow, Scikit-learn), Data Science (Pandas, Plotly), and production-grade RAG architectures.',
        experience: 'She has 3+ years of technical experience at Omdena, working in a global team of 15+ contributors and collaborating in globally distributed teams on AI projects.',
        contact: 'You can reach Sawsan via email at sawsan.abdulbari@gmail.com or connect with her on LinkedIn for professional inquiries.',
        education: 'Sawsan holds a Bachelor of Business IT (Data Science) from HAMK (Grade 4.7/5), the Google Data Analytics Specialization, and the Climate Change AI (CCAI) Summer School.',
        languages: 'She is trilingual, with professional fluency in Finnish, English, and Arabic (Native).',
        projects: 'She has delivered 15 notable projects (AI/ML, data, and product). Try a name: Data Diwan, Kiva, COVID, California housing, RAG / document chat, bank note, carbon fraud, e-commerce, news sentiment, mobile emotion, recipe, PIRHA, or Tree Classifier.',
        project_datadiwan: { text: 'Data Diwan is a trading app (Vite, Supabase) for risk-aware, rule-based decisions—not selling trade signals. Opening details...', action: 'project-dd' },
        project_kiva: { text: 'The Kiva Loan dashboard analyzed 670k+ microloans globally. Opening the project details for you...', action: 'project1' },
        project_covid: { text: 'The COVID-19 project (Kitwe / Zambia, Omdena) uses XGBoost models and a Streamlit app, with MAE, RMSE, and R² in the public repo. Opening details...', action: 'project2' },
        project_housing: { text: 'California Housing Price Predictor: regression with geospatial context. Opening details...', action: 'project3' },
        project_rag: { text: 'Smart Document Chatbot with RAG: FAISS retrieval and an open-LLM path. Opening details...', action: 'project8' },
        project_bank: { text: 'Bank note authentication: SVM, k-NN, trees on the UCI banknote set. Opening details...', action: 'project6' },
        project_emotion: { text: 'Emotion recognition: EfficientNet-B0, FER-2013/RAF-DB, mobile path. Opening details...', action: 'project10' },
        project_carbon: { text: 'The Carbon Fraud network uses a multi-agent consensus architecture to automate verification. Opening details...', action: 'project11' },
        project_recipe: { text: 'AI Recipe Finder leverages Whisper and Groq for real-time voice-to-recipe generation. Opening details...', action: 'project12' },
        project_pirha: { text: 'The PIRHA project is a healthcare rehabilitation guide for the Pirkanmaa region. Opening details...', action: 'project13' },
        project_tree: { text: 'The Tree Classifier is a production-ready ML app for species identification. Opening details...', action: 'project14' },
        default: 'Thanks! Try the chips, or name a project (Data Diwan, RAG, Kiva, PIRHA…), or ask about skills, work experience, education, or contact.'
    },
    ar: {
        help: 'أنا مساعد أسئلة شائعة لهذا الموقع—لست نموذج محادثة توليديًا. أستطيع تلخيص المهارات والخبرة والتعليم واللغات وطريقة التواصل، والمشاريع عند **ذكر اسمها** استخدم الأزرار أو اكتب اسم المشروع (Data Diwan، Kiva، RAG…).',
        skills: 'تمتلك سوسن خبرة عميقة في تعلّم الآلة (PyTorch وTensorFlow وScikit-learn) وعلم البيانات (Pandas وPlotly) وهندسة RAG المخصصة للإنتاج.',
        experience: 'لديها أكثر من 3 سنوات من الخبرة التقنية في Omdena، وعملت ضمن فريق عالمي من أكثر من 15 مُساهمًا وتعاونت في فرق موزّعة عالميًا في مشاريع ذكاء اصطناعي.',
        contact: 'يمكنكم التواصل مع سوسن عبر البريد: sawsan.abdulbari@gmail.com أو عبر LinkedIn للاستفسارات المهنية.',
        education: 'تحمل سوسن درجة البكالوريوس في تقنية معلومات الأعمال (علم البيانات) من HAMK بتقدير 4.7/5، وتخصص Google Data Analytics، والمدرسة الصيفية للذكاء الاصطناعي والتغيّر المناخي (CCAI).',
        languages: 'تتحدث ثلاث لغات بطلاقة: الفنلندية، الإنجليزية، والعربية (اللغة الأم).',
        projects: '15 مشروعًا بارزًا. جرّب أسماء مثل: Data Diwan، كيفا، كوفيد، مساكن كاليفورنيا، RAG، أوراق نقدية، احتيال كربون، تجارة إلكترونية، مشاعر/هاتف، PIRHA، أشجار…',
        project_datadiwan: { text: 'داتا ديوان تطبيق تداول (Vite وSupabase) يركّز على المخاطرة والقواعد—لا بيع إشارات جاهزة. سأفتح التفاصيل...', action: 'project-dd' },
        project_kiva: { text: 'حللت لوحة قروض كيفا أكثر من 670 ألف قرض صغير عالميًا. سأفتح لك تفاصيل المشروع...', action: 'project1' },
        project_covid: { text: 'مشروع كوفيد (كيتوي/زامبيا، أومدينا) يستخدم نماذج XGBoost وستريملت، والتحقق بـMAE وRMSE وR² في المستودع. سأفتح التفاصيل...', action: 'project2' },
        project_housing: { text: 'متنبّئ أسعار المساكن في كاليفورنيا: انحدار مع سياق جغرافي. سأفتح التفاصيل...', action: 'project3' },
        project_rag: { text: 'روبوت وثائق بـRAG: استرجاع FAISS ومسار نموذج مفتوح. سأفتح التفاصيل...', action: 'project8' },
        project_bank: { text: 'التحقق من الأوراق النقدية: SVM وk-NN وأشجار على مجموعة UCI. سأفتح التفاصيل...', action: 'project6' },
        project_emotion: { text: 'التعرّف على المشاعر: EfficientNet-B0 وFER/RAF. سأفتح التفاصيل...', action: 'project10' },
        project_carbon: { text: 'تستخدم شبكة احتيال الكربون بنية وكلاء إجماع لأتمتة التحقق. سأفتح التفاصيل...', action: 'project11' },
        project_recipe: { text: 'باحث الوصفات يستخدم Whisper وGroq للتوليد الصوتي اللحظي. سأفتح التفاصيل...', action: 'project12' },
        project_pirha: { text: 'مشروع PIRHA هو دليل تأهيل صحي لمنطقة بيركانما في فنلندا. سأفتح التفاصيل...', action: 'project13' },
        project_tree: { text: 'مصنف الأشجار هو تطبيق تعلّم آلي جاهز للإنتاج لتحديد الأنواع. سأفتح التفاصيل...', action: 'project14' },
        default: 'شكرًا! جرّب الأزرار أو اكتب اسم مشروع (Data Diwan، RAG، كيفا…)، أو اسأل عن المهارات أو الخبرة أو التواصل.'
    }
};

function getChatReplyIntent(intent) {
    const lang = currentLanguage || 'en';
    const pack = CHAT_KNOWLEDGE_BASE[lang] || CHAT_KNOWLEDGE_BASE.en;
    return pack[intent] || pack.default;
}

function detectChatIntent(raw) {
    const s = raw.toLowerCase().trim();

    const isHelpQuery =
        s === 'help' ||
        s === 'apua' ||
        s === '؟' ||
        s.includes('mitä voit tehdä') ||
        s.includes('miten tämä toimii') ||
        s.includes('mitä osaat') ||
        s.includes('mitä kysyä') ||
        s.includes('what can you do') ||
        s.includes('what can this') ||
        s.includes('how does this work') ||
        s.includes('how do i use') ||
        s.includes('mikä olet') ||
        s.includes('ماذا تستطيع') ||
        s.includes('ماذا تفعل') ||
        s.includes('كيف تستخدم') ||
        s.includes('كيف يعمل');
    if (isHelpQuery) return 'help';

    // Project: Data Diwan & trading
    if (s.includes('datadiwan.com') || s.includes('datadiwan') || s.includes('data diwan') || (s.includes('داتا') && s.includes('ديوان'))) {
        return 'project_datadiwan';
    }
    if (s.includes('trading app') && (s.includes('data') || s.includes('sawsan') || s.includes('saws'))) return 'project_datadiwan';
    if (s.includes('position sizing') && s.includes('trading')) return 'project_datadiwan';
    if (s.includes('treidausjärjestelm') || (s.includes('trading system') && s.includes('data diwan'))) {
        return 'project_datadiwan';
    }

    if (s.includes('kiva')) return 'project_kiva';
    if (s.includes('covid')) return 'project_covid';

    if (s.includes('california') && s.includes('hous')) return 'project_housing';
    if (s.includes('asunto') && s.includes('kaliforn')) return 'project_housing';

    if (s === 'rag') return 'project_rag';
    if (s.includes('faiss') || s.includes('document chat') || (s.includes('document') && s.includes('chatbot') && s.includes('ai'))) {
        return 'project_rag';
    }
    if (s.includes('rag') && (s.includes('document') || s.includes('dokument') || s.includes('dokumentti'))) return 'project_rag';
    if (s.includes('smart') && s.includes('document') && s.includes('chat')) return 'project_rag';

    if (s.includes('efficientnet') || s.includes('tunnetunnist') || s.includes('emotion recognit') || s.includes('fer-2013') || s.includes('raf-db')) {
        return 'project_emotion';
    }
    if (s.includes('emotion') && (s.includes('face') || s.includes('tunne') || s.includes('fer') || s.includes('mobile') || s.includes('mobiil'))) {
        return 'project_emotion';
    }

    if (s.includes('bank note') || s.includes('banknote') || (s.includes('seteli') && (s.includes('tarkist') || s.includes('autent') || s.includes('svm') || s.includes('uci')))) {
        return 'project_bank';
    }

    if (s.includes('carbon') || s.includes('hiili') || s.includes('كربون')) return 'project_carbon';
    if (s.includes('recipe') || s.includes('resepti') || s.includes('وصفات') || (s.includes('whisper') && s.includes('recipe'))) return 'project_recipe';
    if (s.includes('pirha') || s.includes('kuntoutum') || s.includes('rehabilitation')) return 'project_pirha';

    if (s.includes('lajitunnist') || s.includes('tree classifier') || s.includes('species identif')) return 'project_tree';
    if (s.includes('mobiil') && s.includes('puu') && s.includes('laj')) return 'project_tree';
    if (s.includes('classifier') && s.includes('puu') && !s.includes('decision')) return 'project_tree';
    if (s.includes('أشجار') && s.includes('تصنيف')) return 'project_tree';

    if (
        s.includes('skill') ||
        s.includes('taito') ||
        s.includes('مهار') ||
        s.includes('pytorch') ||
        s.includes('tensorflow') ||
        s.includes('scikit') ||
        s.includes('pandas') ||
        s.includes('koneoppiminen') ||
        (s.includes('rag') && s.includes('architectur')) ||
        (s.includes('retrieval') && s.includes('augment'))
    ) {
        return 'skills';
    }
    if (
        s.includes('education') ||
        s.includes('koulutus') ||
        s.includes('opiskelu') ||
        s.includes('university') ||
        s.includes('degree') ||
        s.includes('hamk') ||
        s.includes('tredu') ||
        s.includes('دراسة') ||
        s.includes('جامعة') ||
        s.includes('تعليم')
    ) {
        return 'education';
    }
    if (
        s.includes('language') ||
        s.includes('kieli') ||
        s.includes('suomi') ||
        s.includes('english') ||
        s.includes('arabic') ||
        s.includes('finnish') ||
        s.includes('لغة') ||
        s.includes('عربي') ||
        s.includes('فنلندي')
    ) {
        return 'languages';
    }
    if (
        s.includes('experience') ||
        s.includes('kokemus') ||
        s.includes('työ') ||
        s.includes('work') ||
        s.includes('job') ||
        s.includes('lead') ||
        s.includes('omdena') ||
        s.includes('خبرة') ||
        s.includes('عمل') ||
        s.includes('وظيفة')
    ) {
        return 'experience';
    }
    if (
        s.includes('contact') ||
        s.includes('yhteys') ||
        s.includes('email') ||
        s.includes('sähköposti') ||
        s.includes('linkedin') ||
        s.includes('mailto') ||
        s.includes('gmail') ||
        s.includes('تواصل') ||
        s.includes('بريد') ||
        s.includes('إيميل') ||
        s.includes('لينكد')
    ) {
        return 'contact';
    }
    if (
        s.includes('project') ||
        s.includes('projekti') ||
        s.includes('carbon') ||
        s.includes('covid') ||
        s.includes('dashboard') ||
        s.includes('pirha') ||
        s.includes('kuntoutum') ||
        s.includes('rehabilitation') ||
        s.includes('tree') ||
        s.includes('classifier') ||
        s.includes('mobile') ||
        s.includes('mobiili') ||
        s.includes('mobiil') ||
        s.includes('هاتف') ||
        s.includes('موبايل') ||
        s.includes('lajitunnist') ||
        s.includes('أشجار') ||
        s.includes('تصنيف') ||
        s.includes('مشروع') ||
        s.includes('مشاريع')
    ) {
        return 'projects';
    }
    return null;
}

function getChatReplyFromText(userText) {
    const intent = detectChatIntent(userText);
    if (intent) return getChatReplyIntent(intent);
    return getChatReplyIntent('default');
}

// Chatbot Logic
function initializeChatBot() {
    const toggle = document.getElementById('chat-toggle');
    const windowEl = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close');
    const clearBtn = document.getElementById('chat-clear');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    const sendBtn = document.getElementById('chat-send');

    if (!toggle || !windowEl || !input || !messages || !sendBtn) return;

    function closeChat() {
        windowEl.classList.remove('active');
        windowEl.setAttribute('aria-hidden', 'true');
    }

    function openChat() {
        windowEl.classList.add('active');
        windowEl.setAttribute('aria-hidden', 'false');
        setTimeout(() => input.focus(), 100);
    }

    toggle.addEventListener('click', openChat);

    if (closeBtn) closeBtn.addEventListener('click', closeChat);

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!windowEl.classList.contains('active')) return;
        closeChat();
    });

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        const p = document.createElement('p');
        p.textContent = text;
        msgDiv.appendChild(p);
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    function removeTypingIndicator() {
        document.getElementById('chat-typing-indicator')?.remove();
    }

    function showTypingIndicator() {
        removeTypingIndicator();
        const L = (typeof translations !== 'undefined' && (translations[currentLanguage] || translations.en)) || {};
        const el = document.createElement('div');
        el.className = 'message bot chat-typing-msg';
        el.id = 'chat-typing-indicator';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-label', L['chat-typing'] || '…');

        const dots = document.createElement('div');
        dots.className = 'typing-dots';
        dots.setAttribute('aria-hidden', 'true');
        dots.innerHTML = '<span></span><span></span><span></span>';

        el.appendChild(dots);
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight;
    }

    function resetChatMessages() {
        messages.innerHTML = '';
        const row = document.createElement('div');
        row.className = 'message bot';
        const p = document.createElement('p');
        p.setAttribute('data-key', 'chat-greeting');
        const lang = currentLanguage || 'en';
        p.textContent =
            translations[lang] && translations[lang]['chat-greeting']
                ? translations[lang]['chat-greeting']
                : translations.en['chat-greeting'];
        row.appendChild(p);
        messages.appendChild(row);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            resetChatMessages();
            input.focus();
        });
    }

    function runBotReply(intent) {
        showTypingIndicator();
        window.setTimeout(() => {
            removeTypingIndicator();
            const reply = getChatReplyIntent(intent);
            
            if (typeof reply === 'object') {
                appendMessage('bot', reply.text);
                if (reply.action) {
                    setTimeout(() => {
                        const projectBtn = document.querySelector(`.details-link[data-project="${reply.action}"]`);
                        if (projectBtn) {
                            projectBtn.click();
                            closeChat();
                        }
                    }, 1000);
                }
            } else {
                appendMessage('bot', reply);
            }
        }, 1000);
    }

    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        appendMessage('user', text);
        input.value = '';

        showTypingIndicator();
        window.setTimeout(() => {
            removeTypingIndicator();
            const reply = getChatReplyFromText(text);
            
            if (typeof reply === 'object') {
                appendMessage('bot', reply.text);
                if (reply.action) {
                    setTimeout(() => {
                        const projectBtn = document.querySelector(`.details-link[data-project="${reply.action}"]`);
                        if (projectBtn) {
                            projectBtn.click();
                            closeChat();
                        }
                    }, 1000);
                }
            } else {
                appendMessage('bot', reply);
            }
        }, 1000);
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Delegate chip clicks
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.chat-chip[data-intent]');
        if (!chip) return;
        
        const intent = chip.getAttribute('data-intent');
        const label = chip.textContent.trim();
        appendMessage('user', label);
        runBotReply(intent);
    });
}

// Scroll Progress Bar
function initializeScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        progressBar.style.width = `${progress}%`;
    }, { passive: true });
}

// ScrollSpy: Highlight active navigation link based on scroll position
function initializeScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

// Initialize all functionality when DOM is loaded
function initializeExperienceEarlierDetails() {
    const prefersReduce =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pendingOpenTimeoutIds = new WeakMap();

    const clearOpenTimeouts = (el) => {
        const ids = pendingOpenTimeoutIds.get(el);
        if (ids && ids.length) {
            ids.forEach(clearTimeout);
        }
        pendingOpenTimeoutIds.delete(el);
    };

    document.querySelectorAll('[data-experience-details]').forEach((el) => {
        el.addEventListener('toggle', () => {
            const items = el.querySelectorAll('.experience-earlier-inner .experience-item');
            if (!el.open) {
                clearOpenTimeouts(el);
                items.forEach((item) => item.classList.remove('animate-in'));
                return;
            }
            clearOpenTimeouts(el);
            if (prefersReduce) {
                items.forEach((item) => item.classList.add('animate-in'));
                return;
            }
            const ids = [];
            pendingOpenTimeoutIds.set(el, ids);
            items.forEach((item, index) => {
                ids.push(
                    setTimeout(() => {
                        if (!el.open) return;
                        item.classList.add('animate-in');
                    }, index * 70)
                );
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeHeroParticles();
    initializeScrollProgress();
    initializeScrollSpy();
    initializeLanguageDropdown();
    initializeLanguage();
    initializeProjectImageFallbacks();
    initializeExperienceEarlierDetails();
    initializeNavigation();
    initializeSkillsChartWhenVisible();
    initializeModals();
    initializeContactForm();
    initializeStatCounters();
    initializeProjectFilters();
    initializeChatBot();
    initializeSmoothScrolling();
    initializeNavbarScroll();
    initializeBackToTop();
    initializeScrollAnimations();
    initializeTypingAnimation();
    initializeMicroInteractions();
});

// Handle window resize
window.addEventListener('resize', () => {
    // Close mobile menu on resize
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
});


// Enhanced micro-interactions
function initializeMicroInteractions() {
    // Enhanced button hover effects with ripple
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function(e) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            this.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });
    });
    
    // Enhanced skill items hover effect
    document.querySelectorAll('.skill-category, .stat-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0, 123, 255, 0.2)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Enhanced project cards hover effect
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 25px 50px rgba(0, 123, 255, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 15px 30px rgba(0, 123, 255, 0.2)';
        });
    });
    
    const langToggle = document.getElementById('lang-dropdown-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', function () {
            this.style.animation = 'pulse 0.3s ease-in-out';
            setTimeout(() => {
                this.style.animation = '';
            }, 300);
        });
    }
    
    // Add floating animation to highlight items
    document.querySelectorAll('.highlight-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.2}s`;
        item.style.animation = 'float 3s ease-in-out infinite';
    });
}





// Add CSS animations dynamically
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .skill-item, .stat-item, .project-card {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .navbar {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .highlight-item {
            animation: float 3s ease-in-out infinite;
        }
        
        .hero-title {
            animation: fadeInUp 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
    `;
    document.head.appendChild(style);
}

