import { SchematicContext, Tree } from '@angular-devkit/schematics';
export declare function ngxsSelectMigrate(_options: {
    project: string;
    path: string;
    format: boolean;
}): (tree: Tree, _context: SchematicContext) => Promise<void>;
