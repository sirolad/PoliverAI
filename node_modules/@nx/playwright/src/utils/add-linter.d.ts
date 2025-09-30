import { GeneratorCallback, Tree } from '@nx/devkit';
import { Linter, LinterType } from '@nx/eslint';
export interface PlaywrightLinterOptions {
    project: string;
    linter: Linter | LinterType;
    setParserOptionsProject: boolean;
    skipPackageJson: boolean;
    rootProject: boolean;
    js?: boolean;
    /**
     * Directory from the project root, where the playwright files will be located.
     **/
    directory: string;
    addPlugin?: boolean;
}
export declare function addLinterToPlaywrightProject(tree: Tree, options: PlaywrightLinterOptions): Promise<GeneratorCallback>;
//# sourceMappingURL=add-linter.d.ts.map