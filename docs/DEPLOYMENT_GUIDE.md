# GitHub Pages Deployment Guide

## Step-by-Step Instructions

### 1. Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the "+" icon in the top right corner and select "New repository"
3. Name your repository (e.g., `sawsan-cv-website` or `my-portfolio`)
4. Make sure it's set to "Public" (required for free GitHub Pages)
5. Do NOT initialize with README, .gitignore, or license (we have our own files)
6. Click "Create repository"

### 2. Upload Website Files

**Option A: Using GitHub Web Interface**
1. On your new repository page, click "uploading an existing file"
2. Drag and drop all files from the website folder, or click "choose your files"
3. Upload these files and folders:
   - `index.html`
   - `css/styles.css`
   - `js/script.js`
   - `js/translations.js`
   - `images/sawsan_portrait.png`
   - `images/tech_background.png`
   - `images/data_science_icon.png`
   - `README.md`
4. Write a commit message like "Initial website upload"
5. Click "Commit changes"

**Option B: Using Git Command Line**
```bash
git clone https://github.com/[YOUR_USERNAME]/[REPOSITORY_NAME].git
cd [REPOSITORY_NAME]
# Copy all website files to this directory
git add .
git commit -m "Initial website upload"
git push origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" tab (near the top of the page)
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

### 4. Access Your Website

1. GitHub will provide a URL like: `https://[YOUR_USERNAME].github.io/[REPOSITORY_NAME]`
2. It may take a few minutes for the site to be available
3. You'll see a green checkmark when deployment is successful

### 5. Custom Domain (Optional)

If you want to use a custom domain:
1. In the "Pages" settings, add your custom domain
2. Update your domain's DNS settings to point to GitHub Pages
3. Enable "Enforce HTTPS" for security

## Important Notes

- **Repository must be public** for free GitHub Pages hosting
- **Main HTML file must be named `index.html`**
- Changes to your repository will automatically update the live website
- It may take up to 10 minutes for changes to appear on the live site

## File Structure Requirements

Ensure your repository has this structure:
```
repository-root/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── script.js
│   └── translations.js
├── images/
│   ├── sawsan_portrait.png
│   ├── tech_background.png
│   └── data_science_icon.png
└── README.md
```

## Troubleshooting

**Website not loading?**
- Check that `index.html` is in the root directory
- Verify the repository is public
- Wait 10-15 minutes after enabling Pages

**Images not showing?**
- Ensure image paths are correct (case-sensitive)
- Check that images are uploaded to the `images/` folder

**Styling not applied?**
- Verify CSS file is in the `css/` folder
- Check that the CSS link in `index.html` is correct

## Updates and Maintenance

To update your website:
1. Make changes to your local files
2. Upload the updated files to GitHub (replace existing ones)
3. Changes will automatically deploy to your live site

Your professional CV website is now ready to share with potential employers and clients!

