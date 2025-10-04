import re
from typing import List, Dict, Optional
import fitz
import pytesseract
from PIL import Image
import io


class PDFProcessor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.doc = fitz.open(pdf_path)
    
    def extract_text_with_structure(self) -> List[Dict]:
        pages_data = []
        
        for page_num in range(len(self.doc)):
            page = self.doc[page_num]
            blocks = page.get_text("dict")["blocks"]
            
            page_content = {
                "page_num": page_num + 1,
                "text_blocks": [],
                "headings": [],
                "tables": []
            }
            
            # Extract text normally first
            text_extracted = False
            for block in blocks:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"].strip()
                            if text:
                                text_extracted = True
                                font_size = span["size"]
                                font_flags = span["flags"]
                                
                                is_heading = self._is_heading(font_size, font_flags, text)
                                is_table = self._is_table_content(text, block)
                                
                                if is_heading:
                                    heading_level = self._determine_heading_level(font_size, font_flags)
                                    page_content["headings"].append({
                                        "text": text,
                                        "level": heading_level,
                                        "font_size": font_size
                                    })
                                
                                page_content["text_blocks"].append({
                                    "text": text,
                                    "font_size": font_size,
                                    "is_heading": is_heading,
                                    "is_table": is_table,
                                    "font_flags": font_flags
                                })
            
            # Check if page has near-zero text, apply OCR if needed
            total_text = " ".join([block["text"] for block in page_content["text_blocks"]])
            if len(total_text.strip()) < 50:  # Near-zero text threshold
                print(f"Page {page_num + 1} has minimal text, applying OCR...")
                ocr_content = self._apply_ocr(page)
                if ocr_content:
                    page_content["text_blocks"].append({
                        "text": ocr_content,
                        "font_size": 12.0,  # Default size for OCR text
                        "is_heading": False,
                        "is_table": False,
                        "font_flags": 0,
                        "source": "ocr"
                    })
            
            # Extract tables separately
            tables = self._extract_tables(page)
            page_content["tables"] = tables
            
            pages_data.append(page_content)
        
        return pages_data
    
    def _is_heading(self, font_size: float, font_flags: int, text: str) -> bool:
        is_bold = bool(font_flags & 16)
        is_large_font = font_size > 11
        
        # Enhanced heading patterns for ETI HR manual
        heading_patterns = [
            r'^\d+\.\d+\s+',           # 4.2, 1.1, etc.
            r'^SECTION\s+\d+',         # SECTION 1, SECTION 2, etc.
            r'^\d+\.\d+\.\d+\s+',      # 4.2.1, 1.1.1, etc.
            r'^[A-Z][A-Z\s/&-]+$',     # ALL CAPS headings
            r'^\d+\.\s+[A-Z]',         # 1. SOMETHING
            r'^Policy\s+(Statement|Guidelines)', # Policy sections
            r'^Application$',          # Application sections
            r'^Procedure$',           # Procedure sections
        ]
        
        has_heading_pattern = any(re.match(pattern, text) for pattern in heading_patterns)
        
        # More precise heading detection
        return (is_bold and (is_large_font or has_heading_pattern)) or \
               (has_heading_pattern and len(text) < 80) or \
               (is_large_font and is_bold and len(text) < 50)
    
    def _determine_heading_level(self, font_size: float, font_flags: int) -> int:
        if font_size >= 16:
            return 1
        elif font_size >= 14:
            return 2
        else:
            return 3
    
    def _apply_ocr(self, page) -> Optional[str]:
        """Apply OCR to a page using pytesseract."""
        try:
            # Get page as image
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image
            img = Image.open(io.BytesIO(img_data))
            
            # Apply OCR
            text = pytesseract.image_to_string(img, config='--psm 6')
            return text.strip() if text.strip() else None
        except Exception as e:
            print(f"OCR failed: {e}")
            return None
    
    def _is_table_content(self, text: str, block: Dict) -> bool:
        """Detect if text block is part of a table."""
        # Look for table indicators
        table_patterns = [
            r'\|\s*\w+\s*\|',  # Pipe-separated values
            r'\t\w+\t',        # Tab-separated values
            r'^\s*\d+\.\d+\s+\d+\.\d+',  # Numeric columns
            r'^\s*[A-Z][a-z]+\s+\d+',    # Text followed by numbers
        ]
        
        # Check if text has table-like patterns
        has_table_pattern = any(re.search(pattern, text) for pattern in table_patterns)
        
        # Check if block has uniform spacing (table characteristic)
        has_uniform_spacing = len(text.split('\t')) > 2 or text.count('  ') > 2
        
        return has_table_pattern or has_uniform_spacing
    
    def _extract_tables(self, page) -> List[Dict]:
        """Extract tables from page and convert to Markdown format."""
        tables = []
        try:
            # Use PyMuPDF's table detection
            table_list = page.find_tables()
            
            for i, table in enumerate(table_list):
                # Extract table data
                table_data = table.extract()
                if table_data and len(table_data) > 1:  # At least header + 1 row
                    markdown_table = self._convert_table_to_markdown(table_data)
                    tables.append({
                        "table_index": i,
                        "markdown": markdown_table,
                        "row_count": len(table_data),
                        "col_count": len(table_data[0]) if table_data else 0
                    })
        except Exception as e:
            print(f"Table extraction failed: {e}")
        
        return tables
    
    def _convert_table_to_markdown(self, table_data: List[List[str]]) -> str:
        """Convert table data to Markdown format."""
        if not table_data:
            return ""
        
        markdown_lines = []
        
        # Header row
        header = "| " + " | ".join(str(cell or "").strip() for cell in table_data[0]) + " |"
        markdown_lines.append(header)
        
        # Separator row
        separator = "| " + " | ".join("---" for _ in table_data[0]) + " |"
        markdown_lines.append(separator)
        
        # Data rows
        for row in table_data[1:]:
            row_md = "| " + " | ".join(str(cell or "").strip() for cell in row) + " |"
            markdown_lines.append(row_md)
        
        return "\n".join(markdown_lines)
