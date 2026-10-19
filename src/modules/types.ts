import type { ComponentType, LazyExoticComponent, SVGProps } from 'react';

export interface ModuleProps {
  /** The sub-route after the module id, e.g. "build" in #/chords/build. */
  tab: string | undefined;
}

/** A self-contained practice tool shown on the home screen. */
export interface PracticeModule {
  id: string;
  /** Old ids that should still open this module (e.g. after a rename). */
  aliases?: readonly string[];
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  component: LazyExoticComponent<ComponentType<ModuleProps>>;
}
