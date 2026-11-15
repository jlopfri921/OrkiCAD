"""Conservative deterministic extractor for fully specified circular plates.

Do not let an LLM silently replace a requested disk with a rectangular
template. If dimensions are missing or ambiguous, let the selected provider
interpret the prompt and run the existing shape-fidelity validation.
"""
from __future__ import annotations

import re

from .parts_catalog import validated_spec

NUMBER = r"(\d+(?:[.,]\d+)?)"
HOLE_WORDS = r"(?:orificios?|agujeros?|taladros?|holes?)"
COUNT_WORDS = {
    "uno": 1, "una": 1, "un": 1, "dos": 2, "tres": 3, "cuatro": 4,
    "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
}


def _get_number(text: str, expressions: tuple[str, ...]) -> float | None:
    for pattern in expressions:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1).replace(",", "."))
    return None


def _get_count(text: str) -> int | None:
    # Tolerate conversational phrasing like "un cinco orificios".
    pattern = rf"\b(\d+|{'|'.join(COUNT_WORDS)})\s+(?:{HOLE_WORDS})\b"
    matches = list(re.finditer(pattern, text))
    if not matches:
        return None
    word = matches[-1].group(1)
    return int(word) if word.isdigit() else COUNT_WORDS[word]


def parse_explicit_circular_plate(prompt: str) -> dict | None:
    """Return validated CAD JSON only if *all five* parameters are explicit.

    This does not attempt to guess a hole pitch circle from edge clearances,
    nor treat a circle *inside* a rectangle as a circular exterior.
    """
    if not isinstance(prompt, str):
        return None
    text = prompt.casefold()
    if not re.search(
        r"\b(?:placa|disco|plate|disk|disc)\s+(?:de\s+forma\s+)?(?:circular|redond[ao]|round)\b"
        r"|\b(?:circular|round)\s+(?:placa|plate|disk|disc)\b",
        text,
    ):
        return None

    outer_radius = _get_number(text, (
        rf"\b(?:círculo|circulo|circunferencia|disco|placa).{{0,25}}?de\s+{NUMBER}\s*mm\s+de\s+radio\b",
        rf"\b(?:radio|radius)\s+(?:exterior\s+|outer\s+|de\s+)?(?:de\s+)?{NUMBER}\s*mm\b",
        rf"\b{NUMBER}\s*mm\s+(?:de\s+)?(?:radio|radius)\b",
    ))
    # The user's wording "un círculo de 50 mm de radio" matches the first.
    hole_count = _get_count(text)
    hole_diameter = _get_number(text, (
        rf"\b{HOLE_WORDS}.{{0,55}}?\bde\s+{NUMBER}\s*mm\s+de\s+di[aá]metro\b",
        rf"\b{HOLE_WORDS}.{{0,55}}?\b(?:de\s+)?di[aá]metro\s+(?:de\s+)?{NUMBER}\s*mm\b",
        rf"\b{NUMBER}\s*mm\s+(?:de\s+)?di[aá]metro.{0,25}\b{HOLE_WORDS}\b",
    ))
    # Prefer explicit hole-center distance. It must not be confused with the
    # main radius or the 3 mm hole diameter.
    bolt_circle_radius = _get_number(text, (
        rf"\b(?:a|at)\s+{NUMBER}\s*mm\s+(?:de distancia\s+)?(?:del?|from\s+the)\s+centro\b",
        rf"\b(?:radio|radius)\s+(?:de\s+)?distribuci[oó]n\s+(?:de\s+)?{NUMBER}\s*mm\b",
        rf"\b(?:matriz|patr[oó]n|pattern|bolt circle).{{0,35}}?(?:radio\s+)?(?:de\s+)?{NUMBER}\s*mm\b",
        rf"\bpitch\s+circle\s+radius\s+(?:of\s+)?{NUMBER}\s*mm\b",
    ))
    thickness = _get_number(text, (
        rf"\b{NUMBER}\s*mm\s+de\s+(?:grosor|espesor|thickness)\b",
        rf"\b(?:grosor|espesor|thickness)\s+(?:de\s+)?{NUMBER}\s*mm\b",
        rf"\b{NUMBER}\s*mm\s+thick\b",
    ))
    values = (outer_radius, hole_count, hole_diameter, bolt_circle_radius, thickness)
    if any(value is None for value in values):
        return None
    return validated_spec({
        "type": "circular_plate",
        "outer_radius": outer_radius,
        "thickness": thickness,
        "hole_count": hole_count,
        "hole_diameter": hole_diameter,
        "bolt_circle_radius": bolt_circle_radius,
    })
