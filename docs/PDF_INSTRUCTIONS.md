# PDF CV Generation Instructions

## 🚀 Direct Download (primary method)

The "Download CV" button on the site now downloads a ready-made PDF immediately,
matching the CKS people-layer export: no new window, no manual print dialog.

1. Click the "Download CV" button on the main website
2. `Sawsan_Abdulbari_CV.pdf` is saved straight to the browser's download folder
3. If it does not download, use <a href="../Sawsan_Abdulbari_CV.pdf">`Sawsan_Abdulbari_CV.pdf`</a> directly

## 🔄 Manual Regeneration (when the CV changes)

The PDF is committed in the repo. When its content changes, regenerate it with
headless Chrome (A4 + margins come from the `@page` rule in the print-ready file):

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="Sawsan_Abdulbari_CV.pdf" "file:///D:/ai/sawsan-cv-website/Sawsan_Abdulbari_CV_Print_Ready.html"
```

Fallback (any browser):
1. Open `Sawsan_Abdulbari_CV_Print_Ready.html` in the browser
2. Press `Ctrl+P` to open print dialog
3. Select "Save as PDF"
4. Save as `Sawsan_Abdulbari_CV.pdf`

## ✅ Features

- **Layout**: Proper A4 margins and spacing (name/contact left, portrait right)
- **Complete Content**: All experience, projects, and skills included
- **Professional Format**: Clean, scannable design
- **No Text Overflow**: All content fits properly on pages
- **Print-Ready**: Formatted for PDF generation

## 📁 File Structure

```
Sawsan_Abdulbari_CV.pdf              # Pre-built PDF, served by "Download CV"
Sawsan_Abdulbari_CV_Print_Ready.html # Main CV file (regenerate the PDF from this)
CV_PDF_Generator.html                # PDF generation tool / fallback page
```

## 🎯 Content Included

- Header with portrait (name/contact left, photo right, after CKS)
- Biography with key differentiators
- Complete Work Experience (all roles; current role first, incoming UH clearly labeled)
- Education background
- Education background
- Languages (Arabic, English, Finnish)
- Positions of Trust (mentoring)
- All projects as Project References with descriptions and technologies
- Skills (4 categories)
- Selected Publications (thesis)
- Personal Interests

The CV follows the structure of the Demos Helsinki Knowledge System people-layer CV and matches the website content, generating professional PDFs suitable for job applications.