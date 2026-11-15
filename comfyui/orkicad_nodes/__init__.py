"""OrkiCAD AI custom nodes for ComfyUI.

Install as ComfyUI/custom_nodes/orkicad_nodes and make orkicad_core
importable by the same Python interpreter that runs ComfyUI.
"""
from __future__ import annotations

import json
import os
from pathlib import Path


def _core():
    try:
        from orkicad_core.geometry import generate_scad
        from orkicad_core.parts_catalog import PARTS, validated_spec
        from orkicad_core.stl_render import render_stl
    except ImportError as exc:
        raise RuntimeError(
            "OrkiCAD Core is not installed in the ComfyUI Python environment. "
            "Install the OrkiCAD repository with: python -m pip install -e <path-to-repository>"
        ) from exc
    return generate_scad, PARTS, validated_spec, render_stl


def _spec(spec_json: str):
    _, _, validate, _ = _core()
    try:
        decoded = json.loads(spec_json)
    except (ValueError, TypeError) as exc:
        raise ValueError("OrkiCAD specification must be valid JSON") from exc
    return validate(decoded)


def _output_dir() -> Path:
    """Use ComfyUI's own managed output folder when available."""
    try:
        import folder_paths
        base = Path(folder_paths.get_output_directory()).resolve()
    except ImportError:
        base = Path(os.environ.get("ORKICAD_COMFY_OUTPUT_DIR", "outputs")).resolve()
    directory = base / "orkicad"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


class OrkiCADPartSpec:
    """Create a valid part spec from an allowlisted family and optional JSON overrides."""

    @classmethod
    def INPUT_TYPES(cls):
        _, parts, _, _ = _core()
        return {"required": {
            "part_type": (list(parts),),
            "overrides_json": ("STRING", {"multiline": True, "default": "{}"}),
        }}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("spec_json",)
    FUNCTION = "create"
    CATEGORY = "OrkiCAD/Parametric"

    def create(self, part_type: str, overrides_json: str):
        _, parts, validate, _ = _core()
        if part_type not in parts:
            raise ValueError(f"Unsupported OrkiCAD part type: {part_type}")
        try:
            overrides = json.loads(overrides_json)
        except (ValueError, TypeError) as exc:
            raise ValueError("overrides_json must be a JSON object") from exc
        if not isinstance(overrides, dict):
            raise ValueError("overrides_json must be a JSON object")
        unknown = set(overrides) - set(parts[part_type]["fields"])
        if unknown:
            raise ValueError("Unknown part fields: " + ", ".join(sorted(unknown)))
        candidate = {"type": part_type, **parts[part_type]["fields"], **overrides}
        result = validate(candidate)
        return (json.dumps(result, ensure_ascii=False, sort_keys=True),)


class OrkiCADGenerateSCAD:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"spec_json": ("STRING", {"forceInput": True})}}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("scad_source",)
    FUNCTION = "generate"
    CATEGORY = "OrkiCAD/Parametric"

    def generate(self, spec_json: str):
        generate_scad, _, _, _ = _core()
        return (generate_scad(_spec(spec_json)),)


class OrkiCADRenderSTL:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "spec_json": ("STRING", {"forceInput": True}),
            "file_stem": ("STRING", {"default": "part"}),
        }}

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("stl_path", "preview_path")
    FUNCTION = "render"
    OUTPUT_NODE = True
    CATEGORY = "OrkiCAD/Parametric"

    def render(self, spec_json: str, file_stem: str):
        import re
        _, _, _, render_stl = _core()
        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,50}", file_stem):
            raise ValueError("file_stem must contain 1–50 ASCII letters, digits, _ or -")
        binary = render_stl(_spec(spec_json))
        # Use a unique filename for each run, not an untrusted user path.
        import uuid
        destination = _output_dir() / f"{file_stem}_{uuid.uuid4().hex[:10]}.stl"
        destination.write_bytes(binary)
        # Relative to ComfyUI output, so its native Preview3D can resolve the mesh.
        preview_path = f"orkicad/{destination.name}"
        return (str(destination), preview_path)


