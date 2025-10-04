from typing import List, Dict, Tuple
from openai import OpenAI
from .config import Config


class ResponseGenerator:
    def __init__(self):
        self.client = OpenAI(
            api_key=Config.OPENAI_API_KEY, 
            timeout=60.0,  # Increased timeout for course generation
            max_retries=2  # More retries for reliability
        )
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        return """You are an AI assistant that answers questions about HR policies and procedures based strictly on the provided document chunks.

IMPORTANT INSTRUCTIONS:
1. Answer ONLY based on the information provided in the retrieved chunks
2. Format your response as:
   - Answer (concise, policy language)
   - How this is determined: [bullet list of citations]
3. If information is not available in the chunks, respond with: "Not specified in the retrieved sections." Then list closest sections with pages.
4. Include citations using EXACTLY this format: [HR Manual — <Heading path ≤ 3 levels>, pp.<a>–<b>]
5. Note ETI precedence if relevant (Constitutive Instruments override local law)
6. Use the heading_path and page information from each chunk for citations
7. Be concise but comprehensive
8. Do not make assumptions or add information not in the chunks"""
    
    async def generate_response(self, query: str, chunks: List[Dict]) -> Tuple[str, List[str]]:
        if not chunks:
            return "Not specified in the retrieved sections.", []
        
        context_parts, citations = self._prepare_context(chunks)
        context = "\n".join(context_parts)
        
        answer = await self._generate_answer(query, context)
        used_citations = self._extract_citations(answer, citations)
        
        return answer, used_citations
    
    def _prepare_context(self, chunks: List[Dict]) -> Tuple[List[str], List[str]]:
        context_parts = []
        citations = []
        
        for i, chunk in enumerate(chunks):
            heading_path = chunk.get("headings_path", chunk.get("heading_path", "General"))
            if isinstance(heading_path, list):
                heading_path = " → ".join(heading_path[:3])  # Max 3 levels
            
            pages = chunk.get("pages", [chunk.get("page_start", 1), chunk.get("page_end", 1)])
            if isinstance(pages, list) and len(pages) >= 2:
                page_start, page_end = pages[0], pages[1]
            else:
                page_start = page_end = chunk.get("page_start", 1)
            
            page_info = f"p.{page_start}" if page_start == page_end else f"pp.{page_start}–{page_end}"
            citation = f"[HR Manual — {heading_path}, {page_info}]"
            
            citations.append(citation)
            chunk_id = chunk.get("chunk_index", chunk.get("chunk_id", i))
            context_parts.append(f"<CHUNK id={chunk_id}>\n{chunk['text']}\n</CHUNK>\n")
        
        return context_parts, citations
    
    async def _generate_answer(self, query: str, context: str) -> str:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Question: {query}\n\nContext:\n{context}\n\nAnswer:"}
        ]
        
        response = self.client.chat.completions.create(
            model=Config.CHAT_MODEL,
            messages=messages,
            temperature=0.1,  # Lower temperature for faster generation
            max_tokens=250,   # Further reduced for speed
            stream=False      # Ensure no streaming overhead
        )
        
        return response.choices[0].message.content.strip()
    
    def _extract_citations(self, answer: str, citations: List[str]) -> List[str]:
        import re
        
        # Extract citations that GPT actually generated in the answer
        citation_pattern = r'\[HR Manual — ([^\]]+)\]'
        gpt_citations = re.findall(citation_pattern, answer)
        
        if gpt_citations:
            # Use the citations GPT generated
            formatted_citations = [f"[HR Manual — {cite}]" for cite in gpt_citations]
            return list(set(formatted_citations))  # Remove duplicates
        else:
            # Fallback to metadata-based citations if no GPT citations found
            used_citations = []
            for citation in citations:
                if citation in answer or any(part in answer for part in citation.split("—")[1:]):
                    used_citations.append(citation)
            
            return used_citations if used_citations else list(set(citations))
    
    async def generate_course(self, user_context: str, learning_goal: str) -> str:
        """Generate a personalized learning course based on user context and learning goal."""
        course_prompt = f"""You are an expert learning and development specialist. Based on the user's current skills, position, and learning goals, create a comprehensive personalized learning roadmap.

{user_context}

Please create a detailed learning roadmap in clean HTML format following this exact template structure. Do NOT include DOCTYPE, html, head, meta, style tags or any document structure. Only include the content HTML elements:

<h1>Specialist Growth Roadmap Template</h1>

<h2>1. Current Assessment</h2>
<table border="1" cellpadding="8" cellspacing="0">
<tr><td><strong>Current Role/Skills</strong></td><td>[List current position and key skills]</td></tr>
<tr><td><strong>Strengths</strong></td><td>[List 3 key strengths]</td></tr>
<tr><td><strong>Development Areas</strong></td><td>[List 3 areas for improvement]</td></tr>
</table>

<h2>2. Growth Targets</h2>
<table border="1" cellpadding="8" cellspacing="0">
<tr><td><strong>Short-term (6-12 months)</strong></td><td>[Specific objectives]</td></tr>
<tr><td><strong>Medium-term (1-2 years)</strong></td><td>[Career milestones]</td></tr>
<tr><td><strong>Long-term (3+ years)</strong></td><td>[Aspirational position]</td></tr>
</table>

<h2>3. Skills Development Plan</h2>
<table border="1" cellpadding="8" cellspacing="0">
<tr><th>Skill/Knowledge Area</th><th>Current Level (1-5)</th><th>Target Level</th><th>Timeline</th><th>Resources</th></tr>
<tr><td>[Technical Skill 1]</td><td></td><td></td><td></td><td></td></tr>
<tr><td>[Technical Skill 2]</td><td></td><td></td><td></td><td></td></tr>
<tr><td>[Soft Skill 1]</td><td></td><td></td><td></td><td></td></tr>
</table>

<h2>4. Action Plan Timeline</h2>
<table border="1" cellpadding="8" cellspacing="0">
<tr><th>Timeframe</th><th>Actions</th><th>Expected Outcomes</th></tr>
<tr><td>Months 1-3</td><td>[Key activities]</td><td>[Results]</td></tr>
<tr><td>Months 4-6</td><td>[Key activities]</td><td>[Results]</td></tr>
<tr><td>Months 7-12</td><td>[Key activities]</td><td>[Results]</td></tr>
</table>

<h2>5. Resources Required</h2>
<ul>
<li><strong>Training/Courses:</strong> [Specific courses with dates]</li>
<li><strong>Mentorship:</strong> [Potential mentors]</li>
<li><strong>Projects:</strong> [Stretch assignments]</li>
<li><strong>Budget:</strong> [Financial resources needed]</li>
</ul>

<h2>6. Risk Assessment</h2>
<table border="1" cellpadding="8" cellspacing="0">
<tr><th>Risk</th><th>Impact (L/M/H)</th><th>Mitigation</th></tr>
<tr><td>[Risk 1]</td><td></td><td></td></tr>
<tr><td>[Risk 2]</td><td></td><td></td></tr>
</table>

<h2>7. Success Metrics</h2>
<ul>
<li><strong>Key Performance Indicators:</strong> [Measurable indicators]</li>
<li><strong>Review Schedule:</strong> [Frequency of progress reviews]</li>
<li><strong>Feedback Sources:</strong> [Who will provide assessment]</li>
</ul>

IMPORTANT: Generate ONLY the HTML content elements (h1, h2, table, ul, li, strong, th, td, tr) without any document structure, DOCTYPE, html, head, meta, style tags, or newline characters. The output should be clean HTML content that can be directly pasted into Notion.

Make sure to:
1. Fill in all sections with specific, actionable content
2. Base recommendations on the user's current skill level and position
3. Align with their stated learning goal: "{learning_goal}"
4. Provide realistic timelines and achievable milestones
5. Include specific resources, courses, and learning materials
6. Consider both technical and soft skill development
7. Make it personalized and relevant to their career path
8. Use clean HTML formatting with tables, headers, and lists
9. NO newline characters, NO document structure, NO styling

Generate the complete roadmap in clean HTML content now:"""

        messages = [
            {"role": "system", "content": "You are an expert learning and development specialist with deep knowledge of career development, skill assessment, and personalized learning paths."},
            {"role": "user", "content": course_prompt}
        ]
        
        response = self.client.chat.completions.create(
            model=Config.CHAT_MODEL,
            messages=messages,
            temperature=0.7,  # Higher temperature for more creative and personalized content
            max_tokens=4000,  # Increased tokens for comprehensive course content
            stream=False,
            timeout=90.0  # Additional timeout for course generation specifically
        )
        
        # Clean up the response content to ensure clean HTML formatting
        content = response.choices[0].message.content.strip()
        
        # Remove any escaped characters and convert to clean HTML
        content = content.replace('\\n', '')      # Remove escaped newlines
        content = content.replace('\\r', '')      # Remove escaped carriage returns
        content = content.replace('\\t', '')      # Remove escaped tabs
        
        # Handle double-escaped characters
        content = content.replace('\\\\n', '')    # Remove double-escaped newlines
        content = content.replace('\\\\r', '')    # Remove double-escaped carriage returns
        content = content.replace('\\\\t', '')    # Remove double-escaped tabs
        
        # Clean up any remaining escape sequences
        import re
        content = re.sub(r'\\([ntr])', '', content)  # Remove any remaining escape sequences
        
        # Remove all newlines to create clean HTML
        content = content.replace('\n', '')
        content = content.replace('\r', '')
        
        # Clean up extra spaces around HTML tags
        content = re.sub(r'>\s+<', '><', content)  # Remove spaces between tags
        
        # Clean up multiple spaces
        content = re.sub(r'\s+', ' ', content)  # Replace multiple spaces with single space
        
        # Ensure proper HTML formatting
        content = content.strip()
        
        return content
    
    async def generate_course_content(self, prompt: str) -> str:
        """Generate course content for PDP based on a simple prompt."""
        messages = [
            {"role": "system", "content": "You are an expert career development specialist. Create personalized development plans in JSON format."},
            {"role": "user", "content": prompt}
        ]
        
        response = self.client.chat.completions.create(
            model=Config.CHAT_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
            stream=False
        )
        
        return response.choices[0].message.content.strip()
    
    async def generate_checklist(self, course_content: str) -> List:
        """Generate a checklist of actionable items from course content."""
        checklist_prompt = f"""You are an expert learning and development specialist. Based on the provided course content, create a comprehensive checklist of actionable items that a user needs to complete to reach their learning goals.

Course Content:
{course_content}

Please generate a checklist in the following JSON format:
{{
  "checklist": [
    {{
      "category": "Category Name",
      "items": [
        "Specific actionable item 1",
        "Specific actionable item 2",
        "Specific actionable item 3"
      ]
    }},
    {{
      "category": "Another Category",
      "items": [
        "Another specific item",
        "Another specific item"
      ]
    }}
  ]
}}

Requirements:
1. Break down the course into logical categories (e.g., "Foundation Skills", "Advanced Topics", "Practical Applications", "Assessment & Review")
2. Each item should be specific, actionable, and measurable
3. Include both learning activities and practical exercises
4. Consider the progression from basic to advanced
5. Include time estimates where relevant
6. Make items concrete and achievable
7. Support nested sub-items where appropriate (use arrays within arrays for sub-checks)

Generate a comprehensive checklist that covers all aspects of the course content:"""

        messages = [
            {"role": "system", "content": "You are an expert learning and development specialist who creates actionable, structured learning checklists from course content."},
            {"role": "user", "content": checklist_prompt}
        ]
        
        response = self.client.chat.completions.create(
            model=Config.CHAT_MODEL,
            messages=messages,
            temperature=0.3,  # Lower temperature for more structured output
            max_tokens=3000,  # Sufficient tokens for comprehensive checklist
            stream=False,
            timeout=60.0
        )
        
        content = response.choices[0].message.content.strip()
        
        # Try to parse the JSON response
        import json
        try:
            # Extract JSON from the response (in case there's extra text)
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_content = content[json_start:json_end]
                parsed_data = json.loads(json_content)
                return parsed_data.get("checklist", [])
            else:
                # Fallback: create a simple checklist structure
                return self._create_fallback_checklist(content)
        except json.JSONDecodeError:
            # Fallback: create a simple checklist structure
            return self._create_fallback_checklist(content)
    
    def _create_fallback_checklist(self, content: str) -> List:
        """Create a fallback checklist structure if JSON parsing fails."""
        # Simple fallback: create basic checklist items
        lines = content.split('\n')
        checklist = []
        current_category = "Learning Tasks"
        current_items = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if line looks like a category header
            if (line.startswith('#') or 
                line.isupper() or 
                line.endswith(':') or
                'category' in line.lower() or
                'section' in line.lower()):
                if current_items:
                    checklist.append({
                        "category": current_category,
                        "items": current_items
                    })
                current_category = line.replace('#', '').replace(':', '').strip()
                current_items = []
            else:
                # Clean up the line and add as item
                item = line.replace('-', '').replace('*', '').replace('•', '').strip()
                if item and len(item) > 5:  # Only add substantial items
                    current_items.append(item)
        
        # Add the last category
        if current_items:
            checklist.append({
                "category": current_category,
                "items": current_items
            })
        
        # If no structured content found, create a basic checklist
        if not checklist:
            checklist = [{
                "category": "Course Completion Tasks",
                "items": [
                    "Review the complete course content",
                    "Identify key learning objectives",
                    "Create a personal study schedule",
                    "Complete all practical exercises",
                    "Assess your progress regularly"
                ]
            }]
        
        return checklist