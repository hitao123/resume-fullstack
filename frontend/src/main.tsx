import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { unstableSetRender } from 'antd';
import App from './App.tsx';
import 'antd/dist/reset.css';
import './index.css';
import './i18n';

type RenderContainer = (Element | DocumentFragment) & {
  _reactRoot?: ReturnType<typeof createRoot>;
};

unstableSetRender((node, container) => {
  const host = container as RenderContainer;
  host._reactRoot ??= createRoot(container);
  const root = host._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
