import io
import re

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

def extract_text_from_pdf(file_obj):
    """
    Safely extract text from PDF file.
    Prefers pdfplumber for better layout handling, falls back to PyPDF2.
    Returns: (text, is_partial_or_failed_flag)
    """
    text = ""
    partial = False
    
    # Needs a real file-like object reset to start
    try:
        file_obj.seek(0)
    except Exception:
        pass

    try:
        if PDFPLUMBER_AVAILABLE:
            with pdfplumber.open(file_obj) as pdf:
                pages_text = []
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        pages_text.append(page_text)
                
                text = "\n".join(pages_text)
                
                if not text.strip() and PYPDF2_AVAILABLE:
                    # pdfplumber found nothing, fallback to PyPDF2
                    partial = True
        elif PYPDF2_AVAILABLE:
            # pdfplumber not installed, use PyPDF2
            partial = True
            
        # Fallback PyPDF2 attempt if pdfplumber failed or wasn't installed
        if (not text.strip()) and PYPDF2_AVAILABLE:
            file_obj.seek(0)
            pdf_reader = PyPDF2.PdfReader(file_obj)
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
                    
        if not text.strip():
            partial = True
            text = "[Text Extraction Failed: No readable text found or image-based PDF]"
            
    except Exception as e:
        partial = True
        text = f"[Text Extraction Partial/Failed: {str(e)}]"
        
    finally:
        try:
            file_obj.seek(0)
        except Exception:
            pass

    return text.strip(), partial

def extract_text_from_docx(file_obj):
    """
    Safely extract text from DOCX file.
    Returns: (text, is_partial_or_failed_flag)
    """
    text = ""
    partial = False
    
    try:
        file_obj.seek(0)
    except Exception:
        pass

    if not DOCX_AVAILABLE:
        return "[Text Extraction Failed: python-docx not installed]", True

    try:
        doc = docx.Document(file_obj)
        paragraphs = []
        for p in doc.paragraphs:
            if p.text.strip():
                paragraphs.append(p.text.strip())
        
        text = "\n".join(paragraphs)
        if not text.strip():
            partial = True
            text = "[Text Extraction Failed: No text found in DOCX file]"
            
    except Exception as e:
        partial = True
        text = f"[Text Extraction Partial/Failed: {str(e)}]"
        
    finally:
        try:
            file_obj.seek(0)
        except Exception:
            pass

    return text.strip(), partial

def extract_text(file_obj, filename):
    """
    Main router function for file extraction.
    Determines type from filename extension.
    Returns: (text, is_partial_or_failed_flag)
    """
    file_ext = str(filename).lower()
    
    if file_ext.endswith('.pdf'):
        return extract_text_from_pdf(file_obj)
        
    elif file_ext.endswith('.docx'):
        return extract_text_from_docx(file_obj)
        
    elif file_ext.endswith('.doc'):
        # Note: older .doc not easily supported in python without heavy dependencies like antiword
        # Just returning failure for classic .doc right now, though we accept it in UI.
        return "[Text Extraction Failed: Only .docx supported, classic .doc is unsupported]", True
        
    else:
        return f"[Text Extraction Failed: Unsupported file type '{filename}']", True
