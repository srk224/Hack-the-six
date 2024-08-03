const vscode = require('vscode');
const cp = require('child_process');
const path = require('path');
const os = require('os');

function activate(context) {
    let disposable = vscode.commands.registerCommand('code-cure.runScript', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file to run');
            return;
        }

        const document = editor.document;
        const filePath = editor.document.uri.fsPath;
        const fileExtension = path.extname(filePath);

        if (fileExtension !== '.py') {
            vscode.window.showErrorMessage('The active file is not a Python file');
            return;
        }

        runPythonScript(filePath);
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

function getPythonCommand() {
    if (os.platform() === 'win32') {
        return 'python'; // or provide the full path like 'C:\\Python39\\python.exe'
    } else {
        return 'python3'; // For Unix-based systems, often it's python3
    }
}

function runPythonScript(filePath) {
    const pythonCommand = getPythonCommand();
    let scriptOutput = '';
    let scriptError = '';

    const process = cp.spawn(pythonCommand, [filePath]);

    process.stdout.on('data', (data) => {
        scriptOutput += data.toString();
    });

    process.stderr.on('data', (data) => {
        scriptError += data.toString();
    });

    process.on('close', (code) => {
        vscode.window.showInformationMessage(`Script Output: ${scriptOutput}`);
        console.log(`Script Output: ${scriptOutput}`);
        const terminal = vscode.window.createTerminal('Python Terminal');
        terminal.show();
        terminal.sendText(`${getPythonCommand()} ${filePath}`);
        vscode.window.showInformationMessage(`started processsing`);
        logError(scriptError);
    });
}

function logError(error) {
    // Here you can implement logging to a file or another logging mechanism
    console.log(`Logged Error: ${error}`);
}

module.exports = {
    activate,
    deactivate
};
