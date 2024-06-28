import { Scope, SourceFile } from 'ts-morph';

export class Helper {
  static addImportAndConstructor(sourceFile: SourceFile) {
    const hasStoreImport = sourceFile.getImportDeclaration((impDec) => {
      return (
        impDec.getModuleSpecifierValue() === '@ngxs/store' &&
        impDec.getNamedImports().some((value) => value.getName() === 'Store')
      );
    });

    if (!hasStoreImport) {
      const storeImport = sourceFile.getImportDeclaration((importDecl) => {
        return importDecl.getModuleSpecifierValue() === '@ngxs/store';
      });
      storeImport?.addNamedImport('Store');
    }
    const classes = sourceFile.getClasses();
    for (const clazz of classes) {
      // if there is no Store import on file and there is no constructor
      // add constructor with parameter
      if (!hasStoreImport && clazz.getConstructors().length < 1) {
        clazz.addConstructor({
          parameters: [
            {
              name: '_store',
              scope: Scope.Private,
              type: 'Store',
            },
          ],
        });
        // in case there is empty constructor add parameter
      } else if (!hasStoreImport && clazz.getConstructors().length) {
        clazz.getConstructors().forEach((c) => {
          c.addParameter({
            name: '_store',
            scope: Scope.Private,
            type: 'Store',
          });
        });
      }
    }
  }
  static removeImport(sourceFile: SourceFile) {
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
  }
}
