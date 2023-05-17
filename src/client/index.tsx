/**
 * @File   : index.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 2023/5/17 13:56:19
 */
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import 'hana-ui/hana-style.scss';

if (process.env.isProd) {
  document.body.oncontextmenu = () => false;
}

const container = document.getElementById('container');
const root = createRoot(container);
root.render(<App />);
