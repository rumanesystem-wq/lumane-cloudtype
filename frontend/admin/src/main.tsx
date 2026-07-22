import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/admin.css';
import { Showcase } from './Showcase';
import { AdminApp } from './AdminApp';

const Root = new URLSearchParams(window.location.search).has('showcase') ? Showcase : AdminApp;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
