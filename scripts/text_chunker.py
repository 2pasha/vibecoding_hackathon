from typing import List, Dict
import tiktoken
import re


class TextChunker:
    def __init__(self, min_tokens: int = 400, max_tokens: int = 1200, overlap_tokens: int = 100):
        self.min_tokens = min_tokens
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
    
    def chunk_pages(self, pages_data: List[Dict]) -> List[Dict]:
        chunks = []
        current_chunk_text = ""
        current_chunk_tokens = 0
        current_headings = []
        chunk_headings = []  # Track headings for current chunk
        start_page = 1
        current_page = 1
        chunk_id = 0
        
        for page_data in pages_data:
            page_num = page_data["page_num"]
            current_page = page_num
            
            # Process tables - only create separate chunks for LARGE tables (>= min_tokens)
            for table in page_data.get("tables", []):
                table_tokens = len(self.tokenizer.encode(table["markdown"]))
                
                # Only create separate chunk for large tables that meet minimum token requirement
                if table["row_count"] > 5 and table_tokens >= self.min_tokens:
                    if current_chunk_text.strip():
                        # Finalize current text chunk before table
                        final_headings = chunk_headings if chunk_headings else current_headings
                        chunk = self._create_chunk(
                            chunk_id, current_chunk_text.strip(), 
                            final_headings, start_page, page_num
                        )
                        chunks.append(chunk)
                        chunk_id += 1
                        current_chunk_text = ""
                        current_chunk_tokens = 0
                    
                    # Create table chunk
                    table_chunk = self._create_chunk(
                        chunk_id, table["markdown"],
                        current_headings, page_num, page_num
                    )
                    table_chunk["is_table"] = True
                    chunks.append(table_chunk)
                    chunk_id += 1
                    start_page = page_num
            
            # Update headings based on this page
            old_headings = current_headings.copy()
            self._update_headings(page_data["headings"], current_headings)
            
            # Check for HARD BREAK conditions (as per requirements)
            hard_break_needed = self._check_hard_break(current_headings, old_headings)
            
            # Initialize page_text (start fresh for each page)
            page_text = ""
            
            # Add small tables that weren't processed as separate chunks
            for table in page_data.get("tables", []):
                table_tokens = len(self.tokenizer.encode(table["markdown"]))
                if not (table["row_count"] > 5 and table_tokens >= self.min_tokens):
                    page_text += table["markdown"] + "\n\n"
            
            # Add regular text blocks
            for block in page_data["text_blocks"]:
                if not block["is_heading"] and not block.get("is_table", False):
                    page_text += block["text"] + " "
            
            page_tokens = len(self.tokenizer.encode(page_text))
            
            # Start new chunk if: size limit reached OR hard break needed
            if (current_chunk_tokens + page_tokens > self.max_tokens or hard_break_needed) and current_chunk_text:
                # Use the most relevant headings for this chunk
                final_headings = chunk_headings if chunk_headings else old_headings
                chunk = self._create_chunk(
                    chunk_id, current_chunk_text.strip(), 
                    final_headings, start_page, current_page - 1
                )
                chunks.append(chunk)
                chunk_id += 1
                
                overlap_text = self._get_overlap_text(current_chunk_text) if not hard_break_needed else ""
                current_chunk_text = overlap_text + page_text
                current_chunk_tokens = len(self.tokenizer.encode(current_chunk_text))
                start_page = page_num
                chunk_headings = current_headings.copy()  # New chunk gets current headings
            else:
                if not current_chunk_text:
                    start_page = page_num
                    chunk_headings = current_headings.copy()
                elif not chunk_headings and current_headings:
                    chunk_headings = current_headings.copy()
                    
                current_chunk_text += page_text
                current_chunk_tokens += page_tokens
        
        if current_chunk_text.strip():
            final_headings = chunk_headings if chunk_headings else current_headings
            chunk = self._create_chunk(
                chunk_id, current_chunk_text.strip(), 
                final_headings, start_page, current_page
            )
            chunks.append(chunk)
        
        # Merge short orphan chunks into neighbors
        chunks = self._merge_orphan_chunks(chunks)
        
        return chunks
    
    def _update_headings(self, page_headings: List[Dict], current_headings: List[str]):
        for heading in page_headings:
            level = heading["level"]
            text = heading["text"]
            
            # Skip very long headings that are likely false positives
            if len(text) > 100:
                continue
                
            # For key section headings, reset the hierarchy
            major_sections = ["ANNUAL LEAVE", "SICK LEAVE", "MATERNITY", "PERFORMANCE MANAGEMENT", 
                            "COMPENSATION", "BENEFITS", "TERMINATION", "EMPLOYMENT", "DISCIPLINARY"]
            
            if text in major_sections:
                current_headings.clear()
                current_headings.append(text)
            elif text.startswith("SECTION"):
                current_headings.clear()
                current_headings.append(text)
            elif re.match(r'^\d+\.\d+', text):  # Numbered sections like "4.2"
                # Keep parent section but update subsection
                if len(current_headings) >= 2:
                    current_headings = current_headings[:2]  # Keep section level
                current_headings.append(text)
            elif level <= len(current_headings):
                current_headings = current_headings[:level-1]
                if level > 0:
                    if level > len(current_headings):
                        current_headings.extend([""] * (level - len(current_headings)))
                    current_headings[level-1] = text
            else:
                current_headings.append(text)
            
            # Clean up empty headings
            while current_headings and not current_headings[-1]:
                current_headings.pop()
    
    def _get_overlap_text(self, text: str) -> str:
        tokens = self.tokenizer.encode(text)
        if len(tokens) <= self.overlap_tokens:
            return text + " "
        
        overlap_tokens = tokens[-self.overlap_tokens:]
        overlap_text = self.tokenizer.decode(overlap_tokens)
        return overlap_text + " "
    
    def _check_hard_break(self, current_headings: List[str], old_headings: List[str]) -> bool:
        """Check if a hard break is needed based on heading changes."""
        # Hard break on SECTION changes
        current_sections = [h for h in current_headings if h.startswith("SECTION")]
        old_sections = [h for h in old_headings if h.startswith("SECTION")]
        
        if current_sections != old_sections:
            return True
        
        # Hard break on numbered clause changes (1, 1.2, 1.2.4)
        current_clauses = []
        old_clauses = []
        
        for h in current_headings:
            # Match patterns like "1", "1.2", "1.2.4"
            clause_match = re.match(r'^(\d+(?:\.\d+)*)\s', h)
            if clause_match:
                current_clauses.append(clause_match.group(1))
        
        for h in old_headings:
            clause_match = re.match(r'^(\d+(?:\.\d+)*)\s', h)
            if clause_match:
                old_clauses.append(clause_match.group(1))
        
        # Hard break if we have different numbered clauses
        if current_clauses != old_clauses and (current_clauses or old_clauses):
            return True
        
        return False
    
    def _merge_orphan_chunks(self, chunks: List[Dict]) -> List[Dict]:
        """Aggressively merge short orphan chunks to ensure 400+ token minimum."""
        if len(chunks) <= 1:
            return chunks
        
        # Multiple passes to ensure thorough merging
        merged_chunks = chunks[:]
        max_passes = 3
        
        for pass_num in range(max_passes):
            previous_count = len(merged_chunks)
            merged_chunks = self._single_merge_pass(merged_chunks)
            
            # If no changes in this pass, we're done
            if len(merged_chunks) == previous_count:
                break
        
        return merged_chunks
    
    def _single_merge_pass(self, chunks: List[Dict]) -> List[Dict]:
        """Perform a single pass of merging small chunks."""
        if len(chunks) <= 1:
            return chunks
            
        merged_chunks = []
        i = 0
        
        while i < len(chunks):
            current_chunk = chunks[i]
            current_tokens = current_chunk["token_count"]
            
            # If chunk is below minimum threshold
            if current_tokens < self.min_tokens:
                merged = False
                
                # Try to merge with next chunk first
                if (i + 1 < len(chunks) and 
                    current_tokens + chunks[i + 1]["token_count"] <= self.max_tokens):
                    
                    next_chunk = chunks[i + 1]
                    merged_text = current_chunk["text"] + "\n\n" + next_chunk["text"]
                    merged_headings = current_chunk["headings_path"] if current_chunk["headings_path"] else next_chunk["headings_path"]
                    
                    merged_chunk = self._create_merged_chunk(
                        current_chunk, next_chunk, merged_text, merged_headings
                    )
                    
                    merged_chunks.append(merged_chunk)
                    i += 2  # Skip next chunk as it's been merged
                    merged = True
                
                # Try to merge with previous chunk if forward merge didn't work
                elif (merged_chunks and 
                      current_tokens + merged_chunks[-1]["token_count"] <= self.max_tokens):
                    
                    prev_chunk = merged_chunks.pop()
                    merged_text = prev_chunk["text"] + "\n\n" + current_chunk["text"]
                    merged_headings = prev_chunk["headings_path"] if prev_chunk["headings_path"] else current_chunk["headings_path"]
                    
                    merged_chunk = self._create_merged_chunk(
                        prev_chunk, current_chunk, merged_text, merged_headings
                    )
                    
                    merged_chunks.append(merged_chunk)
                    i += 1
                    merged = True
                
                # If still couldn't merge and chunk is very small, try with larger neighbor
                elif current_tokens < 200:  # Very small chunks
                    # Try merging with next chunk even if it goes slightly over max
                    if (i + 1 < len(chunks) and 
                        current_tokens + chunks[i + 1]["token_count"] <= self.max_tokens * 1.1):
                        
                        next_chunk = chunks[i + 1]
                        merged_text = current_chunk["text"] + "\n\n" + next_chunk["text"]
                        merged_headings = current_chunk["headings_path"] if current_chunk["headings_path"] else next_chunk["headings_path"]
                        
                        merged_chunk = self._create_merged_chunk(
                            current_chunk, next_chunk, merged_text, merged_headings
                        )
                        
                        merged_chunks.append(merged_chunk)
                        i += 2
                        merged = True
                
                if not merged:
                    # Keep the chunk even if it's small (last resort)
                    merged_chunks.append(current_chunk)
                    i += 1
            else:
                # Chunk meets minimum, keep it
                merged_chunks.append(current_chunk)
                i += 1
        
        return merged_chunks
    
    def _create_merged_chunk(self, chunk1: Dict, chunk2: Dict, merged_text: str, merged_headings: List[str]) -> Dict:
        """Helper to create a merged chunk with proper metadata."""
        return {
            "doc_id": "eti-hr-2023",
            "chunk_index": chunk1["chunk_index"],
            "pages": [chunk1["pages"][0], chunk2["pages"][1]],
            "headings_path": merged_headings,
            "text": merged_text,
            "token_count": len(self.tokenizer.encode(merged_text)),
            # Legacy fields
            "chunk_id": chunk1["chunk_id"],
            "heading_path": " → ".join(merged_headings) if merged_headings else "General",
            "page_start": chunk1["pages"][0],
            "page_end": chunk2["pages"][1],
            # Preserve table flag if either chunk was a table
            "is_table": chunk1.get("is_table", False) or chunk2.get("is_table", False)
        }
    
    def _create_chunk(self, chunk_id: int, text: str, headings: List[str], 
                     start_page: int, end_page: int) -> Dict:
        clean_headings = [h for h in headings[:3] if h.strip()]
        
        # Brief specifies this exact metadata structure
        return {
            "doc_id": "eti-hr-2023",
            "chunk_index": chunk_id,
            "pages": [start_page, end_page],
            "headings_path": clean_headings,
            "text": text,
            "token_count": len(self.tokenizer.encode(text)),
            # Legacy fields for backward compatibility
            "chunk_id": f"chunk_{chunk_id:04d}",
            "heading_path": " → ".join(clean_headings) if clean_headings else "General",
            "page_start": start_page,
            "page_end": end_page
        }
