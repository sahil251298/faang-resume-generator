import shutil
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from services.parser import extract_text
from services.enhancer import heuristic_parse_resume, enhance_content
from services.generator import generate_pdf_resume, generate_docx_resume

router = APIRouter()

UPLOAD_DIR = "temp_uploads"
OUTPUT_DIR = "temp_outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

class ResumeData(BaseModel):
    contact: Optional[str] = ""
    summary: Optional[str] = ""
    skills: Optional[List[str]] = []
    experience: Optional[List[str]] = []
    education: Optional[List[str]] = []
    projects: Optional[List[str]] = []
    course_work: Optional[List[str]] = []
    section_order: Optional[List[str]] = ["education", "skills", "experience", "projects", "course_work"]

    class Config:
        arbitrary_types_allowed = True


def cleanup_files(files: List[str]):
    """Deletes files after response is sent."""
    for f in files:
        file_path = str(f) # Ensure string
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Deleted {file_path}")
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")

@router.post("/process")
async def process_resume(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_ext = os.path.splitext(file.filename)[1]
    if file_ext.lower() not in ['.pdf', '.docx']:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX supported.")
    
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 1. Parse
    raw_text = extract_text(file_path, filename)
    
    # 2. Enhance
    enhanced_data = enhance_content(raw_text)
    
    # Clean up input file immediately
    cleanup_files([file_path])
    
    return JSONResponse(content=enhanced_data)

@router.post("/generate")
async def generate_resume_file(data: ResumeData, background_tasks: BackgroundTasks, format: str = "pdf"):
    file_id = str(uuid.uuid4())
    
    # Convert Pydantic model to dict
    resume_dict = data.dict()
    
    if format.lower() == 'docx':
        output_filename = f"faang_resume_{file_id}.docx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        try:
            generate_docx_resume(resume_dict, output_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DOCX Generation failed: {str(e)}")
    else:
        output_filename = f"faang_resume_{file_id}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        media_type = "application/pdf"
        try:
            generate_pdf_resume(resume_dict, output_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF Generation failed: {str(e)}")
        
    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="File was not created.")
        
    # Queue cleanup
    background_tasks.add_task(cleanup_files, [output_path])
    
    return FileResponse(
        output_path, 
        media_type=media_type, 
        filename=output_filename
    )
