'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { imagePath } from './imagePath';

const textile = require('textile-js');

export function packTextileUri(uri: vscode.Uri) {
	// Temporarily change the URI scheme
	// Pack the original URI in to the 'query' field
	if (uri.scheme === textileContentProvider.textileURI.scheme) {
		// Nothing to do
		return uri;
	}

	return uri.with({ scheme: textileContentProvider.textileURI.scheme, query: uri.toString()} );
}

export function unpackTextileUri(uri: vscode.Uri) {
	// Restore original URI scheme from the 'query' field
	if ((uri.scheme !== textileContentProvider.textileURI.scheme) || (!uri.query)) {
		// Not a modified textile URI, nothing to do
		return uri;
	}

	return vscode.Uri.parse(uri.query);
}

export class textileContentProvider implements vscode.TextDocumentContentProvider {
	public static readonly textileURI = vscode.Uri.parse('textile:');

	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private _waiting: boolean = false;

	constructor(private context: vscode.ExtensionContext) { }

	public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		let document = await vscode.workspace.openTextDocument( unpackTextileUri(uri) );
		let text = imagePath( document.getText(), unpackTextileUri(uri) );
		let body = await textile( text );
		
		return `<!DOCTYPE html>
			<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
			</head>
			<body class="vscode-body">
				${body}
			</body>
			</html>`;
	}

	get onDidChange(): vscode.Event<vscode.Uri> {
		return this._onDidChange.event;
	}

	public update(uri: vscode.Uri) {
		if (!this._waiting) {
			this._waiting = true;
			setTimeout(() => {
				this._waiting = false;
				this._onDidChange.fire(uri);
			}, 300);
		}
	}
}
