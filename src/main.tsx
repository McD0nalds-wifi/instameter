import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App, bootstrap } from '@/app';
import '@/app/styles/index.css';

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('Не найден корневой элемент #root');
}

void bootstrap().then((store) => {
  createRoot(rootElement).render(
    <StrictMode>
      <App store={store} />
    </StrictMode>,
  );
});
