/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import type { StatsCompilation } from 'webpack';
export declare function addErrorTips(errors: string[], color?: {
    gray: (message: string) => string;
    cyan: (message: string) => string;
    green: (message: string) => string;
    yellow: (message: string) => string;
    underline: (message: string) => string;
}): string[];
declare function formatWebpackMessages(json?: Pick<StatsCompilation, 'errors' | 'warnings'>, color?: {
    gray: (message: string) => string;
    cyan: (message: string) => string;
    green: (message: string) => string;
    yellow: (message: string) => string;
    underline: (message: string) => string;
}): {
    errors: string[];
    warnings: string[];
};
export { formatWebpackMessages };
