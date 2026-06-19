import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommandPaletteService } from '../../services/command-palette.service';

@Component({
	selector: 'cmd-empty',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './empty.component.html',
	styleUrl: './empty.component.scss',
})
export class CmdEmptyComponent {
	public readonly palette: CommandPaletteService = inject(CommandPaletteService);
}
