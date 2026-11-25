declare module 'katex/contrib/auto-render' {
  export interface DelimiterSpec {
    left: string;
    right: string;
    display: boolean;
  }

  export interface RenderMathInElementOptions {
    delimiters?: Array<DelimiterSpec>;
    throwOnError?: boolean;
    ignoredTags?: string[];
    ignoredClasses?: string[];
    errorCallback?: (msg: string, err: Error) => void;
  }

  export default function renderMathInElement(
    element: HTMLElement,
    options?: RenderMathInElementOptions
  ): void;
}
