"""
Tests for cache module.
"""

import pytest
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from cache import CacheManager, CacheEntry, get_cache_manager, clear_cache


class TestCacheEntry:
    """Tests for CacheEntry class."""

    def test_cache_entry_creation(self):
        """Test cache entry is created correctly."""
        entry = CacheEntry("key1", "value1")
        assert entry.key == "key1"
        assert entry.value == "value1"
        assert entry.hits == 0

    def test_cache_entry_not_expired(self):
        """Test cache entry is not expired immediately."""
        entry = CacheEntry("key1", "value1", ttl=3600)
        assert not entry.is_expired()

    def test_cache_entry_expired(self):
        """Test cache entry is expired after TTL."""
        entry = CacheEntry("key1", "value1", ttl=1)
        time.sleep(1.1)
        assert entry.is_expired()

    def test_cache_entry_access(self):
        """Test cache entry access increments hits."""
        entry = CacheEntry("key1", "value1")
        assert entry.hits == 0
        entry.access()
        assert entry.hits == 1
        assert entry.value == "value1"


class TestCacheManager:
    """Tests for CacheManager class."""

    def test_cache_manager_creation(self):
        """Test cache manager is created with defaults."""
        manager = CacheManager()
        assert manager.max_size == 1000
        assert manager.ttl == 3600
        assert len(manager._cache) == 0

    def test_cache_set_and_get(self):
        """Test setting and getting cache values."""
        manager = CacheManager()
        manager.set("key1", "value1")
        assert manager.get("key1") == "value1"

    def test_cache_get_missing_key(self):
        """Test getting missing key returns None."""
        manager = CacheManager()
        result = manager.get("nonexistent")
        assert result is None

    def test_cache_delete(self):
        """Test deleting cache entry."""
        manager = CacheManager()
        manager.set("key1", "value1")
        assert manager.delete("key1") is True
        assert manager.get("key1") is None

    def test_cache_clear(self):
        """Test clearing all cache entries."""
        manager = CacheManager()
        manager.set("key1", "value1")
        manager.set("key2", "value2")
        manager.clear()
        assert len(manager._cache) == 0
        stats = manager.get_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 0

    def test_cache_max_size_lru(self):
        """Test LRU eviction when max size is reached."""
        manager = CacheManager(max_size=2)
        manager.set("key1", "value1")
        manager.set("key2", "value2")
        manager.set("key3", "value3")
        assert manager.get("key1") is None
        assert manager.get("key2") == "value2"
        assert manager.get("key3") == "value3"

    def test_cache_stats(self):
        """Test cache statistics tracking."""
        manager = CacheManager()
        manager.set("key1", "value1")
        manager.get("key1")
        manager.get("nonexistent")
        stats = manager.get_stats()
        assert stats["enabled"] is True
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_rate"] == 50.0

    def test_cache_ttl_expiration(self):
        """Test cache entry expires after TTL."""
        manager = CacheManager(ttl=1)
        manager.set("key1", "value1")
        time.sleep(1.1)
        assert manager.get("key1") is None

    def test_cache_update_existing_key(self):
        """Test updating existing key updates value."""
        manager = CacheManager()
        manager.set("key1", "value1")
        manager.set("key1", "value2")
        assert manager.get("key1") == "value2"

    def test_cache_hit_rate_calculation(self):
        """Test hit rate calculation."""
        manager = CacheManager()
        for i in range(5):
            manager.set(f"key{i}", f"value{i}")

        for i in range(5):
            manager.get(f"key{i}")

        for i in range(5):
            manager.get(f"nonexistent{i}")

        stats = manager.get_stats()
        assert stats["hit_rate"] == 50.0


def test_get_cache_manager_singleton():
    """Test get_cache_manager returns singleton."""
    clear_cache()
    manager1 = get_cache_manager()
    manager2 = get_cache_manager()
    assert manager1 is manager2


def test_clear_cache():
    """Test clear_cache function."""
    manager = get_cache_manager()
    manager.set("key1", "value1")
    clear_cache()
    assert manager.get("key1") is None
