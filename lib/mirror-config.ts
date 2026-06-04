/** When true: Mirror always re-runs detectors; still persists to mirror_candidates. */
export function isMirrorDevMode(): boolean {
  return process.env.NEXT_PUBLIC_MIRROR_DEV_MODE === 'true'
}
