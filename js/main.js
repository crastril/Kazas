import { initHeader } from './components/header.js';
import { initSimulator } from './components/simulator.js';

// Init All Components
document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initSimulator();
});

// Expose legacy function for mobile tab switching (called from HTML onclick)
window.switchSimulatorTab = function (tab) {
    const tabSans = document.getElementById('tab-sans-kazas');
    const tabAvec = document.getElementById('tab-avec-kazas');
    const resSans = document.getElementById('result-sans-kazas');
    const resAvec = document.getElementById('result-avec-kazas');

    if (tab === 'sans-kazas') {
        tabSans.className = "flex-1 py-3 rounded-lg text-sm font-bold bg-gold text-primary-dark shadow-lg transition-all duration-300";
        tabAvec.className = "flex-1 py-3 rounded-lg text-sm font-bold text-white/60 hover:text-white transition-all duration-300";
        resSans.classList.remove('hidden');
        resAvec.classList.add('hidden');
        resAvec.classList.remove('flex');
    } else {
        tabAvec.className = "flex-1 py-3 rounded-lg text-sm font-bold bg-gold text-primary-dark shadow-lg transition-all duration-300";
        tabSans.className = "flex-1 py-3 rounded-lg text-sm font-bold text-white/60 hover:text-white transition-all duration-300";
        resAvec.classList.remove('hidden');
        resAvec.classList.add('flex');
        resSans.classList.add('hidden');
    }
};
