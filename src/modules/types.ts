import type { ComponentType, LazyExoticComponent, SVGProps } from 'react';

export interface ModuleProps {
  /** The sub-route after the module id, e.g. "build" in #/triads/build. */
  tab: string | undefined;
}

/** A self-contained practice tool shown on the home screen. */
export interface PracticeModule {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  component: LazyExoticComponent<ComponentType<ModuleProps>>;
}
