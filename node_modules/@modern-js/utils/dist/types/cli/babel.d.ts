import type { BabelConfig, BabelConfigUtils, BabelTransformOptions } from '@modern-js/types';
export declare const getBabelUtils: (config: BabelTransformOptions) => BabelConfigUtils;
export declare const applyUserBabelConfig: (defaultOptions: BabelTransformOptions, userBabelConfig?: BabelConfig | BabelConfig[], extraBabelUtils?: Partial<BabelConfigUtils>) => BabelTransformOptions;
