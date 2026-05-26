export const FIXED_HEADER_HEIGHT = 68;

export const getScreenTopPadding = (_safeTop: number): number => 18;

export const getScreenBottomPadding = (safeBottom: number): number =>
  Math.max(safeBottom + 32, 40);
