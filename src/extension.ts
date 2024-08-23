import * as vscode from 'vscode';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL;

async function getGitHubToken(): Promise<string | null> {
  try {
    const session = await vscode.authentication.getSession('github', ['repo'], {
      createIfNone: true,
    });
    if (session) {
      return session.accessToken;
    }
  } catch (error) {
    vscode.window.showErrorMessage('깃헙 로그인에 실패했습니다: ' + error);
  }
  return null;
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.addCodeSnippet', async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText) {
          try {
            const filename = await vscode.window.showInputBox({
              prompt: '소스코드의 파일 명을 입력해주세요',
            });

            if (!filename) {
              vscode.window.showErrorMessage('파일 명은 필수 입력 사항입니다!');
              return;
            }

            const snippets = context.workspaceState.get<any[]>('snippets', []);
            snippets.push({
              filename: filename,
              content: selectedText,
              ordinal: snippets.length + 1,
            });

            // 깃헙 로그인 토큰 가져오기
            // const session = await vscode.authentication.getSession(
            //   'github',
            //   ['repo'],
            //   { createIfNone: true }
            // );
            // if (session) {
            //   return session.accessToken;
            // }

            const token = await getGitHubToken();

            await context.workspaceState.update('snippets', snippets);
            vscode.window.showInformationMessage(
              `소스코드가 성공적으로 추가 되었어요! ${token}`
            );
          } catch (error: unknown) {
            if (error instanceof Error) {
              vscode.window.showErrorMessage(
                `소스코드 추가가 실패했어요: ${error.message}`
              );
            } else {
              vscode.window.showErrorMessage(
                '소스코드 추가가 실패했어요: 알 수 없는 에러입니다. 잠시 후 다시 시도해주세요'
              );
            }
          }
        } else {
          vscode.window.showErrorMessage('선택된 코드가 없습니다!');
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.sendAllSnippets', async () => {
      const snippets = context.workspaceState.get<any[]>('snippets', []);

      if (snippets.length === 0) {
        vscode.window.showErrorMessage('보낼 소스 코드가 없어요!');
        return;
      }

      try {
        const title = await vscode.window.showInputBox({
          prompt: '템플릿 명을 입력해주세요',
        });

        if (!title) {
          vscode.window.showErrorMessage('템플릿 명은 필수 입력 사항입니다!');
          return;
        }

        const requestBody = {
          title: title,
          snippets: snippets,
        };

        const response = await axios.post(`${API_URL}/templates`, requestBody);
        vscode.window.showInformationMessage(
          '템플릿이 코드잽에 성공적으로 업로드되었어요!'
        );

        // 저장된 소스코드들을 제출 후 clear 해야함
        await context.workspaceState.update('snippets', []);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          vscode.window.showErrorMessage(
            `템플릿 업로드에 실패했어요: ${error.message}`
          );
        } else if (error instanceof Error) {
          vscode.window.showErrorMessage(
            `템플릿 업로드에 실패했어요: ${error.message}`
          );
        } else {
          vscode.window.showErrorMessage(
            '템플릿 업로드에 실패했어요: 알 수 없는 에러입니다. 잠시 후 다시 시도해주세요'
          );
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.sendSingleSnippet', async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText) {
          try {
            const title = await vscode.window.showInputBox({
              prompt: '템플릿 명을 입력해주세요.',
            });

            if (!title) {
              vscode.window.showErrorMessage(
                '템플릿 명은 필수 입력 사항입니다!'
              );
              return;
            }

            const filename = await vscode.window.showInputBox({
              prompt: '소스코드의 파일 명을 입력해주세요',
            });

            if (!filename) {
              vscode.window.showErrorMessage('파일 명은 필수 입력 사항입니다!');
              return;
            }

            const requestBody = {
              title: title,
              snippets: [
                {
                  filename: filename,
                  content: selectedText,
                  ordinal: 1,
                },
              ],
            };

            const response = await axios.post(
              `${API_URL}/templates`,
              requestBody
            );
            vscode.window.showInformationMessage(
              '템플릿이 코드잽에 성공적으로 업로드되었어요!'
            );
          } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
              vscode.window.showErrorMessage(
                `템플릿 업로드에 실패했어요: ${error.message}`
              );
            } else if (error instanceof Error) {
              vscode.window.showErrorMessage(
                `템플릿 업로드에 실패했어요: ${error.message}`
              );
            } else {
              vscode.window.showErrorMessage(
                '템플릿 업로드에 실패했어요: 알 수 없는 에러입니다. 잠시 후 다시 시도해주세요'
              );
            }
          }
        } else {
          vscode.window.showErrorMessage('선택된 코드가 없습니다!');
        }
      }
    })
  );
}

export function deactivate() {}
