from fastapi.testclient import TestClient
from api import app, get_current_user_id, rate_limiter, RateLimitStatus
import time
from services.rate_limiter import InMemoryRateLimiter, RateLimitStatus


# Fake authenticated user
app.dependency_overrides[get_current_user_id] = lambda: 123

# Save original limiter method
original_check = rate_limiter.check

try:
    # Test 429: rate limit exceeded
    rate_limiter.check = lambda **kwargs: (
        RateLimitStatus.RATE_LIMITED, 45
    )

    client = TestClient(
        app,
        base_url="http://localhost",
    )
    response = client.get("/summary/trend")

    print("429 TEST")
    print("Status:", response.status_code)
    print("Retry-After:", response.headers.get("Retry-After"))
    print("Body:", response.json())

    assert response.status_code == 429
    assert response.headers.get("Retry-After") == "45"

    # Test 503: limiter capacity exhausted
    rate_limiter.check = lambda **kwargs: (
        RateLimitStatus.CAPACITY_EXCEEDED, 60
    )

    response = client.get("/summary/trend")

    print("\n503 TEST")
    print("Status:", response.status_code)
    print("Retry-After:", response.headers.get("Retry-After"))
    print("Body:", response.text)

    assert response.status_code == 503
    assert response.headers.get("Retry-After") == "60"

        # Test write endpoint: rate limit exceeded
    rate_limiter.check = lambda **kwargs: (
        RateLimitStatus.RATE_LIMITED, 30
    )

    response = client.delete("/expenses/1")

    print("\nWRITE LIMIT TEST")
    print("Status:", response.status_code)
    print("Retry-After:", response.headers.get("Retry-After"))
    print("Body:", response.text)

    assert response.status_code == 429
    assert response.headers.get("Retry-After") == "30"

    print("PASS: Write endpoint rate limiting verified.")

        # Test provisioning: rate limit exceeded
    rate_limiter.check = lambda **kwargs: (
        RateLimitStatus.RATE_LIMITED, 25
    )

    response = client.post(
        "/internal/users/provision",
        json={
            "workos_user_id": "test-user",
            "email": "test@example.com",
            "name": "Test User",
        },
        headers={
            "X-Provisioning-Secret": "deliberately-invalid"
        },
    )

    print("\nPROVISIONING LIMIT TEST")
    print("Status:", response.status_code)
    print("Retry-After:", response.headers.get("Retry-After"))
    print("Body:", response.text)

    assert response.status_code == 429
    assert response.headers.get("Retry-After") == "25"

    print("PASS: Provisioning rate limiting verified.")

    import time
    
    limiter = InMemoryRateLimiter(cleanup_interval=999, max_buckets=1)

    print(limiter.check("user:1", 1, 1))
    time.sleep(1.1)

    result = limiter.check("user:2", 1, 1)
    print(result)

    assert result == (RateLimitStatus.ALLOWED, 0)
    print("PASS: expired bucket was replaced")

    print("\nPASS: Both HTTP rate-limit responses verified.")

finally:
    rate_limiter.check = original_check
    app.dependency_overrides.clear()
