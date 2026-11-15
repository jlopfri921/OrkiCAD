"""Opt-in local Ollama adapter: natural language -> validated CAD parameters.

No model-produced source code is ever executed. Network calls are restricted
to local loopback in this first integration.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from urllib.parse import urlsplit

from .geometry import ParameterError
from .parts_catalog import PARTS, validated_spec

MAX_REQUEST = 2000
ALLOWED_HOSTS = {"127.0.0.1", "localhost", "::1"}


class AIError(RuntimeError):
    """AI provider not reachable or response could not produce a CAD spec."""


def interpret(prompt: str, *, model: str | None = None) -> dict:
    if not isinstance(prompt, str) or not 3 <= len(prompt.strip()) <= MAX_REQUEST:
        raise ValueError("Prompt must contain between 3 and 2000 characters")
    endpoint = os.environ.get("ORKICAD_OLLAMA_URL", "http://127.0.0.1:11434")
    parsed = urlsplit(endpoint)
    if parsed.scheme != "http" or parsed.hostname not in ALLOWED_HOSTS or (
        parsed.username is not None or parsed.password is not None
    ) or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        raise AIError("This prototype only allows loopback HTTP Ollama endpoints")
    if model is None:
        model = os.environ.get("ORKICAD_OLLAMA_MODEL", "qwen2.5:7b")
    if not isinstance(model, str) or not 1 <= len(model) <= 120 or any(
        char in model for char in "\r\n"
    ):
        raise ValueError("Invalid Ollama model name")

    examples = {
        name: {"type": name, **desc["fields"]}
        for name, desc in PARTS.items()
    }
    instruction = (
        "You translate CAD requests into STRICT JSON, with ONLY properties "
        "defined in one of the following schemas/examples. Units are millimetres. "
        "Return ONE JSON object of the chosen part type. Do not return explanations, "
        "markdown, code, keys outside the schema, or executable source. "
        "If some dimensions are not given, use the example defaults (these are "
        "assumptions that must be checked by the user). Never claim measured fit. "
        "Available templates: " + json.dumps(examples, ensure_ascii=False)
    )
    payload = json.dumps({
        "model": model,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0},
        "messages": [
            {"role": "system", "content": instruction},
            {"role": "user", "content": prompt},
        ],
    }).encode("utf-8")
    request = urllib.request.Request(
        endpoint.rstrip("/") + "/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=75) as response:
            if response.status != 200:
                raise AIError(f"Ollama returned HTTP {response.status}")
            raw = response.read(128 * 1024 + 1)
            if len(raw) > 128 * 1024:
                raise AIError("Ollama response too large")
    except (OSError, urllib.error.URLError) as exc:
        raise AIError(f"Local Ollama unavailable: {exc}") from exc
    try:
        response = json.loads(raw)
        content = response["message"]["content"]
        raw_spec = json.loads(content)
        return validated_spec(raw_spec)
    except (KeyError, TypeError, ValueError, json.JSONDecodeError,
            ParameterError) as exc:
        raise AIError(
            "Ollama returned invalid or unsupported CAD parameters. "
            "Try specifying exact dimensions or choosing a catalog part manually. "
            f"Validation: {exc}"
        ) from exc
