# Sawsan Abdulbari - Portfolio Website

A modern, responsive portfolio website showcasing my expertise as a Data Scientist & Machine Learning Engineer.

## 🚀 Live Demo

Visit the live website: [Link](https://sawsanabdulbari.github.io/portfolio/)

## 📋 About

This portfolio website features:

- **Responsive Design**: Optimized for all devices
- **Multilingual UI**: Finnish, English, and Arabic (RTL) with localStorage persistence; skip link to main content
- **Modern UI/UX**: Clean, professional design with smooth animations
- **PDF CV**: Downloadable resume (print to PDF)
- **Interactive Elements**: Smooth scrolling, hover effects, and animations
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Theme**: Dark mode by default; light/dark toggle with persistence

### Polish & performance

The hero uses **tsParticles** (linked nodes preset) for a subtle, interactive network-style background—particle colors follow the dark/light theme, with hover interaction. Navbar scroll, back-to-top visibility, and hero parallax use **requestAnimationFrame** throttling to avoid excessive work per scroll event. On small screens, primary controls use at least **~44px** tap height where styled together; the chat panel uses **95vw × 70vh** on very narrow viewports. The site chat is a **rule-based assistant** (keywords and fixed replies, plus project modal shortcuts), not an LLM. The portfolio lists **14** projects with detail modals.

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)
- **Animations**: CSS Transitions & JavaScript
- **Responsive**: Mobile-first design approach

## 📁 Project Structure

```
portfolio/
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── script.js           # Main JavaScript functionality
│   ├── contact-config.js   # Web3Forms public access key + domain allowlist in dashboard
│   ├── contact-config.example.js
│   ├── translations.js     # Finnish & English strings
│   └── translations-ar.js  # Arabic locale (extends translations)
├── images/                 # Project images and assets
├── docs/                   # Documentation and CV files
├── index.html              # Main HTML file
├── README.md               # This file
└── .gitignore             # Git ignore rules
```

## 🎨 Features

### 🌐 Language & theme defaults
- **Default language**: English (first visit). Finnish and Arabic available from the language menu; choice is saved in `localStorage` under `preferred-language`.
- **Default theme**: Dark. Toggle saves `theme` as `dark` or `light` in `localStorage`.

### 📱 Responsive Design
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly navigation

### 🎯 Sections
- **Hero**: Introduction and call-to-action
- **About**: Professional summary and statistics
- **Skills**: Core competencies in 4 categories
- **Education**: Academic background
- **Experience**: Professional work history
- **Projects**: Portfolio of key projects
- **Interests**: Personal interests and hobbies
- **Contact**: Contact information and social links

### ⚡ Performance Features
- Optimized images
- Single CSS and JavaScript files (no build step; optional minification if needed)
- Fast loading times
- Smooth animations and transitions

## 🚀 Getting Started

### Prerequisites
- A modern web browser
- A local web server (optional, for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SawsanAbdulbari/portfolio.git
   cd portfolio
   ```

2. **Open in browser**
   - Open `index.html` in a browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve .
     
     # Using PHP
     php -S localhost:8000
     ```

3. **Customize**
   - Edit `index.html` for content changes
   - Modify `css/styles.css` for styling
   - Update `js/translations.js` for language content

4. **Check JavaScript before push** (Node.js required)
   ```bash
   npm test
   ```
   Runs `node --check` on all main `js/*.js` files to catch syntax errors. This does not replace a browser smoke test.

## ✉️ Contact form and social previews

### Web3Forms (recommended)

1. Create a free access key at [web3forms.com](https://web3forms.com) (keys are **public** client-side identifiers—protection is the **domain allowlist** in the dashboard, not hiding the key).
2. In the Web3Forms dashboard, add the deployed domain (for example `sawsanabdulbari.github.io`).
3. The key is set in `js/contact-config.js` as `window.__WEB3FORMS_ACCESS_KEY__ = '…';` (see `contact-config.example.js` to start a fresh file).

The `data-web3forms-access-key` attribute on `#contact-form` in `index.html`, if non-empty, overrides `contact-config.js`. If both are empty, the form uses the **mailto** fallback.

### Formspree (alternative)

Set `data-formspree` on the contact form to the Formspree form id. If Web3Forms and Formspree are both unset, the site falls back to mailto (less reliable on some devices).

### Link previews (Open Graph / X)

`og:image` and `twitter:image` in `index.html` use **absolute** URLs under `https://sawsanabdulbari.github.io/portfolio/` (currently `images/datadiwan-hero.png`, a file that exists in the repo) so previews resolve on LinkedIn, X, Slack, and similar apps. Project cards fall back to `images/placeholder.svg` if a screenshot file is missing.

## 📝 Customization

### Adding New Sections
1. Add HTML structure in `index.html`
2. Add corresponding styles in `css/styles.css`
3. Add translations in `js/translations.js`
4. Update navigation links

### Changing Colors
The website uses CSS custom properties for easy color customization:
```css
:root {
    --primary-500: #2c3e50;    /* Deep Blue */
    --secondary-500: #f39c12;  /* Warm Gold */
    /* ... other color variables */
}
```

### Adding New Languages
1. Add new language object in `js/translations.js`
2. Add language button in `index.html`
3. Update `switchLanguage()` function in `js/script.js`

## 📄 CV/Resume

The site opens a print-optimized HTML CV (`Sawsan_Abdulbari_CV_Print_Ready.html`) from the **Download CV** control; use the browser print dialog and **Save as PDF** to produce `Sawsan_Abdulbari_CV.pdf` (see `docs/PDF_INSTRUCTIONS.md`).

## 🌐 Deployment

### GitHub Pages
1. Push code to GitHub repository
2. Go to repository Settings
3. Scroll to Pages section
4. Select source branch (usually `main`)
5. Your site will be available at `[https://sawsanabdulbari.github.io/portfolio](https://sawsanabdulbari.github.io/portfolio/)`

### Other Hosting Options
- **Netlify**: Drag and drop deployment
- **Vercel**: Connect GitHub repository
- **AWS S3**: Static website hosting
- **Any web hosting service**: Upload files via FTP

## 🤝 Contributing

This is a personal portfolio project. If you find any issues or have suggestions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Contact

- **Email**: sawsan.abdulbari@gmail.com
- **Phone**: +358 40 5110 5012
- **LinkedIn**: [linkedin.com/in/sawsanabdulbari](https://linkedin.com/in/sawsanabdulbari)
- **GitHub**: [github.com/sawsanabdulbari](https://github.com/sawsanabdulbari)

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- Inspiration from modern portfolio designs
- Open source community for tools and resources

---

**Built with ❤️ by Sawsan Abdulbari**
