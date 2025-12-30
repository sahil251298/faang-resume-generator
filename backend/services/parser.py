import pdfminer.high_level
import docx
import os

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a PDF file."""
    try:
        text = pdfminer.high_level.extract_text(file_path)
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_docx(file_path: str) -> str:
    """Extracts text from a DOCX file."""
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return ""

def extract_text(file_path: str, filename: str) -> str:
    """Dispatches to correct extractor based on file extension."""
    if filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    elif filename.lower().endswith('.docx'):
        return extract_text_from_docx(file_path)
    else:
        return ""
