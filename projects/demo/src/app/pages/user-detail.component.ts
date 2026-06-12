import { Component } from '@angular/core';

@Component({
	selector: 'app-user-detail',
	standalone: true,
	template: `<h2>User Detail</h2><p>This route has a param and is excluded from the palette.</p>`,
})
export class UserDetailComponent {}
