import { initHeader }      from './components/header.js';
import { initContact }     from './components/contact.js';
import { initBlogPreview } from './components/blog-preview.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initContact();
    initBlogPreview();
});
