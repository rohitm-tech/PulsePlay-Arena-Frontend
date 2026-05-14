/**
 * Single source of truth for horizontal rhythm across PulsePlay.
 * Header, page shells, and footers should use these tokens.
 */
export const SITE_MAX = 'max-w-6xl';
export const SITE_GUTTER = 'px-4 sm:px-6';

/** Full-bleed sections: inner content matches page width + gutters */
export const siteInShell = `mx-auto w-full ${SITE_MAX} ${SITE_GUTTER}`;

/** Fixed header inner row */
export const siteHeaderInner = `mx-auto flex h-16 w-full ${SITE_MAX} items-center justify-between gap-4 ${SITE_GUTTER}`;

/** Mobile drawer content — same width as header */
export const siteMobileNavInner = `mx-auto flex w-full ${SITE_MAX} flex-col gap-1 ${SITE_GUTTER}`;

/** Primary page column (below fixed header) */
export const sitePageMain = `mx-auto w-full ${SITE_MAX} ${SITE_GUTTER} pb-20 pt-28`;

/** Centered narrow column inside the same max width (auth, small forms) */
export const siteNarrowColumn = `mx-auto w-full max-w-md`;

/** Readable prose / settings blocks inside full-width shell */
export const siteReadableColumn = `mx-auto w-full max-w-3xl`;
