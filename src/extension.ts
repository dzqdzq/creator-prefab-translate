import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function showToast(msg: string) {
  vscode.window.showInformationMessage(msg);
}

function getWebviewContent(projPath: vscode.Uri, prefabPath: vscode.Uri) {
  return `<!doctype html>
	<html lang="en">
	
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
		<link href="${projPath}/static/css/main.4229b3c8.css" rel="stylesheet">
	</head>
	
	<body>
		<div id="container" style="padding:24px" />
		<script>window.prefabPath = "${prefabPath}"</script>
		<script defer="defer" src="${projPath}/static/js/main.js"></script>
	</body>
	
	</html>`;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!(Array.isArray(workspaceFolders) && workspaceFolders[0])) {
    return;
  }
  const projPath = workspaceFolders[0].uri.path;
  // 判断workspaceFolders下是否有assets文件夹
  const assetsPath = path.join(projPath, 'assets');
  const uuidPath = path.join(projPath, 'library', 'uuid-to-mtime.json');
  if (!fs.existsSync(assetsPath) || !fs.existsSync(uuidPath)) {
    return;
  }
  const extensionPath = context.extensionPath;
  console.log('dzq== cocos creator');
  let panel: vscode.WebviewPanel | undefined = undefined;
  const disposable = vscode.commands.registerCommand(
    'extension.cocos.prefab.openWebview',
    () => {
      // 获取当前文件内容
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const doc = editor.document;
      let prefab = null;
      try {
        prefab = JSON.parse(doc.getText());
      } catch (error) {
        showToast('预制体格式错误');
        return;
      }
      let isNeedCreate = !panel;
      if (!isNeedCreate) {
        try {
          const webview = panel!.webview;
        } catch (e) {
          isNeedCreate = true;
        }
      }

      if (isNeedCreate) {
        panel = vscode.window.createWebviewPanel(
          'prefabPreview',
          'Prefab Preview',
          {
            viewColumn: vscode.ViewColumn.Two,
            preserveFocus: true,
          },
          {
            enableScripts: true,
            // localResourceRoots: [
            //   vscode.Uri.file(path.join(extensionPath, "build"))
            // ]
          }
        );
      }

      // 设置 Webview 的 HTML 内容
      if (panel) {
        // 获取当前的活动主题
        const activeTheme = vscode.window.activeColorTheme.kind;

        // 将主题信息发送到 Webview 中
        panel.webview.postMessage({ theme: activeTheme });

        // 监听 Webview 消息
        panel.webview.onDidReceiveMessage((message) => {
          if (message.type === 'applyTheme') {
            applyTheme(message.theme);
          }
        });

        const projPath = panel?.webview.asWebviewUri(
          vscode.Uri.file(path.join(extensionPath, 'build'))
        );
        const prefabPath = panel?.webview.asWebviewUri(
          vscode.Uri.file(editor.document.uri.path)
        );
        panel.webview.html = getWebviewContent(projPath, prefabPath);
      }
    }
  );

  context.subscriptions.push(disposable);
}

function applyTheme(theme: string) {
  // 根据主题设置样式
  if (theme === 'dark') {
    document.body.style.backgroundColor = '#1e1e1e';
    document.body.style.color = '#d4d4d4';
  } else {
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#333333';
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
