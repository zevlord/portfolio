# Nikki Tirta Iwan — Portfolio Assets & Blueprint Hub

This directory contains the core visual, data, and architectural assets for **Nikki Tirta Iwan's** professional portfolio website.

---

## Directory Structure

```
D:\Portofolio website\
├── assets/
│   ├── branding/
│   │   ├── logo-monogram.svg        # Scalable NTI monogram with electric cyan & emerald accent
│   │   ├── favicon.svg              # 64x64 crisp technical favicon for browser tabs
│   │   └── og-preview.svg           # 1200x630 OpenGraph social share card with metrics & telemetry
│   ├── diagrams/
│   │   ├── visage-link-architecture.svg        # Real-time audio streaming, LLM inference & 8GB VRAM constraint
│   │   ├── retail-forecasting-pipeline.svg     # CRISP-DM 12.8M-row time-series benchmark (Prophet vs. SARIMAX)
│   │   ├── sap-fiori-s4hana-architecture.svg   # S/4HANA DB -> ABAP DPC_EXT -> OData Gateway -> Fiori ALP
│   │   ├── borrowin-layered-architecture.svg   # C# (.NET) layered architecture & RBAC
│   │   ├── bca-autologger-serverless.svg       # Event-driven bank email parsing via GAS & Telegram webhooks
│   │   └── argos-proxmox-netbird-infra.svg     # Proxmox VE hypervisor & NetBird WireGuard mesh network
│   ├── mockups/
│   │   ├── visage-link-ui-mockup.svg           # 3D avatar viewport, audio stream waveform & memory guard
│   │   ├── forecasting-chart-mockup.svg        # Time-series benchmark curves with confidence bands
│   │   └── fiori-alp-mockup.svg                # SAP Fiori Analytical List Page with live dimension filter bar
│   └── data/
│       ├── portfolio-data.json                 # Complete structured JSON dataset extracted from CV
│       └── portfolio-data.ts                   # Fully typed TypeScript data interface for Next.js / React
└── README.md
```

---

## Asset Mapping to Nikki's CV

| Project / Section | Associated Assets | Strategic Engineering Narrative |
| :--- | :--- | :--- |
| **Visage Link** | `visage-link-architecture.svg`<br/>`visage-link-ui-mockup.svg` | Demonstrates word-level streaming audio synthesis, VMC/OSC protocol avatar rigging, and 8GB VRAM budget optimization. |
| **Retail Forecasting at Scale** | `retail-forecasting-pipeline.svg`<br/>`forecasting-chart-mockup.svg` | Highlights 12.8M rows (1.6 GB) data science under the CRISP-DM framework, benchmarking Prophet against SARIMAX and Holt-Winters. |
| **Office Supply Analytics (SAP)** | `sap-fiori-s4hana-architecture.svg`<br/>`fiori-alp-mockup.svg` | Highlights enterprise-grade SAP S/4HANA backend with custom ABAP `DPC_EXT` classes, dynamic OpenSQL, and SAPUI5 Fiori ALP. |
| **BorrowIn (.NET)** | `borrowin-layered-architecture.svg` | Demonstrates classic software engineering discipline: layered architecture, RBAC, and automated RDLC reporting. |
| **BCA Autologger** | `bca-autologger-serverless.svg` | Demonstrates serverless agility, regex data extraction, Google Sheets automation, and real-time Telegram Bot webhooks. |
| **Argos Club & Leadership** | `argos-proxmox-netbird-infra.svg` | Showcases hands-on server virtualization (Proxmox VE), overlay mesh networking (NetBird), and campus mentoring. |

---

## Next Steps for Frontend Development
- Initialize Next.js 15 (or Vite + React) in this directory or a dedicated workspace.
- Import `assets/data/portfolio-data.ts` to power all dynamic components.
- Use the SVGs in `assets/diagrams/` and `assets/mockups/` inside interactive modal case studies and bento grid cards.
