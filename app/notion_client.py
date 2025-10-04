import os
import httpx
from typing import List, Dict, Optional
from .config import Config
from .logging_utils import log_error


class NotionClient:
    """Client for searching Notion databases and pages."""
    
    def __init__(self):
        self.api_key = Config.NOTION_API_KEY
        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
    
    async def search(self, query: str, max_results: int = 6) -> List[Dict]:
        """
        Search Notion for pages and databases containing the query.
        Returns a list of relevant Notion content with full page content.
        """
        if not self.api_key:
            print(f"DEBUG: Notion API key not set")
            return []
        
        print(f"DEBUG: Searching Notion with query: '{query}'")
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Search for pages and databases
                search_data = {
                    "query": query,
                    "page_size": min(max_results * 2, 100)  # Get more results to filter
                }
                
                response = await client.post(
                    f"{self.base_url}/search",
                    headers=self.headers,
                    json=search_data
                )
                
                if response.status_code != 200:
                    log_error("notion_search", f"Notion API error: {response.status_code} - {response.text}")
                    return []
                
                results = response.json()
                search_results = results.get("results", [])
                
                # Process results and fetch content for each page
                processed_results = []
                for result in search_results[:max_results]:
                    try:
                        processed_result = await self._process_and_fetch_content(result, client)
                        if processed_result:
                            processed_results.append(processed_result)
                    except Exception as e:
                        log_error("notion_process", f"Error processing result: {str(e)}")
                        continue
                
                return processed_results
                
        except Exception as e:
            log_error("notion_search", f"Error searching Notion: {str(e)}")
            return []
    
    async def _process_and_fetch_content(self, result: Dict, client: httpx.AsyncClient) -> Optional[Dict]:
        """Process a single Notion result and fetch its content."""
        try:
            page_id = result.get("id", "")
            page_type = result.get("object", "page")
            
            # Extract basic information
            title = self._extract_title(result)
            url = result.get("url", "")
            last_edited = result.get("last_edited_time", "")
            
            # Fetch page content
            content = ""
            if page_type == "page":
                content = await self._fetch_page_content(page_id, client)
            
            return {
                "id": page_id,
                "type": page_type,
                "title": title,
                "url": url,
                "last_edited": last_edited,
                "content": content,
                "source": "notion"
            }
            
        except Exception as e:
            log_error("notion_process_content", f"Error processing result: {str(e)}")
            return None
    
    async def _fetch_page_content(self, page_id: str, client: httpx.AsyncClient) -> str:
        """Fetch the content of a Notion page."""
        try:
            # Get page blocks
            response = await client.get(
                f"{self.base_url}/blocks/{page_id}/children",
                headers=self.headers,
                params={"page_size": 100}
            )
            
            if response.status_code != 200:
                return ""
            
            blocks = response.json().get("results", [])
            content_parts = []
            
            for block in blocks:
                block_type = block.get("type", "")
                block_content = self._extract_block_content(block)
                if block_content:
                    content_parts.append(block_content)
            
            return "\n".join(content_parts)
            
        except Exception as e:
            log_error("notion_fetch_content", f"Error fetching page content: {str(e)}")
            return ""
    
    def _extract_block_content(self, block: Dict) -> str:
        """Extract text content from a Notion block."""
        try:
            block_type = block.get("type", "")
            
            if block_type in ["paragraph", "heading_1", "heading_2", "heading_3"]:
                rich_text = block.get(block_type, {}).get("rich_text", [])
                return "".join([text.get("plain_text", "") for text in rich_text])
            
            elif block_type == "bulleted_list_item":
                rich_text = block.get("bulleted_list_item", {}).get("rich_text", [])
                content = "".join([text.get("plain_text", "") for text in rich_text])
                return f"• {content}" if content else ""
            
            elif block_type == "numbered_list_item":
                rich_text = block.get("numbered_list_item", {}).get("rich_text", [])
                content = "".join([text.get("plain_text", "") for text in rich_text])
                return f"1. {content}" if content else ""
            
            elif block_type == "code":
                code_obj = block.get("code", {})
                language = code_obj.get("language", "")
                rich_text = code_obj.get("rich_text", [])
                content = "".join([text.get("plain_text", "") for text in rich_text])
                return f"```{language}\n{content}\n```" if content else ""
            
            elif block_type == "quote":
                rich_text = block.get("quote", {}).get("rich_text", [])
                content = "".join([text.get("plain_text", "") for text in rich_text])
                return f"> {content}" if content else ""
            
            return ""
            
        except Exception as e:
            log_error("notion_extract_block", f"Error extracting block content: {str(e)}")
            return ""
    
    def _process_search_results(self, results: List[Dict], max_results: int) -> List[Dict]:
        """Process and format Notion search results."""
        processed_results = []
        
        for result in results[:max_results]:
            try:
                # Extract basic information
                page_id = result.get("id", "")
                page_type = result.get("object", "page")
                
                # Get title
                title = self._extract_title(result)
                
                # Get URL
                url = result.get("url", "")
                
                # Get last edited time
                last_edited = result.get("last_edited_time", "")
                
                # For pages, we might want to get more content
                content_preview = self._extract_content_preview(result)
                
                processed_result = {
                    "id": page_id,
                    "type": page_type,
                    "title": title,
                    "url": url,
                    "last_edited": last_edited,
                    "content_preview": content_preview,
                    "source": "notion"
                }
                
                processed_results.append(processed_result)
                
            except Exception as e:
                log_error("notion_process", f"Error processing Notion result: {str(e)}")
                continue
        
        return processed_results
    
    def _extract_title(self, result: Dict) -> str:
        """Extract title from Notion result."""
        properties = result.get("properties", {})
        
        # Try different title fields
        for title_field in ["title", "Name", "name", "Title"]:
            if title_field in properties:
                title_prop = properties[title_field]
                if title_prop.get("type") == "title":
                    title_rich_text = title_prop.get("title", [])
                    if title_rich_text:
                        return "".join([text.get("plain_text", "") for text in title_rich_text])
        
        # Fallback to page title or ID
        return result.get("title", [{}])[0].get("plain_text", "") if result.get("title") else f"Notion {result.get('object', 'page')}"
    
    def _extract_content_preview(self, result: Dict) -> str:
        """Extract a content preview from Notion result."""
        # For now, we'll use the title as content preview
        # In a more advanced implementation, we could fetch page content
        return self._extract_title(result)
    
    async def get_page_content(self, page_id: str) -> Optional[str]:
        """
        Get the full content of a Notion page.
        This is a more advanced feature that could be implemented later.
        """
        if not self.api_key:
            return None
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/pages/{page_id}",
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    return None
                
                # This would require more complex parsing of Notion's block structure
                # For now, we'll return a placeholder
                return "Notion page content (full content extraction not implemented)"
                
        except Exception as e:
            log_error("notion_page_content", f"Error getting page content: {str(e)}")
            return None
