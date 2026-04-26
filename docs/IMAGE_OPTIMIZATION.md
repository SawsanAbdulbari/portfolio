# Image Optimization Guide for Portfolio

To ensure professional performance and fast load times (especially for mobile recruiters), the following images should be optimized. High-resolution images should be converted to WebP format.

## High-Priority Optimizations

| File Name | Current Size | Target Size | Action |
|-----------|--------------|-------------|--------|
| `ml_pipeline.png` | 2.8 MB | < 200 KB | Compress & convert to WebP |
| `tech_background.png` | (legacy) | — | No longer used: hero texture is pure CSS. Safe to omit from the repo. |
| `taxi_duration.png` | 1.6 MB | < 150 KB | Compress & convert to WebP |
| `tree_classifier.png` | 1.6 MB | < 150 KB | Compress & convert to WebP |
| `covid_prediction.png` | 430 KB | < 100 KB | Compress |

## Recommended Tools

1. **[Squoosh.app](https://squoosh.app/)**: Best for manual control and WebP conversion.
2. **[TinyPNG](https://tinypng.com/)**: Fast bulk compression.
3. **ImageMagick**: For CLI-based batch processing.
   ```bash
   # Example command to convert all png to webp with 75% quality
   magick mogrify -format webp -quality 75 images/*.png
   ```

## Technical Implementation (Optional)

Consider using the `<picture>` tag in `index.html` to serve WebP with PNG fallbacks:

```html
<picture>
  <source srcset="images/project.webp" type="image/webp">
  <img src="images/project.png" alt="Project Description">
</picture>
```
