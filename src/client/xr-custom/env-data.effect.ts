/**
 * env-data.effect.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/29 19:10:51
 */
import XrFrame from 'XrFrame';
import {xrSystem} from '../common/ext';

xrSystem.registerEffect('env-data-skybox', scene => scene.createEffect({
  name: 'env-data-skybox',
  properties: [],
  images: [
    {
      key: 'u_source',
      default: 'white'
    }
  ],
  defaultRenderQueue: 2000,
  passes: [{
    renderStates: {
      cullOn: false,
      blendOn: false,
      depthWrite: false,
      depthTestOn: false
    },
    lightMode: "ForwardBase",
    useMaterialRenderStates: false,
    shaders: [0, 1]
  }],
  shaders: [`#version 100
  attribute vec3 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position.xy, 1.0, 1.0);
  }
  `,
    `#version 100
precision highp float;
precision highp int;
varying highp vec2 v_texCoord;

uniform float u_isHDR;
uniform sampler2D u_source;

vec3 LINEARtoSRGB(vec3 linearIn)
{
  vec3 linOut = pow(linearIn.xyz,vec3(1.0 / 2.2));

  return linOut;
}

vec3 aces(vec3 color) {
  return (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
}

void main()
{
  vec2 uv = v_texCoord.xy;
  vec4 color = texture2D(u_source, uv);

  if (u_isHDR == 0.) {
    gl_FragColor = vec4(LINEARtoSRGB(color.rgb), 1.0);
  } else {
    gl_FragColor = vec4(LINEARtoSRGB(aces(color.rgb)), 1.0);
  }
} 
    `],
}));

xrSystem.registerEffect('env-data-specular', scene => scene.createEffect({
  name: 'env-data-specular',
  properties: [],
  images: [
    {
      key: 'u_source',
      default: 'white'
    }
  ],
  defaultRenderQueue: 2000,
  passes: [{
    renderStates: {
      cullOn: false,
      blendOn: false,
      depthWrite: false,
      depthTestOn: false
    },
    lightMode: "ForwardBase",
    useMaterialRenderStates: false,
    shaders: [0, 1]
  }],
  shaders: [
`#version 100
attribute vec3 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position.xy, 1.0, 1.0);
}
`,
`#version 100
precision highp float;
precision highp int;
varying highp vec2 v_texCoord;

uniform sampler2D u_source;

float texelSize = 1.0 / 1024.0;

const int kernelSize = 13; // 高斯模糊的核大小，必须为奇数
const int numSamples = 16; // 采样点数量

vec4 gaussianBlur(vec2 uv, float blurSize) {
    vec4 color = vec4(0.0);
    float totalWeight = 0.0;

    // 高斯权重数组
    float weights[kernelSize];
    // 根据高斯函数计算权重
    float sigma = float(kernelSize) / 6.0;
    float twoSigmaSquared = 2.0 * sigma * sigma;
    float weightSum = 0.0;
    for (int i = 0; i < kernelSize; ++i) {
      float x = float(i) - float(kernelSize - 1) / 2.0;
      weights[i] = exp(-x * x / twoSigmaSquared);
      weightSum += weights[i];
    }
    // 归一化权重
    for (int i = 0; i < kernelSize; ++i) {
      weights[i] /= weightSum;
    }

    for (int sample = 0; sample < numSamples; ++sample) {
      vec2 sampleOffset = vec2(float(sample) / float(numSamples - 1) - 0.5) * 2.0;
      for (int i = 0; i < kernelSize; ++i) {
        for (int j = 0; j < kernelSize; ++j) {
          vec2 offsetUV = uv + (vec2(i, j) - vec2(float(kernelSize - 1) / 2.0)) * texelSize * blurSize * 2.4 + sampleOffset * texelSize;
          vec4 texColor = texture2D(u_source, offsetUV);
  
          // 根据权重进行加权平均
          float weight = weights[i] * weights[j];
          color += texColor * weight;
          totalWeight += weight;
        }
      }
    }
  
    return color / totalWeight;
}


void main()
{
  vec2 uv = v_texCoord.xy;
  uv.y = uv.y * 2.0;

  vec4 srcColor = vec4(1.0);

  if (v_texCoord.y <= 0.5) {
    // mipmap 1
    vec2 uv1 = vec2(v_texCoord.x, v_texCoord.y * 2.0);
    srcColor = texture2D(u_source, uv1);
  } else if (v_texCoord.y <= 0.75){
    // mipmap 2
    if (v_texCoord.x <= 0.5) {
      vec2 uv2 = vec2(v_texCoord.x * 2.0, (v_texCoord.y - 0.5) * 4.0);
      // srcColor = texture2D(u_source, uv2);
      srcColor = gaussianBlur(uv2, 1.0);
    }
  } else if (v_texCoord.y <= 0.875){
    // mipmap 3
    if (v_texCoord.x <= 0.25) {
      vec2 uv3 = vec2(v_texCoord.x * 4.0, (v_texCoord.y - 0.75) * 8.0);
      // srcColor = texture2D(u_source, uv3);
      srcColor = gaussianBlur(uv3, 2.0);
    }
  } else if (v_texCoord.y <= 0.9375){
    // mipmap 4
    if (v_texCoord.x <= 0.125) {
      vec2 uv4 = vec2(v_texCoord.x * 8.0, (v_texCoord.y - 0.875) * 16.0);
      // srcColor = texture2D(u_source, uv4);
      srcColor = gaussianBlur(uv4, 3.0);
    }
  } else if (v_texCoord.y <= 0.96875){
    // mipmap 5
    if (v_texCoord.x <= 0.0625) {
      vec2 uv5 = vec2(v_texCoord.x * 16.0, (v_texCoord.y - 0.9375) * 32.0);
      srcColor = texture2D(u_source, uv5);
      srcColor = gaussianBlur(uv5, 4.0);
    }
  } else if (v_texCoord.y <= 0.984375){
    // mipmap 6
    if (v_texCoord.x <= 0.03125) {
      vec2 uv6 = vec2(v_texCoord.x * 32.0, (v_texCoord.y - 0.96875) * 64.0);
      // srcColor = texture2D(u_source, uv6);
      srcColor = gaussianBlur(uv6, 5.0);
    }
  } else if (v_texCoord.y <= 0.9921875){
    // mipmap 7
    if (v_texCoord.x <= 0.015625) {
      vec2 uv7 = vec2(v_texCoord.x * 64.0, (v_texCoord.y - 0.984375) * 128.0);
      // srcColor = texture2D(u_source, uv7);
      srcColor = gaussianBlur(uv7, 6.0);
    }
  } else if (v_texCoord.y <= 0.99609375){
    // mipmap 8
    if (v_texCoord.x <= 0.0078125) {
      vec2 uv8 = vec2(v_texCoord.x * 128.0, (v_texCoord.y - 0.9921875) * 256.0);
      // srcColor = texture2D(u_source, uv8);
      srcColor = gaussianBlur(uv8, 7.0);
    }
  }

  vec4 color = srcColor;

  // RGBD
  float d = 1.;
  float m = max(color.r, max(color.g, color.b));
  if (m > 1.) {
    d = 1. / m;
  }
  color.r = color.r * d;
  color.g = color.g * d;
  color.b = color.b * d;
  color.a = d;

  gl_FragData[0] = color;
} 
`],

}));
