const vscode = require("vscode");
const fs = require("fs");
const clipboardy = require("clipboardy");
const path = require("path");

function getTestCommandFromConfiguration() {
  return vscode.workspace.getConfiguration("djangoTestPath").get("testCommand");
}

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

function parseSelections() {
  return vscode.window.activeTextEditor.selections
    .map((s) => {
      let start = s.start;
      if (
        vscode.window.activeTextEditor.document
          .lineAt(start.line)
          .text.slice(start.character - 4, start.character - 1) === "def"
      ) {
        let className = vscode.window.activeTextEditor.document
          .getText()
          .split("\n")
          .slice(0, start.line)
          .reverse()
          .find((s) => s.match("(:?^|s)class"))
          .split(" ")[1]
          .split("(")[0];
        return (
          className + "." + vscode.window.activeTextEditor.document.getText(s)
        );
      } else if (
        vscode.window.activeTextEditor.document
          .lineAt(start.line)
          .text.slice(start.character - 6, start.character - 1) === "class"
      ) {
        return vscode.window.activeTextEditor.document.getText(s);
      }
    })
    .filter((s) => {
      return !!s && !s.includes("\n") && !s.trim().includes(" ");
    });
}

function generatePath(pythonPath, selections, withCommand = false) {
  if (pythonPath && selections.length > 0) {
    return generatePathWithSelection(pythonPath, selections, withCommand);
  }
  if (pythonPath && selections.length == 0) {
    return generatePathWithoutSelection(pythonPath, withCommand);
  }
}

function generatePathWithSelection(
  pythonPath,
  selections,
  withCommand = false
) {
  let testCommand = getTestCommandFromConfiguration();
  if (selections.length == 0) {
    return withCommand ? `${testCommand} ${pythonPath}` : `${pythonPath}`;
  } else if (selections.length == 1) {
    const selection = selections[0].trim();
    return withCommand
      ? `${testCommand} ${pythonPath}.${selection}`
      : `${pythonPath}.${selection}`;
  }
  if (withCommand) {
    return selections.map((s) => `${pythonPath}.${s.trim()}`).join(" ");
  } else {
    return `${testCommand} ${selections
      .map((s) => `${pythonPath}.${s.trim()}`)
      .join(" ")}`;
  }
}

function generatePathWithoutSelection(pythonPath, withCommand = false) {
  let testCommand = getTestCommandFromConfiguration();
  return withCommand ? `${testCommand} ${pythonPath}` : `${pythonPath}`;
}

function copyDjangoTestPath(uri, withCommand) {
  try {
    const filePath = uri
      ? uri.fsPath
      : vscode.window.activeTextEditor.document.fileName;
    const pythonPath = getPythonPath(filePath);
    const selections = parseSelections();
    const pathStatement = withCommand
      ? generatePath(pythonPath, selections, true)
      : generatePath(pythonPath, selections, false);
    clipboardy.writeSync(pathStatement);
  } catch (e) {
    console.log(e);
  }
}

function copyDjangoTestPathWithoutCommand(uri) {
  copyDjangoTestPath(uri, false);
}

function copyDjangoTestPathWithCommand(uri) {
  copyDjangoTestPath(uri, true);
}

function activate(context) {
  let djangoTestPathWithoutCommand = vscode.commands.registerCommand(
    "extension.copyDjangoTestPathWithCommand",
    copyDjangoTestPathWithCommand
  );
  let djangoTestPathWithCommand = vscode.commands.registerCommand(
    "extension.copyDjangoTestPathWithoutCommand",
    copyDjangoTestPathWithoutCommand
  );
  context.subscriptions.push(djangoTestPathWithoutCommand);
  context.subscriptions.push(djangoTestPathWithCommand);
}

exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
