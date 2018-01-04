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

            if (!uri.scheme && uri.path && !uri.fragment) {
                // Assume it must be a file
                if (uri.path[0] === '/') {
                     let root = vscode.workspace.getWorkspaceFolder(sourceUri);
                    if (root) {
                        uri = vscode.Uri.file(path.join(root.uri.fsPath, uri.path));
                    } 
                } else {
                    uri = vscode.Uri.file(path.join(path.dirname(sourceUri.path), uri.path));
                }
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
