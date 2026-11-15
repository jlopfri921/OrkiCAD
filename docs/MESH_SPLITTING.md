# Mesh splitting, cut planning and printable assemblies

**Status: planned.**

## Input
STL, GLB or other supported mesh formats; parametric solid models where available.

## Workflows
1. Split by an axis-aligned or arbitrary user-selected cutting plane.
2. Split disconnected mesh shells into independent objects.
3. Split by user-drawn cut curves or spatial regions (advanced).
4. Automatically propose a split to fit a configurable printer build volume (advanced; requires validation).
5. Add assembly aids: alignment pins, dovetails, tabs, screw joints or keyed connectors.
6. Apply editable offsets/clearances for FDM or resin printing, based on test-fit recommendations.
7. Repair each resulting mesh, validate manifoldness and thickness, and export each part as STL or 3MF.
8. Preview exploded view and generate an assembly/part naming report.

## Important limitations
A triangle mesh is not automatically an editable CAD solid. Cutting a mesh is straightforward; designing reliable mating interfaces and safe load-bearing joints requires engineering judgment and print tests. No claim of watertightness or fit without validation.

## Implementation plan
Start with cut-plane and disconnected-shell splitting, then printable volume partitioning and connectors. Add tests for part count, bounding boxes, watertightness, units and assembly clearance.
