// OrkiCAD AI: catalog-driven, client-side CAD parameter editor for ComfyUI.
// All backend inputs remain canonical millimetres and validated by OrkiCAD Core.
import { app } from "../../scripts/app.js";

const MM_PER_INCH = 25.4;
const NO_UNITS = new Set(["teeth", "pressure_angle"]);
const STRINGS = {
  es: {
    title: "Editor paramétrico", noProposal: "Ejecuta la IA una vez para recibir los parámetros.",
    pending: "Revisa las medidas y activa approve_for_export para generar el STL.",
    approved: "Parámetros aprobados. Ejecuta otra vez para actualizar el STL.",
    units: "Unidades", reset: "Restablecer propuesta", type: "Pieza",
    angle: "grados", invalid: "Introduce un número válido.",
    catalog: "No se pudo cargar el catálogo de piezas.", overrides: "Los cambios se guardan en overrides_json.",
    freeze: "Copiar diseño para editar sin IA", copied: "Diseño copiado. Pégalo en base_spec_json del nodo Saved parametric design.",
    copyFailed: "No se pudo copiar: utiliza el JSON del nodo como alternativa.",
  },
  en: {
    title: "Parametric editor", noProposal: "Run the AI once to receive part parameters.",
    pending: "Review the dimensions, then enable approve_for_export to generate STL.",
    approved: "Parameters approved. Run again to update STL.",
    units: "Units", reset: "Reset to proposal", type: "Part",
    angle: "degrees", invalid: "Enter a valid number.",
    catalog: "Could not load the parts catalog.", overrides: "Changes are saved to overrides_json.",
    freeze: "Copy design for AI-free edits", copied: "Design copied. Paste into base_spec_json of Saved parametric design.",
    copyFailed: "Unable to copy; use the node JSON as an alternative.",
  },
};
let catalogPromise;
function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch("/orkicad/catalog", { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error("Catalog HTTP " + res.status);
        return res.json();
      }).catch((err) => { catalogPromise = null; throw err; });
  }
  return catalogPromise;
}
function parseObject(value) {
  try {
    const item = JSON.parse(value || "{}");
    return item && !Array.isArray(item) && typeof item === "object" ? item : {};
  } catch { return {}; }
}
function displayNumber(mm, field, units) {
  return units === "in" && !NO_UNITS.has(field)
    ? Number((mm / MM_PER_INCH).toFixed(5)) : mm;
}
function canonicalNumber(value, field, units) {
  return units === "in" && !NO_UNITS.has(field) ? value * MM_PER_INCH : value;
}
function element(tag, text, css) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (css) Object.assign(item.style, css);
  return item;
}
function paint(node) {
  const host = node.__orkicadEditor;
  if (!host) return;
  host.replaceChildren();
  const language = node.properties?.orkicad_language === "en" ? "en" : "es";
  const t = STRINGS[language];
  const header = element("div", t.title, { fontWeight: "700", marginBottom: "8px" });
  host.append(header);
  const line = element("div", "", { display: "flex", gap: "6px", marginBottom: "8px" });
  const lang = element("select");
  for (const code of ["es", "en"]) {
    const option = new Option(code.toUpperCase(), code);
    lang.append(option);
  }
  lang.value = language;
  lang.addEventListener("change", () => {
    node.properties.orkicad_language = lang.value;
    paint(node);
  });
  const units = element("select");
  for (const [code, label] of [["mm", "mm"], ["in", "in"]]) units.append(new Option(label, code));
  units.value = node.properties?.orkicad_units === "in" ? "in" : "mm";
  units.addEventListener("change", () => {
    node.properties.orkicad_units = units.value;
    paint(node);
  });
  line.append(element("span", t.units + ":"), units, lang);
  host.append(line);
  const saved = node.type === "OrkiCADSavedDesign" || node.comfyClass === "OrkiCADSavedDesign";
  const baseWidget = node.widgets?.find((w) => w.name === "base_spec_json");
  const proposal = saved ? parseObject(baseWidget?.value) : node.properties?.orkicad_proposal;
  const entry = node.__orkicadCatalog?.parts?.[proposal?.type];
  if (!proposal || !entry) {
    host.append(element("div", node.__orkicadCatalogError ? t.catalog : t.noProposal));
    return;
  }
  host.append(element("div", t.type + ": " + proposal.type, {
    fontWeight: "600", marginBottom: "5px",
  }));
  const overridesWidget = node.widgets?.find((w) => w.name === "overrides_json");
  const approvedWidget = node.widgets?.find((w) => w.name === "approve_for_export");
  const overrides = parseObject(overridesWidget?.value);
  const fields = element("div", "", { display: "grid", gridTemplateColumns: "1fr 120px", gap: "6px", alignItems: "center" });
  for (const desc of entry.fields) {
    const key = desc.key;
    if (!Object.hasOwn(proposal, key)) continue;
    const isAngle = key === "pressure_angle";
    const isCount = key === "teeth";
    const current = Object.hasOwn(overrides, key) ? overrides[key] : proposal[key];
    fields.append(element("label", key.replaceAll("_", " ") +
      (isAngle ? " (°)" : isCount ? "" : " (" + units.value + ")")));
    const input = desc.options?.length ? element("select") : element("input");
    if (desc.options?.length) {
      for (const option of desc.options) input.append(new Option(option, option));
      input.value = String(current);
    } else {
      input.type = "number";
      const isNumeric = typeof current === "number";
      input.value = isNumeric ? String(displayNumber(current, key, units.value)) : "";
      const scale = units.value === "in" && !NO_UNITS.has(key) ? MM_PER_INCH : 1;
      input.min = desc.min === undefined ? "" : String(Number((desc.min / scale).toFixed(5)));
      input.step = isCount ? "1" : units.value === "in" && !NO_UNITS.has(key) ? "any" : String(desc.step ?? "any");
    }
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.background = "#292929";
    input.style.color = "white";
    input.style.border = "1px solid #666";
    input.style.padding = "4px";
    input.setAttribute("aria-label", key);
    input.addEventListener("change", () => {
      let newValue = desc.options?.length ? input.value : Number(input.value);
      if (!desc.options?.length) {
        if (input.value.trim() === "" || !Number.isFinite(newValue)) {
          input.setCustomValidity(t.invalid);
          input.reportValidity();
          return;
        }
        newValue = canonicalNumber(newValue, key, units.value);
        if (isCount) newValue = Math.round(newValue);
        if (Number.isFinite(desc.min) && newValue < desc.min) {
          input.setCustomValidity("Minimum: " + desc.min);
          input.reportValidity();
          return;
        }
      }
      input.setCustomValidity("");
      const updated = parseObject(overridesWidget?.value);
      updated[key] = newValue;
      if (overridesWidget) overridesWidget.value = JSON.stringify(updated);
      if (approvedWidget) approvedWidget.value = false;
      app.graph?.setDirtyCanvas(true, true);
      paint(node);
    });
    fields.append(input);
  }
  host.append(fields);
  const footer = element("div", t.overrides, { fontSize: "11px", opacity: "0.7", marginTop: "8px" });
  host.append(footer);
  const reset = element("button", t.reset, {
    cursor: "pointer", padding: "5px 8px", marginTop: "8px",
    background: "#3d3d3d", border: "1px solid #777", color: "white",
  });
  reset.addEventListener("click", () => {
    if (overridesWidget) overridesWidget.value = "{}";
    if (approvedWidget) approvedWidget.value = false;
    paint(node);
  });
  host.append(reset);
  if (!saved) {
    const freeze = element("button", t.freeze, {
      cursor: "pointer", padding: "5px 8px", margin: "8px 0 0 5px",
      background: "#274b65", border: "1px solid #6c9fbc", color: "white",
    });
    freeze.addEventListener("click", async () => {
      // Validate again at the saved-design Python node on each generation.
      const frozen = { ...proposal, ...parseObject(overridesWidget?.value) };
      try {
        await navigator.clipboard.writeText(JSON.stringify(frozen, null, 2));
        freeze.textContent = t.copied;
      } catch (err) {
        console.warn("[OrkiCAD] clipboard write failed", err);
        freeze.textContent = t.copyFailed;
      }
    });
    host.append(freeze);
  }
  if (saved) return;
  host.append(element("p", approvedWidget?.value ? t.approved : t.pending, {
    fontSize: "12px", marginTop: "8px",
  }));
}
function setupReview(node) {
  if (node.__orkicadEditor) return;
  if (!node.properties) node.properties = {};
  const host = element("div", undefined, {
    color: "#f3f3f3", background: "#202020", padding: "10px",
    boxSizing: "border-box", width: "100%", height: "100%",
    overflowY: "auto", fontSize: "12px",
  });
  node.__orkicadEditor = host;
  node.addDOMWidget("orkicad_editor", "orkicad-editor", host, {
    serialize: false, hideOnZoom: false,
  });
  node.setSize([Math.max(node.size?.[0] ?? 400, 435), Math.max(node.size?.[1] ?? 500, 520)]);
  getCatalog().then((catalog) => {
    node.__orkicadCatalog = catalog;
    paint(node);
  }).catch((err) => {
    console.warn("[OrkiCAD] catalog unavailable", err);
    node.__orkicadCatalogError = true;
    paint(node);
  });
  paint(node);
}
function refreshReviewLinkedTo(aiNode, serialized) {
  let proposal;
  try { proposal = JSON.parse(serialized); } catch { return; }
  if (!proposal || typeof proposal.type !== "string") return;
  for (const output of aiNode.outputs || []) {
    for (const id of output.links || []) {
      const edge = aiNode.graph?.links?.[id];
      if (!edge) continue;
      const target = aiNode.graph.getNodeById(edge.target_id);
      if (target?.comfyClass !== "OrkiCADReviewSpec" && target?.type !== "OrkiCADReviewSpec") continue;
      if (!target.properties) target.properties = {};
      // Never carry approval/overrides from the previous AI proposal.
      const old = JSON.stringify(target.properties.orkicad_proposal ?? null);
      if (old !== JSON.stringify(proposal)) {
        const overridesWidget = target.widgets?.find((w) => w.name === "overrides_json");
        const approvedWidget = target.widgets?.find((w) => w.name === "approve_for_export");
        if (overridesWidget) overridesWidget.value = "{}";
        if (approvedWidget) approvedWidget.value = false;
      }
      target.properties.orkicad_proposal = proposal;
      paint(target);
    }
  }
}
app.registerExtension({
  name: "orkicad.visual_parameter_editor",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name === "OrkiCADInterpretLocal") {
      const previous = nodeType.prototype.onExecuted;
      nodeType.prototype.onExecuted = function (message) {
        previous?.apply(this, arguments);
        const proposed = message?.proposed_spec?.[0];
        if (typeof proposed === "string") refreshReviewLinkedTo(this, proposed);
      };
    }
    if (nodeData.name === "OrkiCADReviewSpec" || nodeData.name === "OrkiCADSavedDesign") {
      const previous = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = function () {
        previous?.apply(this, arguments);
        setupReview(this);
      };
    }
  },
  loadedGraphNode(node) {
    if (["OrkiCADReviewSpec", "OrkiCADSavedDesign"].includes(node.comfyClass) ||
        ["OrkiCADReviewSpec", "OrkiCADSavedDesign"].includes(node.type)) {
      setupReview(node);
      paint(node);
    }
  },
});
