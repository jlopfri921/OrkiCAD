/** Bounded, immutable in-session history of CAD parameter edits.
 *
 * A snapshot contains a part family and complete typed parameter object.
 * It excludes STL caches, AI credentials and canvas selections.
 * Native .okad schema v1 currently persists only the latest snapshot.
 */
export const MAX_UNDO_STEPS = 50

export type CadEditSnapshot<T extends string, P> = {
  type: T
  params: Record<string, P>
  /** AI-generated geometry requires renewed human approval when revisited. */
  reviewRequired?: boolean
}
export type CadEditHistory<T extends string, P> = {
  past: Array<CadEditSnapshot<T, P>>
  present: CadEditSnapshot<T, P>
  future: Array<CadEditSnapshot<T, P>>
}

function copySnapshot<T extends string, P>(value: CadEditSnapshot<T, P>): CadEditSnapshot<T, P> {
  return { type: value.type, params: structuredClone(value.params), reviewRequired: !!value.reviewRequired }
}

export function createEditHistory<T extends string, P>(
  type: T, params: Record<string, P>,
): CadEditHistory<T, P> {
  return { past: [], present: copySnapshot({ type, params }), future: [] }
}

export function commitEdit<T extends string, P>(
  history: CadEditHistory<T, P>, next: CadEditSnapshot<T, P>,
): CadEditHistory<T, P> {
  const copied = copySnapshot(next)
  if (copied.type === history.present.type &&
      JSON.stringify(copied.params) === JSON.stringify(history.present.params) &&
      copied.reviewRequired === !!history.present.reviewRequired) {
    return history
  }
  return {
    past: [...history.past, copySnapshot(history.present)].slice(-MAX_UNDO_STEPS),
    present: copied,
    future: [],
  }
}

export function undoEdit<T extends string, P>(
  history: CadEditHistory<T, P>,
): CadEditHistory<T, P> {
  if (!history.past.length) return history
  const previous = history.past[history.past.length - 1]
  return {
    past: history.past.slice(0, -1),
    present: copySnapshot(previous),
    future: [copySnapshot(history.present), ...history.future],
  }
}

export function redoEdit<T extends string, P>(
  history: CadEditHistory<T, P>,
): CadEditHistory<T, P> {
  if (!history.future.length) return history
  return {
    past: [...history.past, copySnapshot(history.present)].slice(-MAX_UNDO_STEPS),
    present: copySnapshot(history.future[0]),
    future: history.future.slice(1),
  }
}
