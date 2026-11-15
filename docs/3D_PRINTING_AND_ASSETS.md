# 3D printing and creative / game asset pipelines

## 3D printing
Planned pipeline: import/generated solid or mesh → unit/scale verification → watertightness, winding and self-intersection checks → wall thickness and clearance checks → mesh repair/decimation when appropriate → part orientation and optional support suggestions → STL/3MF → optional slicer integration (Bambu Studio, OrcaSlicer, Cura).

A geometrically plausible shape is not automatically printable. Slicing parameters depend on material, printer, nozzle and manufacturing conditions. Slicer-ready output requires validation; do not claim printer instructions without testing.

## Game and design assets
Planned pipeline: image/text/model → shape/texture creation → mesh cleanup and controlled retopology → UV unwrap → bake maps (base color, normal, metallic, roughness, ambient occlusion) → optional LOD/collider generation → GLB/glTF and optional downstream formats using appropriate converters → preview and versioned asset export.

Target usages: game props, environment elements, product mockups, visualization, educational 3D content and design variants.

## CAD vs game art
Use solid CAD and exact constraints for mechanical manufacturing; use polygonal meshes and PBR materials for games. A conversion may require redesign or manual work, and lossless equivalence is not guaranteed.
