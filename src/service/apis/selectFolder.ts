/**
 * selectFolder.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/3 18:44:13
 */
import {IpcMainInvokeEvent, dialog} from 'electron';

export default async function selectFolder(
  event: IpcMainInvokeEvent
) {
  const dirs = dialog.showOpenDialogSync({
    title: '选择导出目录',
    message: '重复文件将被覆盖！',
    properties: ['openDirectory']
  });

  if (!dirs?.length) {
    return {error: '未选择输出目录！'};
  }

  const dir = dirs[0];
  return {res: dir};
}
