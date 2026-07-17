import { Component, ChangeDetectionStrategy, input, computed, InputSignal, Signal } from '@angular/core';

@Component({
	selector: 'cmd-group',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'role': 'group',
		'[attr.aria-labelledby]': 'showHeading() ? headingId() : null',
	},
	templateUrl: './group.component.html',
	styleUrl: './group.component.scss',
})
export class CmdGroupComponent {
	public readonly heading: InputSignal<string> = input.required<string>();

	public readonly showHeading: InputSignal<boolean> = input<boolean>(true);

	// aria-labelledby is a space-separated id list, so the heading must be slugified.
	public readonly headingId: Signal<string> = computed(() => {
		const slug: string = this.heading().toLowerCase().replace(/[^a-z0-9]+/g, '-');
		return `cmd-group-${slug}`;
	});
}
