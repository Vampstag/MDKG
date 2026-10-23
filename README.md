# MDKG Portfolio

Personal portfolio website for M. Dimas K. G., a Digital Creative specializing in Cinematic Video Production, Content Systems, and Web Experiences.

## Live Site
🌍 [hellodimas.my.id](https://hellodimas.my.id)

## Tech Stack
- **Structure & Style:** HTML5, CSS3, Vanilla JavaScript
- **Animations:** GSAP (GreenSock), ScrollTrigger
- **Smooth Scroll:** Lenis
- **Interactivity:** Swiper.js, Draggable
- **Forms:** Formspree


## Project Structure
```
/
├── index.html              Home
├── 404.html
├── about/index.html        /about
├── services/index.html     /services
├── library/index.html      /library
├── journal/                /journal (index + articles)
├── portfolio/              /portfolio (the grid page)
│   ├── 2026/               /portfolio/2026/<slug>, one file per case study, grouped by year
│   ├── 2025/               /portfolio/2025/<slug>
│   └── _template-case-study.html   Copy into portfolio/<year>/ to start a new case study
├── partials/               navbar.html, footer.html (fetched into every page)
├── css/                    style.css (site), widget.css (music widget)
├── js/                     script.js (site), portfolio.js (grid data),
│                           widget.js, custom.js, case-study.js
├── data/                   journal.json, library-*.json
├── assets/
│   ├── images/             home/, journal/, project/<project>/
│   ├── videos/             hero-card/, about/, project/<project>/
│   ├── audio/              vo-<project>.mp3 narration, music/ (widget playlist)
│   ├── fonts/  pdf/
├── docs/                   DESIGN-SYSTEM.md, vo-scripts/, notes/
├── _archive/legacy/        Unused files kept for reference (safe to delete)
└── sw.js, manifest.json, robots.txt, sitemap.xml, vercel.json, .htaccess
```

Every page is `<name>/index.html`, so the public URL stays `/name`. Pages one level deep
reference shared files with `../` (`../css/style.css`, `../js/script.js`).
`sw.js` must stay at the root so its scope covers the whole site.

## Deployment
This repository is hooked to a live server. Any pushes to the `main` branch will automatically trigger a deployment webhook and update the live site.

---
*Designed and developed to reflect cinematic pacing and thoughtful visual execution.*

&copy; 2025 M. Dimas K. G.

## Adding a case study
1. Copy `portfolio/_template-case-study.html` to `portfolio/<year>/<slug>.html` (create the year folder if new) and fill in the `{{...}}` placeholders, including `{{YEAR}}`.
2. Add its card to `js/portfolio.js` (`year` and `link: "/portfolio/<year>/<slug>"`) and its URL to `sitemap.xml`.
3. Pages in `portfolio/<year>/` sit two folders deep, so shared files are referenced as `../../assets/...`; `script.js` and `widget.js` handle that depth through `window.MDKG_ROOT_PREFIX`.
4. Old flat URLs (`/portfolio/<slug>`) are 301-redirected to the year URLs in `.htaccess` and `vercel.json`. Keep those when renaming or moving a page again.
