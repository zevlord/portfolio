# Nikki Tirta Iwan — Portfolio Website

Personal engineering portfolio for **Nikki Tirta Iwan** (Information Systems undergraduate at Universitas Multimedia Nusantara), showcasing work across **Local-First Voice AI**, **Large-Scale Time-Series Forecasting**, and **SAP S/4HANA Enterprise Systems**.

- **Live Site:** [zevlord.github.io/portfolio](https://zevlord.github.io/portfolio/)
- **AI Assistant Proxy:** Cloudflare Worker (`cloudflare-worker/worker.js` v3.1)

---

## Project Structure

```
D:\Portofolio website\
├── index.html                   # Morphing chrome, hero fluid runway, pinned 3-act work stage & case modal
├── css/
│   ├── style.css                # Florentine High Renaissance Dark Cream design system & stage responsive rules
│   └── lenis.css                # Self-hosted Lenis smooth scrolling styles
├── js/
│   ├── fluid-engine.js          # WebGL2 Navier-Stokes fluid ink solver (Hero & Footer)
│   ├── main.js                  # Morphing header, menu overlay, pinned work stage, Chronologia & AI widget
│   └── lenis.min.js             # Self-hosted Lenis smooth scroll library
├── cloudflare-worker/
│   └── worker.js                # Serverless Gemini API proxy (env.GEMINI_API_KEY, CORS-restricted)
├── assets/
│   ├── layers/                  # Isolated hero fresco background and Adam/Cyborg WebP layers
│   ├── certs/                   # Verified IBM SkillsBuild & Adobe Learning Manager certificates
│   ├── Footer.webp              # Full-bleed Renaissance footer backdrop
│   ├── visage-link-demo.mp4     # 3D VRM avatar + GPT-SoVITS Japanese voice demonstration
│   ├── argos-n8n.mp4            # Campus workshop documentation video
│   ├── sap-*.png                # IS539 SAP Fiori ALP & ABAP DPC_EXT exam evidence
│   └── Nikki_Tirta_Iwan_Resume.pdf
└── README.md
```

---

## Featured Projects & Interactive Architecture

1. **Hero (`#top`)** — `380vh` scroll-driven fingertip convergence over isolated Sistine WebP layers paired with a **WebGL2 Navier-Stokes ink simulation** (`#heroFluidCanvas`), synapse energy arcs (`#heroSynapseCanvas`), and morphing header (`#headerBar` → floating `NTI` + `MENU` pills).
2. **Pinned Exhibition Stage (`#work`, `01 / 03` → `03 / 03`)** — Full-viewport `360vh` sticky stage (stacked on `<=900px`) with 3-segment clickable progress rail and deep-dive **`#caseStudyModal`**:
   - **01 · Visage Link** — Local `Qwen 2.5 7B`, `GPT-SoVITS` Japanese speech streaming, `SQLite` BLOB RAG, `VMC/OSC` UDP `39539` within 8GB VRAM (`#caseStudyModal` 4-tab code inspector). ([Repo](https://github.com/zevlord/Visage-Link))
   - **02 · 12.6M Retail Demand Forecasting** — CRISP-DM study (`salesFinal2016.csv`, 1.6 GB, `chunksize=100k`) benchmarking Prophet (`R² = 0.8349`) vs SARIMAX (`0.4846`) vs ADF baseline (`0.2521`). ([Repo](https://github.com/zevlord/inventory-forecasting))
   - **03 · SAP S/4HANA Analytics** — Custom ABAP `DPC_EXT` OData Gateway (`Z_EXP_FIORI_SRV`) and SAPUI5 Analytical List Page (`zumn.is539.group2.officesupplyreport`) with 5-tab modal inspector. ([Repo](https://github.com/zevlord/sap-fiori-office-supply-report))
3. **Chronologia Timeline (`#background`)** — Scroll-drawn terracotta spine (`timelineSpine`) with filterable, reversible experience and credential cards (Argos Club, IBM SkillsBuild, BorrowIn, Perkenalan Prodi SI, BCA Autologger, UMN).
4. **Interactive Footer (`#contact`) & Ask AI (`#aiChatWidget`)** — *School of Athens* WebP backdrop layered with luminous parchment/terracotta fluid ink (`#footerFluidCanvas`), Back-to-Top pill, and Gemini-powered Ask AI widget proxied via Cloudflare Workers (`8` queries/device, 12s client timeout + local grounded fallback).

---

## Local Preview & Deployment

```powershell
# Run local static server on port 5500 (whitelisted by Cloudflare Worker CORS)
python -m http.server 5500
```

Push updates to `main` to deploy static frontend files to GitHub Pages. Changes inside `cloudflare-worker/worker.js` must be deployed separately in the Cloudflare Workers dashboard (`cold-cell-15a6`).
