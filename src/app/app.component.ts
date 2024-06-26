import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
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
  // Before Migration
  //@Select(AnimalsState.getAnimals) animals$: Observable<string[]>;

  //After Migration
  animals$: Observable<string[]> = this._store.select(AnimalsState.getAnimals);
  constructor(private _store: Store) {}
}