class OrkiCADExportMesh:
    """Export a validated design to an allowlisted OpenSCAD mesh format."""

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "spec_json": ("STRING", {"forceInput": True}),
            "format": (["3mf", "obj", "off", "amf", "stl"],),
            "file_stem": ("STRING", {"default": "cad_export"}),
        }}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("export_path",)
    FUNCTION = "export"
    OUTPUT_NODE = True
    CATEGORY = "OrkiCAD/Export"

    def export(self, spec_json: str, format: str, file_stem: str):
        import re
        import uuid
        from orkicad_core.stl_render import render_mesh, MESH_EXPORT_FORMATS

        if format not in MESH_EXPORT_FORMATS:
            raise ValueError("Unsupported mesh export format")
        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,50}", file_stem):
            raise ValueError("file_stem must contain 1-50 ASCII letters, digits, _ or -")
        binary = render_mesh(_spec(spec_json), format=format)
        destination = _output_dir() / f"{file_stem}_{uuid.uuid4().hex[:10]}.{format}"
        destination.write_bytes(binary)
        return (str(destination),)


class OrkiCADExportSTEP:
    """Native analytic CAD export through installed FreeCADCmd."""

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "spec_json": ("STRING", {"forceInput": True}),
            "file_stem": ("STRING", {"default": "cad_part"}),
        }, "optional": {
            "freecad_path": ("STRING", {"default": "Auto", "multiline": False}),
        }}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("step_path",)
    FUNCTION = "export"
    OUTPUT_NODE = True
    CATEGORY = "OrkiCAD/Export"

    def export(self, spec_json: str, file_stem: str, freecad_path: str = "Auto"):
        import re
        import uuid
        from orkicad_core.step_export import render_step

        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,50}", file_stem):
            raise ValueError("file_stem must contain 1-50 ASCII letters, digits, _ or -")
        binary = render_step(_spec(spec_json), freecad_path=freecad_path)
        destination = _output_dir() / f"{file_stem}_{uuid.uuid4().hex[:10]}.step"
        destination.write_bytes(binary)
        return (str(destination),)


class OrkiCADExportOCCTSTEP:
    """Cross-platform native STEP export with optional isolated OCCT runtime."""

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "spec_json": ("STRING", {"forceInput": True}),
            "file_stem": ("STRING", {"default": "occt_part"}),
        }, "optional": {
            "occt_python_path": ("STRING", {"default": "Auto", "multiline": False}),
        }}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("step_path",)
    FUNCTION = "export"
    OUTPUT_NODE = True
    CATEGORY = "OrkiCAD/Export"

    def export(self, spec_json: str, file_stem: str, occt_python_path: str = "Auto"):
        import re
        import uuid
        from orkicad_core.occt_step import render_occt_step

        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,50}", file_stem):
            raise ValueError("file_stem must contain 1-50 ASCII letters, digits, _ or -")
        binary = render_occt_step(_spec(spec_json), python_path=occt_python_path)
        destination = _output_dir() / f"{file_stem}_{uuid.uuid4().hex[:10]}.step"
        destination.write_bytes(binary)
        return (str(destination),)


class OrkiCADInterpretLocal:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "prompt": ("STRING", {"multiline": True,
                                  "default": "A box lid for a 60 x 40 mm box with 2 mm walls"}),
            "ollama_model": ("STRING", {"default": "qwen2.5:7b"}),
        }}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("proposed_spec_json",)
    FUNCTION = "interpret"
    CATEGORY = "OrkiCAD/AI"

    def interpret(self, prompt: str, ollama_model: str):
        from orkicad_core.ai_interpreter import interpret
        proposal = interpret(prompt, model=ollama_model)
        # The downstream part remains editable, not verified for mechanical fit.
        serialized = json.dumps(proposal, ensure_ascii=False, sort_keys=True)
        return {"ui": {"proposed_spec": [serialized]}, "result": (serialized,)}


