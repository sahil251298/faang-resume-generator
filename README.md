# FAANG Resume Generator

Transform your resume into a recruiter-ready masterpiece in 2 minutes.

![App Screenshot](https://via.placeholder.com/800x400?text=FAANG+Resume+Generator+Screenshot)

## 🚀 Overview

The **FAANG Resume Generator** is a full-stack web application designed to help software engineers and professionals create top-tier, ATS-friendly resumes. It uses **Google Gemini AI** to rewrite your bullet points, ensuring they meet the high standards of top tech companies (Google, Meta, Amazon, etc.) by focusing on impact, metrics, and action verbs.

Unlike generic templates, this tool forces a **"Classic Serif"** aesthetic—clean, legible, and devoid of graphics—which is the preferred format for engineering recruiters.

## ✨ Key Features

*   **AI Enhancement**: Automatically extracts text from your existing PDF/DOCX resume and rewrites experience/projects using the "STAR" method (Situation, Task, Action, Result).
*   **Dual Format Support**: Download your polished resume as a **PDF** (perfectly formatted) or **DOCX** (fully editable Word document).
*   **Live Editor**: 
    *   Review extracted data before generation.
    *   **Reorder Sections**: Move "Skills" above "Education" or "Projects" to the top with simple Up/Down controls.
    *   **Structure Editing**: Add or remove education entries, projects, or list items easily.
*   **ATS Optimization**: Uses standard fonts (Times New Roman), standard headings, and layout structures that parse perfectly in Applicant Tracking Systems.
*   **Smart Parsing**: Intelligently identifies Contact Info, Skills, Experience, and more, protecting them from content bleeding.

## 🛠️ Tech Stack

### Frontend
*   **React.js** (Vite): for a fast, interactive UI.
*   **Tailwind CSS**: for modern, responsive styling.
*   **React Icons**: for UI elements.

### Backend
*   **FastAPI** (Python): High-performance API framework.
*   **Google Gemini API**: For LLM-based text enhancement and parsing.
*   **ReportLab**: For pixel-perfect PDF generation.
*   **python-docx**: For native Word document generation.
*   **PDFMiner**: For extracting text from uploaded PDFs.

## 📦 Installation & Setup

### Prerequisites
*   Python 3.9+
*   Node.js 18+
*   Google Gemini API Key (Get one [here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/faang-resume-generator.git
cd faang-resume-generator
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Running Locally
You can run the full app using the helper script (macOS/Linux):
```bash
cd ..
./run_app.sh
```
Or run individually:
*   **Backend**: `uvicorn main:app --reload` (Runs on http://localhost:8000)
*   **Frontend**: `npm run dev` (Runs on http://localhost:5173)

## 🚀 Deployment

The application is configured to serve the frontend static files from the backend, making it a "Monolith" that is easy to deploy on free tiers like **Render** or **Railway**.

1.  **Build Frontend**:
    ```bash
    cd frontend && npm run build
    ```
    *This creates a `dist` folder which is now part of the git repo whitelist.*

2.  **Push to GitHub**.

3.  **Deploy on Render**:
    *   **Build Command**: `pip install -r backend/requirements.txt`
    *   **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
    *   Set `GEMINI_API_KEY` in environment variables.

## 📝 License
MIT License. Feel free to fork and contribute!
