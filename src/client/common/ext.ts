/**
 * ext.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/30 14:18:50
 */
import XrFrame from 'XrFrame';

const {xrFrameSystem} = window['xrFrame'];
const xrSystem = xrFrameSystem as XrFrame.IXrFrameSystem;

export {xrSystem};