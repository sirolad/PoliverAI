import { CreateNodes, CreateNodesV2 } from '@nx/devkit';
export interface JestPluginOptions {
    targetName?: string;
    ciTargetName?: string;
    /**
     * The name that should be used to group atomized tasks on CI
     */
    ciGroupName?: string;
    /**
     *  Whether to use jest-config and jest-runtime are used to load Jest configuration and context.
     *  Disabling this is much faster but could be less correct since we are using our own config loader
     *  and test matcher instead of Jest's.
     */
    disableJestRuntime?: boolean;
}
export declare const createNodesV2: CreateNodesV2<JestPluginOptions>;
/**
 * @deprecated This is replaced with {@link createNodesV2}. Update your plugin to export its own `createNodesV2` function that wraps this one instead.
 * This function will change to the v2 function in Nx 20.
 */
export declare const createNodes: CreateNodes<JestPluginOptions>;
//# sourceMappingURL=plugin.d.ts.map