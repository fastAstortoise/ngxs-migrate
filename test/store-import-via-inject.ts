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
