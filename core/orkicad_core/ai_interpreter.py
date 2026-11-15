"""Opt-in local Ollama adapter: natural language -> validated CAD parameters.

No model-produced source code is ever executed. Network calls are restricted
to local loopback in this first integration.
"""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from urllib.parse import urlsplit

from .geometry import ParameterError
from .parts_catalog import PARTS, validated_spec

MAX_REQUEST = 2000
DEFAULT_TIMEOUT_SECONDS = 180
ALLOWED_HOSTS = {"127.0.0.1", "localhost", "::1"}


class AIError(RuntimeError):
    """AI provider not reachable or response could not produce a CAD spec."""


def build_cad_instruction() -> str:
    """Shared provider-neutral prompt schema; never allow model output as code."""
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
        "Important: Preserve topology and explicitly specified outline. If user requests a circular disk, "
        "use circular_plate with a cylinder base, NOT mounting_plate, corner_plate or a box. "
        "Distinguish radius from diameter, count radial through holes exactly, and use bolt_circle_radius "
        "for each hole center distance from global origin. Do not approximate missing shapes by rectangles. "
        "Available templates: " + json.dumps(examples, ensure_ascii=False)
    )
    return instruction



def validate_prompt_shape(prompt: str, spec: dict) -> dict:
    """Reject a model silently substituting a box for a requested circular disk.

    This is deliberately conservative: use it only for explicit circular-plate
    requests, not instructions about a circular detail inside a rectangular part.
    """
    p = prompt.casefold()
    is_circular_plate = bool(re.search(
        r"(?:placa|disco|plate|disk|disc)\s+(?:de\s+forma\s+)?(?:circular|redond[ao]|round)"
        r"|(?:circular|round)\s+(?:placa|plate|disk|disc)", p
    ))
    if is_circular_plate and spec.get("type") != "circular_plate":
        raise AIError(
            "The requested outside shape is a circular plate, but the AI "
            "selected a different geometry. No rectangular substitute was generated. "
            "Choose circular_plate and retry or change its parameters directly."
        )
    return spec


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

    instruction = build_cad_instruction()
    timeout_raw = os.environ.get("ORKICAD_OLLAMA_TIMEOUT", str(DEFAULT_TIMEOUT_SECONDS))
    try:
        timeout = float(timeout_raw)
    except ValueError as exc:
        raise AIError("ORKICAD_OLLAMA_TIMEOUT must be a number of seconds") from exc
    if not 5 <= timeout <= 600:
        raise AIError("ORKICAD_OLLAMA_TIMEOUT must be between 5 and 600 seconds")

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
        with urllib.request.urlopen(request, timeout=timeout) as response:
            if response.status != 200:
                raise AIError(f"Ollama returned HTTP {response.status}")
            raw = response.read(128 * 1024 + 1)
            if len(raw) > 128 * 1024:
                raise AIError("Ollama response too large")
    except TimeoutError as exc:
        raise AIError(
            f"Local Ollama did not respond within {timeout:g} seconds. "
            "Check that Ollama is running, verify the exact installed model "
            "with 'ollama list', warm it with 'ollama run <model>', "
            "or select a smaller local model. "
            "The request timeout can be adjusted using ORKICAD_OLLAMA_TIMEOUT."
        ) from exc
    except urllib.error.HTTPError as exc:
        detail = exc.read(2048).decode("utf-8", errors="replace")
        raise AIError(f"Ollama HTTP {exc.code}: {detail}") from exc
    except (OSError, urllib.error.URLError) as exc:
        raise AIError(
            f"Local Ollama connection failed at {endpoint}: {exc}. "
            "Check that Ollama is running and listening on this loopback address."
        ) from exc
    try:
        response = json.loads(raw)
        content = response["message"]["content"]
        raw_spec = json.loads(content)
        return validate_prompt_shape(prompt, validated_spec(raw_spec))
    except (KeyError, TypeError, ValueError, json.JSONDecodeError,
            ParameterError) as exc:
        raise AIError(
            "Ollama returned invalid or unsupported CAD parameters. "
            "Try specifying exact dimensions or choosing a catalog part manually. "
            f"Validation: {exc}"
        ) from exc
