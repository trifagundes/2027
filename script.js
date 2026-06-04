// Executa imediatamente para evitar piscar tela
(function() {
    const savedTheme = localStorage.getItem('site_theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização
    initThemeToggle();
    initNavigation();
    loadHeroSlider();
    initPitchConfig();
    initScrollAnimations();
    loadEquipe();
    loadTitulos();
    loadPatrocinadores();
    loadAgenda();
    initPixCopy();
    loadContatos();
    loadPacotesPatrocinio();
    loadSobre();
    loadCampanha();
});

/* ==========================================================================
   Data Fetcher (LocalStorage Fallback)
   ========================================================================== */
async function fetchData(storageKey, url) {
    const localData = localStorage.getItem(storageKey);
    if (localData) {
        try {
            return JSON.parse(localData);
        } catch(e) {
            console.error('Erro ao fazer parse do localStorage para', storageKey);
        }
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao carregar ' + url);
    return await response.json();
}
/* ==========================================================================
   Navigation & Mobile Menu
   ========================================================================== */
function initNavigation() {
    const header = document.getElementById('main-header');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    // Header bg on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    mobileBtn.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
        const isExpanded = mobileBtn.getAttribute('aria-expanded') === 'true';
        mobileBtn.setAttribute('aria-expanded', !isExpanded);
    });

    // Close mobile menu when clicking a link
    links.forEach(link => {
        link.addEventListener('click', () => {
            mobileBtn.classList.remove('active');
            navLinks.classList.remove('active');
            mobileBtn.setAttribute('aria-expanded', 'false');
        });
    });
}

/* ==========================================================================
   Agenda Dinâmica
   ========================================================================== */
