import logging
from urllib.parse import urlsplit

from starlette.responses import PlainTextResponse


logger = logging.getLogger(__name__)


def normalize_origin(origin: str) -> str | None:
    try:
        parsed = urlsplit(origin)

        if parsed.scheme.lower() not in {"http", "https"}:
            return None

        if not parsed.hostname:
            return None

        if parsed.username or parsed.password:
            return None

        if parsed.path or parsed.query or parsed.fragment:
            return None

        port = parsed.port
        scheme = parsed.scheme.lower()
        hostname = parsed.hostname.lower()

        if port is None:
            return f"{scheme}://{hostname}"

        if (scheme == "http" and port == 80) or (
            scheme == "https" and port == 443
        ):
            return f"{scheme}://{hostname}"

        return f"{scheme}://{hostname}:{port}"

    except ValueError:
        return None

class MCPHttpSecurityMiddleware:
    """Outer HTTP security layer for the MCP server."""

    def __init__(
        self,
        app,
        allowed_hosts: set[str],
        allowed_origins: set[str],
        security_mode: str = "log",
    ):
        self.app = app
        self.allowed_hosts = {
            host.strip().lower()
            for host in allowed_hosts
            if host.strip()
        }
        self.allowed_origins = {
            normalized
            for origin in allowed_origins
            if (normalized := normalize_origin(origin)) is not None
        }
        self.security_mode = security_mode.lower()

        if self.security_mode not in {"log", "enforce"}:
            raise ValueError("MCP_SECURITY_MODE must be 'log' or 'enforce'")

    async def __call__(self, scope, receive, send):
        # Pass lifespan and other non-HTTP scopes through unchanged.
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {
            key.decode("latin-1").lower(): value.decode("latin-1")
            for key, value in scope.get("headers", [])
        }

        violations = []

        # 1. Validate Host
        host_header = headers.get("host", "")

        try:
            parsed_host = urlsplit(f"//{host_header}")

            hostname = parsed_host.hostname
            port = parsed_host.port

            valid_host = (
                hostname is not None
                and not parsed_host.username
                and not parsed_host.password
                and parsed_host.path == ""
                and parsed_host.query == ""
                and parsed_host.fragment == ""
                and hostname.lower() in self.allowed_hosts
            )

        except ValueError:
            valid_host = False

        if not valid_host:
            violations.append("host")
        # except ValueError:
        #     request_host = None

        # if (
        #     not request_host
        #     or request_host.lower() not in self.allowed_hosts
        # ): violations.append("untrusted_host")

        # 2. Validate Origin only on the MCP endpoint.
        # Missing Origin is intentionally allowed for native MCP clients.
        if scope.get("path") == "/mcp":
            origin = headers.get("origin")

            if origin:
                normalized_origin = normalize_origin(origin)

                if (
                    normalized_origin is None
                    or normalized_origin not in self.allowed_origins
                ):
                    violations.append("untrusted_origin")

        if violations:
            logger.warning(
                "MCP HTTP security audit: violations=%s mode=%s",
                ",".join(violations),
                self.security_mode,
            )

            if self.security_mode == "enforce":
                response = PlainTextResponse(
                    "Forbidden",
                    status_code=403,
                )
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)