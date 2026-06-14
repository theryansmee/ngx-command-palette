import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { ProjectDefinition } from '@angular-devkit/core/src/workspace';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { addRootImport, addRootProvider } from '@schematics/angular/utility';

interface Schema {
	project?: string;
}

export function ngAdd(options: Schema): Rule {
	return async (tree: Tree, context: SchematicContext) => {
		const workspace = await getWorkspace(tree);
		const projectName = options.project || workspace.extensions['defaultProject'] as string;

		if (!projectName) {
			throw new Error('Could not determine project name. Use --project to specify one.');
		}

		const project = workspace.projects.get(projectName);

		if (!project) {
			throw new Error(`Project "${projectName}" not found in the workspace.`);
		}

		context.logger.info('Adding ngx-command-palette to your project...');

		addPaletteToTemplate(tree, project, context);

		return addProviderAndComponent(projectName);
	};
}

function addProviderAndComponent(projectName: string): Rule {
	return () => {
		const providerRule = addRootProvider(projectName, ({ code, external }) => {
			return code`${external('provideCommandPalette', '@theryansmee/ngx-command-palette')}()`;
		});

		const importRule = addRootImport(projectName, ({ code, external }) => {
			return code`${external('CmdPaletteComponent', '@theryansmee/ngx-command-palette')}`;
		});

		return (innerTree: Tree) => {
			providerRule(innerTree, {} as SchematicContext);
			importRule(innerTree, {} as SchematicContext);
			return innerTree;
		};
	};
}

function addPaletteToTemplate(tree: Tree, project: ProjectDefinition, context: SchematicContext): void {
	const sourceRoot = project.sourceRoot || 'src';
	const templatePaths = [
		`${sourceRoot}/app/app.component.html`,
		`${sourceRoot}/app/app.html`,
	];

	for (const templatePath of templatePaths) {
		if (!tree.exists(templatePath)) {
			continue;
		}

		const content = tree.read(templatePath)!.toString('utf-8');

		if (content.includes('<cmd-palette')) {
			context.logger.info('<cmd-palette /> already exists in template, skipping.');
			return;
		}

		tree.overwrite(templatePath, `<cmd-palette />\n${content}`);
		context.logger.info(`Added <cmd-palette /> to ${templatePath}`);
		return;
	}

	context.logger.warn(
		'Could not find root component template. Add <cmd-palette /> manually to your root component.',
	);
}
