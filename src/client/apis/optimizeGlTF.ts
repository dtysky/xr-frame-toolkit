/**
 * optimizeGlTF.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/3 17:36:54
 */
import {callAPI} from './common';

export type TCompressTextureQuality =  'high' | 'medium' | 'low' | 'off';

export default function optimizeGlTF(
  src: string, dstFolder: string,
  compressTex: TCompressTextureQuality,
  toGLB: boolean, openOutput: boolean
) {
  return callAPI<string>('optimizeGlTF', src, dstFolder, compressTex, toGLB, openOutput);
}
