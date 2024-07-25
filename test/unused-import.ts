import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { AccountInformation } from './account-information';
import { OrganizationState } from '@store/organization.state';

@Component({
  selector: 'app-account-administration',
  templateUrl: './account-administration.component.html'
})
export class AccountAdministrationComponent {
  @Select(OrganizationState.organizationAccounts)
  accounts$: Observable<AccountInformation[]>;
}
