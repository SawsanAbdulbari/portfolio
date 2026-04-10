// Current language (default: English; localStorage overrides)
let currentLanguage = 'en';

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
                entry.target.classList.add('animate-in');
                
                // Add staggered animation for children
                const children = entry.target.querySelectorAll('.skill-item, .stat-item, .project-card, .experience-item, .highlight-item, .interest-item, .education-item');
                children.forEach((child, index) => {
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
    project1: {
        title: { fi: '🏦 Kiva-laina EDA Dashboard', en: '🏦 Kiva Loan EDA Dashboard', ar: '🏦 لوحة تحليل استكشافي لقروض كيفا' },
        metrics: { 'Data Points': '670k+', 'Tools': 'Streamlit, Plotly', 'Type': 'Exploratory Data Analysis' },
        impact: { fi: 'Analysoi mikrolainojen jakautumista globaalisti auttaen tunnistamaan rahoitusvajeita.', en: 'Analyzed microloan distribution globally to identify funding gaps and demographic trends.', ar: 'تحليل توزيع القروض الصغيرة عالميًا لمعرفة فجوات التمويل والاتجاهات السكانية.' },
        tech: ['Python', 'Pandas', 'Plotly', 'Streamlit']
    },
    project2: {
        title: { fi: '🦠 COVID-19-tapausten ennustejärjestelmä', en: '🦠 COVID-19 Case Prediction System', ar: '🦠 نظام تنبؤ بحالات كوفيد-19' },
        metrics: { 'Model': 'LSTM / Prophet', 'Horizon': '30 Days', 'Goal': 'Healthcare Planning' },
        impact: { fi: 'Toimitti kriittisiä ennusteita terveydenhuollon infrastruktuurin suunnitteluun Sambiassa.', en: 'Provided critical forecasts for healthcare infrastructure planning in Zambia during the pandemic.', ar: 'تنبؤات حرجة لتخطيط البنية التحتية الصحية في زامبيا أثناء الجائحة.' },
        tech: ['TensorFlow', 'Scikit-learn', 'Prophet', 'Python']
    },
    project3: {
        title: { fi: '🏠 Kalifornian asuntojen hintojen ennustin', en: '🏠 California Housing Price Predictor', ar: '🏠 مُتنبّئ بأسعار المساكن في كاليفورنيا' },
        metrics: { 'Algorithm': 'Random Forest', 'RMSE': 'Low', 'Feature Engineering': 'Geospatial' },
        impact: { fi: 'Ennustaa asuntojen hintoja tarkasti sijainnin ja muiden ominaisuuksien perusteella.', en: 'Predicts housing prices accurately based on location and other features using regression.', ar: 'يتنبّأ بأسعار المساكن بدقة من الموقع والميزات باستخدام الانحدار.' },
        tech: ['Python', 'Scikit-learn', 'Pandas', 'Matplotlib']
    },
    project4: {
        title: { fi: '👥 Asiakassegmentointi Dashboard', en: '👥 Customer Segmentation Dashboard', ar: '👥 لوحة تجزئة العملاء' },
        metrics: { 'Method': 'K-Means Clustering', 'RFM Score': 'Implemented', 'Optimization': 'Elbow Method' },
        impact: { fi: 'Auttaa yrityksiä kohdentamaan markkinointia tunnistamalla erilaisia asiakasryhmiä.', en: 'Helps businesses target marketing by identifying distinct customer segments using behavioral data.', ar: 'يساعد على استهداف التسويق عبر تحديد شرائح عملاء بواسطة سلوكهم.' },
        tech: ['Python', 'Scikit-learn', 'Plotly', 'Streamlit']
    },
    project5: {
        title: { fi: '🚕 NYC-taksimatkan keston ennustin', en: '🚕 NYC Taxi Trip Duration Prediction', ar: '🚕 تنبؤ بمدة رحلات التاكسي في نيويورك' },
        metrics: { 'Algorithm': 'XGBoost', 'Training Set': '1.4M rows', 'Performance': 'High Accuracy' },
        impact: { fi: 'Optimoi reittisuunnittelua ja matka-ajan arviointia suurkaupunkiympäristössä.', en: 'Optimized route planning and travel time estimation in a complex urban environment.', ar: 'يُحسّن تخطيط المسارات وتقدير مدة الرحلة في بيئة حضرية معقدة.' },
        tech: ['Python', 'XGBoost', 'Folium', 'Pandas']
    },
    project6: {
        title: { fi: '💵 Setelien autenttisuuden tarkistus', en: '💵 Bank Note Authentication', ar: '💵 التحقق من أصالة الأوراق النقدية' },
        metrics: { 'Accuracy': '99.5%', 'Algorithm': 'Random Forest', 'Data': 'Wavelet Transformed' },
        impact: { fi: 'Tunnistaa väärennetyt setelit erittäin tarkasti parantaen taloudellista turvallisuutta.', en: 'Identifies counterfeit banknotes with high precision, enhancing financial security.', ar: 'كشف الأوراق المزيفة بدقة عالية لتعزيز الأمن المالي.' },
        tech: ['Python', 'Random Forest', 'OpenCV', 'Streamlit']
    },
    project7: {
        title: { fi: '🛒 E-commerce-analytiikka Dashboard', en: '🛒 E-commerce Analytics Dashboard', ar: '🛒 لوحة تحليلات التجارة الإلكترونية' },
        metrics: { 'Visuals': '15+ Charts', 'KPIs': 'CLV, Churn, Revenue', 'Interactivity': 'Full' },
        impact: { fi: 'Tarjoaa kattavan näkymän myyntiin ja asiakkaiden käyttäytymiseen.', en: 'Provides a comprehensive view of sales performance and customer behavior patterns.', ar: 'رؤية شاملة للمبيعات وسلوك العملاء.' },
        tech: ['Python', 'Pandas', 'Plotly', 'Streamlit']
    },
    project8: {
        title: { fi: '🤖 Älykäs AI-dokumentti Chatbot RAG:lla', en: '🤖 Smart AI Document Chatbot with RAG', ar: '🤖 روبوت محادثة ذكي للوثائق مع RAG' },
        metrics: { 'Architecture': 'RAG', 'Vector Store': 'FAISS/Chroma', 'LLM': 'OpenAI GPT-4' },
        impact: { fi: 'Mahdollistaa luonnollisen kielen keskustelut omien dokumenttien kanssa kontekstitietoisesti.', en: 'Enables natural language conversations with private documents using context-aware retrieval.', ar: 'يُمكّن محادثات بلغة طبيعية مع مستنداتك عبر استرجاع يدرك السياق.' },
        tech: ['Python', 'OpenAI', 'LangChain', 'Streamlit']
    },
    project9: {
        title: { fi: '📰 Uutisten sentimentti- ja avainsana-analyysi Dashboard', en: '📰 News Sentiment & Keyword Analysis Dashboard', ar: '📰 لوحة تحليل المشاعر والكلمات المفتاحية في الأخبار' },
        metrics: { 'Analysis': 'VADER Sentiment', 'Extraction': 'RAKE/NLTK', 'Real-time': 'API Integration' },
        impact: { fi: 'Seuraa yleistä mielipidettä ja keskeisiä puheenaiheita uutisvirrasta automaattisesti.', en: 'Tracks public sentiment and key talking points from news feeds automatically.', ar: 'تتبع المشاعر العامة والموضوعات الرئيسية من الأخبار تلقائيًا.' },
        tech: ['Python', 'NLTK', 'Pandas', 'Streamlit']
    },
    project10: {
        title: { fi: '😊 Tunnetunnistusprojekti', en: '😊 Emotion Recognition Project', ar: '😊 مشروع التعرف على المشاعر' },
        metrics: { 'Backbone': 'EfficientNet-B0', 'Quantization': 'INT8', 'Inference': 'Real-time' },
        impact: { fi: 'Tunnistaa ihmisen tunteet videokuvasta reaaliajassa mobiililaitteilla.', en: 'Recognizes human emotions from video in real-time on mobile devices.', ar: 'التعرف على المشاعر من الفيديو في الوقت الفعلي على الأجهزة المحمولة.' },
        tech: ['Python', 'PyTorch', 'EfficientNet', 'OpenCV']
    },
    project11: {
        title: { fi: '🌱 Hiilipetosten löytö järjestelmä', en: '🌱 Carbon Fraud Detection Network', ar: '🌱 شبكة كشف احتيال أسواق الكربون' },
        metrics: { 'System': 'Multi-Agent AI', 'APIs': 'CLIMATIQ, OpenWeather', 'Database': 'PostgreSQL' },
        impact: { fi: 'Havaitsee reaaliaikaisesti petoksia hiilimarkkinoilla monimutkaisen tekoälyverkoston avulla.', en: 'Detects real-time fraud in carbon markets using a complex network of AI agents.', ar: 'كشف احتيال الكربون لحظيًا عبر شبكة وكلاء ذكاء اصطناعي.' },
        tech: ['Python', 'FastAPI', 'Google Cloud', 'Vertex AI']
    },
    project12: {
        title: { fi: '🍳 AI Recipe Finder', en: '🍳 AI Recipe Finder', ar: '🍳 الباحث عن الوصفات بالذكاء الاصطناعي' },
        metrics: { 'Speech': 'Whisper', 'LLM': 'Groq / FLAN-T5', 'UI': 'Gradio' },
        impact: { fi: 'Luo reseptejä puheen perusteella helpottaen ruoanlaiton suunnittelua.', en: 'Generates recipes based on voice input, simplifying meal planning.', ar: 'توليد وصفات من الإدخال الصوتي لتسهيل تخطيط الوجبات.' },
        tech: ['Python', 'Whisper', 'Groq', 'Gradio']
    },
    project13: {
        title: {
            fi: '🏥 PIRHA: Kuntoutumisopas toimenpidettä edeltäen',
            en: '🏥 PIRHA Pre-Procedure Rehabilitation Guide',
            ar: '🏥 دليل PIRHA للتأهيل قبل الإجراء'
        },
        metrics: { 'Region': 'Pirkanmaa (PIRHA), Tampere, Finland', 'Deployment': 'Vercel', 'Type': 'Public health ICT' },
        impact: {
            fi: 'Tukee potilaita ja läheisiä toimenpidettä edeltävässä kuntoutumisessa Pirkanmaan hyvinvointialueella.',
            en: 'Supports patients and families with pre-procedure rehabilitation guidance for the Pirkanmaa wellbeing region.',
            ar: 'يدعم المرضى والعائلات بتوجيه التأهيل قبل الإجراء في منطقة بيركانما لرفاهية السكان.'
        },
        tech: ['Vercel', 'Web', 'Accessibility']
    },
    project14: {
        title: {
            fi: '🌳 Puun lajitunnistin',
            en: '🌳 Tree Classifier',
            ar: '🌳 مُصنّف أشجار'
        },
        metrics: { 'Deployment': 'Vercel', 'Type': 'Species classification', 'Platforms': 'Web, Mobile' },
        impact: {
            fi: 'Mahdollistaa puulajien tunnistamisen verkossa ja mobiilissa, tukemaan ympäristö- ja metsäalan sovelluksia.',
            en: 'Enables interactive tree species identification on the web and on mobile to support environmental and forestry-related use cases.',
            ar: 'يُمكّن من تصنيف أنواع الأشجار بشكل تفاعلي على الويب والهاتف لدعم حالات الاستخدام البيئية والغابات.'
        },
        tech: ['Python', 'Machine Learning', 'Vercel', 'Web', 'Mobile']
    }
};

function initializeModals() {
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.modal-close');

    if (!modal || !modalBody || !closeBtn) return;

    // Use event delegation for project detail buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.details-link');
        if (!btn) return;

        const projectId = btn.getAttribute('data-project');
        const data = projectData[projectId];
        
        if (data) {
            const lang = currentLanguage || 'en';
            const title = data.title[lang] || data.title.en || 'Project Details';
            const impact = data.impact[lang] || data.impact.en || '';
            
            let metricsHtml = '<ul>';
            for (const [key, value] of Object.entries(data.metrics || {})) {
                metricsHtml += `<li><strong>${key}:</strong> ${value}</li>`;
            }
            metricsHtml += '</ul>';

            let techHtml = '<div class="tech-tags">';
            (data.tech || []).forEach(t => {
                techHtml += `<span class="tech-tag">${t}</span>`;
            });
            techHtml += '</div>';

            const Lm = translations[lang] || translations.en;
            const impactLabel = Lm['modal-impact'] || 'Impact';
            const metricsLabel = Lm['modal-metrics'] || 'Metrics';
            const techLabel = Lm['modal-technologies'] || 'Technologies';

            modalBody.innerHTML = `
                <h2 id="modal-title">${title}</h2>
                <div class="modal-section">
                    <h3>${impactLabel}</h3>
                    <p>${impact}</p>
                </div>
                <div class="modal-section">
                    <h3>${metricsLabel}</h3>
                    ${metricsHtml}
                </div>
                <div class="modal-section">
                    <h3>${techLabel}</h3>
                    ${techHtml}
                </div>
            `;
            
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        } else {
            console.error(`Missing data for project ID: ${projectId}`);
        }
    });

    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
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
                const categories = card.getAttribute('data-category').split(' ');
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
        skills: 'Sawsanilla on vahva osaaminen koneoppimisessa (PyTorch, TensorFlow, Scikit-learn), datatieteessä (Pandas, Plotly) ja RAG-arkkitehtuureissa.',
        experience: 'Hänellä on yli 3 vuotta kokemusta ja hän on toiminut Lead ML Engineerinä Omdenalla, johtaen 15+ hengen tiimejä.',
        contact: 'Voit ottaa yhteyttä Sawsaniin sähköpostitse: sawsan.abdulbari@gmail.com tai LinkedInin kautta.',
        education: 'Sawsan on suorittanut Tietojenkäsittely tradenomi -tutkinnon (Data Science) HAMKissa, käynyt Climate Change AI (CCAI) -kesäkoulun ja Liiketoiminnan perustutkinnon Tredussa.',
        languages: 'Hän puhuu sujuvasti suomea, englantia ja arabiaa (äidinkieli).',
        projects: 'Hänellä on 14 merkittävää projektia. Mistä haluaisit kuulla lisää? Esimerkiksi: "Kiva", "COVID", "Hiilipetos" tai "Reseptit".',
        project_kiva: { text: 'Kiva-laina dashboard analysoi 670k+ mikrolainaa globaalisti. Avaan projektin tiedot sinulle...', action: 'project1' },
        project_covid: { text: 'COVID-19 ennustejärjestelmä toimitti kriittisiä ennusteita Sambian terveydenhuollolle. Avaan tiedot...', action: 'project2' },
        project_carbon: { text: 'Hiilipetosten havaitsemisverkosto käyttää monimutkaista AI-agenttiverkostoa. Avaan tiedot...', action: 'project11' },
        project_recipe: { text: 'AI Recipe Finder käyttää Whisperia ja Groqia reseptien luomiseen puheesta. Avaan tiedot...', action: 'project12' },
        project_pirha: { text: 'PIRHA-projekti on kuntoutumisopas, joka on toteutettu Pirkanmaan hyvinvointialueelle. Avaan tiedot...', action: 'project13' },
        project_tree: { text: 'Puun lajitunnistin on koneoppimiseen perustuva sovellus lajien tunnistamiseen. Avaan tiedot...', action: 'project14' },
        default: 'Kiitos kysymyksestä! Voit kysyä esimerkiksi taidoista, kokemuksesta, koulutuksesta, kielistä tai projekteista.'
    },
    en: {
        skills: 'Sawsan has strong expertise in Machine Learning (PyTorch, TensorFlow, Scikit-learn), Data Science (Pandas, Plotly), and RAG architectures.',
        experience: 'She has over 3 years of experience and has served as a Lead ML Engineer at Omdena, leading teams of 15+ members.',
        contact: 'You can reach Sawsan via email: sawsan.abdulbari@gmail.com or through LinkedIn.',
        education: 'Sawsan holds a Bachelor of Business IT (Data Science) from HAMK, completed the Climate Change AI (CCAI) Summer School, and a Vocational Qualification in Business from Tredu.',
        languages: 'She is trilingual, fluent in Finnish, English, and Arabic (Native).',
        projects: 'She has 14 notable projects. Which one would you like to know about? Try: "Kiva", "COVID", "PIRHA", or "Tree Classifier".',
        project_kiva: { text: 'The Kiva Loan dashboard analyzed 670k+ microloans globally. Opening details for you...', action: 'project1' },
        project_covid: { text: 'The COVID-19 system provided critical forecasts for Zambia healthcare. Opening details...', action: 'project2' },
        project_carbon: { text: 'The Carbon Fraud network uses a multi-agent AI system. Opening details...', action: 'project11' },
        project_recipe: { text: 'AI Recipe Finder uses Whisper and Groq for voice-to-recipe generation. Opening details...', action: 'project12' },
        project_pirha: { text: 'The PIRHA project is a rehabilitation guide for the Pirkanmaa wellbeing region. Opening details...', action: 'project13' },
        project_tree: { text: 'The Tree Classifier is an ML app for interactive species identification. Opening details...', action: 'project14' },
        default: 'Thanks for asking! You can ask about skills, experience, education, languages, or projects.'
    },
    ar: {
        skills: 'تمتلك سوسن خبرة قوية في تعلّم الآلة (PyTorch وTensorFlow وScikit-learn) وعلم البيانات (Pandas وPlotly) وهندسة RAG.',
        experience: 'لديها أكثر من ثلاث سنوات من الخبرة، وعملت كمهندسة تعلّم آلي رئيسية في Omdena مع قيادة فرق من أكثر من 15 عضوًا.',
        contact: 'يمكن التواصل مع سوسن عبر البريد: sawsan.abdulbari@gmail.com أو عبر LinkedIn.',
        education: 'لدى سوسن بكالوريوس تقنية معلومات الأعمال (علم البيانات) من HAMK، وأكملت المدرسة الصيفية للذكاء الاصطناعي والتغيّر المناخي (CCAI)، ودبلوم إدارة أعمال من Tredu.',
        languages: 'تتحدث ثلاث لغات بطلاقة: الفنلندية، الإنجليزية، والعربية (اللغة الأم).',
        projects: 'لديها 14 مشروعًا بارزًا. عن أي مشروع تود المعرفة؟ جرب: "كيفا"، "كوفيد"، "PIRHA"، أو "تصنيف الأشجار".',
        project_kiva: { text: 'لوحة قروض كيفا حللت 670 ألف قرض صغير. سأفتح لك التفاصيل...', action: 'project1' },
        project_covid: { text: 'نظام كوفيد وفر تنبؤات حرجة لزامبيا. سأفتح لك التفاصيل...', action: 'project2' },
        project_carbon: { text: 'شبكة كشف احتيال الكربون تستخدم نظام وكلاء ذكاء اصطناعي متعدد. سأفتح لك التفاصيل...', action: 'project11' },
        project_recipe: { text: 'باحث الوصفات يستخدم Whisper وGroq للتوليد الصوتي. سأفتح لك التفاصيل...', action: 'project12' },
        project_pirha: { text: 'مشروع PIRHA هو دليل تأهيل لمنطقة بيركانما. سأفتح لك التفاصيل...', action: 'project13' },
        project_tree: { text: 'مصنف الأشجار هو تطبيق تعلم آلي لتحديد الأنواع. سأفتح لك التفاصيل...', action: 'project14' },
        default: 'شكرًا لسؤالك! يمكنك السؤال عن المهارات، الخبرة، التعليم، اللغات، أو المشاريع.'
    }
};

