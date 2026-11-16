# OrkiCAD AI — First edit history (undo/redo) implementation

**Status:** under review; in-session CAD editing only. This does not yet persist a history tree in saved .okad documents.

## Current feature

- **Undo / Redo:** two compact actions in the shared Studio Web/Desktop topbar, available in CAD 2D, CAD 3D and technical drawings because all views consume the same live parametric state.
- **Keyboard:** Ctrl+Z / Ctrl+Y or Ctrl+Shift+Z (Cmd on macOS), only when focus is outside an input, text field, select or contenteditable region; normal typing undo remains the browser's responsibility.
- **History:** up to 50 committed design snapshots, containing the **part type** and complete editable **parameter set**. Snapshots are deep-copied to avoid later edits mutating earlier versions.
- **Changes captured:** inspector dimension updates (including related screw-drive adjustments), switching part families, and AI prompt proposals after the service returns a recognized catalog part. Restoring a pending AI proposal via Redo requires human approval again.
- **Redo branch:** a fresh CAD edit after an undo clears the previously available redo states, as in a conventional CAD editor.
- **Safety:** undo/redo invalidate pending render requests, remove stale STL from the 3D viewport, clear face selection and regenerate from the restored parameters. Failed render must not make previous geometry appear current.
- **File opening:** loading an existing validated .okad project resets the session's undo/redo stacks, so changes from a different project cannot accidentally be applied.
- **Saved project:** `orkicad.project/1` persists the **current parametric design**, project ID, part ID, name and revision. **It does not yet persist historical snapshots.** After reopening the .okad file, Undo starts with an empty history. No false claim of durable feature history.

## What this is not

This is **not** a full parametric operation timeline or a SolidWorks/FreeCAD-style feature tree. Current catalog parts use parameter snapshots, not independently identifiable sketch, extrusion, revolution, cut or loft operation IDs. It is also not multi-document undo, cloud editing or collaboration.

## Acceptance test

1. Select circular plate, set radius 50 and thickness 4, then modify radius to 70.
2. Undo should restore radius 50 in 2D, 3D HUD and drawings; Redo should restore radius 70. A stale old STL must not be selectable or exportable.
3. Undo then change hole diameter: Redo becomes unavailable.
4. Switch to a washer, Undo returns to the circular plate with all its previous dimensions.
5. Load an existing valid .okad file: undo and redo must be disabled and the imported part remains accurate.
6. Generate an AI proposal, Undo returns to the previous design and discards pending approval state, avoiding accidental generation from the discarded proposal.
7. Ctrl+Z inside a numeric/text input must not invoke CAD undo; clicking the toolbar Undo does.
8. Close and reopen the app: confirm that only the saved final document is restored and the **in-session** edit history is not falsely represented as saved.

## Next development stage

Define explicit typed, persistent operation commands with stable IDs, parameter references, dependency graph, validity state and schema migration `orkicad.project/2`; only then add durable feature history, sketch extrusion, revolution, loft and sweep operations. A compound operation should appear as one undo step. Persist provenance of externally imported STEP/STL or photographs only when those sources are supported and securely validated.
