// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "logmaster" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('logmaster.helloWorld', function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World Log Master!');
    vscode.window.showInformationMessage('Log Master!');
  });

  context.subscriptions.push(disposable);
  //打印功能
  let copyTextToLog = vscode.commands.registerCommand('logmaster.copyTextToLog', function () {
    const editor = vscode.window.activeTextEditor;
    // 用户配置
    const config = getQuoteStyle()
    const quoteStyle = config.quoteChar;
    const includeTime = config.includeTime;
    const includeType = config.includeType;
    const customEmoji = config.customEmoji;
    if (editor) {
      const selections = editor.selections;
      editor.edit(editBuilder => {
        selections.forEach(selection => {
          const selectedText = editor.document.getText(selection);
          const currentLine = selection.active.line;
          const lineCount = editor.document.lineCount;
          const lineText = editor.document.lineAt(currentLine).text;
          const leadingSpaces = lineText.match(/^\s*/) ? lineText.match(/^\s*/)[0].length : 0;
          const allSpace = ' '.repeat(leadingSpaces)
          // 用户配置
          let timeString = ''
          let typeString = ''
          let customEmojiString = customEmoji?`[${customEmoji}]|`:''
          if(includeTime){
            timeString = `[${quoteStyle}+new Date().toLocaleTimeString()+${quoteStyle}]|`;
          }
          if(includeType){
              typeString = `[${quoteStyle}+typeof ${selectedText}+${quoteStyle}]|`;
          }


          if (currentLine < lineCount - 1) {
            // 如果不是文档最后一行，就在当前行的下一行开头插入
            const nextLineStart = new vscode.Position(currentLine + 1, 0);
            editBuilder.insert(nextLineStart, allSpace + `console.log(${quoteStyle}${customEmojiString}${timeString}${typeString}${selectedText}:${quoteStyle},${selectedText});` + '\n');
          } else {
            // 创建一个新的位置对象，表示当前行的末尾
            const nextLineEndPosition = editor.document.lineAt(currentLine).range.end;
            // 在当前行的下一行插入选中的文本
            editBuilder.insert(nextLineEndPosition, '\n' + allSpace + `console.log(${quoteStyle}${selectedText}:${quoteStyle},${selectedText});`);
          }
        });
      })
    }
  });

  context.subscriptions.push(copyTextToLog);


  // 注册注释所有日志的命令
  let disposableCommentLogs = vscode.commands.registerCommand('logmaster.commentAllLogs', function () {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      editor.edit(editBuilder => {
        // 查找所有的 console.log 语句行
        const logStatements = findAllLogStatements(document);
        console.log(logStatements);
        logStatements.forEach(logStatement => {
          // 为每个 log 语句创建一个注释版本
          editBuilder.replace(logStatement.range, `// ${logStatement.text}`);
        });
      });
    }
  });

  context.subscriptions.push(disposableCommentLogs);

  // 移除所有的日志打印
  let removeAllLogs = vscode.commands.registerCommand('logmaster.removeAllLogs', function () {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      editor.edit(editBuilder => {
        const documentText = document.getText();
        // 创建一个正则表达式，以匹配含有 console.log 的行，包括可能的换行符
        const logRegex = /^.*console\.log\(.*\);?.*\r?\n/gm;
        let match;
        while ((match = logRegex.exec(documentText)) !== null) {
          // 为匹配到的每一行 console.log 创建一个范围（Range），然后删除它
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);
          const logRange = new vscode.Range(startPos, endPos);
          editBuilder.delete(logRange);
        }
      }).then(() => {
        // 在操作完成后，如果需要，可以在这里执行其他操作
      });
    }
  });

  context.subscriptions.push(removeAllLogs);
}


// This method is called when your extension is deactivated
function deactivate() { }


// 方法 methods
function findAllLogStatements(document) {
  let logStatements = [];
  const logRegex = /console\.log\((.*)\);/g;
  let match;
  while (match = logRegex.exec(document.getText())) {
    let matchRange = new vscode.Range(
      document.positionAt(match.index),
      document.positionAt(match.index + match[0].length)
    );
    logStatements.push({ range: matchRange, text: match[0] });
  }
  return logStatements;
}

const getQuoteStyle = () => {
  const config = vscode.workspace.getConfiguration('logmaster');
  const quoteStyle = config.get('quoteStyle') || 'double';
  const includeTime = config.get('includeTime') || false;;
  const includeType = config.get('includeType') || false;
  const customEmoji = config.get('customEmoji') || '';
  const quoteChar = quoteStyle === 'single' ? '\'' : '"';
  return { quoteChar, includeTime, includeType, customEmoji }
}


module.exports = {
  activate,
  deactivate
}
