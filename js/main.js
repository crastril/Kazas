import { initHeader } from './components/header.js';
import { initSimulator } from './components/simulator.js';
import { initContact } from './components/contact.js';
import { initPaywall } from './components/paywall.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initSimulator();
    initContact();
    initPaywall();
});
