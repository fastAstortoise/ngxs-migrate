"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ngxsSelectMigrate = void 0;
const ts_morph_1 = require("ts-morph");
const prettier = require("prettier");
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const regex = /inject\(\s*Store\s*\)/g;
function runMigration(tree, dir, formatFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const project = new ts_morph_1.Project();
        const sourceFiles = project.addSourceFilesAtPaths(`${dir}/**/*.ts`);
        const basePath = process.cwd();
        let filesChanged = [];
        for (const sourceFile of sourceFiles) {
            const filePath = (0, node_path_1.relative)(basePath, sourceFile.getFilePath());
            const classes = sourceFile.getClasses();
            let foundChangeInAtLeastOneClass = false;
            for (const clazz of classes) {
                const validDecorator = clazz
                    .getDecorators()
                    .find((value) => ['Component', 'Directive'].includes(value.getName()));
                if (!validDecorator || !sourceFile.getText().includes('@Select')) {
                    continue;
                }
                foundChangeInAtLeastOneClass = true;
                let storeIdentifierUsed = '';
                clazz.getConstructors().forEach((instance) => {
                    const storeFound = instance
                        .getParameters()
                        .find((v) => v.getStructure().type === 'Store');
                    if (storeFound === null || storeFound === void 0 ? void 0 : storeFound.getScope()) {
                        storeIdentifierUsed = storeFound.getName();
                    }
                });
                clazz.forEachChild((node) => {
                    if (ts_morph_1.Node.isPropertyDeclaration(node)) {
                        if (!storeIdentifierUsed &&
                            node.hasInitializer() &&
                            regex.test(node.getInitializer().getText())) {
                            storeIdentifierUsed = node.getName();
                        }
                        const selectDecorator = node.getDecorator('Select');
                        if (selectDecorator) {
                            const { name, isReadonly, docs, scope, type, hasOverrideKeyword } = node.getStructure();
                            const selectArg = selectDecorator
                                .getArguments()
                                .map((v) => v.getText());
                            const propertyTobeAdded = clazz.addProperty({
                                name,
                                isReadonly,
                                docs,
                                scope,
                                type,
                                hasOverrideKeyword,
                                initializer: (writer) => {
                                    writer.write(`this.${storeIdentifierUsed}.select(${selectArg});`);
                                },
                            });
                            node.replaceWithText(propertyTobeAdded.print());
                            propertyTobeAdded.remove();
                        }
                    }
                });
            }
            if (foundChangeInAtLeastOneClass) {
                filesChanged.push(filePath);
                const hasSelectImport = sourceFile.getImportDeclaration((impDec) => {
                    return (impDec.getModuleSpecifierValue() === '@ngxs/store' &&
                        impDec.getNamedImports().some((value) => value.getName() === 'Select'));
                });
                if (hasSelectImport) {
                    const selectImport = hasSelectImport
                        .getNamedImports()
                        .find((v) => v.getName() === 'Select');
                    selectImport === null || selectImport === void 0 ? void 0 : selectImport.remove();
                }
                let textToWrite = sourceFile.getText();
                if (formatFile && prettier) {
                    const config = yield prettier.resolveConfig(sourceFile.getFilePath());
                    textToWrite = yield prettier.format(sourceFile.getText(), Object.assign(Object.assign({}, config), { parser: 'typescript' }));
                }
                tree.overwrite(filePath, textToWrite);
            }
        }
        return filesChanged;
    });
}
function createHost(tree) {
    return {
        readFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = tree.read(path);
                if (!data) {
                    throw new schematics_1.SchematicsException('File not found.');
                }
                return core_1.virtualFs.fileBufferToString(data);
            });
        },
        writeFile(path, data) {
            return __awaiter(this, void 0, void 0, function* () {
                return tree.overwrite(path, data);
            });
        },
        isDirectory(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
            });
        },
        isFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return tree.exists(path);
            });
        },
    };
}
function ngxsSelectMigrate(_options) {
    return (tree, _context) => __awaiter(this, void 0, void 0, function* () {
        if (_options.path && _options.project) {
            throw new schematics_1.SchematicsException(`Provided both project and path. Please either provide --project or --path.`);
        }
        let path = null;
        const host = createHost(tree);
        const { workspace } = yield core_1.workspaces.readWorkspace('/', host);
        const ngProject = workspace.projects.get(_options.path);
        if (ngProject) {
            const projectType = ngProject.extensions.projectType === 'application' ? 'app' : 'lib';
            path = `${ngProject.sourceRoot}/${projectType}`;
        }
        if ((0, node_fs_1.existsSync)(_options.path) && (0, node_fs_1.statSync)(_options.path).isDirectory()) {
            path = _options.path;
        }
        if (!path) {
            throw new schematics_1.SchematicsException(`Can not find project name or directory path provided. Project/Path provided : ${_options.project} ${_options.path}`);
        }
        const filesChanged = yield runMigration(tree, path, _options.format);
        if (filesChanged.length) {
            _context.logger.info('Automated migration has completed. Please verify your build and files.');
        }
    });
}
exports.ngxsSelectMigrate = ngxsSelectMigrate;
//# sourceMappingURL=index.js.map