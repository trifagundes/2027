document.addEventListener('DOMContentLoaded', () => {
    // Inicialização
    initNavigation();
    loadHeroSlider();
    initPitchConfig();
    initScrollAnimations();
    loadEquipe();
    loadTitulos();
    loadPatrocinadores();
    loadAgenda();
    initPixCopy();
});

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
        const response = await fetch('./agenda.json');
        if (!response.ok) throw new Error('Falha ao carregar agenda');
        
        const data = await response.json();
        const trimestres = data.trimestres;
        
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
        const response = await fetch('./equipe.json');
        if (!response.ok) throw new Error('Falha ao carregar equipe');
        
        const data = await response.json();
        const atletas = data.atletas;
        
        // Atualiza as estatísticas no Hero
        if (data.equipe && data.equipe.estatisticas_temporada) {
            const stats = data.equipe.estatisticas_temporada;
            const kmTargetEl = document.getElementById('km-goal');
            const kmCounterEl = document.getElementById('km-counter');
            const kmBarEl = document.getElementById('km-bar');
            const widget = document.getElementById('km-widget');
            
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
        const response = await fetch('./patrocinadores.json');
        if (!response.ok) throw new Error('Falha ao carregar patrocinadores');
        
        const data = await response.json();
        
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
        const response = await fetch('./titulos.json');
        if (!response.ok) throw new Error('Falha ao carregar títulos');
        
        const data = await response.json();
        const historico = data.historico_titulos;
        
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
        const response = await fetch('./hero.json');
        if (!response.ok) throw new Error('Falha ao carregar hero.json');
        
        const data = await response.json();
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
        const response = await fetch('./master.json');
        if (!response.ok) throw new Error('Falha ao carregar master.json');
        
        const data = await response.json();
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
        const response = await fetch('./patrocinadores.json');
        if (response.ok) {
            const data = await response.json();
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
