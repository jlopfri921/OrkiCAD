"""Deterministic topology-first interpreter for an annulus with a radial sector removed.

Do not let an LLM use a rectangular plate for a split/open circular ring.
Only four numeric dimensions are needed; thickness is an explicit default
when omitted and must be presented as an assumption to the designer.
"""
from __future__ import annotations

import re

from .parts_catalog import validated_spec

NUM = r"(\d+(?:[.,]\d+)?)"


def _match(text: str, *patterns: str) -> float | None:
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            return float(match.group(1).replace(",", "."))
    return None


def requests_radial_ring_cut(prompt: str) -> bool:
    if not isinstance(prompt, str):
        return False
    s = prompt.casefold()
    circular = bool(re.search(r"\b(?:anillo|aro|arandela|circular|circunferencia|ring)\b", s))
    cut = bool(re.search(r"\b(?:corte|cortado|seccion|sección|abierto|abertura|ranura|interrumpido|cut|gap|opening)\b", s))
    annular = bool(re.search(r"\b(?:interior|interna|interno|agujero|oquedad|hueco|aro|anillo|ring)\b", s))
    radial = bool(re.search(r"\b(?:radial|radiales|radios|arco|circunferencia|sector|arc)\b", s))
    return circular and cut and annular and radial


def parse_split_ring(prompt: str) -> tuple[dict | None, list[str]]:
    if not requests_radial_ring_cut(prompt):
        return None, []
    s = prompt.casefold()
    outer_diameter = _match(s,
        rf"(?:di[aá]metro\s+exterior|di[aá]metro\s+externo|di[aá]metro\s+(?:de\s+)?(?:la\s+)?pieza)\s*(?:de\s*)?{NUM}\s*mm",
        rf"(?:pieza|aro|anillo)\s+circular\s+(?:de\s+)?{NUM}\s*mm",
        rf"(?:pieza|aro|anillo)\s+(?:de\s+)?{NUM}\s*mm\s+(?:de\s+)?di[aá]metro",
    )
    outer_radius = _match(s,
        rf"(?:radio\s+exterior|radio\s+externo)\s*(?:de\s*)?{NUM}\s*mm",
        rf"(?:pieza|aro|anillo)\s+circular\s+(?:de\s+)?{NUM}\s*mm\s+de\s+radio",
    )
    if outer_radius is not None:
        outer_diameter = outer_radius * 2
    inner_radius = _match(s,
        rf"(?:oquedad|hueco|agujero|círculo|circulo|circunferencia|radio|di[aá]metro)\s+(?:intern[ao]|interior)\s+(?:circular\s+)?(?:de\s+)?{NUM}\s*mm\s+de\s+radio",
        rf"(?:radio\s+interior|radio\s+interno)\s*(?:de\s*)?{NUM}\s*mm",
        rf"(?:oquedad|hueco|agujero)\s+(?:intern[ao]|interior)\s+circular\s+de\s+{NUM}\s*mm\s+de\s+radio",
    )
    outer_gap = _match(s,
        rf"(?:corte|abertura|separaci[oó]n|interrupci[oó]n)\s+(?:completo\s+)?(?:de\s+)?{NUM}\s*mm\s*(?:de\s+distancia\s+)?(?:en\s+el\s+)?(?:arco|circunferencia)",
        rf"(?:arco|circunferencia)\s+exterior.{0,40}?{NUM}\s*mm\b",
        rf"(?:corte|abertura|separaci[oó]n)\s+(?:completo\s+)?de\s+{NUM}\s*mm",
    )
    if outer_diameter is None or inner_radius is None or outer_gap is None:
        # A topology-sensitive request must be rejected rather than
        # being silently converted to a rectangle by a language model.
        return None, ["missing_split_ring_dimensions"]
    thickness = _match(s,
        rf"(?:grosor|espesor|thickness)\s*(?:de\s*)?{NUM}\s*mm",
        rf"{NUM}\s*mm\s+de\s+(?:grosor|espesor)")
    assumptions = []
    if thickness is None:
        thickness = 4.0
        assumptions.append("Espesor no indicado: se ha supuesto 4 mm; revísalo antes de generar.")
    spec = validated_spec({
        "type": "split_ring",
        "outer_diameter": outer_diameter,
        "inner_radius": inner_radius,
        "outer_arc_gap": outer_gap,
        "thickness": thickness,
    })
    return spec, assumptions
