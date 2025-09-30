"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkspace = updateWorkspace;
const devkit_1 = require("@nx/devkit");
function updateWorkspace(tree, options) {
    const projectConfig = (0, devkit_1.readProjectConfiguration)(tree, options.project);
    if (!projectConfig.targets) {
        projectConfig.targets = {};
    }
    projectConfig.targets[options.targetName] = {
        executor: '@nx/jest:jest',
        outputs: [
            options.isTsSolutionSetup
                ? '{projectRoot}/test-output/jest/coverage'
                : (0, devkit_1.joinPathFragments)('{workspaceRoot}', 'coverage', options.rootProject ? '{projectName}' : '{projectRoot}'),
        ],
        options: {
            jestConfig: (0, devkit_1.joinPathFragments)(projectConfig.root, `jest.config.${options.js ? 'js' : 'ts'}`),
        },
    };
    if (options.setupFile === 'angular') {
        // We set the tsConfig in the target options so Angular migrations can discover it
        projectConfig.targets[options.targetName].options.tsConfig =
            (0, devkit_1.joinPathFragments)(projectConfig.root, 'tsconfig.spec.json');
    }
    (0, devkit_1.updateProjectConfiguration)(tree, options.project, projectConfig);
}
