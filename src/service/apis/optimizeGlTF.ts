/**
 * optimizeGlTF.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/3 18:44:24
 */
import {IpcMainInvokeEvent, shell} from 'electron';
import optimize from '../common/gltfOptimize';

export default async function optimizeGlTF(
  event: IpcMainInvokeEvent,
  src: string, dstFolder: string,
  compressTex:  'high' | 'medium' | 'low' | 'off',
  toGLB: boolean, openOutput: boolean
) {
  try {
    const res = await optimize(src, dstFolder, compressTex, toGLB);
    
    shell.showItemInFolder(res);

    return {res};
  } catch (error) {
    console.error(error)
    return {error};
  }
}