async function loadAgenda() {
    const container = document.getElementById('agenda-container');
    if (!container) return;

    try {
        const data = await fetchData('ciclismo_agenda', './json/agenda.json');
        const trimestres = data.trimestres;
        
        if (data.conteudo) {
            const titleP1 = document.getElementById('agenda-title-p1');
            if (titleP1 && data.conteudo.titulo_parte1) titleP1.textContent = data.conteudo.titulo_parte1;
            const titleP2 = document.getElementById('agenda-title-p2');
            if (titleP2 && data.conteudo.titulo_parte2) titleP2.textContent = data.conteudo.titulo_parte2;
            const subtitle = document.getElementById('agenda-subtitle');
            if (subtitle && data.conteudo.subtitulo) subtitle.textContent = data.conteudo.subtitulo;
        }
        
        container.innerHTML = '';
        
        if (trimestres && trimestres.length > 0) {
            // Container para as abas
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'titulos-tabs fade-in';
            
            // Container para os painéis
            const panelsContainer = document.createElement('div');
            panelsContainer.className = 'titulos-panels';

            trimestres.forEach((tri, index) => {
                const isActive = index === 0;
                
                // Botão da aba
                const btn = document.createElement('button');
                btn.className = `tab-btn ${isActive ? 'active' : ''}`;
                btn.textContent = tri.nome;
                btn.setAttribute('data-target', `agenda-${tri.id}`);
                
                btn.onclick = () => {
                    tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    panelsContainer.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById(`agenda-${tri.id}`).classList.add('active');
                };
                tabsContainer.appendChild(btn);

                // Painel da aba
                const panel = document.createElement('div');
                panel.id = `agenda-${tri.id}`;
                panel.className = `tab-panel ${isActive ? 'active' : ''}`;
                
                let eventosHtml = '<div class="agenda-timeline">';
                
                tri.eventos.forEach((evt, evtIndex) => {
                    const delay = evtIndex * 0.1;
                    
                    const tituloHtml = evt.link 
                        ? `<a href="${evt.link}" target="_blank" rel="noopener noreferrer" class="agenda-link"><h3>${evt.titulo} <span>↗</span></h3></a>`
                        : `<h3>${evt.titulo}</h3>`;

                    eventosHtml += `
                        <div class="agenda-item fade-in" style="transition-delay: ${delay}s">
                            <div class="agenda-date">
                                <span class="month">${evt.mes}</span>
                                <span class="day">${evt.dia}</span>
                            </div>
                            <div class="agenda-content">
                                ${tituloHtml}
                                <p class="location">${evt.local}</p>
                                <p class="desc">${evt.descricao}</p>
                                <span class="badge-tag">${evt.tag}</span>
                            </div>
                        </div>
                    `;
                });
                
                eventosHtml += '</div>';
                panel.innerHTML = eventosHtml;
                panelsContainer.appendChild(panel);
            });

            container.appendChild(tabsContainer);
            container.appendChild(panelsContainer);
            
            initScrollAnimations();
        } else {
            container.innerHTML = '<p>Nenhuma agenda encontrada.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar agenda:", error);
        container.innerHTML = '<p>Erro ao carregar os eventos da agenda.</p>';
    }
}

/* ==========================================================================
   Scroll Animations (Intersection Observer)
   ========================================================================== */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Anima apenas uma vez
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   Carregamento de Dados (Atletas)
   ========================================================================== */
async function loadEquipe() {
    const grid = document.getElementById('atletas-grid');
    
    try {
        const data = await fetchData('ciclismo_equipe', './json/equipe.json');
        const atletas = data.atletas;
        
        if (data.conteudo) {
            const titleP1 = document.getElementById('atletas-title-p1');
            if (titleP1 && data.conteudo.titulo_parte1) titleP1.textContent = data.conteudo.titulo_parte1;
            
            const titleP2 = document.getElementById('atletas-title-p2');
            if (titleP2 && data.conteudo.titulo_parte2) titleP2.textContent = data.conteudo.titulo_parte2;
            
            const subtitle = document.getElementById('atletas-subtitle');
            if (subtitle && data.conteudo.subtitulo) subtitle.textContent = data.conteudo.subtitulo;
        }
        
        // Atualiza as estatísticas no Hero
        if (data.equipe && data.equipe.estatisticas_temporada) {
            const stats = data.equipe.estatisticas_temporada;
            const kmTargetEl = document.getElementById('km-goal');
            const kmCounterEl = document.getElementById('km-counter');
            const kmBarEl = document.getElementById('km-bar');
            const widget = document.getElementById('km-widget');
            const temporadaEl = document.getElementById('km-widget-temporada');
            
            if (temporadaEl && data.equipe.temporada) {
                const termo = data.equipe.termo_ciclo || 'Temporada';
                temporadaEl.textContent = `${termo} ${data.equipe.temporada}`;
            }
            
            if (kmTargetEl && kmCounterEl && kmBarEl && widget) {
                kmTargetEl.textContent = stats.km_meta_anual.toLocaleString('pt-BR');
                widget.style.display = 'block';
                
                let startTimestamp = null;
                const duration = 2500; // 2.5s animation
                
                const animateCounter = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    // Easing cubic-out
                    const easeOutProgress = 1 - Math.pow(1 - progress, 3);
                    const currentKm = Math.floor(easeOutProgress * stats.km_atual);
                    
                    kmCounterEl.textContent = currentKm.toLocaleString('pt-BR');
                    
                    if (progress < 1) {
                        window.requestAnimationFrame(animateCounter);
                    } else {
                        kmCounterEl.textContent = stats.km_atual.toLocaleString('pt-BR');
                    }
                };
                
                window.requestAnimationFrame(animateCounter);
                
                // Animate bar width
                const percent = Math.min((stats.km_atual / stats.km_meta_anual) * 100, 100);
                setTimeout(() => {
                    kmBarEl.style.width = `${percent}%`;
                }, 300);
            }
        }
        
        if (atletas && atletas.length > 0) {
            grid.innerHTML = ''; // Limpa loading
            
            atletas.forEach((atleta, index) => {
                // Previne imagens vazias se não houver no JSON
                const imgSource = atleta.foto && atleta.foto.length > 0 && !atleta.foto.includes('src/atletas/') 
                    ? atleta.foto 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(atleta.nome)}&background=0a0a0c&color=00ff88&size=250`;
                
                // Se a foto é do diretório local mas o usuário não criou a imagem, usamos placeholder no onerror
                const fotoHtml = atleta.foto.includes('src/atletas/') 
                    ? `<img src="${atleta.foto}" alt="${atleta.nome}" class="atleta-img" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(atleta.nome)}&background=0a0a0c&color=00ff88&size=250'">`
                    : `<img src="${imgSource}" alt="${atleta.nome}" class="atleta-img">`;

                const demoNames = ["Juan Gimenez", "Renan Tarouco", "Oeslei Dorneles"];
                const isDemonstrative = demoNames.includes(atleta.nome);
                const demoTagHtml = isDemonstrative ? `<div class="demo-tag">Foto Demonstrativa</div>` : '';

                const card = document.createElement('div');
                card.className = 'atleta-card fade-in';
                card.style.transitionDelay = `${(index % 4) * 0.1}s`;
                
                card.innerHTML = `
                    <div class="atleta-img-wrapper">
                        ${fotoHtml}
                        ${demoTagHtml}
                        ${atleta.instagram ? `<a href="${atleta.instagram}" target="_blank" class="atleta-social" title="Instagram de ${atleta.nome}">IG</a>` : ''}
                    </div>
                    <div class="atleta-info">
                        <div class="atleta-header">
                            <h3 class="atleta-nome">${atleta.nome}</h3>
                            <span class="atleta-flag" title="${atleta.pais}">${atleta.bandeira_emoji}</span>
                        </div>
                        <div class="atleta-cat">${atleta.categoria_principal}</div>
                        <p style="font-size: 0.875rem; color: var(--text-muted)">${atleta.especialidade}</p>
                        
                        ${atleta.dados_desempenho_estimados ? `
                        <div class="atleta-stats">
                            <div class="stat-item">
                                <span class="stat-value">${atleta.dados_desempenho_estimados.ftp_watts}W</span>
                                <span class="stat-label">FTP</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${atleta.dados_desempenho_estimados.watts_kg}</span>
                                <span class="stat-label">W/kg</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                grid.appendChild(card);
            });
            
            // Re-inicia observador para os novos elementos criados dinamicamente
            initScrollAnimations();
        } else {
            grid.innerHTML = '<p>Nenhum atleta encontrado.</p>';
        }
        
    } catch (error) {
        console.error("Erro ao carregar atletas:", error);
        grid.innerHTML = `<p style="color: #ff5555">Erro ao carregar os dados da equipe. Verifique se está rodando em um servidor local (ex: Live Server).</p>`;
    }
}

