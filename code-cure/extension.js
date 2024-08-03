const vscode = require('vscode');
const cp = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

let scriptData = {
    filePath: '',
    fileContent: '',
    fileStructure: {},
    errorMessage: ''
};

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

        scriptData.filePath = filePath;
        scriptData.fileContent = editor.document.getText();

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
        // console.log(`Script Output: ${scriptOutput}`);
        const terminal = vscode.window.createTerminal('Python Terminal');
        terminal.show();
        terminal.sendText(`${pythonCommand} ${filePath}`);
        vscode.window.showInformationMessage(`started processsing`);
        scriptData.errorMessage = scriptError;
        // logError(scriptError);

        const extensionRootPath = path.join(__dirname, '..');
        const jsonFilePath = path.join(extensionRootPath, 'input.json');
        writeDataToFile(scriptData, jsonFilePath);
    });

    // Get the file structure from the root directory of the workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const rootPath = workspaceFolders[0].uri.fsPath;
        scriptData.fileStructure = getFileStructure(rootPath);
    }
    // scriptData.fileStructure = getFileStructure(path.dirname(filePath));
    // ThroughDirectory(path.dirname(filePath));
    // console.log('f -- \n');
    // for (const fileePath of walkSync(path.dirname(filePath))) {
    //     console.log(fileePath);
    // }
}

function writeDataToFile(data, filePath) {
    console.log('now writing to file - ');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function logError(error) {
    // Here you can implement logging to a file or another logging mechanism
    console.log(`Logged Error: ${scriptData.errorMessage}`);
    console.log(`fileContent: ${scriptData.fileContent}`);
    console.log(`filePath: ${scriptData.filePath}`);
    let b = JSON.stringify(scriptData.fileStructure, null, 2);
    console.log(`fileStructure: ${b}`);
}

function getStoredScriptData() {
    return scriptData;
}

function getFileStructure(dir) {
    const result = {};
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            result[file] = getFileStructure(filePath);
        } else {
            result[file] = 'file';
        }
    });
    return result;
}

let Files  = [];

function *walkSync(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        yield* walkSync(path.join(dir, file.name));
      } else {
        yield path.join(dir, file.name);
      }
    }
  }
  
 

module.exports = {
    activate,
    deactivate,
    getStoredScriptData
};
