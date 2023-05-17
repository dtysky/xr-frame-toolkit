const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

function syncVersions() {
  const version = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
  let tmp = JSON.parse(fs.readFileSync('./platforms/desktop/tauri.conf.json', 'utf-8'));
  tmp.package.version = version;
  fs.writeFileSync('./platforms/desktop/tauri.conf.json', JSON.stringify(tmp, undefined, 2), 'utf-8');
}

function convert(code) {
  return `window['wasmLoadPromise'].then(wm => {
  window['Phys3D'] = wm;
  ${code}
});
  `
}

class Replace {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('Replace', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'Replace',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        () => {
          const files = compilation.getAssets();
          files.filter(f => /\.js$/.test(f.name)).forEach(file => {
            const code = convert(file.source.source());

            compilation.updateAsset(
              file.name,
              new webpack.sources.RawSource(code)
            );
          });
        }
      );
    });
  }
}

module.exports = (env) => {
  const isProd = !!env.production;

  if (isProd) {
    syncVersions();
  }

  return {
    devtool: !isProd ? 'source-map' : false,
    mode: isProd ? 'production' : 'development',
    stats: {
      warnings:false
    },

    entry: {
      main: [
        path.resolve(__dirname, './src/client/index.tsx')
      ]
    },
  
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'assets/main-[hash].js',
      publicPath: '/'
    },
  
    resolve: {
      extensions: ['.js', '.ts', '.tsx']
    },
    
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader'
          },
          exclude: /node_modules/
        },
        {
          test: /\.(png|jpg|webp|mp4)$/,
          type: 'asset/resource'
        },
        {
          test: /\.(wxml)$/,
          type: 'asset/source'
        },
        {
          test: /\.(css|scss|sass)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
            {
              loader: 'css-loader'
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['postcss-preset-env'],
                  ],
                }
              }
            },
            {
              loader: 'sass-loader'
            },
            {
              loader: 'sass-resources-loader',
              options: {
                resources: './src/client/hana-theme.scss'
              }
            }
          ]
        },
      ]
    },
  
    plugins: [
      new MiniCssExtractPlugin({filename: 'assets/main-[hash].css'}),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './src/client/index.html')
      }),
      new webpack.DefinePlugin({
        'process.env': {
          isProd
        }
      }),
      new Replace(),
      !isProd && new webpack.HotModuleReplacementPlugin()
    ].filter(item => !!item),

    devServer: {
      host: '0.0.0.0',
      port: 8888,
      hot: true,
      client: {
        overlay: false,
      },
      static: {
        directory: path.join(__dirname, './src/static'),
        publicPath: '/static',
      },
      historyApiFallback: true
    }
  };
};
