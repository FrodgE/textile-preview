'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

export function imagePath(sourceText: string, sourceUri: vscode.Uri) {
    // Regex
    //      image character                       : !
    //      group 1, optional format specifiers   : .{...} or .(...)
    //      group 2, mandatory image path         : ...
    //      group 3, optional alternate image text: (...)
    //      image character                       : !
    var imageRegEx = /!(.?[\{|\(].*?[\}|\)])?(.*?)(\(.*?\))?!/;
    var result = '';
    
    //Look for image
    while (sourceText) {
        let match = sourceText.match(imageRegEx);

        if (match) {
            let uri = vscode.Uri.parse(match[2]);

            if ((uri.scheme ==='file') && !uri.authority && uri.path) {
                // Assume image is stored locally
                // Check for open workspace/folder
                let workspace = vscode.workspace.getWorkspaceFolder(sourceUri);
                if (workspace && (match[2][0] === '/')) {
                    // Image path relative to current workspace/project
                    uri = vscode.Uri.file(path.join(workspace.uri.fsPath, uri.path));
                } else {
                    // Image path relative to textile file
                    uri = vscode.Uri.file(path.join(path.dirname(sourceUri.path), uri.path));
                }

                // Allow Webview API to load the local image
                uri = uri.with({ scheme: 'vscode-resource' });
            }

            result += sourceText.substring(0, match.index + 1);

            if (match[1]) {
                // Contains optional image formatting options
                result += match[1];
            }

            result += uri.toString();

            if (match[3]) {
                // Contains optional alt text
                result += match[3];
            }

            result += '!';
            sourceText = sourceText.substring(match.index + match[0].length);
        }
        else {
            result += sourceText;
            sourceText = '';
        }
    }

    return result;
}
