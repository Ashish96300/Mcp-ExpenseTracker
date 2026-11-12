
from starlette.responses import PlainTextResponse


class MCPRequestSizeMiddleware:
    """Reject MCP HTTP requests whose body exceeds the configured limit."""

    def __init__(self, app, max_body_size: int = 1_048_576):
        if isinstance(max_body_size, bool) or not isinstance(max_body_size, int):
            raise TypeError("max_body_size must be an integer")

        if max_body_size <= 0:
            raise ValueError("max_body_size must be positive")

        self.app = app
        self.max_body_size = max_body_size

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Check Content-Length before reading the request body.
        content_lengths = [
            value.decode("latin-1").strip()
            for name, value in scope.get("headers", [])
            if name.lower() == b"content-length"
        ]

        if len(content_lengths) > 1 and len(set(content_lengths)) > 1:
            response = PlainTextResponse("Invalid Content-Length", status_code=400)
            await response(scope, receive, send)
            return

        if content_lengths:
            declared_length = content_lengths[0]

            if not declared_length.isascii() or not declared_length.isdecimal():
                response = PlainTextResponse("Invalid Content-Length", status_code=400)
                await response(scope, receive, send)
                return

            if int(declared_length) > self.max_body_size:
                response = PlainTextResponse("Request body too large", status_code=413)
                await response(scope, receive, send)
                return

        # Read and count the actual streamed body, even if Content-Length is absent
        # or misleading. Buffer at most max_body_size bytes.
        body = bytearray()

        while True:
            message = await receive()

            if message["type"] == "http.disconnect":
                await self.app(scope, receive, send)
                return

            if message["type"] != "http.request":
                continue

            chunk = message.get("body", b"")

            if len(body) + len(chunk) > self.max_body_size:
                response = PlainTextResponse("Request body too large", status_code=413)
                await response(scope, receive, send)
                return

            body.extend(chunk)

            if not message.get("more_body", False):
                break

        # Replay the validated body to the downstream application.
        body_sent = False

        async def replay_receive():
            nonlocal body_sent

            if not body_sent:
                body_sent = True
                return {
                    "type": "http.request",
                    "body": bytes(body),
                    "more_body": False,
                }

            return await receive()

        await self.app(scope, replay_receive, send)
