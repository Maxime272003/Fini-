import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { app } from './lib/app.svelte';

// Menu clic droit du navigateur désactivé : les cartes ont le leur.
document.addEventListener('contextmenu', (e) => {
  const target = e.target as HTMLElement | null;
  if (!target?.closest('input, textarea')) e.preventDefault();
});

mount(App, { target: document.getElementById('app')! });
void app.init();
