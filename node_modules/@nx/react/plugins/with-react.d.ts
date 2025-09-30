import type { Configuration } from 'webpack';
import type { NxWebpackExecutionContext, WithWebOptions } from '@nx/webpack';
export interface SvgrOptions {
    svgo?: boolean;
    titleProp?: boolean;
    ref?: boolean;
}
export interface WithReactOptions extends WithWebOptions {
    /**
     * @deprecated Add SVGR support in your Webpack configuration without relying on Nx. See https://react-svgr.com/docs/webpack/
     * TODO(v22): Remove this option and migrate userland webpack config to explicitly configure @svgr/webpack
     * */
    svgr?: boolean | SvgrOptions;
}
/**
 * @param {WithReactOptions} pluginOptions
 * @returns {NxWebpackPlugin}
 */
export declare function withReact(pluginOptions?: WithReactOptions): (config: Configuration, context: NxWebpackExecutionContext) => Configuration;
//# sourceMappingURL=with-react.d.ts.map