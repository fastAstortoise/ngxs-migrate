import {Injectable} from '@angular/core';
import {Selector, State} from '@ngxs/store';

@State<string[]>({
  name: 'animals',
  defaults: []
})
@Injectable()
export class AnimalsState {
  @Selector()
  static getAnimals(state: string[]) {
    return state.slice();
  }
}
