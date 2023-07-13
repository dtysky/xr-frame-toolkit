/**
 * checkUpdate.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/13 13:05:14
 */
const oldV: number[] = process.env.version.split('.').map(v => parseInt(v, 10));

export default async function checkUpdate(): Promise<string> {
  const res = await fetch('https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/toolkit/package.json');
  const remote = (await res.json() as any)?.version;
  console.log('remote', remote)
  if (!remote) {
    return '';
  }

  const newV: number[] = remote.split('.').map(v => parseInt(v, 10));
  for (let i = 0; i < 2; i += 1) {
    if (newV[i] === oldV[i]) {
      continue;
    }

    return newV[i] > oldV[i] ? remote : '';
  }

  return '';
}
