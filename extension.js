const vscode = require('vscode');
const fs = require('fs');
const clipboardy = require('clipboardy');
const path = require('path');



function getPythonPath(filePath) {
  const splittedPath = filePath.split(path.sep);
  if (
    splittedPath.length === 0 ||
    !splittedPath[splittedPath.length - 1].endsWith(".py")
  ) {
    return "";
  }

  const fileName = splittedPath.pop();

  let pythonPath =
    fileName !== "__init__.py"
      ? [fileName.substring(0, fileName.lastIndexOf("."))]
      : [];

  while (
    splittedPath.length > 0 &&
    fs.existsSync([...splittedPath, ["__init__.py"]].join(path.sep))
  ) {
    pythonPath.unshift(splittedPath.pop());
  }

  return pythonPath.join(".");
}

function copyDjangoTestPath(uri) {
  try {
    const filePath = uri
      ? uri.fsPath
      : vscode.window.activeTextEditor.document.fileName;
    const pythonPath = getPythonPath(filePath);
    const selections = vscode.window.activeTextEditor.selections
      .map(s => {
        let start = s.start
        if (vscode.window.activeTextEditor.document.lineAt(start.line).text.slice(start.character-4, start.character-1) === "def") {
          let className = vscode.window.activeTextEditor.document.getText().split('\n').slice(0, start.line).reverse().find(s => s.match("(:?^|\s)class")).split(' ')[1].split('(')[0]
          return className+"."+ vscode.window.activeTextEditor.document.getText(s)
        } else if (vscode.window.activeTextEditor.document.lineAt(start.line).text.slice(start.character-6, start.character-1) === "class") {
          return vscode.window.activeTextEditor.document.getText(s)
        }
      })
      .filter(s => {
        return !!s && !s.includes("\n") && !s.trim().includes(" ")
      });
    if (pythonPath && selections.length > 0) {
      const pathStatement = generatePythonPathWithSelection(pythonPath, selections);
      clipboardy.writeSync(pathStatement);
    }
    if (pythonPath && selections.length == 0) {
      clipboardy.writeSync(pythonPath);
    }
  } catch (e) {
    console.log(e);
  }
}

function copyDjangoTestCommand(uri) {
  try {
    let testCommand = vscode.workspace.getConfiguration('djangoTestPath').get('testCommand')
    const filePath = uri
      ? uri.fsPath
      : vscode.window.activeTextEditor.document.fileName;
    const pythonPath = getPythonPath(filePath);
    const selections = vscode.window.activeTextEditor.selections
      .map(s => {
        let start = s.start
        if (vscode.window.activeTextEditor.document.lineAt(start.line).text.slice(start.character-4, start.character-1) === "def") {
          let className = vscode.window.activeTextEditor.document.getText().split('\n').slice(0, start.line).reverse().find(s => s.match("(:?^|\s)class")).split(' ')[1].split('(')[0]
          return className+"."+ vscode.window.activeTextEditor.document.getText(s)
        } else if (vscode.window.activeTextEditor.document.lineAt(start.line).text.slice(start.character-6, start.character-1) === "class") {
          return vscode.window.activeTextEditor.document.getText(s)
        }
      })
      .filter(s => {
        return !!s && !s.includes("\n") && !s.trim().includes(" ")
      });
    if (pythonPath && selections.length > 0) {
      const pathStatement = generatePythonCommandWithSelection(pythonPath, selections);
      clipboardy.writeSync(pathStatement);
    }
    if (pythonPath && selections.length == 0) {
      clipboardy.writeSync(`${testCommand} ${pythonPath}`);
    }
  } catch (e) {
    console.log(e);
  }
}

function generatePythonCommandWithSelection(pythonPath, selections) {
  let testCommand = vscode.workspace.getConfiguration('djangoTestPath').get('testCommand')
  if (selections.length == 0) {
    return `${testCommand} ${pythonPath}`;
  } else if (selections.length == 1) {
    const selection = selections[0].trim();
    return `${testCommand} ${pythonPath}.${selection}`;
  }
  const selection = selections.map(s => `${testCommand} ${pythonPath}.${s.trim()}`).join(" ");
  return selection;
}

function generatePythonPathWithSelection(pythonPath, selections) {
  if (selections.length == 0) {
    return `${pythonPath}`;
  } else if (selections.length == 1) {
    const selection = selections[0].trim();
    return `${pythonPath}.${selection}`;
  }
  const selection = selections.map(s => `${pythonPath}.${s.trim()}`).join(" ");
  return selection;
}

function activate(context) {
  let djangoTestPath = vscode.commands.registerCommand(
    "extension.copyDjangoTestPath",
    copyDjangoTestPath
  );
  let djangoTestCommand = vscode.commands.registerCommand(
    "extension.copyDjangoTestCommand",
    copyDjangoTestCommand
  );  
  context.subscriptions.push(djangoTestPath);
  context.subscriptions.push(djangoTestCommand);
}

exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
