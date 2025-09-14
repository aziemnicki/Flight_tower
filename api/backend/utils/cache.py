import time
from typing import Any, Dict, Optional

_cache: Dict[str, Any] = {}
_cache_expiry: Dict[str, float] = {}

def get(key: str) -> Optional[Any]:
    if key in _cache and time.time() < _cache_expiry[key]:
        return _cache[key]
    return None

def set(key: str, value: Any, ttl: int):
    _cache[key] = value
    _cache_expiry[key] = time.time() + ttl
