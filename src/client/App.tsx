/**
 * App.tsx
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/17 17:20:26
 */
import * as React from 'react';
import {Menu, MenuItem, Loading, Notifications} from 'hana-ui';

import WXMLViewer from './pages/WXMLViewer';
import EnvData from './pages/EnvData';
import GLTFOpt from './pages/GLTFOpt';

import './xr-custom';
import './global.scss';
import css from './app.module.scss';

type TPage = 'wxml' | 'gltf' | 'env-data';

export default function App() {
  const [page, setPage] = React.useState<TPage>('gltf');
  const [notify, setNotify] = React.useState<any>();
  const [loading, setLoading] = React.useState<string>();

  const handleSetNotify = React.useCallback(
    (type: string, content: string, duration?: number) => {
      setNotify({type, content, showClose: true, duration: duration || 4})
    },
    []
  );
  const handleSetLoading = React.useCallback(
    (info: string) => {
      setLoading(info);
    },
    []
  );

  return (
    <div className={css.container}>
      <Menu
        className={css.topbar}
        horizonal
        type={'linear'}
        value={page}
        onClick={(_, val) => setPage(val)}
      >
        <MenuItem value="env-data">环境数据生成</MenuItem>
        <MenuItem value="gltf">glTF优化</MenuItem>
        {/* <MenuItem value="wxml">WXML预览编辑</MenuItem> */}
      </Menu>

      <div className={css.content}>
        {
          page === 'wxml' ? (
            <WXMLViewer />
          ) : page === 'env-data' ? (
            <EnvData
              setNotify={handleSetNotify}
              setLoading={handleSetLoading}
            />
          ) : (
            <GLTFOpt
              setNotify={handleSetNotify}
              setLoading={handleSetLoading}
            />
          )
        }
      </div>
      <Notifications notification={notify} />
      {loading && <Loading content={loading} />}
    </div>
  );
}

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/env-data" element={<EnvData />} />
//         <Route path="/gltf-opt" element={<GLTFOpt />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }
