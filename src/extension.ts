'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { packTextileUri, unpackTextileUri, textileContentProvider } from './contentProvider';

const path = require('path');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "textile-preview" is now active!');
	
	const contentProvider = new textileContentProvider(context);
	const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(textileContentProvider.textileURI.scheme, contentProvider);

	// Show textile
	let previewDisposable = vscode.commands.registerCommand('textile.showPreview', async () => {
		textilePanel(vscode.ViewColumn.One);
		return;
	});

	// Show textile to the side
	let sidePreviewDisposable = vscode.commands.registerCommand('textile.showPreviewToSide', async () => {
		textilePanel(vscode.ViewColumn.Two);
		return;
	});
	
	// Record of uris & panels
	let panelUri = {};

	// Create/reveal textile preview webpanel
	const textilePanel = async (viewColumn: vscode.ViewColumn) => {
		let editor = vscode.window.activeTextEditor;

		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a textile file');
			return;
		}

		let textileDocUri = packTextileUri(editor.document.uri);

		if (typeof (panelUri[textileDocUri.toString()]) === 'undefined') {
			// Panel has not yet been created for this document, create one
			let title = path.basename(editor.document.uri.fsPath) + ' - Preview';

			// Allow panel to load local resources
			let resourceUri: vscode.Uri;
			let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
			if (workspaceFolder) {
				// Resources within the currently opened workspace/folder
				resourceUri = workspaceFolder.uri;
			}
			else {
				// Resources within the same folder or sub folder to the open textile file
				resourceUri = vscode.Uri.file(path.dirname(editor.document.uri.fsPath));
			}

			const panel = vscode.window.createWebviewPanel(
				'textilePreview',
				title,
				{
					preserveFocus: true,
					viewColumn: viewColumn,
				},
				{
					localResourceRoots: [resourceUri]
				}
			);

			panelUri[textileDocUri.toString()] = panel;
		}
		else {
			// Use existing panel
			panelUri[textileDocUri.toString()].reveal(viewColumn, true);
		}

		// Initial update
		vscode.workspace.openTextDocument(textileDocUri).then(doc => {
			panelUri[textileDocUri.toString()].webview.html = doc.getText();
		});

		// Update upon change
		let contentChangeDisposable = contentProvider.onDidChange(uri => {
			contentProvider.provideTextDocumentContent(uri).then(doc => {
				panelUri[uri.toString()].webview.html = doc;
			})
		});

		panelUri[textileDocUri.toString()].onDidDispose(() => {
			// Remove panel from uri records
			delete panelUri[textileDocUri.toString()];

			// Dispose change event listener
			contentChangeDisposable.dispose();
		})

		return;
	}

	vscode.workspace.onDidChangeTextDocument(e => {
		if (e.document === vscode.window.activeTextEditor.document) {
			contentProvider.update(packTextileUri(e.document.uri));
		}
	});

	context.subscriptions.push(contentProviderRegistration,
								previewDisposable,
								sidePreviewDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
