/**
 * readLocalFile.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/4 13:01:13
 */
import {callAPI} from './common';

export default function readLocalFile(filePath: string) {
  return callAPI<{text: string, buffer: Uint8Array}>('readLocalFile', filePath);
}

export const LOCAL_FILE_PREFIX = 'file://'
// const {fetch: origFetch} = window;
// //@ts-ignore
// window.fetch = async (url: string, options: any) => {
//   if (!url.startsWith(LOCAL_FILE_PREFIX)) {
//     return origFetch(url, options);
//   }

//   url = url.replace(LOCAL_FILE_PREFIX, '');
//   const res = await readLocalFile(url);

//   return {
//     ok: true,
//     status: 200,
//     json: async () => JSON.parse(res.text),
//     text: async () => res,
//     arrayBuffer: async () => res.buffer.buffer
//   };
// };