class OrkiCADReviewSpec:
    """A deliberate user approval gate between AI interpretation and STL export.

    ComfyUI reevaluates this node when its widgets change. In the default
    unapproved state it raises a readable error including the model proposal,
    preventing any downstream STL export.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "spec_json": ("STRING", {"forceInput": True}),
            "overrides_json": ("STRING", {"multiline": True, "default": "{}"}),
            "approve_for_export": ("BOOLEAN", {"default": False}),
        }}

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("approved_spec_json", "review_summary")
    FUNCTION = "review"
    CATEGORY = "OrkiCAD/AI"

    def review(self, spec_json: str, overrides_json: str, approve_for_export: bool):
        _, parts, validate, _ = _core()
        original = _spec(spec_json)
        try:
            overrides = json.loads(overrides_json)
        except (TypeError, ValueError) as exc:
            raise ValueError("Review overrides must be a JSON object") from exc
        if not isinstance(overrides, dict):
            raise ValueError("Review overrides must be a JSON object")
        kind = original["type"]
        unknown = set(overrides) - set(parts[kind]["fields"])
        if unknown:
            raise ValueError("Unknown override fields: " + ", ".join(sorted(unknown)))
        accepted = validate({**original, **overrides})
        readable = json.dumps(accepted, ensure_ascii=False, indent=2, sort_keys=True)
        if not approve_for_export:
            raise ValueError(
                "OrkiCAD requires manual approval before STL export. "
                "Review the proposed dimensions below, adjust overrides_json "
                "if necessary, and set approve_for_export to true, then rerun. "
                "No STL has been exported by this approval gate.\\n" + readable
            )
        return (json.dumps(accepted, ensure_ascii=False, sort_keys=True), readable)


class OrkiCADSavedDesign:
    """Editable, self-contained CAD design; no Ollama or upstream AI connection.

    Store the validated base specification in the workflow's own widget.
    Visual edits are emitted through the overrides JSON widget.
    """

    @classmethod
    def INPUT_TYPES(cls):
        from orkicad_core.parts_catalog import PARTS
        default_spec = {"type": "box_lid", **PARTS["box_lid"]["fields"]}
        return {"required": {
            "base_spec_json": ("STRING", {
                "multiline": True,
                "default": json.dumps(default_spec, ensure_ascii=False, sort_keys=True),
            }),
            "overrides_json": ("STRING", {"multiline": True, "default": "{}"}),
        }}

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("spec_json", "design_summary")
    FUNCTION = "build"
    CATEGORY = "OrkiCAD/Parametric"

    def build(self, base_spec_json: str, overrides_json: str):
        _, parts, validate, _ = _core()
        original = _spec(base_spec_json)
        try:
            overrides = json.loads(overrides_json)
        except (TypeError, ValueError) as exc:
            raise ValueError("Saved design overrides must be valid JSON") from exc
        if not isinstance(overrides, dict):
            raise ValueError("Saved design overrides must be a JSON object")
        unknown = set(overrides) - set(parts[original["type"]]["fields"])
        if unknown:
            raise ValueError("Unknown saved design fields: " + ", ".join(sorted(unknown)))
        updated = validate({**original, **overrides})
        return (json.dumps(updated, ensure_ascii=False, sort_keys=True),
                json.dumps(updated, ensure_ascii=False, indent=2, sort_keys=True))


NODE_CLASS_MAPPINGS = {
    "OrkiCADPartSpec": OrkiCADPartSpec,
    "OrkiCADGenerateSCAD": OrkiCADGenerateSCAD,
    "OrkiCADRenderSTL": OrkiCADRenderSTL,
    "OrkiCADInterpretLocal": OrkiCADInterpretLocal,
    "OrkiCADReviewSpec": OrkiCADReviewSpec,
    "OrkiCADSavedDesign": OrkiCADSavedDesign,
    "OrkiCADExportMesh": OrkiCADExportMesh,
    "OrkiCADExportSTEP": OrkiCADExportSTEP,
    "OrkiCADExportOCCTSTEP": OrkiCADExportOCCTSTEP,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "OrkiCADPartSpec": "OrkiCAD · Part parameters",
    "OrkiCADGenerateSCAD": "OrkiCAD · Generate OpenSCAD",
    "OrkiCADRenderSTL": "OrkiCAD · Render STL",
    "OrkiCADInterpretLocal": "OrkiCAD · Local AI → CAD parameters",
    "OrkiCADReviewSpec": "OrkiCAD · Review & approve CAD",
    "OrkiCADSavedDesign": "OrkiCAD · Saved parametric design",
    "OrkiCADExportMesh": "OrkiCAD · Export 3MF / OBJ / mesh",
    "OrkiCADExportSTEP": "OrkiCAD · Export native STEP (FreeCAD)",
    "OrkiCADExportOCCTSTEP": "OrkiCAD · Export native STEP (OCCT)",
}


# ComfyUI serves this JavaScript automatically alongside the registered nodes.
WEB_DIRECTORY = "./web"

# Only expose allowlisted catalog metadata; never arbitrary filesystem data.
def _register_catalog_route():
    try:
        from server import PromptServer
        from aiohttp import web
        from orkicad_core.parts_catalog import catalog_public
    except ImportError:
        return

    @PromptServer.instance.routes.get("/orkicad/catalog")
    async def orkicad_catalog(_request):
        return web.json_response(catalog_public())

_register_catalog_route()
