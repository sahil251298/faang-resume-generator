from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="FAANG Resume Generator")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all. In prod, strict.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import resume

app.include_router(resume.router, prefix="/api/resume", tags=["resume"])

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ... (API routes above)

# Mount static files
# Check if dist exists (it might not during local dev if not built)
DIST_DIR = os.path.join(os.path.dirname(__file__), "../frontend/dist")

if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # If API call, let it through (should remain matched by routers above)
    if full_path.startswith("api"):
        return {"error": "API route not found"}
        
    # Serve index.html for any other route (SPA)
    if os.path.exists(os.path.join(DIST_DIR, "index.html")):
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
    return {"message": "Frontend not built. Run 'npm run build' in frontend directory."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
