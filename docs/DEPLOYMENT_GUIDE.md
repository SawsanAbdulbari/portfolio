# GitHub Pages deployment

This project is deployed as a static site (for example at `https://sawsanabdulbari.github.io/portfolio/`).

## Repository and clone

```bash
git clone https://github.com/SawsanAbdulbari/portfolio.git
cd portfolio
```

## Enable GitHub Pages

1. Open the repository on GitHub → **Settings** → **Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Select branch **`main`** and folder **`/ (root)`**, then **Save**.
4. After a few minutes, the site is served from  
   `https://sawsanabdulbari.github.io/portfolio/`  
   (URL follows `https://<user>.github.io/<repo>/` if the repo name differs).

## Custom domain (optional)

1. In **Pages**, add the custom domain.
2. Configure DNS for GitHub Pages as documented by GitHub.
3. Enable **Enforce HTTPS** when available.

## Repository layout (reference)

```
portfolio/
├── index.html
├── BITCA-Thesis-Sawsan.pdf   # Bachelor thesis (Education section download)
├── CV_PDF_Generator.html
├── Sawsan_Abdulbari_CV_Print_Ready.html
├── css/
│   └── styles.css
├── js/
│   ├── script.js
│   ├── contact-config.js
│   ├── translations.js
│   └── translations-ar.js
├── images/
├── docs/
└── README.md
```

## Troubleshooting

- **`index.html` must be at the repository root** for the default Pages URL to work.
- **Public repository** is required for free GitHub Pages from `main`.
- **Case-sensitive paths** on the server: match `css/`, `js/`, and `images/` exactly.
- Allow **a few minutes** after each push for the live site to update.

## Updates

Push changes to `main`; GitHub Pages rebuilds automatically. For the contact form, set the Web3Forms key in `js/contact-config.js` (see `README.md`).
