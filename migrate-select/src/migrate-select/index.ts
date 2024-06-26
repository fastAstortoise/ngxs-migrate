import { CodeBlockWriter, Node, Project, ts } from 'ts-morph';
import * as prettier from 'prettier';
import {
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { virtualFs, workspaces } from '@angular-devkit/core';
import { existsSync, statSync } from 'node:fs';
import { relative } from 'node:path';
import { Helper } from './helper';

const regex = /inject\(\s*Store\s*\)/g;

async function runMigration(
  tree: Tree,
  dir: string,
  formatFile: boolean
): Promise<string[]> {
  const project = new Project();
  const sourceFiles = project.addSourceFilesAtPaths(`${dir}/**/*.ts`);
  const basePath = process.cwd();
  let filesChanged: string[] = [];
  for (const sourceFile of sourceFiles) {
    const filePath = relative(basePath, sourceFile.getFilePath());
    let storeIdentifierUsed = '';
    Helper.addConstructor(sourceFile);

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
      clazz.getConstructors().forEach((instance) => {
        const storeFound = instance
          .getParameters()
          .find((v) => v.getStructure().type === 'Store');
        if (storeFound?.getScope()) {
          storeIdentifierUsed = storeFound.getName();
        }
      });
      clazz.forEachChild((node: Node<ts.Node>) => {
        if (Node.isPropertyDeclaration(node)) {
          if (
            !storeIdentifierUsed &&
            node.hasInitializer() &&
            regex.test(node.getInitializer()!.getText())
          ) {
            storeIdentifierUsed = node.getName();
          }
          const selectDecorator = node.getDecorator('Select');
          if (selectDecorator) {
            const { name, isReadonly, docs, scope, type, hasOverrideKeyword } =
              node.getStructure();
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
              initializer: (writer: CodeBlockWriter) => {
                writer.write(
                  `this.${storeIdentifierUsed}.select(${selectArg})`
                );
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
        return (
          impDec.getModuleSpecifierValue() === '@ngxs/store' &&
          impDec.getNamedImports().some((value) => value.getName() === 'Select')
        );
      });
      if (hasSelectImport) {
        const selectImport = hasSelectImport
          .getNamedImports()
          .find((v) => v.getName() === 'Select');
        selectImport?.remove();
      }
      let textToWrite = sourceFile.getText();
      if (formatFile && prettier) {
        const config = await prettier.resolveConfig(sourceFile.getFilePath());
        textToWrite = await prettier.format(sourceFile.getText(), {
          ...config,
          parser: 'typescript',
        });
      }
      tree.overwrite(filePath, textToWrite);
    }
  }

  return filesChanged;
}

function createHost(tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile(path: string): Promise<string> {
      const data = tree.read(path);
      if (!data) {
        throw new SchematicsException('File not found.');
      }
      return virtualFs.fileBufferToString(data);
    },
    async writeFile(path: string, data: string): Promise<void> {
      return tree.overwrite(path, data);
    },
    async isDirectory(path: string): Promise<boolean> {
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
    },
    async isFile(path: string): Promise<boolean> {
      return tree.exists(path);
    },
  };
}
export function ngxsSelectMigrate(_options: {
  project: string;
  path: string;
  format: boolean;
}) {
  return async (tree: Tree, _context: SchematicContext) => {
    if (_options.path && _options.project) {
      throw new SchematicsException(
        `Provided both project and path. Please either provide --project or --path.`
      );
    }
    let path = null;
    const host = createHost(tree);
    const { workspace } = await workspaces.readWorkspace('/', host);
    const ngProject = workspace.projects.get(_options.path);

    if (ngProject) {
      const projectType =
        ngProject.extensions.projectType === 'application' ? 'app' : 'lib';
      path = `${ngProject.sourceRoot}/${projectType}`;
    }

    if (existsSync(_options.path) && statSync(_options.path).isDirectory()) {
      path = _options.path;
    }

    if (!path) {
      throw new SchematicsException(
        `Can not find project name or directory path provided. Project/Path provided : ${_options.project} ${_options.path}`
      );
    }

    const filesChanged = await runMigration(tree, path, _options.format);

    if (filesChanged.length) {
      _context.logger.info(
        'Automated migration has completed. Please verify your build and files.'
      );
    }
  };
}
