import { configurationGenerator } from './src/generators/configuration/configuration';
export { configurationGenerator };
/**
 * @deprecated Use `configurationGenerator` instead. It will be removed in Nx v22.
 */
export declare const jestProjectGenerator: typeof configurationGenerator;
export { addPropertyToJestConfig, removePropertyFromJestConfig, } from './src/utils/config/update-config';
export { jestConfigObjectAst } from './src/utils/config/functions';
export { jestInitGenerator } from './src/generators/init/init';
export { getJestProjectsAsync } from './src/utils/config/get-jest-projects';
//# sourceMappingURL=index.d.ts.map