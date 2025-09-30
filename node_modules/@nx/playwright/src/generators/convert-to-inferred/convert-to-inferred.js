"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToInferred = convertToInferred;
const devkit_1 = require("@nx/devkit");
const plugin_1 = require("../../plugins/plugin");
const executor_to_plugin_migrator_1 = require("@nx/devkit/src/generators/plugin-migrations/executor-to-plugin-migrator");
async function convertToInferred(tree, options) {
    const projectGraph = await (0, devkit_1.createProjectGraphAsync)();
    const migratedProjects = await (0, executor_to_plugin_migrator_1.migrateProjectExecutorsToPlugin)(tree, projectGraph, '@nx/playwright/plugin', plugin_1.createNodesV2, { targetName: 'e2e', ciTargetName: 'e2e-ci' }, [
        {
            executors: ['@nx/playwright:playwright'],
            postTargetTransformer,
            targetPluginOptionMapper: (targetName) => ({ targetName }),
        },
    ], options.project);
    if (migratedProjects.size === 0) {
        throw new executor_to_plugin_migrator_1.NoTargetsToMigrateError();
    }
    if (!options.skipFormat) {
        await (0, devkit_1.formatFiles)(tree);
    }
}
function postTargetTransformer(target) {
    if (target.options) {
        if (target.options?.config) {
            delete target.options.config;
        }
        handleRenameOfProperties(target.options);
    }
    if (target.configurations) {
        for (const configurationName in target.configurations) {
            const configuration = target.configurations[configurationName];
            handleRenameOfProperties(configuration);
        }
    }
    return target;
}
function handleRenameOfProperties(options) {
    for (const [key, value] of Object.entries(options)) {
        const newKeyName = (0, devkit_1.names)(key).fileName;
        delete options[key];
        options[newKeyName] = value;
    }
}
exports.default = convertToInferred;
