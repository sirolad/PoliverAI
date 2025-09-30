"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const devkit_1 = require("@nx/devkit");
const executor_options_utils_1 = require("@nx/devkit/src/generators/executor-options-utils");
async function default_1(tree) {
    let usesModuleFederation = false;
    (0, executor_options_utils_1.forEachExecutorOptions)(tree, '@nx/webpack:webpack', (options, projectName, targetName) => {
        const webpackConfig = options.webpackConfig;
        if (!webpackConfig || webpackConfig === '@nx/react/plugins/webpack') {
            return;
        }
        const webpackContents = tree.read(webpackConfig, 'utf-8');
        if (['withModuleFederation', 'withModuleFederationForSSR'].some((p) => webpackContents.includes(p))) {
            usesModuleFederation = true;
        }
    });
    if (!usesModuleFederation) {
        return;
    }
    const nxJson = (0, devkit_1.readNxJson)(tree);
    const nxMFDevRemotesEnvVar = 'NX_MF_DEV_REMOTES';
    if (!nxJson.targetDefaults ||
        !nxJson.targetDefaults?.['@nx/webpack:webpack']) {
        nxJson.targetDefaults ??= {};
        nxJson.targetDefaults['@nx/webpack:webpack'] = {
            cache: true,
            inputs: ['production', '^production', { env: nxMFDevRemotesEnvVar }],
            dependsOn: ['^build'],
        };
    }
    else {
        nxJson.targetDefaults['@nx/webpack:webpack'].dependsOn ??= [];
        if (!nxJson.targetDefaults['@nx/webpack:webpack'].dependsOn.includes('^build')) {
            nxJson.targetDefaults['@nx/webpack:webpack'].dependsOn.push('^build');
        }
        nxJson.targetDefaults['@nx/webpack:webpack'].inputs ??= [];
        if (!nxJson.targetDefaults['@nx/webpack:webpack'].inputs.find((i) => typeof i === 'string' ? false : i['env'] === nxMFDevRemotesEnvVar)) {
            nxJson.targetDefaults['@nx/webpack:webpack'].inputs.push({
                env: nxMFDevRemotesEnvVar,
            });
        }
    }
    (0, devkit_1.updateNxJson)(tree, nxJson);
    await (0, devkit_1.formatFiles)(tree);
}
