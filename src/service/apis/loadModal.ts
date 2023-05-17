/**
 * loadModal.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/3 18:43:46
 */
import {IpcMainInvokeEvent, dialog} from 'electron';

export default async function loadModal(
  event: IpcMainInvokeEvent
) {
  const files = dialog.showOpenDialogSync({
    title: '选择gltf/glb文件',
    properties: ['openFile'],
    filters: [{
      name: '模型文件',
      extensions: ['gltf', 'glb']
    }]
  });

  if (!files?.length) {
    return {error: '未选择任何模型文件！'};
  }

  const file = files[0];
  return {res: file};
}
