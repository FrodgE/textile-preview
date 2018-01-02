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
	let previewDisposable = vscode.commands.registerCommand('textile.showPreview', () => {
		let editor = vscode.window.activeTextEditor;

		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a textile file');
			return;
		}

		let title = path.basename(editor.document.uri.fsPath) + ' - Preview';

		return vscode.commands.executeCommand('vscode.previewHtml', packTextileUri(editor.document.uri), vscode.ViewColumn.One, title).then((success) => {
		}, (reason) => {
			vscode.window.showErrorMessage(reason);
		});
	});
	
	// Show textile to the side
	let sidePreviewDisposable = vscode.commands.registerCommand('textile.showPreviewToSide', () => {
		let editor = vscode.window.activeTextEditor;

		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a textile file');
			return;
		}

		let title = path.basename(editor.document.uri.fsPath) + ' - Preview';

		return vscode.commands.executeCommand('vscode.previewHtml', packTextileUri(editor.document.uri), vscode.ViewColumn.Two, title).then((success) => {
		}, (reason) => {
			vscode.window.showErrorMessage(reason);
		});
	});
	
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
