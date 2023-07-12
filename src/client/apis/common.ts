/**
 * common.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/25 19:17:23
 */
interface IApiResult<T extends any> {
  res?: T;
  error?: string;
}

export async function callAPI<T>(
  name: string, ...args: any
): Promise<T> {
  const res: IApiResult<T> = await window['electronAPI'].services(name, ...args);

  if (res.error) {
    throw new Error(res.error);
  }

  return res.res;
}
