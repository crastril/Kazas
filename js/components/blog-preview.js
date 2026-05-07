/**
 * Blog Preview — charge les 3 derniers articles depuis /blog/articles.json
 * Pour ajouter un article : insérer un objet EN TÊTE du tableau dans articles.json
 */
export async function initBlogPreview() {
    const grid = document.getElementById('blog-preview-grid');
    if (!grid) return;

    let articles;
    try {
        const res = await fetch('/blog/articles.json');
        if (!res.ok) throw new Error('fetch failed');
        articles = await res.json();
    } catch {
        // En cas d'erreur réseau, masquer silencieusement la section
        document.getElementById('blog-preview')?.style.setProperty('display', 'none');
        return;
    }

    const latest = articles.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

    grid.innerHTML = latest.map(a => {
        const date = new Date(a.date).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        return /* html */`
        <article class="group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
            <a href="/blog/${a.slug}.html">
                <div class="h-44 overflow-hidden bg-primary/10">
                    <img src="${a.image}" alt="${a.title}"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy" decoding="async" />
                </div>
                <div class="p-5">
                    <span class="text-xs font-bold uppercase tracking-widest text-gold">${a.category}</span>
                    <h3 class="text-base font-bold text-primary mt-2 mb-2 leading-snug group-hover:text-gold transition-colors line-clamp-2">
                        ${a.title}
                    </h3>
                    <p class="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">${a.excerpt}</p>
                    <div class="flex items-center justify-between text-xs text-gray-400">
                        <span>${date}</span>
                        <span>${a.readTime} de lecture</span>
                    </div>
                </div>
            </a>
        </article>`;
    }).join('');
}
