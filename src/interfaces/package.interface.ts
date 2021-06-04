import { GuildConfig } from "./guild-config.interface";

export interface PackageDependency {
    name: string;
    repository: string | undefined;
    description: string;
    type: 'config' | 'module';
}

export interface PackageInput {
    event: string;
    data: any;
    config: GuildConfig;
    command?: {
        keyword: string;
        param: any;
    }
}

export type PackageTrigger = string | RegExp | { (data: PackageInput): boolean };