/* ==========================================================================
   Carregamento de Dados (Patrocinadores)
   ========================================================================== */
async function loadPatrocinadores() {
    const wrapper = document.getElementById('parceiros-grid');
    
    try {
        const data = await fetchData('ciclismo_patrocinadores', './json/patrocinadores.json');
        
        if (data.conteudo) {
            const titleP1 = document.getElementById('parceiros-title-p1');
            if (titleP1 && data.conteudo.titulo_parte1) titleP1.textContent = data.conteudo.titulo_parte1;
            const titleP2 = document.getElementById('parceiros-title-p2');
            if (titleP2 && data.conteudo.titulo_parte2) titleP2.textContent = data.conteudo.titulo_parte2;
            const titleP3 = document.getElementById('parceiros-title-p3');
            if (titleP3 && data.conteudo.titulo_parte3) titleP3.textContent = data.conteudo.titulo_parte3;
        }
        
        wrapper.innerHTML = '';
        
        // Juntar ambos os arrays do json se existirem, ou usar o que estiver disponível
        let todosPatrocinadores = [];
        if (data.patrocinadores2) todosPatrocinadores = [...todosPatrocinadores, ...data.patrocinadores2];
        if (data.patrocinadores) todosPatrocinadores = [...todosPatrocinadores, ...data.patrocinadores];
        
        if (todosPatrocinadores.length > 0) {
            todosPatrocinadores.forEach((pat, index) => {
                const item = document.createElement('div');
                item.className = 'sponsor-logo-item fade-in';
                item.style.transitionDelay = `${(index % 5) * 0.1}s`;
                item.title = pat.nome;

                if (pat.tipo === 'svg' && pat.markup) {
                    item.innerHTML = pat.markup;
                } else if (pat.src) {
                    item.innerHTML = `<img src="${pat.src}" alt="${pat.nome}" loading="lazy">`;
                } else if (pat.imagem) {
                    // Fallback para imagens locais que podem não existir ainda
                    const bgAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(pat.nome)}&background=random&color=fff&size=120`;
                    item.innerHTML = `<img src="${pat.imagem}" alt="${pat.nome}" loading="lazy" onerror="this.src='${bgAvatar}'">`;
                } else {
                    item.innerHTML = `<span style="font-family: var(--font-heading); font-weight: 700; color: var(--text-muted)">${pat.nome}</span>`;
                }
                
                wrapper.appendChild(item);
            });
            
            initScrollAnimations();
        } else {
            wrapper.innerHTML = '<p>Nenhum parceiro encontrado.</p>';
        }
        
    } catch (error) {
        console.error("Erro ao carregar patrocinadores:", error);
    }
}

/* ==========================================================================
   Carregamento de Dados (Títulos / Conquistas)
   ========================================================================== */
async function loadTitulos() {
    const container = document.getElementById('titulos-container');
    if (!container) return;
    
    try {
        const data = await fetchData('ciclismo_titulos', './json/titulos.json');
        const historico = data.historico_titulos;
        
        if (data.conteudo) {
            const titleP1 = document.getElementById('titulos-title-p1');
            if (titleP1 && data.conteudo.titulo_parte1) titleP1.textContent = data.conteudo.titulo_parte1;
            const titleP2 = document.getElementById('titulos-title-p2');
            if (titleP2 && data.conteudo.titulo_parte2) titleP2.textContent = data.conteudo.titulo_parte2;
            const subtitle = document.getElementById('titulos-subtitle');
            if (subtitle && data.conteudo.subtitulo) subtitle.textContent = data.conteudo.subtitulo;
        }
        
        container.innerHTML = '';
        
        if (historico && historico.length > 0) {
            // Reverter para mostrar o ano mais recente primeiro
            const historicoReverse = [...historico].reverse();
            
            // Container para as abas (botões)
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'titulos-tabs fade-in';
            
            // Container para o conteúdo das abas
            const contentContainer = document.createElement('div');
            contentContainer.className = 'titulos-panels';
            
            historicoReverse.forEach((anoData, index) => {
                const isActive = index === 0;
                
                // Criar botão da aba
                const btn = document.createElement('button');
                btn.className = `tab-btn ${isActive ? 'active' : ''}`;
                btn.textContent = anoData.ano;
                
                // Evento de clique para trocar de aba
                btn.onclick = () => {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById(`panel-${anoData.ano}`).classList.add('active');
                };
                tabsContainer.appendChild(btn);

                // Criar painel de conteúdo
                const panel = document.createElement('div');
                panel.id = `panel-${anoData.ano}`;
                panel.className = `tab-panel ${isActive ? 'active' : ''}`;
                
                let conquistasHtml = '';
                anoData.conquistas.forEach(conquista => {
                    conquistasHtml += `
                        <div class="conquista-item">
                            <span class="conquista-data">${conquista.data}</span>
                            <span class="conquista-desc">${conquista.descricao}</span>
                        </div>
                    `;
                });
                
                panel.innerHTML = `
                    <div class="ano-card">
                        <div class="conquista-list">
                            ${conquistasHtml}
                        </div>
                    </div>
                `;
                
                contentContainer.appendChild(panel);
            });
            
            container.appendChild(tabsContainer);
            container.appendChild(contentContainer);
            
            // Re-inicia observador para os novos elementos criados dinamicamente
            initScrollAnimations();
        } else {
            container.innerHTML = '<p>Nenhum título encontrado.</p>';
        }
        
    } catch (error) {
        console.error("Erro ao carregar títulos:", error);
        container.innerHTML = `<p style="color: #ff5555">Erro ao carregar as conquistas.</p>`;
    }
}

/* ==========================================================================
   Hero Slider
   ========================================================================== */
async function loadHeroSlider() {
    const bgContainer = document.getElementById('hero-slider-bg');
    if (!bgContainer) return;

    try {
        const data = await fetchData('ciclismo_hero', './json/hero.json');
        
        // Atualizar textos do Hero
        if (data.conteudo) {
            const badge = document.getElementById('hero-badge');
            if (badge) badge.textContent = data.conteudo.badge;
            
            const titleP1 = document.getElementById('hero-title-p1');
            if (titleP1) titleP1.textContent = data.conteudo.titulo_parte1;
            
            const titleP2 = document.getElementById('hero-title-p2');
            if (titleP2) titleP2.innerHTML = data.conteudo.titulo_parte2;
            
            const desc = document.getElementById('hero-desc');
            if (desc) desc.textContent = data.conteudo.descricao;
            
            const btnPrimary = document.getElementById('hero-btn-primary');
            if (btnPrimary) btnPrimary.textContent = data.conteudo.btn_primario;
            
            const btnSecondary = document.getElementById('hero-btn-secondary');
            if (btnSecondary) btnSecondary.textContent = data.conteudo.btn_secundario;
        }
        
        const slides = data.slides;
        
        if (slides && slides.length > 0) {
            bgContainer.innerHTML = '';
            
            slides.forEach((slide, index) => {
                const div = document.createElement('div');
                div.className = `hero-slide ${index === 0 ? 'active' : ''}`;
                div.innerHTML = `<img src="${slide.src}" alt="${slide.alt}">`;
                bgContainer.appendChild(div);
            });
            
            initHeroSlider(); // Inicia a rotação após carregar
        }
    } catch (error) {
        console.error("Erro ao carregar slider do hero:", error);
    }
}

/* ==========================================================================
   Master Sponsor / Naming Rights Banner
   ========================================================================== */
async function loadMasterSponsor() {
    const container = document.getElementById('master-sponsor-container');
    if (!container) return;

    try {
        const data = await fetchData('ciclismo_master', './json/master.json');
        const master = data.naming_rights;
        
        if (master && master.ativo) {
            container.innerHTML = `
                <section class="master-banner fade-in">
                    <div class="container">
                        <div class="master-content">
                            <span class="master-title">${master.titulo}</span>
                            <a href="${master.link || '#'}" target="_blank" rel="noopener noreferrer">
                                <img src="${master.logo_src}" alt="${master.nome_patrocinador}" class="master-logo">
                            </a>
                            ${master.mensagem ? `<p class="master-msg">"${master.mensagem}"</p>` : ''}
                        </div>
                    </div>
                </section>
            `;
        }
    } catch (error) {
        console.error("Erro ao carregar patrocinador master:", error);
    }
}

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;
    
    let currentSlide = 0;
    
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

/* ==========================================================================
   Pitch Config / FAB
   ========================================================================== */
async function initPitchConfig() {
    const fabBtn = document.getElementById('pitch-config-btn');
    const panel = document.getElementById('pitch-config-panel');
    const closeBtn = document.getElementById('close-config');
    const select = document.getElementById('sponsor-select');
    
    if (!fabBtn || !panel || !select) return;
    
    // Toggle Panel
    fabBtn.addEventListener('click', () => panel.classList.toggle('hidden'));
    closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
    
    try {
        // Carregar opções do patrocinadores.json para o select
        const data = await fetchData('ciclismo_patrocinadores', './json/patrocinadores.json');
        if (data) {
            const patrocs = data.patrocinadores || [];
            
            let optionsHtml = `<option value="">-- Sem Patrocinador Master --</option>`;
            
            patrocs.forEach(p => {
                const img = p.src || p.imagem; // Pega imagem independente de como foi salva
                if (img) {
                    const cor1 = p.cor_primaria || '';
                    const cor2 = p.cor_secundaria || '';
                    optionsHtml += `<option value="${img}" data-nome="${p.nome}" data-cor1="${cor1}" data-cor2="${cor2}">${p.nome}</option>`;
                }
            });
            
            select.innerHTML = optionsHtml;
        }
    } catch(e) {
        console.error("Erro ao carregar opções para o select:", e);
        select.innerHTML = `<option value="">Erro ao carregar</option>`;
    }
    
    // Atualizar banner master e cores quando selecionar
    select.addEventListener('change', (e) => {
        const val = e.target.value;
        const container = document.getElementById('master-sponsor-container');
        if (!container) return;
        
        const option = e.target.options[e.target.selectedIndex];
        
        if (val) {
            const nome = option.dataset.nome;
            const cor1 = option.dataset.cor1;
            const cor2 = option.dataset.cor2;
            
            // Trocar o tema de cores inteiro do site
            if (cor1) document.documentElement.style.setProperty('--accent-green', cor1);
            if (cor2) document.documentElement.style.setProperty('--accent-cyan', cor2);

            container.innerHTML = `
                <section class="master-banner fade-in">
                    <div class="container">
                        <div class="master-content">
                            <span class="master-title">Temporada 2027 Apresentada por:</span>
                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <img src="${val}" alt="${nome}" class="master-logo">
                            </a>
                            <p class="master-msg">"Apoiando o esporte e o desenvolvimento da nossa região."</p>
                        </div>
                    </div>
                </section>
            `;
            // Trigger animation
            setTimeout(() => {
                const banner = container.querySelector('.master-banner');
                if(banner) banner.classList.add('visible'); // If using observer class
            }, 50);
        } else {
            // Restaurar as cores originais
            document.documentElement.style.removeProperty('--accent-green');
            document.documentElement.style.removeProperty('--accent-cyan');
            
            // Deixa em estado neutro (sem banner master)
            container.innerHTML = '';
        }
    });
}

/* ==========================================================================
   PIX Copy Button
   ========================================================================== */
function initPixCopy() {
    const btnCopy = document.getElementById('btn-copy-pix');
    const pixKeyText = document.getElementById('pix-key-text');
    const feedback = document.getElementById('copy-feedback');

    if (!btnCopy || !pixKeyText || !feedback) return;

    btnCopy.addEventListener('click', (e) => {
        e.preventDefault();
        const textToCopy = pixKeyText.textContent.trim();
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            feedback.classList.add('show');
            setTimeout(() => {
                feedback.classList.remove('show');
            }, 2000);
        }).catch(err => {
            console.error('Falha ao copiar:', err);
        });
    });
}

/* ==========================================================================
   Carregamento de Dados (Contatos e Apoio)
   ========================================================================== */
async function loadContatos() {
    try {
        const data = await fetchData('ciclismo_contatos', './json/contatos.json');
        
        // Atualizar Apoie
        if (data.apoio) {
            const pixKey = document.getElementById('pix-key-text');
            if (pixKey && data.apoio.pix) pixKey.textContent = data.apoio.pix;
            
            const btnVakinha = document.getElementById('link-vakinha');
            if (btnVakinha && data.apoio.vaquinha) btnVakinha.href = data.apoio.vaquinha;
            
            const btnApoiase = document.getElementById('link-apoiase');
            if (btnApoiase && data.apoio.apoia_se) btnApoiase.href = data.apoio.apoia_se;
        }
        
        // Atualizar Footer
        if (data.rodape) {
            const footerLogo = document.getElementById('footer-logo');
            if (footerLogo && data.rodape.logo_texto) footerLogo.textContent = data.rodape.logo_texto;
            
            const footerLinksTitle = document.getElementById('footer-links-title');
            if (footerLinksTitle && data.rodape.titulo_links) footerLinksTitle.textContent = data.rodape.titulo_links;
            
            const footerLink1 = document.getElementById('footer-link-1');
            if (footerLink1 && data.rodape.link_1) footerLink1.textContent = data.rodape.link_1;
            
            const footerLink2 = document.getElementById('footer-link-2');
            if (footerLink2 && data.rodape.link_2) footerLink2.textContent = data.rodape.link_2;
            
            const footerLink3 = document.getElementById('footer-link-3');
            if (footerLink3 && data.rodape.link_3) footerLink3.textContent = data.rodape.link_3;
            
            const footerContactTitle = document.getElementById('footer-contact-title');
            if (footerContactTitle && data.rodape.titulo_contato) footerContactTitle.textContent = data.rodape.titulo_contato;

            const footerDescricao = document.getElementById('footer-descricao');
            if (footerDescricao && data.rodape.descricao) footerDescricao.innerHTML = data.rodape.descricao;
            
            const footerCopyright = document.getElementById('footer-copyright');
            if (footerCopyright && data.rodape.copyright) footerCopyright.innerHTML = data.rodape.copyright;
        }
        
        const footerEmail = document.getElementById('footer-email');
        if (footerEmail && data.email) footerEmail.textContent = data.email;
        
        const footerPhone = document.getElementById('footer-phone');
        if (footerPhone && data.telefone) footerPhone.textContent = data.telefone;
        
        if (data.redes_sociais) {
            const ig = document.getElementById('footer-ig');
            if (ig && data.redes_sociais.instagram) ig.href = data.redes_sociais.instagram;
            
            const fb = document.getElementById('footer-fb');
            if (fb && data.redes_sociais.facebook) fb.href = data.redes_sociais.facebook;
            
            const st = document.getElementById('footer-st');
            if (st && data.redes_sociais.strava) st.href = data.redes_sociais.strava;
            
            const yt = document.getElementById('footer-yt');
            if (yt && data.redes_sociais.youtube) {
                yt.href = data.redes_sociais.youtube;
                yt.style.display = ''; // Volta pro padrão
            }
        }

        // Atualizar links de contato (Mailto) nos pacotes
        if (data.email) {
            const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
            mailtoLinks.forEach(link => {
                if (link.href.includes('contato@exemplo.com')) {
                    link.href = link.href.replace('contato@exemplo.com', data.email);
                }
            });
        }

        // Atualizar link do WhatsApp
        if (data.telefone) {
            const waLink = document.querySelector('a[href^="https://wa.me/"]');
            if (waLink) {
                let numericPhone = "";
                for (let i = 0; i < data.telefone.length; i++) {
                    if (data.telefone[i] >= '0' && data.telefone[i] <= '9') {
                        numericPhone += data.telefone[i];
                    }
                }
                waLink.href = waLink.href.replace(/wa.me\/[0-9]+/, "wa.me/" + numericPhone);
            }
        }
        
    } catch (error) {
        console.error("Erro ao carregar contatos:", error);
    }
}

/* ==========================================================================
   Carregamento de Dados (Pacotes de Patrocínio)
   ========================================================================== */
async function loadPacotesPatrocinio() {
    const grid = document.getElementById('pacotes-grid');
    if (!grid) return;
    
    try {
        const data = await fetchData('ciclismo_pacotes_patrocinio', './json/pacotes_patrocinio.json');
        const cotas = data.cotas;
        
        if (data.conteudo) {
            const titleP1 = document.getElementById('pacotes-title-p1');
            if (titleP1 && data.conteudo.titulo_parte1) titleP1.textContent = data.conteudo.titulo_parte1;
            const titleP2 = document.getElementById('pacotes-title-p2');
            if (titleP2 && data.conteudo.titulo_parte2) titleP2.textContent = data.conteudo.titulo_parte2;
            const subtitle = document.getElementById('pacotes-subtitle');
            if (subtitle && data.conteudo.subtitulo) subtitle.textContent = data.conteudo.subtitulo;
            
            const nrTitulo = document.getElementById('nr-titulo');
            if (nrTitulo && data.conteudo.nr_titulo) nrTitulo.textContent = data.conteudo.nr_titulo;
            const nrDesc = document.getElementById('nr-descricao');
            if (nrDesc && data.conteudo.nr_descricao) nrDesc.textContent = data.conteudo.nr_descricao;
            const nrBotao = document.getElementById('nr-botao');
            if (nrBotao && data.conteudo.nr_botao) nrBotao.textContent = data.conteudo.nr_botao;
        }
        
        if (cotas && cotas.length > 0) {
            grid.innerHTML = ''; // Limpa loading
            
            // Busca o email global configurado para usar nos botões de Solicitar Proposta
            let emailContato = 'contato@exemplo.com';
            try {
                const contatoData = await fetchData('ciclismo_contatos', './json/contatos.json');
                if (contatoData && contatoData.email) emailContato = contatoData.email;
            } catch (e) {
                console.warn("Não foi possível pré-carregar email para os pacotes.");
            }
            
            cotas.forEach((cota, index) => {
                const card = document.createElement('div');
                card.className = `pricing-card fade-in ${cota.destaque ? 'featured' : ''}`;
                card.style.transitionDelay = `${(index % 3) * 0.1}s`;
                
                let beneficiosHtml = '';
                if (cota.beneficios) {
                    cota.beneficios.forEach(ben => {
                        beneficiosHtml += `<li><i class="check-icon">✓</i> ${ben}</li>`;
                    });
                }
                
                const btnClass = cota.destaque ? 'btn-primary' : 'btn-outline';
                
                card.innerHTML = `
                    ${cota.tag_destaque ? `<div class="badge-popular">${cota.tag_destaque}</div>` : ''}
                    <div class="card-header">
                        <h3>${cota.nome}</h3>
                        <div class="price">${cota.preco}</div>
                    </div>
                    <ul class="features">
                        ${beneficiosHtml}
                    </ul>
                    <a href="mailto:${emailContato}?subject=Interesse%20Cota%20${encodeURIComponent(cota.nome)}" target="_blank" rel="noopener noreferrer" class="${btnClass}">Solicitar Proposta</a>
                `;
                
                grid.appendChild(card);
            });
            
            initScrollAnimations();
        } else {
            grid.innerHTML = '<p>Nenhum pacote encontrado.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar pacotes:", error);
        grid.innerHTML = `<p style="color: #ff5555">Erro ao carregar os pacotes.</p>`;
    }
}

/* ==========================================================================
   Carregamento de Dados (Sobre a História)
   ========================================================================== */
async function loadSobre() {
    const grid = document.getElementById('sobre-grid');
    const subtitulo = document.getElementById('sobre-subtitle');
    if (!grid) return;
    
    // Dicionário de SVGs permitidos para manter a segurança e padronização
    const iconesDict = {
        target: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
        bike: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>`,
        heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
        star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
    };

    try {
        const data = await fetchData('ciclismo_sobre', './json/sobre.json');
        
        const titleP1 = document.getElementById('sobre-title-p1');
        if (titleP1 && data.titulo_parte1) titleP1.textContent = data.titulo_parte1;
        
        const titleP2 = document.getElementById('sobre-title-p2');
        if (titleP2 && data.titulo_parte2) titleP2.textContent = data.titulo_parte2;
        
        if (subtitulo && data.subtitulo) {
            subtitulo.textContent = data.subtitulo;
        }

        if (data.cards && data.cards.length > 0) {
            grid.innerHTML = '';
            
            data.cards.forEach((card, index) => {
                const div = document.createElement('div');
                div.className = `sobre-card fade-in`;
                div.style.transitionDelay = `${index * 0.1}s`;
                
                const svgCode = iconesDict[card.icone] || iconesDict['star']; // star como fallback
                
                div.innerHTML = `
                    <div class="icon">${svgCode}</div>
                    <h3>${card.titulo}</h3>
                    <p>${card.texto}</p>
                `;
                grid.appendChild(div);
            });
            initScrollAnimations();
        } else {
            grid.innerHTML = '<p>Nenhuma informação encontrada.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar sobre:", error);
        grid.innerHTML = `<p style="color: #ff5555">Erro ao carregar conteúdo da história.</p>`;
    }
}

/* ==========================================================================
   Carregamento de Dados (Campanha Apoie)
   ========================================================================== */
async function loadCampanha() {
    try {
        const data = await fetchData('ciclismo_campanha', './json/campanha.json');
        
        if (data.conteudo) {
            const titleP1 = document.getElementById('campanha-title-p1');
            if (titleP1 && data.conteudo.titulo_parte1) titleP1.textContent = data.conteudo.titulo_parte1;
            const titleP2 = document.getElementById('campanha-title-p2');
            if (titleP2 && data.conteudo.titulo_parte2) titleP2.textContent = data.conteudo.titulo_parte2;
            const labelPix = document.getElementById('campanha-label-pix');
            if (labelPix && data.conteudo.label_pix) labelPix.textContent = data.conteudo.label_pix;
            const btnVak = document.getElementById('link-vakinha');
            if (btnVak && data.conteudo.btn_vakinha) btnVak.textContent = data.conteudo.btn_vakinha;
            const btnApo = document.getElementById('link-apoiase');
            if (btnApo && data.conteudo.btn_apoiase) btnApo.textContent = data.conteudo.btn_apoiase;
        }
        
        const texto = document.getElementById('campanha-texto');
        if (texto && data.texto_chamada) texto.textContent = data.texto_chamada;
        
        const titulo = document.getElementById('campanha-titulo');
        if (titulo && data.titulo_card) titulo.textContent = data.titulo_card;
        
        const arrecadadoSpan = document.getElementById('campanha-arrecadado');
        const metaSpan = document.getElementById('campanha-meta');
        const barra = document.getElementById('campanha-barra');
        
        if (data.arrecadado !== undefined && data.meta !== undefined) {
            if (arrecadadoSpan) arrecadadoSpan.textContent = `R$ ${data.arrecadado.toLocaleString('pt-BR')} arrecadados`;
            if (metaSpan) metaSpan.textContent = `Meta: R$ ${data.meta.toLocaleString('pt-BR')}`;
            
            if (barra) {
                let porcentagem = (data.arrecadado / data.meta) * 100;
                if (porcentagem > 100) porcentagem = 100;
                barra.style.width = `${porcentagem}%`;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar campanha:", error);
    }
}

/* ==========================================================================
   Funcionalidade de Cópia (PIX)
   ========================================================================== */
function initPixCopy() {
    const btnCopyPix = document.getElementById('btn-copy-pix');
    const pixKeyText = document.getElementById('pix-key-text');
    
    if (btnCopyPix && pixKeyText) {
        let originalText = '';
        btnCopyPix.addEventListener('click', () => {
            if (pixKeyText.textContent === "Copiado com sucesso!") return;
            originalText = pixKeyText.textContent;
            
            const onSuccess = () => {
                pixKeyText.textContent = "Copiado com sucesso!";
                pixKeyText.style.opacity = '0.7';
                setTimeout(() => {
                    pixKeyText.textContent = originalText;
                    pixKeyText.style.opacity = '1';
                }, 2000);
            };

            if (navigator.clipboard) {
                navigator.clipboard.writeText(originalText).then(onSuccess).catch(err => {
                    console.warn('API de clipboard falhou, tentando fallback...', err);
                    fallbackCopy(originalText, onSuccess);
                });
            } else {
                fallbackCopy(originalText, onSuccess);
            }
        });
    }

    function fallbackCopy(text, onSuccess) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            if (document.execCommand('copy')) onSuccess();
        } catch (err) {
            console.error('Erro no fallback de cópia:', err);
        }
        document.body.removeChild(textArea);
    }
}

/* ==========================================================================
   Theme Toggle
   ========================================================================== */
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('light');
        const isLight = document.documentElement.classList.contains('light');
        localStorage.setItem('site_theme', isLight ? 'light' : 'dark');
        btn.textContent = isLight ? '??' : '??';
    });
    
    const isLight = document.documentElement.classList.contains('light');
    btn.textContent = isLight ? '??' : '??';
}
