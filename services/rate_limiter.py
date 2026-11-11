
import threading
import time
from collections import deque
from enum import Enum

class RateLimitStatus(Enum):
    ALLOWED = "allowed"
    RATE_LIMITED = "rate_limited"
    CAPACITY_EXCEEDED = "capacity_exceeded"

class InMemoryRateLimiter:
    """Thread-safe sliding-window rate limiter with periodic cleanup."""

    def __init__(self, cleanup_interval: int = 60 , max_buckets: int = 1000,):
        self._requests = {}
        self._windows = {}
        self._lock = threading.Lock()
        self._cleanup_interval = cleanup_interval
        self._last_cleanup = time.monotonic()

        if cleanup_interval < 1 or max_buckets < 1:
            raise ValueError("Cleanup interval and max buckets must be positive.")

        self._max_buckets = max_buckets

    def _remove_expired(self, timestamps, cutoff):
        while timestamps and timestamps[0] <= cutoff:
            timestamps.popleft()

    def _cleanup(self, now):
        """Remove expired timestamps and inactive buckets periodically."""
        if now - self._last_cleanup < self._cleanup_interval:
            return

        for key in list(self._requests):
            timestamps = self._requests[key]
            window = self._windows[key]

            self._remove_expired(timestamps, now - window)

            if not timestamps:
                del self._requests[key]
                del self._windows[key]

        self._last_cleanup = now

    def _cleanup_expired_buckets(self, now):
        """Remove all buckets whose rate-limit windows have expired."""
        for key in list(self._requests):
            timestamps = self._requests[key]
            window = self._windows[key]

            self._remove_expired(timestamps, now - window)

            if not timestamps:
                del self._requests[key]
                del self._windows[key]

            
        self._last_cleanup = now

    def check(self, key: str, limit: int, window_seconds: int = 60):
        """
        Check whether a request is allowed.

        Returns:
            (True, 0) if allowed.
            (False, retry_after_seconds) if the limit is exceeded.
        """
        if not isinstance(key, str) or not key.strip():
            raise ValueError("Key must be a non-empty string.")

        if type(limit) is not int or limit < 1:
            raise ValueError("Limit must be a positive integer.")

        if type(window_seconds) is not int or window_seconds < 1:
            raise ValueError("Window must be a positive integer.")

        now = time.monotonic()

        with self._lock:
            self._cleanup(now)
            if key in self._windows and self._windows[key] != window_seconds:
                raise ValueError("Window duration cannot change for an existing key.")

            if key not in self._requests and len(self._requests) >= self._max_buckets:
             self._cleanup_expired_buckets(now)

             if len(self._requests) >= self._max_buckets:
                return RateLimitStatus.CAPACITY_EXCEEDED, window_seconds

            timestamps = self._requests.setdefault(key, deque())
            self._windows[key] = window_seconds

            self._remove_expired(timestamps, now - window_seconds)

            if len(timestamps) >= limit:
                retry_after = max(
                    1,
                    int(window_seconds - (now - timestamps[0]) + 0.999)
                )
                return RateLimitStatus.RATE_LIMITED, retry_after

            timestamps.append(now)
            return RateLimitStatus.ALLOWED, 0


# One shared limiter instance per application process.
rate_limiter = InMemoryRateLimiter()
