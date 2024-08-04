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

// To help in running python scripts depending on end-user system
function getPythonCommand() {
    if (os.platform() === 'win32') {
        return 'python';
    } else {
        return 'python3';
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

    process.on('close', async (code) => {
        vscode.window.showInformationMessage(`Script Output: ${scriptOutput}`);
        // console.log(`Script Output: ${scriptOutput}`);
        const terminal = vscode.window.createTerminal('Python Terminal');
        terminal.show();
        terminal.sendText(`${pythonCommand} ${filePath}`);
        vscode.window.showInformationMessage(`started processsing`);
        scriptData.errorMessage = scriptError;
        // logError(scriptError);

        const extensionRootPath = path.join(__dirname, '..');
        const jsonFilePath = path.join(extensionRootPath, 'code-cure', 'input.json');
        writeDataToFile(scriptData, jsonFilePath);

        try{
            console.log('Calling OpenAI Script...')
            await runOpenAIScript(extensionRootPath);
            readAndDisplayResponseData(terminal);
        } catch (error){
            console.log('Error with running'+error);
        }
    });

    // Get the file structure from the root directory of the workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const rootPath = workspaceFolders[0].uri.fsPath;
        scriptData.fileStructure = getFileStructure(rootPath);
    }
}

// Function to Trigger the open_ai_py.py file to use its API
async function runOpenAIScript(extensionRootPath) {
    return new Promise((resolve, reject) => {
        const pythonCommand = getPythonCommand();
        const openaiScriptPath = path.join(extensionRootPath,'code-cure', 'open_ai_api.py');
        
        const process = cp.spawn(pythonCommand, [openaiScriptPath]);

        process.stdout.on('data', (data) => {
            // console.log(`openai.py stdout: \n\n ${data}`);
        });

        process.stderr.on('data', (data) => {
            // console.error(`openai.py stderr: ${data}`);
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log('Script Executed. Writing data to terminal...');
                resolve();
            } else {
                // console.error(`openai.py script failed with code ${code}.`);
                reject(new Error(`openai.py script failed with code ${code}.`));
            }
        });
    });
}

// To send input, to be then used with Open AI API
function writeDataToFile(data, filePath) {
    console.log('Sending input...');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Logging function
function logError(error) {
    console.log(`Logged Error: ${scriptData.errorMessage}`);
    console.log(`fileContent: ${scriptData.fileContent}`);
    console.log(`filePath: ${scriptData.filePath}`);
    let struc = JSON.stringify(scriptData.fileStructure, null, 2);
    console.log(`fileStructure: ${struc}`);
}

function getStoredScriptData() {
    return scriptData;
}

// Recursive function to get complete file structure for file being run.
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

function readAndDisplayResponseData(terminal) {
    const extensionRootPath = path.join(__dirname, '..');
    const responseFilePath = path.join(extensionRootPath, 'code-cure', 'response_data.txt'); // Adjusted path to response_data.txt
    
    if (!fs.existsSync(responseFilePath)) {
        console.error('File does not exist:', responseFilePath);
        return;
    }

    try {
        const data = fs.readFileSync(responseFilePath, 'utf-8');
        const wrappedData = `\n# Here is a suggestion to help with your error:\n${data.split('\n').map(line => `# ${line}`).join('\n')}\n`;
        terminal.sendText(wrappedData);
    } catch (error) {
        console.error('Error reading or displaying response data:', error);
    }
}

module.exports = {
    activate,
    deactivate,
    getStoredScriptData
};
