<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=18181B,09090B,000000&height=180&section=header&text=EVOTRACK&fontSize=60&fontColor=ffffff&animation=twinkling&fontAlignY=32&desc=Premium%20EV%20Dashboard%20&%20Tracker&descAlignY=62&descSize=16" alt="EVOTRACK Banner" />
</p>
<h1 align="center" style="color: white;">
  EVOTRACK
  <br>
  <img src="https://img.shields.io/badge/EVOTRACK-Premium%20Dashboard-FFD700?style=for-the-badge&logo=tesla&logoColor=black" alt="EVOTRACK" />
</h1>

<h3 align="center"><em>A Premium EV Battery & Service Management Dashboard</em></h3>

<p align="center">
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="Vanilla JS" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS"><img src="https://img.shields.io/badge/Custom_CSS-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS" /></a>
  <a href="https://evotrack.onrender.com/"><img src="https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=flat-square&logo=render&logoColor=white" alt="Deployed on Render" /></a>
</p>

<h3 align="center">
  <strong>Live Web Application:</strong> <a href="https://evotrack.onrender.com/">https://evotrack.onrender.com/</a>
</h3>

<p align="center">
  <strong>EVOTRACK</strong> is a meticulously crafted, premium web application for tracking EV battery charging and driving history. It focuses heavily on high-fidelity visual design, a Notion/Airtable style interface, and seamless offline-ready local experiences.
</p>

<hr />

### 🎥 Project Working Demo
https://evotrack.onrender.com/

---

## 📋 Table of Contents

- [🎯 Reference & Scope](#-reference--scope)
- [✨ Core Features](#-core-features)
- [🎨 Visual & Interaction Fidelity](#-visual--interaction-fidelity)
- [🏗️ Architecture](#️-architecture)
- [🧰 Tech Stack](#-tech-stack)
- [🤖 AI Workflow & Sub-Agents](#-ai-workflow--sub-agents)
- [📁 Project Structure](#-project-structure)
- [🚀 Local Development](#-local-development)
- [☁️ Deployment](#️-deployment)
- [👨💻 Author](#-author)

---

## 🎯 Reference & Scope
This project is built to track and manage electric vehicle data with an emphasis on a premium, desktop-first (with mobile responsive) experience. The implementation includes multiple primary views:
1. Dashboard (Charging Logs)
2. Service Records
3. Tyre Changes
4. Vehicle Issues
5. Additional Services

---

## ✨ Core Features

### 🏠 Dashboard & Charging Logs
- **High-Fidelity UI:** Notion/Airtable style data tables with custom typography (Inter) and beautiful dark/light modes.
- **Dynamic Stats:** Auto-calculating environmental impact, trees saved, and total charging costs.
- **3D Hero Background:** Seamless 3D video loop hero section to give a state-of-the-art premium feel.

### 📝 Seamless Data Management
- **Inline Editing:** Real-time inline editing of table rows without needing heavy forms.
- **Local Database:** Powered by a lightweight SQLite database via FastAPI.
- **CSV Export:** One-click data export directly to CSV.

### 📱 Responsive Design
- **Mobile Optimized:** Custom CSS rules ensuring the tables and complex UI scale perfectly to mobile screens.
- **Theme Support:** Fully integrated Light/Dark mode toggle with smooth transitions.

---

## 🎨 Visual & Interaction Fidelity
The implementation focuses on delivering a premium experience through:
- Glassmorphism & custom glowing effects
- Sleek typography and curated color palettes
- Beautiful empty states and loading animations
- Smooth table row hover actions
- Accessible modal dialogs and interactions
- Pixel-perfect mobile adaptation

---

## 🏗️ Architecture

This project is structured as a full-stack monolith utilizing a highly efficient Python backend and a vanilla frontend.

The architecture features:
- **Backend:** FastAPI serving RESTful endpoints and static files.
- **Database:** SQLite with SQLAlchemy ORM.
- **Frontend:** Pure HTML, vanilla JavaScript (ES6+), and plain CSS (no heavy frameworks).

---

## 🧰 Tech Stack

### Frontend
- **HTML5** (Structure)
- **Vanilla JavaScript** (Interactivity & DOM Manipulation)
- **Custom CSS** (Styling, Dark Mode, Animations)

### Backend
- **FastAPI** (Python Web Framework)
- **Uvicorn** (ASGI Server)
- **SQLAlchemy** (Database ORM)
- **SQLite** (Database Engine)

---

## 🤖 AI Workflow & Sub-Agents

This project was built utilizing an AI-assisted workflow to guarantee speed, beautiful UI, and functional backend logic.

### Process Included:
- Agentic UI Generation (HTML/CSS)
- Iterative visual refinement for premium aesthetics
- Mobile responsiveness adjustments
- Backend API generation and database integration

---

## 📁 Project Structure

```text
EVOTRACK/
│
├── main.py                 # FastAPI Application & Endpoints
├── database.py             # SQLAlchemy configuration
├── models.py               # Database Models
├── schemas.py              # Pydantic validation schemas
│
├── static/                 
│   ├── css/         
│   │   ├── style.css       # Core styling & Light/Dark Mode
│   │   └── mobile.css      # Mobile responsiveness
│   ├── js/
│   │   └── app2.js         # Main UI logic
│   └── img/                
│       └── ev-logo.png
│
├── templates/              
│   └── index.html          # Main Application View
│
├── run.bat                 # Windows startup script
├── requirements.txt        
└── README.md               
```

---

## 🚀 Local Development

### 1. Get the Project
Clone or download the project directory.

### 2. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Development Server
```bash
uvicorn main:app --reload
```
*Or use the provided `run.bat` file on Windows.*

### 5. View the Application
Open: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## ☁️ Deployment

The application is deployed on Render.
**Live Application:** https://evotrack.onrender.com/

---

## 👨💻 Author

**Hashmil Muhammed**

