/**
 * compressTextures.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/5 18:36:43
 */
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {pack} from 'seinjs-texture-compressor';
import {showInfo} from './utils';

const TMP_DIR = path.resolve(os.tmpdir(), 'xr-frame-toolkit-tmp');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR);
}

export default async function compressTexture(
  src: string, buffer: Buffer,
  quality: 'high' | 'medium' | 'low',
  isNormalMap: boolean
): Promise<{astc: Buffer, pvrtc: Buffer, s3tc: Buffer, etc: Buffer}> {
  let isTransparent = /(png|exr)$/g.test(src);
  let useMipmaps = true;
  let destEncoding!: string;
  let destQuality!: string;
  const tmpSrcPath = path.resolve(TMP_DIR, `compress_tex_tmp_src${path.extname(src)}`);
  fs.writeFileSync(tmpSrcPath, buffer);
  
  const res: {astc: Buffer, pvrtc: Buffer, s3tc: Buffer, etc: Buffer} = {} as any;
  for (const destFormat of ['astc', 'etc', 'pvrtc', 's3tc']) {
    if (destFormat === 'astc') {
      // https://developer.nvidia.com/astc-texture-compression-for-game-assets
      if (quality === 'high') {
        destEncoding = (isTransparent || isNormalMap) ? 'ASTC_4x4' : 'ASTC_5x5';
        destQuality = 'astcthorough';
      } else if (quality === 'medium') {
        destEncoding = (isTransparent || isNormalMap) ? 'ASTC_5x5' : 'ASTC_6x6';
        destQuality = 'astcmedium';
      } else {
        destEncoding = (isTransparent || isNormalMap) ? 'ASTC_6x6' : 'ASTC_8x6';
        destQuality = 'astcfast';
      }
    } else if (destFormat === 'pvrtc') {
      if (quality === 'low') {
        destEncoding = (isTransparent && !isNormalMap) ? 'PVRTC1_2' : 'PVRTC1_2_RGB';
        destQuality = 'pvrtcbest';
      } else {
        destEncoding = (isTransparent && !isNormalMap) ? 'PVRTC1_4' : 'PVRTC1_4_RGB';
        destQuality = 'pvrtcnormal';
      }
    } else if (destFormat === 'etc') {
      destEncoding = (isTransparent && !isNormalMap) ? 'ETC2_RGBA' : 'ETC2_RGB';
      if (quality === 'low') {
        destQuality = 'etcslow';
      } else {
        destQuality = 'etcfast';
      }
    } else if (destFormat === 's3tc') {
      if (quality === 'low') {
        destEncoding = (isTransparent && !isNormalMap) ? 'DXT3' : 'DXT1';
        destQuality = 'better';
      } else {
        destEncoding = (isTransparent && !isNormalMap) ? 'DXT5' : 'DXT3';
        destQuality = 'fast';
      }
    }
  
    showInfo(`packing: ${src} to ${destFormat}`);
    const tmpDestPath = path.resolve(TMP_DIR, `compress_tex_tmp_dest.ktx`);
    try {
      await pack({
        type: destFormat,
        input: tmpSrcPath,
        output: tmpDestPath,
        compression: destEncoding,
        quality: destQuality,
        verbose: true,
        mipmap: useMipmaps,
        square: destFormat === 'pvrtc' ? '+' : 'no'
      });

      res[destFormat] = fs.readFileSync(tmpDestPath);
    } catch (error) {
      throw new Error(`Compress error: '${error.message}'`);
    }
  }

  return res;
}
