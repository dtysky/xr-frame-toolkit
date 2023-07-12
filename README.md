# xr-frame-toolkit

用于微信小程序内置的`xr-frame`系统的可视化工具，目前提供以下两个功能：

1. 通过环境贴图，生成`xr-frame`专用的`env-data`，包含`skybox`、`diffuse sh`和`specular map`，支持打包成单二进制文件。
2. 对`gltf`模型文件进行预处理，优化为`xr-frame`友好的数据结构，同时支持**压缩纹理**和打包为`glb`，能大幅提升加载速度并节省内存，但注意**压缩纹理要求基础库3.0.1**以上的版本。

## 使用

首先下载：

然后参考下面的视频即可：

### env-data


### gltf

