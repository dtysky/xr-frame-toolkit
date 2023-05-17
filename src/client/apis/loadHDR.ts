/**
 * loadHDR.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/31 11:28:50
 */
import {callAPI} from './common';

export interface IImage {
  name: number;
  width: number;
  height: number;
  hdr: boolean;
  rgb: boolean;
  premultiplyAlpha: boolean;
  buffer: ArrayBufferView;
}

export default function loadHDR() {
  return callAPI<IImage>('loadHDR');
}
