import type { Command } from '../../compiled/commander';
export declare const getFullArgv: () => string[];
export declare const getArgv: () => string[];
export declare const getCommand: () => string;
export declare const isDevCommand: () => boolean;
export declare const deprecatedCommands: (program: Command & {
    commandsMap?: Map<string, Command>;
}) => void;
