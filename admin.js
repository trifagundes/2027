// Executa imediatamente para evitar piscar tela
(function() {
    const savedTheme = localStorage.getItem('site_theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
    }
})();
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    const navItems = document.querySelectorAll('.nav-item');
    const titleEl = document.getElementById('current-section-title');
    const formContainer = document.getElementById('form-container');
    const btnSave = document.getElementById('btn-save');
    const btnClear = document.getElementById('btn-clear-cache');
    const btnExport = document.getElementById('btn-export-all');

    // Modal Elements
    const modal = document.getElementById('admin-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-btn-cancel');
    const modalSave = document.getElementById('modal-btn-save');

    let currentFile = '';
    let currentData = null;
    let editingContext = null; // { arrayPath, index, itemData }

    // Toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Inicialização
    const firstTab = document.querySelector('.nav-item.active');
    if (firstTab) {
        loadSection(firstTab.dataset.file, firstTab.textContent);
    }

    // Navegação
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            loadSection(item.dataset.file, item.textContent);
        });
    });

    async function loadSection(fileKey, title) {
        currentFile = fileKey;
        titleEl.textContent = title;
        formContainer.innerHTML = '<div class="loading-spinner">Carregando dados...</div>';

        const storageKey = 'ciclismo_' + fileKey;
        const localData = localStorage.getItem(storageKey);

        try {
            if (localData) {
                currentData = JSON.parse(localData);
            } else {
                const response = await fetch(`./json/${fileKey}.json`);
                if (!response.ok) throw new Error('Falha ao carregar JSON original');
                currentData = await response.json();
            }
            renderForm(currentData);
        } catch (error) {
            console.error(error);
            formContainer.innerHTML = `<p style="color: #ff5555;">Erro ao carregar dados: ${error.message}</p>`;
        }
    }

    // ==========================================================================
    // Renderização do Formulário Dinâmico e DataTables
    // ==========================================================================
    function renderForm(data) {
        formContainer.innerHTML = '';
        const rootDiv = document.createElement('div');
        buildFields(data, rootDiv, '');
        formContainer.appendChild(rootDiv);
    }

    function buildFields(obj, parentEl, path) {
        if (typeof obj !== 'object' || obj === null) return;

        if (Array.isArray(obj)) {
            const isObjectArray = obj.length === 0 || (typeof obj[0] === 'object' && obj[0] !== null);
            
            if (isObjectArray) {
                renderTable(obj, parentEl, path);
            } else {
                // Array simples de strings/numeros (Ex: conquistas)
                const arrayContainer = document.createElement('div');
                arrayContainer.className = 'object-container array-container';
                const title = document.createElement('div');
                title.className = 'object-title';
                title.textContent = (path.split('.').pop() || 'Lista').toUpperCase().replace('_', ' ');
                arrayContainer.appendChild(title);
                
                obj.forEach((item, index) => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'array-item';
                    createInputField(itemDiv, `Item ${index + 1}`, item, `${path}[${index}]`, obj);
                    arrayContainer.appendChild(itemDiv);
                });
                parentEl.appendChild(arrayContainer);
            }
        } else {
            // Objects
            Object.keys(obj).forEach(key => {
                const val = obj[key];
                const currentPath = path ? `${path}.${key}` : key;

                if (typeof val === 'object' && val !== null) {
                    const objDiv = document.createElement('div');
                    objDiv.className = 'object-container';
                    const title = document.createElement('div');
                    title.className = 'object-title';
                    title.textContent = key.toUpperCase().replace(/_/g, ' ');
                    objDiv.appendChild(title);
                    
                    buildFields(val, objDiv, currentPath);
                    parentEl.appendChild(objDiv);
                } else {
                    // Primitive
                    createInputField(parentEl, key, val, currentPath, obj);
                }
            });
        }
    }

    function renderTable(array, parentEl, path) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'admin-table-container object-container';
        
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.marginBottom = '1rem';
        
        const title = document.createElement('div');
        title.className = 'object-title';
        title.style.border = 'none';
        title.style.margin = '0';
        title.textContent = (path.split('.').pop() || 'Lista').toUpperCase().replace('_', ' ');
        headerDiv.appendChild(title);

        const btnAdd = document.createElement('button');
        btnAdd.className = 'btn-primary';
        btnAdd.style.padding = '0.5rem 1rem';
        btnAdd.style.fontSize = '0.85rem';
        btnAdd.textContent = '+ Adicionar Novo';
        btnAdd.onclick = () => openModal(path, -1, array);
        headerDiv.appendChild(btnAdd);
        
        tableContainer.appendChild(headerDiv);

        if (array.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'Nenhum item cadastrado.';
            emptyMsg.style.color = 'var(--text-muted)';
            tableContainer.appendChild(emptyMsg);
            parentEl.appendChild(tableContainer);
            return;
        }

        // Descobrir chaves para as colunas (pegamos no máximo 3 propriedades primitivas)
        let keys = [];
        const firstItem = array[0];
        Object.keys(firstItem).forEach(k => {
            if (typeof firstItem[k] !== 'object' && keys.length < 3) {
                keys.push(k);
            }
        });

        const tableWrapper = document.createElement('div');
        tableWrapper.style.overflowX = 'auto';

        const table = document.createElement('table');
        table.className = 'admin-table';
        
        // Thead
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        keys.forEach(k => {
            const th = document.createElement('th');
            th.textContent = k;
            trHead.appendChild(th);
        });
        const thActions = document.createElement('th');
        thActions.textContent = 'Ações';
        thActions.style.width = '100px';
        thActions.style.textAlign = 'right';
        trHead.appendChild(thActions);
        thead.appendChild(trHead);
        table.appendChild(thead);

        // Tbody
        const tbody = document.createElement('tbody');
        array.forEach((item, index) => {
            const tr = document.createElement('tr');
            keys.forEach(k => {
                const td = document.createElement('td');
                td.textContent = item[k] !== undefined ? String(item[k]).substring(0, 50) : '';
                tr.appendChild(td);
            });
            
            const tdActions = document.createElement('td');
            tdActions.innerHTML = `
                <div class="table-actions" style="justify-content: flex-end;">
                    <button class="btn-icon edit" title="Editar">✏️</button>
                    <button class="btn-icon delete" title="Excluir">🗑️</button>
                </div>
            `;
            
            tdActions.querySelector('.edit').onclick = () => openModal(path, index, array);
            tdActions.querySelector('.delete').onclick = () => deleteItem(path, index, array);

            tr.appendChild(tdActions);
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        tableContainer.appendChild(tableWrapper);
        parentEl.appendChild(tableContainer);
    }

    function createInputField(parentEl, labelText, value, path, parentObj) {
        const group = document.createElement('div');
        group.className = 'form-group';

        if (labelText) {
            const label = document.createElement('label');
            label.textContent = labelText.replace(/_/g, ' ');
            label.style.textTransform = 'capitalize';
            group.appendChild(label);
        }

        let input;
        if (typeof value === 'boolean') {
            input = document.createElement('select');
            input.className = 'form-control';
            input.innerHTML = `<option value="true" ${value ? 'selected' : ''}>Verdadeiro (Sim)</option>
                               <option value="false" ${!value ? 'selected' : ''}>Falso (Não)</option>`;
        } else if (typeof value === 'string' && value.length > 80) {
            input = document.createElement('textarea');
            input.className = 'form-control';
            input.value = value;
        } else {
            input = document.createElement('input');
            input.type = typeof value === 'number' ? 'number' : 'text';
            input.className = 'form-control';
            input.value = value;
        }

        input.dataset.path = path;
        
        // Update model immediately on change
        input.addEventListener('change', (e) => {
            let finalValue = input.value;
            if (typeof value === 'boolean') finalValue = input.value === 'true';
            if (typeof value === 'number') finalValue = Number(input.value);
            
            // If inside modal, update the local editing context obj
            if (editingContext && path.startsWith(editingContext.arrayPath)) {
                // Path inside the modal is relative to editingContext.itemData but was passed as absolute
                const relativePath = path.substring(editingContext.arrayPath.length);
                // Actually it's easier to just use the ref passed (parentObj) since objects are by reference!
                const lastKey = path.split('.').pop().replace(/\]$/, '').split('[').pop();
                parentObj[lastKey] = finalValue;
            } else {
                updateDataByPath(currentData, path, finalValue);
            }
        });

        group.appendChild(input);
        parentEl.appendChild(group);
    }

    function updateDataByPath(obj, path, finalValue) {
        const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        const lastPart = parts[parts.length - 1];
        current[lastPart] = finalValue;
    }

    // ==========================================================================
    // Lógica do Modal (Editar/Adicionar Item em Array)
    // ==========================================================================
    function openModal(arrayPath, index, arrayRef) {
        let itemData;
        if (index === -1) {
            // Add new: Clone schema from first item if exists
            itemData = arrayRef.length > 0 ? createEmptyClone(arrayRef[0]) : {};
            modalTitle.textContent = 'Adicionar Novo Item';
        } else {
            // Edit existing (deep clone to not mutate until save)
            itemData = JSON.parse(JSON.stringify(arrayRef[index]));
            modalTitle.textContent = 'Editar Item';
        }

        editingContext = { arrayPath, index, arrayRef, itemData };

        modalBody.innerHTML = '';
        const rootDiv = document.createElement('div');
        // We pass the absolute path for array items to keep IDs consistent
        const basePath = index === -1 ? `${arrayPath}[NEW]` : `${arrayPath}[${index}]`;
        buildFields(itemData, rootDiv, basePath);
        modalBody.appendChild(rootDiv);

        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        editingContext = null;
    }

    function createEmptyClone(obj) {
        if (typeof obj !== 'object' || obj === null) return '';
        if (Array.isArray(obj)) return [];
        const clone = {};
        for (let key in obj) {
            if (typeof obj[key] === 'string') clone[key] = '';
            else if (typeof obj[key] === 'number') clone[key] = 0;
            else if (typeof obj[key] === 'boolean') clone[key] = false;
            else clone[key] = createEmptyClone(obj[key]);
        }
        return clone;
    }

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);

    modalSave.addEventListener('click', () => {
        if (!editingContext) return;
        
        if (editingContext.index === -1) {
            editingContext.arrayRef.push(editingContext.itemData);
        } else {
            editingContext.arrayRef[editingContext.index] = editingContext.itemData;
        }
        
        closeModal();
        renderForm(currentData); // Re-render tudo (Simples e eficaz)
        showToast('Item atualizado (Não esqueça de Salvar no Navegador)');
    });

    function deleteItem(arrayPath, index, arrayRef) {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            arrayRef.splice(index, 1);
            renderForm(currentData);
            showToast('Item excluído');
        }
    }

    // ==========================================================================
    // Ações Gerais
    // ==========================================================================
    btnSave.addEventListener('click', () => {
        if (!currentFile || !currentData) return;
        localStorage.setItem('ciclismo_' + currentFile, JSON.stringify(currentData));
        showToast('Salvo com sucesso!');
    });

    btnClear.addEventListener('click', () => {
        if(confirm('Tem certeza? Isso apagará todas as edições locais de todos os arquivos!')) {
            const keys = Object.keys(localStorage);
            keys.forEach(k => {
                if(k.startsWith('ciclismo_')) localStorage.removeItem(k);
            });
            alert('Cache limpo! Recarregando...');
            location.reload();
        }
    });

    btnExport.addEventListener('click', () => {
        const sections = ['campanha', 'contatos', 'sobre', 'equipe', 'agenda', 'titulos', 'patrocinadores', 'pacotes_patrocinio', 'master', 'hero'];
        sections.forEach(sec => {
            const data = localStorage.getItem('ciclismo_' + sec);
            if (data) {
                downloadJSON(data, `${sec}.json`);
            }
        });
        showToast('Downloads iniciados (Verifique seu navegador)');
    });

    function downloadJSON(jsonString, filename) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});


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
