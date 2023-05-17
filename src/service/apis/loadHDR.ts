/**
 * loadHDR.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/31 11:29:09
 */
import {IpcMainInvokeEvent, dialog} from 'electron';
import {decodeImage} from '../common/image';

export default async function loadHDR(
  event: IpcMainInvokeEvent
) {
  const files = dialog.showOpenDialogSync({
    title: '选择图像文件',
    message: '建议选择HDR/EXR图像',
    properties: ['openFile'],
    filters: [{
      name: '图像',
      extensions: ['hdr', 'exr', 'jpg', 'png', 'tiff']
    }]
  });

  if (!files?.length) {
    return {error: '未选择任何图像文件！'};
  }

  const file = files[0];
  const img = await decodeImage(file);

  return {res: img};
}
