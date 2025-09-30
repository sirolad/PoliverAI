export type Falsy = false | null | undefined | 0 | '';
export declare function applyOptionsChain<T, U>(defaults: T, options?: T | ((config: T, utils?: U) => T | void) | Array<T | ((config: T, utils?: U) => T | void)> | Falsy, utils?: U, mergeFn?: typeof Object.assign): T;
export declare function applyOptionsChain<T, U>(defaults: T, options: T | ((config: T, utils: U) => T | void) | Array<T | ((config: T, utils: U) => T | void)> | Falsy, utils: U, mergeFn?: typeof Object.assign): T;
