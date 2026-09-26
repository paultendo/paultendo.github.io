/**
 * Typographic quotes and apostrophes for text that skips Markdown's own pass, such as frontmatter titles:
 * can't becomes can’t, "taken" becomes “taken”. Text that is already curly is left as it is.
 */
export function smartQuotes(s: string): string {
  return s
    .replace(/(^|[\s([{—–/-])'/gu, "$1‘")
    .replace(/'/g, "’")
    .replace(/(^|[\s([{—–/-])"/gu, "$1“")
    .replace(/"/g, "”");
}
