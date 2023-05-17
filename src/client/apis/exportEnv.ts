/**
 * exportEnv.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/6/2 16:06:11
 */
import {callAPI} from './common';

export default function exportEnv(
  name: number,
  skySize: number, specSize: number,
  bin: boolean, hdr: boolean,
  skyMap: ArrayBuffer, specMap: ArrayBuffer,
  sh9: number[][]
) {
  return callAPI(
    'exportEnv',
    name,
    skySize, specSize, bin, hdr,
    skyMap, specMap, sh9
  );
}
