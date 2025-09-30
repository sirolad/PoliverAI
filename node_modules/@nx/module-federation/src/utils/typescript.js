"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTsPathMappings = readTsPathMappings;
exports.readTsConfig = readTsConfig;
exports.getRootTsConfigPath = getRootTsConfigPath;
const fs_1 = require("fs");
const path_1 = require("path");
const devkit_1 = require("@nx/devkit");
let tsConfig = new Map();
let tsPathMappings = new Map();
function readTsPathMappings(tsConfigPath = process.env.NX_TSCONFIG_PATH ?? getRootTsConfigPath()) {
    if (tsPathMappings.has(tsConfigPath)) {
        return tsPathMappings.get(tsConfigPath);
    }
    if (!tsConfig.has(tsConfigPath)) {
        tsConfig.set(tsConfigPath, readTsConfiguration(tsConfigPath));
    }
    tsPathMappings.set(tsConfigPath, {});
    Object.entries(tsConfig.get(tsConfigPath).options?.paths ?? {}).forEach(([alias, paths]) => {
        tsPathMappings.set(tsConfigPath, {
            ...tsPathMappings.get(tsConfigPath),
            [alias]: paths.map((path) => path.replace(/^\.\//, '')),
        });
    });
    return tsPathMappings.get(tsConfigPath);
}
function readTsConfiguration(tsConfigPath) {
    if (!(0, fs_1.existsSync)(tsConfigPath)) {
        throw new Error(`NX MF: TsConfig Path for workspace libraries does not exist! (${tsConfigPath}).`);
    }
    return readTsConfig(tsConfigPath);
}
let tsModule;
function readTsConfig(tsConfigPath) {
    if (!tsModule) {
        tsModule = require('typescript');
    }
    const readResult = tsModule.readConfigFile(tsConfigPath, tsModule.sys.readFile);
    return tsModule.parseJsonConfigFileContent(readResult.config, tsModule.sys, (0, path_1.dirname)(tsConfigPath));
}
function getRootTsConfigPath() {
    const tsConfigFileName = getRootTsConfigFileName();
    return tsConfigFileName ? (0, path_1.join)(devkit_1.workspaceRoot, tsConfigFileName) : null;
}
function getRootTsConfigFileName() {
    for (const tsConfigName of ['tsconfig.base.json', 'tsconfig.json']) {
        const tsConfigPath = (0, path_1.join)(devkit_1.workspaceRoot, tsConfigName);
        if ((0, fs_1.existsSync)(tsConfigPath)) {
            return tsConfigName;
        }
    }
    return null;
}
