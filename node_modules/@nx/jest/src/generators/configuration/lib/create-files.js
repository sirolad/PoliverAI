"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFiles = createFiles;
const devkit_1 = require("@nx/devkit");
const add_swc_config_1 = require("@nx/js/src/utils/swc/add-swc-config");
const path_1 = require("path");
function createFiles(tree, options, presetExt) {
    const projectConfig = (0, devkit_1.readProjectConfiguration)(tree, options.project);
    const commonFilesFolder = options.setupFile === 'angular' ? '../files-angular' : '../files/common';
    let transformer;
    let transformerOptions = null;
    if (options.compiler === 'babel' || options.babelJest) {
        transformer = 'babel-jest';
    }
    else if (options.compiler === 'swc') {
        transformer = '@swc/jest';
        if (options.isTsSolutionSetup) {
            transformerOptions = 'swcJestConfig';
        }
        else if (options.supportTsx) {
            transformerOptions =
                "{ jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } } }";
        }
    }
    else {
        transformer = 'ts-jest';
        transformerOptions = "{ tsconfig: '<rootDir>/tsconfig.spec.json' }";
    }
    if (options.compiler === 'swc' && options.isTsSolutionSetup) {
        (0, add_swc_config_1.addSwcTestConfig)(tree, projectConfig.root, 'es6', options.supportTsx);
    }
    const projectRoot = options.rootProject
        ? options.project
        : projectConfig.root;
    const rootOffset = (0, devkit_1.offsetFromRoot)(projectConfig.root);
    // jsdom is the default in the nx preset
    const testEnvironment = options.testEnvironment === 'none' || options.testEnvironment === 'jsdom'
        ? ''
        : options.testEnvironment;
    const coverageDirectory = options.isTsSolutionSetup
        ? `test-output/jest/coverage`
        : `${rootOffset}coverage/${projectRoot}`;
    (0, devkit_1.generateFiles)(tree, (0, path_1.join)(__dirname, commonFilesFolder), projectConfig.root, {
        tmpl: '',
        ...options,
        testEnvironment,
        transformer,
        transformerOptions,
        js: !!options.js,
        rootProject: options.rootProject,
        projectRoot,
        offsetFromRoot: rootOffset,
        presetExt,
        coverageDirectory,
        extendedConfig: options.isTsSolutionSetup
            ? `${rootOffset}tsconfig.base.json`
            : './tsconfig.json',
        outDir: options.isTsSolutionSetup
            ? `./out-tsc/jest`
            : `${rootOffset}dist/out-tsc`,
        module: !options.isTsSolutionSetup || transformer === 'ts-jest'
            ? 'commonjs'
            : undefined,
    });
    if (options.setupFile !== 'angular') {
        (0, devkit_1.generateFiles)(tree, (0, path_1.join)(__dirname, options.isTsSolutionSetup
            ? '../files/jest-config-ts-solution'
            : '../files/jest-config-non-ts-solution'), projectConfig.root, {
            tmpl: '',
            ...options,
            testEnvironment,
            transformer,
            transformerOptions,
            js: !!options.js,
            rootProject: options.rootProject,
            offsetFromRoot: rootOffset,
            presetExt,
            coverageDirectory,
        });
    }
    if (options.setupFile === 'none') {
        tree.delete((0, path_1.join)(projectConfig.root, './src/test-setup.ts'));
    }
    if (options.js) {
        tree.rename((0, path_1.join)(projectConfig.root, 'jest.config.ts'), (0, path_1.join)(projectConfig.root, 'jest.config.js'));
    }
}
