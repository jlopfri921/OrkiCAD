"""Optional API-key-per-request cloud AI adapter for the localhost Studio prototype.

No credentials are saved, logged, returned to clients, or placed in URLs.
Only fixed HTTPS provider endpoints are used; AI output is never executed.
The local-only HTTP server is NOT suitable for multi-user/public deployment.
"""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.request

from .ai_interpreter import AIError, build_cad_instruction, MAX_REQUEST
from .parts_catalog import validated_spec

PROVIDERS = ("openai", "anthropic", "gemini")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """Do not forward API credentials across redirects."""

    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None
CLOUD_TIMEOUT = 90
MODEL_PATTERN = re.compile(r"^[a-zA-Z0-9_.:/-]{1,120}$")


def interpret_cloud(prompt: str, *, provider: str, model: str, api_key: str) -> dict:
    if not isinstance(prompt, str) or not 3 <= len(prompt.strip()) <= MAX_REQUEST:
        raise ValueError("Prompt must contain 3 to 2000 characters")
    if provider not in PROVIDERS:
        raise ValueError("Unsupported cloud provider")
    if not isinstance(model, str) or not MODEL_PATTERN.fullmatch(model):
        raise ValueError("Specify a valid provider model ID")
    if not isinstance(api_key, str) or not 8 <= len(api_key) <= 512 or any(
        c in api_key for c in "\r\n"
    ):
        raise ValueError("Provide a valid API key for the selected provider")

    instruction = build_cad_instruction()
    if provider == "openai":
        url = "https://api.openai.com/v1/responses"
        headers = {"Authorization": "Bearer " + api_key}
        body = {"model": model, "instructions": instruction, "input": prompt,
                "store": False, "max_output_tokens": 4096}
    elif provider == "anthropic":
        url = "https://api.anthropic.com/v1/messages"
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
        body = {"model": model, "system": instruction, "max_tokens": 4096,
                "messages": [{"role": "user", "content": prompt}]}
    else:
        # Fixed host; model is constrained to an allowlisted character alphabet.
        model_id = model.removeprefix("models/")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent"
        headers = {"x-goog-api-key": api_key}
        body = {
            "systemInstruction": {"parts": [{"text": instruction}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }

    request = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers}, method="POST"
    )
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=CLOUD_TIMEOUT) as response:
            raw = response.read(128 * 1024 + 1)
            if len(raw) > 128 * 1024:
                raise AIError("Cloud provider response exceeds safety limit")
    except urllib.error.HTTPError as exc:
        # Never forward provider error bodies; they may inadvertently contain
        # request information or credentials.
        raise AIError(f"{provider} returned HTTP {exc.code}; check model, key, billing and quota") from None
    except (TimeoutError, OSError, urllib.error.URLError) as exc:
        raise AIError(f"{provider} request failed or timed out") from None

    try:
        result = json.loads(raw)
        if provider == "openai":
            chunks = [
                item.get("text", "")
                for output in result.get("output", [])
                for item in output.get("content", [])
                if item.get("type") == "output_text"
            ]
            text = "\n".join(chunks)
        elif provider == "anthropic":
            text = "\n".join(item.get("text", "") for item in result.get("content", [])
                             if item.get("type") == "text")
        else:
            text = "\n".join(part.get("text", "")
                             for candidate in result["candidates"]
                             for part in candidate["content"]["parts"])
        # Responses stay JSON-only; no executing or evaluating source.
        return validated_spec(json.loads(text))
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise AIError(
            "Provider response did not contain a valid OrkiCAD CAD JSON specification. "
            "Try a more explicit dimensional prompt or a different model."
        ) from None
