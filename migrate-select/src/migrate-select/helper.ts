import { Scope, SourceFile } from 'ts-morph';

export class Helper {
  static addConstructor(sourceFile: SourceFile) {
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
      }
    }
  }
}
