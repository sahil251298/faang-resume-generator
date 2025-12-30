import re
import os
import json
import google.generativeai as genai
from typing import Union, Dict
from dotenv import load_dotenv

load_dotenv()

def clean_text(text: str) -> str:
    """Basic text cleaning."""
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def heuristic_parse_resume(text: str) -> dict:
    """Fall back heuristic parser if Gemini unavailable."""
    sections = {
        "contact": "",
        "summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "course_work": []
    }
    
    lower_text = text.lower()
    keywords = ["skills", "experience", "education", "projects", "summary", "objective", "course work", "coursework"]
    indices = []
    
    for kw in keywords:
        matches = list(re.finditer(r'(?i)\b' + kw + r'\b', text))
        for m in matches:
            indices.append((m.start(), kw))
            
    indices.sort()
    
    if not indices:
        sections["summary"] = text[:500] + "..."
        return sections
        
    if indices:
        # First part is likely contact
        sections["contact"] = text[:indices[0][0]].strip()
        
    for i in range(len(indices)):
        start, key = indices[i]
        end = indices[i+1][0] if i+1 < len(indices) else len(text)
        content = text[start:end].strip()
        content = re.sub(r'(?i)^' + key + r'[:\s-]*', '', content).strip()
        
        normalized_key = key.lower().replace(" ", "")
        
        if normalized_key == "skills":
            sections["skills"] = [s.strip() for s in content.split(',') if s.strip()]
        elif normalized_key in ["experience", "workhistory"]:
            sections["experience"].append(content)
        elif normalized_key == "education":
            sections["education"].append(content)
        elif normalized_key == "projects":
            sections["projects"].append(content)
        elif normalized_key in ["summary", "objective"]:
            sections["summary"] = content
        elif normalized_key in ["coursework", "course work"]:
            sections["course_work"].append(content)
            
    return sections

def enhance_content(input_data: Union[str, Dict]) -> dict:
    """
    Enhances resume using Gemini API.
    Accepts raw text (preferred) or pre-parsed dict.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key or "PLACE_YOUR_KEY" in api_key:
        print("Gemini API Key missing. Using heuristic.")
        if isinstance(input_data, str):
            return heuristic_parse_resume(input_data)
        return input_data

    genai.configure(api_key=api_key)
    
    # Try user requested model first, then standard ones
    models_to_try = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-exp', 'gemini-1.5-flash']
    model = None
    
    for m_name in models_to_try:
        try:
            model = genai.GenerativeModel(m_name)
            # Test if model works by generating a dummy token? 
            # Actually instantiating might not fail, only generate_content.
            # But the previous error was 404 on generateContent presumably?
            # actually the error said "is not found... or is not supported for generateContent".
            # So let's just pick one and try to use it in the generate block below.
            break
        except:
            continue
            
    if not model:
        model = genai.GenerativeModel('gemini-1.5-flash') # Default fallback
    
    # Prepare input for prompt
    if isinstance(input_data, str):
        content_block = f"RESUME TEXT:\n{input_data}"
    else:
        content_block = f"PARSED DATA:\n{json.dumps(input_data)}"
    
    prompt = f"""
    You are an expert FAANG recruiter. I will provide a resume.
    
    TASK:
    1. EXTRACT all content into the JSON structure below.
    2. DO NOT DELETE ANY EXPERIENCES, PROJECTS, OR DETAILS. The user specifically requested NO LOSS OF CONTENT.
    3. IMPROVE the wording to be "FAANG Quality":
       - Use strong action verbs (Architected, Designed, Orchestrated).
       - Highlight metrics and impact.
       - Fix grammar/spelling.
       - Improve readability.
    4. Format "experience" and "projects" as lists of strings, where each string represents one Role or one Project. 
       Inside that string, use "•" for bullet points. Include the Company Name, Role, and Dates clearly at the start of the string.
    
    REQUIRED JSON STRUCTURE:
    {{
        "contact": "Name | Phone | Email | LinkedIn | GitHub | Portfolio (One single line string)",
        "education": ["University Name, Degree, GPA, Date", "..."],
        "course_work": ["List of relevant courses..."],
        "skills": ["Language: Python, Java...", "Frameworks: React, FastAPI...", "Tools: Docker, AWS..."],
        "experience": [
            "GOOGLE | Software Engineer | 06/2024 - Present\\n• Bullet point 1...\\n• Bullet point 2...",
            "TEKION | Engineer | ...\\n• Bullet..."
        ],
        "projects": [
            "Project Name | Tech Stack\\n• Description bullet 1...",
            "..."
        ]
    }}
    
    {content_block}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini Error: {e}")
        # Fallback
        if isinstance(input_data, str):
            return heuristic_parse_resume(input_data)
        return input_data
