declare module 'minimatch' {
  export function Minimatch(pattern: string, options?: any): any;
  export function filter(pattern: string, options?: any): any;
  export default function minimatch(p: string, pattern: string, options?: any): boolean;
}
