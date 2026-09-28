export interface TabDef {
  id: string;
  label: string;
}

/** Resolves the active tab from the URL, falling back to the first tab. */
export function resolveTab(tabs: readonly TabDef[], tab: string | undefined): string {
  return tabs.find((t) => t.id === tab)?.id ?? tabs[0].id;
}
