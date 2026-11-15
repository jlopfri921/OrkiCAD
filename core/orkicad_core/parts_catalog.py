"""Versioned allowlisted part catalog driving dynamic CAD forms and AI output.

All length dimensions are canonical millimetres. The UI may display inches.
"""
from __future__ import annotations

CATALOG_VERSION = "0.4-prototype"
PARTS = {
    "corner_plate": {"fields": {"width": 90, "depth": 55, "thickness": 6,
                                  "corner_style": "round", "corner_size": 5,
                                  "hole_diameter": 6, "hole_inset": 17}},
    "machined_block": {"fields": {"width": 100, "depth": 60, "height": 15,
                                    "hole_diameter": 6, "hole_inset": 12,
                                    "pocket_width": 48, "pocket_depth": 30,
                                    "pocket_cut_depth": 6}},
    "washer": {"fields": {"outer_diameter": 18, "inner_diameter": 6.5, "thickness": 2}},
    "mounting_plate": {"fields": {"width": 80, "depth": 50, "thickness": 5,
                                   "hole_diameter": 5, "hole_inset": 10}},
    "open_box": {"fields": {"width": 60, "depth": 40, "height": 25, "wall": 2}},
    "metric_screw": {"fields": {"diameter": 6, "pitch": 1, "length": 30,
                                "head": "socket", "drive": "hex"}},
    "metric_nut": {"fields": {"diameter": 6, "pitch": 1, "shape": "hex",
                              "thickness": "normal"}},
    "spur_gear": {"fields": {"module": 2, "teeth": 24, "thickness": 8,
                             "shaft_diameter": 8, "pressure_angle": 20}},
    "box_lid": {"fields": {"box_width": 60, "box_depth": 40,
                           "box_wall": 2, "thickness": 3, "overhang": 2,
                           "plug_depth": 5, "clearance": 0.3}},
    "bottle_cap": {"fields": {"neck_outer_diameter": 28,
                              "height": 16, "wall": 3, "top_thickness": 3,
                              "pitch": 3, "clearance": 0.4,
                              "thread_depth": 1}},
}

# These fields are categorical rather than free-text values.
OPTIONS = {
    "corner_style": ["round", "chamfer"],
    "head": ["socket", "button", "hex", "pan", "flat", "none"],
    "drive": ["hex", "torx", "none", "slot", "phillips"],
    "shape": ["hex", "square"],
}
# Each item is UI metadata, not arbitrary CAD source.
FIELDS = {
    "outer_diameter": {"min": 0.1}, "inner_diameter": {"min": 0.1},
    "width": {"min": 0.1}, "depth": {"min": 0.1},
    "height": {"min": 0.1}, "wall": {"min": 0.1},
    "thickness": {"min": 0.1}, "hole_diameter": {"min": 0.1},
    "hole_inset": {"min": 0.1}, "diameter": {"min": 1},
    "pitch": {"min": 0.1}, "length": {"min": 0.1},
    "module": {"min": 0.1}, "teeth": {"min": 12, "step": 1},
    "shaft_diameter": {"min": 0.1}, "pressure_angle": {"min": 1},
    "box_width": {"min": 0.1}, "box_depth": {"min": 0.1},
    "box_wall": {"min": 0.1}, "overhang": {"min": 0.1},
    "plug_depth": {"min": 0.1}, "clearance": {"min": 0.01},
    "neck_outer_diameter": {"min": 0.1}, "top_thickness": {"min": 0.1},
    "thread_depth": {"min": 0.1},
    "pocket_width": {"min": 0.1}, "pocket_depth": {"min": 0.1},
    "pocket_cut_depth": {"min": 0.1}, "corner_size": {"min": 0.1},
}


def catalog_public():
    return {"version": CATALOG_VERSION, "parts": {
        key: {"fields": [
            {"key": name, "default": value,
             **({"options": OPTIONS[name]} if name in OPTIONS else {}),
             **(FIELDS.get(name, {}))}
            for name, value in desc["fields"].items()
        ]}
        for key, desc in PARTS.items()
    }}


def validated_spec(value):
    """Strict extraction: ignore invented keys, require supplied schema fields."""
    from .geometry import ParameterError, generate_scad

    if not isinstance(value, dict):
        raise ParameterError("AI response must be a JSON object")
    kind = value.get("type")
    if not isinstance(kind, str) or kind not in PARTS:
        raise ParameterError("Unsupported part type. Supported: " + ", ".join(PARTS))
    permitted = PARTS[kind]["fields"]
    missing = [key for key in permitted if key not in value]
    if missing:
        raise ParameterError("Missing required measurements: " + ", ".join(missing))
    spec = {"type": kind}
    for key, default in permitted.items():
        item = value[key]
        if type(default) is str:
            if not isinstance(item, str):
                raise ParameterError(f"{key} must be text")
            if key in OPTIONS and item not in OPTIONS[key]:
                raise ParameterError(f"{key} must be one of: {', '.join(OPTIONS[key])}")
        if type(default) in (int, float) and (
            isinstance(item, bool) or not isinstance(item, (int, float))
        ):
            raise ParameterError(f"{key} must be numeric")
        spec[key] = item
    generate_scad(spec)
    return spec
