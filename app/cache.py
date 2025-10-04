import hashlib
import json
from typing import Dict, Optional
import time

class SimpleCache:
    """Simple in-memory cache for RAG responses."""
    
    def __init__(self, max_size: int = 100, ttl_seconds: int = 3600):
        self.cache: Dict[str, Dict] = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
    
    def _hash_query(self, query: str) -> str:
        """Create hash key for query."""
        return hashlib.md5(query.lower().encode()).hexdigest()
    
    def get(self, query: str) -> Optional[Dict]:
        """Get cached response for query."""
        key = self._hash_query(query)
        
        if key in self.cache:
            cached_item = self.cache[key]
            # Check if expired
            if time.time() - cached_item['timestamp'] < self.ttl_seconds:
                print(f"CACHE HIT: {query[:50]}...")  # Debug log
                return cached_item['response']
            else:
                # Remove expired item
                print(f"CACHE EXPIRED: {query[:50]}...")  # Debug log
                del self.cache[key]
        else:
            print(f"CACHE MISS: {query[:50]}...")  # Debug log
        
        return None
    
    def put(self, query: str, response: Dict) -> None:
        """Cache response for query."""
        key = self._hash_query(query)
        
        # Remove oldest item if cache is full
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]['timestamp'])
            del self.cache[oldest_key]
        
        self.cache[key] = {
            'response': response,
            'timestamp': time.time()
        }
        print(f"CACHE PUT: {query[:50]}... (cache size: {len(self.cache)})")  # Debug log
    
    def clear(self) -> None:
        """Clear all cached items."""
        self.cache.clear()
    
    def size(self) -> int:
        """Get current cache size."""
        return len(self.cache)

# Global cache instance
response_cache = SimpleCache(max_size=50, ttl_seconds=1800)  # 30 minutes TTL
