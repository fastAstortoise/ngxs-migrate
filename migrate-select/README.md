# NgxsMigrate
# Getting Started With Ngxs Migrate Schematics

This repository is a Schematic implementation that helps you migrate ngxs @Select automatically.
It covers some of the use cases. It looks at each file and try to find the possible identifier you are using in the project.

### Scenario 1.
If there is no mention of `Store` in the imports. It will add `_store` as identifier and add constructor(this is much simpler than having to add with `inject`)

Before Migration:

```ts
import {Select} from "@ngxs/store";
import {AnimalsState} from "./store/animal.state";
import {Observable} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ngxs-migrate';
  @Select(AnimalsState.getAnimals) animals$: Observable<string[]>;
}
```
After migration of ngxs @Select
```ts
import {Store} from "@ngxs/store";
import {AnimalsState} from "./store/animal.state";
import {Observable} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ngxs-migrate';
  
  animals$: Observable<string[]> = this._store.select(AnimalsState.getAnimals);
  constructor(private _store: Store) {}
}
```

### Scenario 2.
If there is mention of `Store` in constructor. It will take that identifier and add that to all statements.

> This will NOT work in case you do not have SCOPE because that means you have assigned it to some other variable.

Before Migration:

```ts
import {Select, Store} from "@ngxs/store";
import {AnimalsState} from "./store/animal.state";
import {Observable} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ngxs-migrate';
  @Select(AnimalsState.getAnimals) animals$: Observable<string[]>;
  constructor(private _myStore: Store) {}
}
```
After migration of ngxs @Select
```ts
import { Store } from "@ngxs/store";
import {AnimalsState} from "./store/animal.state";
import {Observable} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ngxs-migrate';
  
  animals$: Observable<string[]> = this._myStore.select(AnimalsState.getAnimals);
  constructor(private _myStore: Store) {}
}
```

### Scenario 3.
If there is mention of `inject(Store)`. It will take the variable name of that statement and add that to all statements.

Before Migration:

```ts
import {Select, Store} from "@ngxs/store";
import {AnimalsState} from "./store/animal.state";
import {Observable} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private _myInjectedStore = inject(Store);
  title = 'ngxs-migrate';
  @Select(AnimalsState.getAnimals) animals$: Observable<string[]>;
}
```
After migration of ngxs @Select
```ts
import { Store } from "@ngxs/store";
import {AnimalsState} from "./store/animal.state";
import {Observable} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private _myInjectedStore = inject(Store);
  title = 'ngxs-migrate';
  
  animals$: Observable<string[]> = this._myInjectedStore.select(AnimalsState.getAnimals);
}
```

> In all cases it will remove the `Select` from import after migration.

### Installing 

```bash
npm i @sahaaye/ngxs-migrate
```
### Running Command

Full command with options available

`ng g @sahaaye/ngxs-migrate:select --path path_to_any_directory --project project_name --format true`

> You can only provide one of the `--project` or `--path` option.

`--format` will run the prettier using closest prettier config to the file.

Run the schematic using following commands

To Run migration on folder you can give the `--path`.
```bash
ng g @sahaaye/ngxs-migrate:select --path path_to_any_directory
```

To Run migration on project you can use your project name `--project`.

```bash
ng g @sahaaye/ngxs-migrate:select --project project_name
```

