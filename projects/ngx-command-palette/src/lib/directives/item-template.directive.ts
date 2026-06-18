import { Directive, inject, input, InputSignal, TemplateRef } from '@angular/core';
import { CmdItemTemplateContext } from '../models/command';

@Directive({
	selector: 'ng-template[cmdItemTemplate]',
	standalone: true,
})
export class CmdItemTemplateDirective {
	public readonly cmdItemTemplate: InputSignal<string> = input<string>('');
	public readonly templateRef: TemplateRef<CmdItemTemplateContext> = inject(TemplateRef);
}