function getChatReplyIntent(intent) {
    const lang = currentLanguage || 'en';
    const pack = CHAT_KNOWLEDGE_BASE[lang] || CHAT_KNOWLEDGE_BASE.en;
    return pack[intent] || pack.default;
}

function detectChatIntent(raw) {
    const s = raw.toLowerCase();

    // Project Specifics
    if (s.includes('kiva')) return 'project_kiva';
    if (s.includes('covid')) return 'project_covid';
    if (s.includes('carbon') || s.includes('hiili') || s.includes('كربون')) return 'project_carbon';
    if (s.includes('recipe') || s.includes('resepti') || s.includes('وصفات')) return 'project_recipe';
    if (s.includes('pirha') || s.includes('kuntoutum') || s.includes('rehabilitation')) return 'project_pirha';
    if (s.includes('tree') || s.includes('classifier') || s.includes('puu') || s.includes('أشجار')) return 'project_tree';

    if (
        s.includes('skill') ||
        s.includes('taito') ||
        s.includes('مهار') ||
        s.includes('pytorch') ||
        s.includes('tensorflow') ||
        s.includes('scikit') ||
        s.includes('pandas') ||
        s.includes('rag') ||
        s.includes('koneoppiminen')
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
    const send = document.getElementById('chat-send');
    const messages = document.getElementById('chat-messages');

    if (!toggle || !windowEl || !input || !messages) return;

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
        const el = document.createElement('div');
        el.className = 'message bot chat-typing-msg';
        el.id = 'chat-typing-indicator';
        el.setAttribute('aria-hidden', 'true');
        
        const dots = document.createElement('div');
        dots.className = 'typing-dots';
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

    send.addEventListener('click', sendMessage);
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
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeHeroParticles();
    initializeScrollProgress();
    initializeScrollSpy();
    initializeLanguageDropdown();
    initializeLanguage();
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

