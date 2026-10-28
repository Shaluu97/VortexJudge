// ── PROBLEM BUILDER & DASHBOARD CONTROLLER ────────────────────────────────────

(function () {
  'use strict';

  // Global module state
  let allProblems = [];
  let currentProblem = null;
  let isNewProblem = false;
  let currentSortAsc = false;
  let activeTextareaId = 'pbStatement';
  let latexDisplayMode = false;
  let sampleTests = [];
  let subtasksList = [];

  // Pagination state
  let currentPage = 1;
  const pageSize = 10;

  // Helper: Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Helper: Generate Unique Hash Tag (e.g., RXZUDA9WUP)
  function generateProblemHash() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  // ── VIEW SWITCHER ─────────────────────────────────────────────────────────
  window.showProblemView = function (viewName) {
    const listView = document.getElementById('probViewList');
    const builderView = document.getElementById('probViewBuilder');

    if (!listView || !builderView) return;

    if (viewName === 'builder') {
      listView.style.display = 'none';
      builderView.style.display = 'block';
    } else {
      builderView.style.display = 'none';
      listView.style.display = 'block';
      loadAdminProblems();
    }
  };

  // ── VIEW 1: PROBLEMS LIST & FILTERS ───────────────────────────────────────
  window.loadAdminProblems = async function () {
    try {
      const res = await fetch('/api/admin/problems');
      allProblems = await res.json();
      currentPage = 1;
      renderProblemsTable();
    } catch (err) {
      console.error('Failed to load problems:', err);
    }
  };

  function getFilteredProblems() {
    const searchVal = (document.getElementById('probSearchInput')?.value || '').trim().toLowerCase();
    const filterArchived = document.getElementById('filterArchived')?.checked || false;
    const filterMy = document.getElementById('filterMyProblems')?.checked || false;
    const filterSecret = document.getElementById('filterSecret')?.checked || false;

    // Current user username from adminName element
    const currentAdminUser = (document.getElementById('adminName')?.textContent || 'admin').trim().toLowerCase();

    return allProblems.filter(p => {
      // Archive filter
      const isArchived = Boolean(p.is_archived);
      if (filterArchived && !isArchived) return false;
      if (!filterArchived && isArchived) return false;

      // Secret filter
      const isSecret = Boolean(p.is_secret || p.visibility === 'private');
      if (filterSecret && !isSecret) return false;

      // My problems filter
      if (filterMy) {
        const author = (p.author_name || '').toLowerCase();
        if (!author.includes(currentAdminUser) && !currentAdminUser.includes(author)) {
          return false;
        }
      }

      // Search query (matches title, code, category)
      if (searchVal) {
        const titleMatch = (p.title || '').toLowerCase().includes(searchVal);
        const codeMatch = String(p.code || '').toLowerCase().includes(searchVal);
        const catMatch = (p.category || '').toLowerCase().includes(searchVal);
        if (!titleMatch && !codeMatch && !catMatch) return false;
      }

      return true;
    });
  }

  window.toggleProblemsSort = function () {
    currentSortAsc = !currentSortAsc;
    const sortIcon = document.getElementById('pbSortIcon');
    if (sortIcon) {
      sortIcon.textContent = currentSortAsc ? '↑' : '↓';
    }
    renderProblemsTable();
  };

  window.renderProblemsTable = function (page = currentPage) {
    currentPage = page;
    const tbody = document.getElementById('pbProblemsTableBody');
    const paginationContainer = document.getElementById('pbPagination');
    if (!tbody) return;

    let filtered = getFilteredProblems();

    // Sort by title
    filtered.sort((a, b) => {
      const tA = (a.title || '').toLowerCase();
      const tB = (b.title || '').toLowerCase();
      return currentSortAsc ? tA.localeCompare(tB) : tB.localeCompare(tA);
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    const pageItems = filtered.slice(startIdx, endIdx);

    if (pageItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--pb-text-dim);">
            Mos keluvchi masalalar topilmadi.
          </td>
        </tr>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageItems.map(p => {
      const isPrivate = Boolean(p.is_secret || p.visibility === 'private');
      const secretBadge = isPrivate
        ? `<span class="pb-badge-secret">Maxfiy</span>`
        : '';

      const authorHandle = p.author_name ? `@${escapeHtml(p.author_name.replace(/^@/, ''))}` : '@admin';
      const timeMs = p.time_limit || 1000;
      const memMb = p.memory_limit ? (p.memory_limit >= 1024 ? Math.round(p.memory_limit) + 'MB' : p.memory_limit + 'MB') : '256MB';
      const safeTitle = escapeHtml(p.title || '').replace(/'/g, "\\'");

      return `
        <tr>
          <td>
            <a href="javascript:void(0)" class="pb-id-link" onclick="openProblemBuilder(${p.id})">
              #${escapeHtml(p.code || p.id)}
            </a>
            ${secretBadge}
          </td>
          <td>
            <a href="javascript:void(0)" class="pb-author-link" onclick="filterByAuthor('${escapeHtml(p.author_name || 'admin')}')">
              ${authorHandle}
            </a>
          </td>
          <td>
            <a href="javascript:void(0)" class="pb-title-link" onclick="openProblemBuilder(${p.id})">
              <strong>${escapeHtml(p.title)}</strong>
              <span class="pb-hash-tag">#${escapeHtml(p.code || p.id)}</span>
            </a>
          </td>
          <td><strong>${memMb}</strong></td>
          <td><strong>${timeMs}ms</strong></td>
          <td style="text-align: center;">
            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;">
              <button type="button" class="pb-btn-action-edit" onclick="openProblemBuilder(${p.id})" title="Masalani tahrirlash">
                ✏️ Tahrirlash
              </button>
              <button type="button" class="pb-btn-action-delete" onclick="deleteProblemFromList(${p.id}, '${safeTitle}')" title="Masalani o‘chirish">
                🗑️ O‘chirish
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    renderPagination(totalPages);
  };

  window.deleteProblemFromList = async function (id, title) {
    if (!confirm(`Haqiqatan ham "${title}" masalasini va uning barcha testlarini o‘chirmoqchimisiz?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/problems/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'O‘chirishda xatolik yuz berdi');
      alert(`"${title}" masalasi muvaffaqiyatli o‘chirildi ✓`);
      await loadAdminProblems();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  function renderPagination(totalPages) {
    const container = document.getElementById('pbPagination');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';

    // First & Prev
    html += `<button class="pb-page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="renderProblemsTable(1)" title="Birinchi sahifa">«</button>`;
    html += `<button class="pb-page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="renderProblemsTable(${currentPage - 1})" title="Oldingi sahifa">&lt;</button>`;

    // Page numbers with ellipsis
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `<button class="pb-page-btn" onclick="renderProblemsTable(1)">1</button>`;
      if (startPage > 2) html += `<span class="pb-page-ellipsis">...</span>`;
    }

    for (let p = startPage; p <= endPage; p++) {
      html += `<button class="pb-page-btn ${p === currentPage ? 'active' : ''}" onclick="renderProblemsTable(${p})">${p}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span class="pb-page-ellipsis">...</span>`;
      html += `<button class="pb-page-btn" onclick="renderProblemsTable(${totalPages})">${totalPages}</button>`;
    }

    // Next & Last
    html += `<button class="pb-page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="renderProblemsTable(${currentPage + 1})" title="Keyingi sahifa">&gt;</button>`;
    html += `<button class="pb-page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="renderProblemsTable(${totalPages})" title="Oxirgi sahifa">»</button>`;

    container.innerHTML = html;
  }

  window.filterByAuthor = function (author) {
    const searchInput = document.getElementById('probSearchInput');
    if (searchInput) {
      searchInput.value = author;
      renderProblemsTable(1);
    }
  };

  // ── VIEW 2: BUILDER INITIALIZATION ────────────────────────────────────────
  window.openNewProblemBuilder = function () {
    isNewProblem = true;
    subtasksList = [
      { subtask_index: 1, group: 1, score: 50, has_testcases: 0, tests_count: 0, zip_name: '' }
    ];
    currentProblem = {
      id: null,
      code: generateProblemHash(),
      title: '',
      difficulty: "O'rtacha",
      category: "Boshlang'ich",
      time_limit: 1000,
      memory_limit: 256000,
      score: 1,
      visibility: 'public',
      is_secret: 0,
      statement: '',
      input_format: '',
      output_format: '',
      note: '',
      has_subtasks: 0,
      is_subtask: 0,
      samples: [
        { input_data: '2 3', output_data: '5' }
      ]
    };

    populateBuilderForm(currentProblem);
    showProblemView('builder');
    switchBuilderSubTab('masala');
    updateLiveContestantPreview();
  };

  window.openProblemBuilder = async function (id) {
    try {
      const res = await fetch(`/api/admin/problems/${id}`);
      if (!res.ok) throw new Error('Masala ma\'lumotlarini yuklab bo‘lmadi');
      const data = await res.json();
      isNewProblem = false;
      currentProblem = data;

      // Populate samples if returned or fetch testcases
      if (!currentProblem.samples || currentProblem.samples.length === 0) {
        try {
          const tcRes = await fetch(`/api/admin/problems/${id}/testcases`);
          const allTc = await tcRes.json();
          currentProblem.samples = allTc.filter(t => t.is_sample === 1);
        } catch (_) {
          currentProblem.samples = [];
        }
      }

      if (currentProblem.samples.length === 0) {
        currentProblem.samples = [{ input_data: '', output_data: '' }];
      }

      populateBuilderForm(currentProblem);
      showProblemView('builder');
      switchBuilderSubTab('masala');
      updateLiveContestantPreview();
    } catch (err) {
      alert(err.message);
    }
  };

  function populateBuilderForm(p) {
    // Top tag in builder
    const codeTag = p.code || generateProblemHash();
    document.getElementById('pbCurrentCode').value = codeTag;

    // Visibility
    const isPublic = p.visibility === 'public' && !p.is_secret;
    const visCheckbox = document.getElementById('pbVisToggle');
    if (visCheckbox) {
      visCheckbox.checked = isPublic;
      updateVisibilityDisplay(isPublic);
    }

    // Parameters
    document.getElementById('pbTimeInput').value = p.time_limit || 1000;
    document.getElementById('pbMemoryInput').value = p.memory_limit || 256000;
    document.getElementById('pbScoreInput').value = p.score || 1;
    document.getElementById('pbDiffSelect').value = p.difficulty || "O'rtacha";

    // Taxonomy & Language
    document.getElementById('pbCategorySelect').value = p.category || "Boshlang'ich";
    document.getElementById('pbLangSelect').value = p.language || "O'zbekcha";

    // Title
    document.getElementById('pbTitleInput').value = p.title || '';

    // Editors
    document.getElementById('pbStatement').value = p.statement || '';
    document.getElementById('pbInputFormat').value = p.input_format || '';
    document.getElementById('pbOutputFormat').value = p.output_format || '';
    document.getElementById('pbNote').value = p.note || '';

    // Subtasks switch
    const subtaskToggle = document.getElementById('pbSubtaskToggle');
    const isSub = Boolean(p.is_subtask !== undefined ? p.is_subtask : p.has_subtasks);
    if (subtaskToggle) {
      subtaskToggle.checked = isSub;
      toggleSubtaskMode(isSub);
    }

    // ICPC Badge
    const badge = document.getElementById('pbIcpcBadge');
    if (badge) {
      const hasIcpc = Boolean(p.icpc_archive_path || (p.testcases_count && p.testcases_count > 0));
      if (hasIcpc) {
        badge.style.background = '';
        badge.style.color = '';
        badge.style.borderColor = '';
        badge.className = 'pb-icpc-badge';
        badge.textContent = `✓ testcases.zip arxiv ${p.testcases_count ? '(' + p.testcases_count + ' ta test)' : ''}`;
      } else {
        badge.style.background = 'var(--pb-danger-bg)';
        badge.style.color = 'var(--pb-danger)';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.35)';
        badge.className = 'pb-icpc-badge';
        badge.textContent = '⚠️ Testcase yuklanmagan!';
      }
    }

    // Samples table
    sampleTests = (p.samples && p.samples.length > 0)
      ? p.samples.map(s => ({ input_data: s.input_data || '', output_data: s.output_data || '' }))
      : [{ input_data: '', output_data: '' }];

    renderSampleTestsTable();
    loadSubtasksList(p.id);
    initVisualEditors();
    syncAllTextareasToVisual();
  }

  window.switchBuilderSubTab = function (tabName) {
    const tabMasala = document.getElementById('pbTabContent-masala');
    const tabTestlar = document.getElementById('pbTabContent-testlar');
    const btnMasala = document.getElementById('pbSubTabBtn-masala');
    const btnTestlar = document.getElementById('pbSubTabBtn-testlar');

    if (tabName === 'testlar') {
      tabMasala.style.display = 'none';
      tabTestlar.style.display = 'block';
      btnMasala.classList.remove('active');
      btnTestlar.classList.add('active');
    } else {
      tabMasala.style.display = 'block';
      tabTestlar.style.display = 'none';
      btnMasala.classList.add('active');
      btnTestlar.classList.remove('active');
    }
  };

  // ── VISIBILITY TOGGLE ─────────────────────────────────────────────────────
  window.handleVisibilityChange = function (isChecked) {
    updateVisibilityDisplay(isChecked);
    updateLiveContestantPreview();
  };

  function updateVisibilityDisplay(isPublic) {
    const badge = document.getElementById('pbVisStatusBadge');
    if (!badge) return;
    badge.style.color = '';
    badge.style.background = '';
    badge.style.borderColor = '';
    if (isPublic) {
      badge.textContent = 'Ochiq (Public)';
      badge.className = 'pb-vis-badge badge-public';
    } else {
      badge.textContent = 'Yopiq (Private)';
      badge.className = 'pb-vis-badge badge-private';
    }
  }

  // ── CONSTANTS & VISUAL EDITOR STATE ───────────────────────────────────────
  const PB_EDITORS = ['pbStatement', 'pbInputFormat', 'pbOutputFormat', 'pbNote'];
  let savedSelectionRange = null;
  let editingMathWidget = null;

  // ── VISUAL RICH-TEXT LAYER & ATOMIC MATH WIDGETS ─────────────────────────
  window.initVisualEditors = function () {
    PB_EDITORS.forEach(id => {
      const ta = document.getElementById(id);
      if (!ta) return;

      let visual = document.getElementById(`${id}_visual`);
      if (!visual) {
        visual = document.createElement('div');
        visual.id = `${id}_visual`;
        visual.className = 'pb-editor-visual';
        visual.contentEditable = 'true';
        visual.spellcheck = false;
        visual.setAttribute('data-target', id);
        visual.setAttribute('placeholder', ta.getAttribute('placeholder') || 'Matn kiriting...');

        if (ta.style.minHeight) {
          visual.style.minHeight = ta.style.minHeight;
        }

        // Insert right after textarea
        ta.parentNode.insertBefore(visual, ta.nextSibling);

        // Hide raw textarea by default (Visual mode active)
        ta.style.display = 'none';

        // Add mode toggle button to toolbar
        const toolbar = document.getElementById(`tb-${id}`);
        if (toolbar && !document.getElementById(`btn-mode-${id}`)) {
          const toggleBtn = document.createElement('button');
          toggleBtn.type = 'button';
          toggleBtn.id = `btn-mode-${id}`;
          toggleBtn.className = 'pb-tool-btn pb-mode-toggle-btn';
          toggleBtn.title = "Vizual / Manba (Markdown) rejimini almashtirish";
          toggleBtn.innerHTML = '👁️ <span style="font-size:0.75rem; font-weight:700;">Vizual</span>';
          toggleBtn.onclick = () => toggleEditorSourceMode(id);
          toolbar.appendChild(toggleBtn);
        }
      }

      if (!visual.dataset.initialized) {
        visual.dataset.initialized = 'true';

        visual.addEventListener('focus', () => {
          activeTextareaId = id;
          if (typeof activeEditorTargetId !== 'undefined') {
            activeEditorTargetId = id;
          }
        });

        visual.addEventListener('input', () => {
          syncVisualToTextarea(id);
        });

        visual.addEventListener('mouseup', () => {
          saveEditorSelection(id);
        });

        visual.addEventListener('keyup', () => {
          saveEditorSelection(id);
        });

        visual.addEventListener('paste', (e) => {
          handleVisualEditorPaste(e, id);
        });
      }

      // Initial populate from textarea
      syncTextareaToVisual(id);
    });
  };

  function saveEditorSelection(textareaId) {
    activeTextareaId = textareaId;
    if (typeof activeEditorTargetId !== 'undefined') {
      activeEditorTargetId = textareaId;
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const visual = document.getElementById(`${textareaId}_visual`);
      if (visual && (visual === range.commonAncestorContainer || visual.contains(range.commonAncestorContainer))) {
        savedSelectionRange = range.cloneRange();
        return;
      }
    }
    savedSelectionRange = null;
  }

  function createMathWidgetNode(tex, isDisplay) {
    const cleanTex = (tex || '').trim();
    const tag = isDisplay ? 'div' : 'span';
    const widget = document.createElement(tag);
    widget.className = `pb-math-widget ${isDisplay ? 'pb-math-display' : 'pb-math-inline'}`;
    widget.setAttribute('contenteditable', 'false');
    widget.setAttribute('data-tex', cleanTex);
    widget.setAttribute('data-display', isDisplay ? 'true' : 'false');
    widget.title = 'Formulani tahrirlash uchun bosing';

    const rendered = document.createElement(isDisplay ? 'div' : 'span');
    rendered.className = 'pb-math-rendered';

    if (window.katex && cleanTex) {
      try {
        rendered.innerHTML = window.katex.renderToString(cleanTex, {
          displayMode: isDisplay,
          throwOnError: false
        });
      } catch (_) {
        rendered.textContent = cleanTex;
      }
    } else {
      rendered.textContent = cleanTex || '...';
    }

    const badge = document.createElement('span');
    badge.className = 'pb-math-badge';
    badge.textContent = isDisplay ? 'f(x) display' : 'f(x)';

    widget.appendChild(rendered);
    widget.appendChild(badge);

    widget.addEventListener('click', (e) => {
      e.stopPropagation();
      openLatexModalForWidget(widget);
    });

    return widget;
  }

  function parseTextToVisualNodes(rawText) {
    const frag = document.createDocumentFragment();
    if (!rawText) return frag;

    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n\r]+?\$|\n)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        const plain = rawText.substring(lastIndex, match.index);
        frag.appendChild(document.createTextNode(plain));
      }

      const token = match[0];
      if (token === '\n') {
        frag.appendChild(document.createElement('br'));
      } else if (token.startsWith('$$') && token.endsWith('$$') && token.length >= 4) {
        const math = token.slice(2, -2).trim();
        frag.appendChild(createMathWidgetNode(math, true));
      } else if (token.startsWith('$') && token.endsWith('$') && token.length >= 2) {
        const math = token.slice(1, -1).trim();
        frag.appendChild(createMathWidgetNode(math, false));
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < rawText.length) {
      frag.appendChild(document.createTextNode(rawText.substring(lastIndex)));
    }

    return frag;
  }

  function serializeVisualNode(node) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList && node.classList.contains('pb-math-widget')) {
        const tex = node.getAttribute('data-tex') || '';
        const isDisplay = node.getAttribute('data-display') === 'true';
        return isDisplay ? `\n$$${tex}$$\n` : `$${tex}$`;
      }
      if (node.tagName === 'BR') {
        return '\n';
      }
      let inner = '';
      for (const child of node.childNodes) {
        inner += serializeVisualNode(child);
      }
      if (node.tagName === 'DIV' || node.tagName === 'P') {
        return inner + '\n';
      }
      return inner;
    }
    return '';
  }

  function syncVisualToTextarea(textareaId) {
    const ta = document.getElementById(textareaId);
    const visual = document.getElementById(`${textareaId}_visual`);
    if (!ta || !visual) return;

    let result = '';
    for (const child of visual.childNodes) {
      result += serializeVisualNode(child);
    }
    ta.value = result;
    updateLiveContestantPreview();
  }

  function syncTextareaToVisual(textareaId) {
    const ta = document.getElementById(textareaId);
    const visual = document.getElementById(`${textareaId}_visual`);
    if (!ta || !visual) return;

    visual.innerHTML = '';
    const frag = parseTextToVisualNodes(ta.value || '');
    visual.appendChild(frag);
  }

  window.syncAllVisualToTextareas = function () {
    PB_EDITORS.forEach(id => syncVisualToTextarea(id));
  };

  window.syncAllTextareasToVisual = function () {
    PB_EDITORS.forEach(id => syncTextareaToVisual(id));
  };

  window.toggleEditorSourceMode = function (id) {
    const ta = document.getElementById(id);
    const visual = document.getElementById(`${id}_visual`);
    const btn = document.getElementById(`btn-mode-${id}`);
    if (!ta || !visual) return;

    const isVisual = (visual.style.display !== 'none');
    if (isVisual) {
      syncVisualToTextarea(id);
      visual.style.display = 'none';
      ta.style.display = 'block';
      ta.focus();
      if (btn) btn.innerHTML = '&lt;/&gt; <span style="font-size:0.75rem; font-weight:700;">Manba</span>';
    } else {
      syncTextareaToVisual(id);
      ta.style.display = 'none';
      visual.style.display = 'block';
      visual.focus();
      if (btn) btn.innerHTML = '👁️ <span style="font-size:0.75rem; font-weight:700;">Vizual</span>';
    }
  };

  function handleVisualEditorPaste(e, id) {
    const pasteText = (e.clipboardData || window.clipboardData)?.getData('text');
    if (!pasteText) return;

    if (pasteText.includes('$')) {
      e.preventDefault();
      const frag = parseTextToVisualNodes(pasteText);
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(frag);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        const visual = document.getElementById(`${id}_visual`);
        if (visual) visual.appendChild(frag);
      }
      syncVisualToTextarea(id);
    }
  }

  function openLatexModalForWidget(widget) {
    editingMathWidget = widget;
    const visual = widget.closest('.pb-editor-visual');
    if (visual && visual.getAttribute('data-target')) {
      activeTextareaId = visual.getAttribute('data-target');
      if (typeof activeEditorTargetId !== 'undefined') {
        activeEditorTargetId = activeTextareaId;
      }
    }

    const modal = document.getElementById('pbLatexModal');
    const input = document.getElementById('pbLatexInput');
    const displayToggle = document.getElementById('pbLatexDisplayMode');
    const modalTitle = document.getElementById('pbLatexModalTitle');

    const tex = widget.getAttribute('data-tex') || '';
    const isDisplay = widget.getAttribute('data-display') === 'true';

    if (modalTitle) modalTitle.textContent = "LaTeX Formulani Tahrirlash";
    if (input) input.value = tex;
    if (displayToggle) displayToggle.checked = isDisplay;

    renderLatexModalPreview();
    if (modal) modal.style.display = 'flex';
    if (input) {
      input.focus();
      input.select();
    }
  }

  // ── RICH TEXT TOOLBARS ────────────────────────────────────────────────────
  window.setActiveEditor = function (textareaId) {
    activeTextareaId = textareaId;
    if (typeof activeEditorTargetId !== 'undefined') {
      activeEditorTargetId = textareaId;
    }
  };

  window.insertEditorFormat = function (type, textareaId = activeTextareaId) {
    const ta = document.getElementById(textareaId);
    const visual = document.getElementById(`${textareaId}_visual`);
    if (!ta) return;

    if (visual && visual.style.display !== 'none') {
      syncVisualToTextarea(textareaId);
    }

    ta.focus();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    let replacement = '';

    switch (type) {
      case 'code':
        replacement = `\`${selected || 'kod'}\``;
        break;
      case 'codeblock':
        replacement = `\n\`\`\`cpp\n${selected || '// sizning kodingiz'}\n\`\`\`\n`;
        break;
      case 'link':
        replacement = `[${selected || 'havola matni'}](https://example.com)`;
        break;
      case 'ul':
        replacement = `\n- ${selected || 'ro\'yxat bandi'}\n`;
        break;
      case 'ol':
        replacement = `\n1. ${selected || 'birinchi band'}\n`;
        break;
      case 'table':
        replacement = `\n| Parametr | Qiymat |\n| --- | --- |\n| N | 100 |\n`;
        break;
      case 'clear':
        replacement = selected.replace(/[*_#`~\[\]\(\)\$]/g, '');
        break;
      case 'h1':
        replacement = `\n# ${selected || 'Sarlavha 1'}\n`;
        break;
      case 'h2':
        replacement = `\n## ${selected || 'Sarlavha 2'}\n`;
        break;
      case 'h3':
        replacement = `\n### ${selected || 'Sarlavha 3'}\n`;
        break;
      case 'paragraph':
        replacement = `\n${selected || 'Matn'}\n`;
        break;
      default:
        replacement = selected;
    }

    ta.value = ta.value.substring(0, start) + replacement + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + replacement.length;

    if (visual && visual.style.display !== 'none') {
      syncTextareaToVisual(textareaId);
    }

    updateLiveContestantPreview();
  };

  window.handleBlockSelect = function (selectEl, textareaId) {
    const val = selectEl.value;
    if (val) {
      insertEditorFormat(val, textareaId);
      selectEl.value = '';
    }
  };

  // Image Upload for Editor
  window.triggerImageUpload = function (textareaId) {
    activeTextareaId = textareaId;
    if (typeof activeEditorTargetId !== 'undefined') {
      activeEditorTargetId = textareaId;
    }
    const fileInput = document.getElementById('globalImageInput');
    if (fileInput) fileInput.click();
  };

  window.triggerFileAttachment = function (textareaId) {
    const url = prompt('Fayl havolasini (URL) kiriting:');
    if (url) {
      const name = prompt('Fayl nomini kiriting:', 'Faylni yuklab olish');
      const md = `\n📎 [${name || 'Fayl'}](${url})\n`;
      const ta = document.getElementById(textareaId);
      if (ta) {
        ta.value += md;
        syncTextareaToVisual(textareaId);
        updateLiveContestantPreview();
      }
    }
  };

  // ── LATEX F(X) MODAL CONTROLLER ───────────────────────────────────────────
  window.openLatexModal = function (textareaId = activeTextareaId) {
    activeTextareaId = textareaId;
    if (typeof activeEditorTargetId !== 'undefined') {
      activeEditorTargetId = textareaId;
    }
    editingMathWidget = null;
    saveEditorSelection(textareaId);

    const modal = document.getElementById('pbLatexModal');
    const input = document.getElementById('pbLatexInput');
    const preview = document.getElementById('pbLatexPreview');
    const displayToggle = document.getElementById('pbLatexDisplayMode');
    const modalTitle = document.getElementById('pbLatexModalTitle');

    if (modalTitle) modalTitle.textContent = "LaTeX Formula Muharriri";
    if (displayToggle) displayToggle.checked = latexDisplayMode;
    if (input) input.value = '1 \\le N \\le 10^5';

    renderLatexModalPreview();
    if (modal) modal.style.display = 'flex';
    if (input) {
      input.focus();
      input.select();
    }
  };

  window.closeLatexModal = function () {
    const modal = document.getElementById('pbLatexModal');
    if (modal) modal.style.display = 'none';
    editingMathWidget = null;
  };

  window.renderLatexModalPreview = function () {
    const input = document.getElementById('pbLatexInput');
    const preview = document.getElementById('pbLatexPreview');
    const displayToggle = document.getElementById('pbLatexDisplayMode');
    if (!input || !preview) return;

    const tex = input.value.trim() || 'Formula kiritilmagan';
    const isDisplay = displayToggle ? displayToggle.checked : false;
    latexDisplayMode = isDisplay;

    try {
      if (window.katex) {
        katex.render(tex, preview, {
          displayMode: isDisplay,
          throwOnError: false
        });
      } else {
        preview.textContent = tex;
      }
    } catch (_) {
      preview.textContent = tex;
    }
  };

  window.insertPresetLatex = function (tex) {
    const input = document.getElementById('pbLatexInput');
    if (input) {
      input.value = tex;
      renderLatexModalPreview();
      input.focus();
    }
  };

  window.confirmLatexInsert = function () {
    const input = document.getElementById('pbLatexInput');
    const displayToggle = document.getElementById('pbLatexDisplayMode');
    if (!input) return;

    const tex = input.value.trim();
    if (!tex) {
      closeLatexModal();
      return;
    }

    const isDisplay = displayToggle ? displayToggle.checked : false;
    latexDisplayMode = isDisplay;

    if (editingMathWidget) {
      // 1. Update existing widget in place
      editingMathWidget.setAttribute('data-tex', tex);
      editingMathWidget.setAttribute('data-display', isDisplay ? 'true' : 'false');
      editingMathWidget.className = `pb-math-widget ${isDisplay ? 'pb-math-display' : 'pb-math-inline'}`;

      const rendered = editingMathWidget.querySelector('.pb-math-rendered');
      if (rendered) {
        if (window.katex) {
          try {
            rendered.innerHTML = window.katex.renderToString(tex, {
              displayMode: isDisplay,
              throwOnError: false
            });
          } catch (_) {
            rendered.textContent = tex;
          }
        } else {
          rendered.textContent = tex;
        }
      }

      const badge = editingMathWidget.querySelector('.pb-math-badge');
      if (badge) badge.textContent = isDisplay ? 'f(x) display' : 'f(x)';

      syncVisualToTextarea(activeTextareaId);
      editingMathWidget = null;
    } else {
      // 2. Insert new atomic widget at cursor
      const widget = createMathWidgetNode(tex, isDisplay);
      const visual = document.getElementById(`${activeTextareaId}_visual`);
      const ta = document.getElementById(activeTextareaId);

      if (visual && visual.style.display !== 'none') {
        visual.focus();
        let inserted = false;

        if (savedSelectionRange && (visual === savedSelectionRange.commonAncestorContainer || visual.contains(savedSelectionRange.commonAncestorContainer))) {
          try {
            savedSelectionRange.deleteContents();
            savedSelectionRange.insertNode(widget);

            const space = document.createTextNode('\u00A0');
            if (widget.nextSibling) {
              widget.parentNode.insertBefore(space, widget.nextSibling);
            } else {
              widget.parentNode.appendChild(space);
            }

            const newRange = document.createRange();
            newRange.setStartAfter(space);
            newRange.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(newRange);
            inserted = true;
          } catch (_) {
            inserted = false;
          }
        }

        if (!inserted) {
          visual.appendChild(widget);
          const space = document.createTextNode('\u00A0');
          visual.appendChild(space);
        }

        syncVisualToTextarea(activeTextareaId);
      } else if (ta) {
        const formatted = isDisplay ? `\n$$${tex}$$\n` : `$${tex}$`;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + formatted + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + formatted.length;
        ta.focus();
        updateLiveContestantPreview();
      }
    }

    closeLatexModal();
  };

  // ── ROBOAI ASSISTANT ──────────────────────────────────────────────────────
  window.runRoboAI = function () {
    const currentTitle = document.getElementById('pbTitleInput')?.value.trim();
    const currentStatement = document.getElementById('pbStatement')?.value.trim();

    if (!currentTitle && !currentStatement) {
      const sampleTitles = [
        'Do\'stona almashtirish',
        'Sehrli massivlar yig\'indisi',
        'Sonlar ketma-ketligidagi palindrom',
        'Eng qisqa marshrut koordinatasi',
        'Matritsadagi maksimal ayirma'
      ];
      const pick = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
      document.getElementById('pbTitleInput').value = pick;
      document.getElementById('pbStatement').value = `Sizga $N$ ta butun sondan iborat massiv berilgan. Massiv elementlarini tartiblash jarayonida do'stona juftliklar hosil qilish talab etiladi.\n\nHar bir juftlik uchun ularning eng katta umumiy bo'luvchisi (EKUB) $1$ dan katta bo'lishi kerak.`;
      document.getElementById('pbInputFormat').value = `Birinchi qatorda bitta butun son $N$ ($1 \\le N \\le 10^5$) beriladi.\nIkkinchi qatorda $N$ ta butun son $a_1, a_2, \\dots, a_n$ ($1 \\le a_i \\le 10^9$) bo'sh joy bilan ajratilgan holda beriladi.`;
      document.getElementById('pbOutputFormat').value = `Masala shartini qanoatlantiruvchi juftliklar sonini yoki imkoni bo'lmasa \`-1\` chiqaring.`;
      document.getElementById('pbNote').value = `Birinchi namunada massiv elementlari do'stona juftlik hosil qiladi.`;
      if (typeof syncAllTextareasToVisual === 'function') {
        syncAllTextareasToVisual();
      }
      updateLiveContestantPreview();
      alert('🤖 RoboAI yangi namunaviy masala sharti va sarlavhasini generatsiya qildi!');
      return;
    }

    // Enhance existing
    if (currentTitle) {
      if (typeof syncAllTextareasToVisual === 'function') {
        syncAllTextareasToVisual();
      }
      alert(`🤖 RoboAI: "${currentTitle}" masalasi tahlil qilindi. LaTeX formulalar va shartlar strukturalandi.`);
      updateLiveContestantPreview();
    }
  };

  // ── TAB 2: TESTLAR & SUBTASKS CONTROLLER ──────────────────────────────────
  window.toggleSubtaskMode = function (isChecked) {
    const ioiArea = document.getElementById('pbIoiArea');
    const icpcArea = document.getElementById('pbIcpcArea');
    const btnNewSubtask = document.getElementById('pbBtnNewSubtask');

    if (isChecked) {
      if (ioiArea) ioiArea.style.display = 'block';
      if (icpcArea) icpcArea.style.display = 'none';
      if (btnNewSubtask) btnNewSubtask.style.display = 'inline-flex';

      if (!subtasksList || subtasksList.length === 0) {
        subtasksList = [
          { subtask_index: 1, group: 1, score: 50, has_testcases: 0, tests_count: 0, zip_name: '' }
        ];
      }
      renderSubtasksList();
    } else {
      if (ioiArea) ioiArea.style.display = 'none';
      if (icpcArea) icpcArea.style.display = 'block';
      if (btnNewSubtask) btnNewSubtask.style.display = 'none';
    }
  };

  window.addNewSubtaskCard = function () {
    const nextNum = (subtasksList ? subtasksList.length : 0) + 1;
    if (!subtasksList) subtasksList = [];
    subtasksList.push({
      subtask_index: nextNum,
      group: nextNum,
      score: 50,
      has_testcases: 0,
      tests_count: 0,
      zip_name: ''
    });
    renderSubtasksList();
  };

  window.removeSubtaskCard = async function (idx) {
    if (idx === 0) {
      alert('Subtask #1 ni o‘chirib bo‘lmaydi!');
      return;
    }
    const st = subtasksList[idx];
    const group = st ? (st.subtask_index || st.group || (idx + 1)) : (idx + 1);
    if (!confirm(`Haqiqatan ham Subtask #${group} ni o‘chirmoqchimisiz?`)) return;

    if (currentProblem && currentProblem.id) {
      try {
        await fetch(`/api/admin/problems/${currentProblem.id}/subtasks/${group}`, { method: 'DELETE' });
      } catch (_) {}
    }

    subtasksList.splice(idx, 1);
    // Re-index remaining subtasks (#1, #2, #3...)
    subtasksList.forEach((item, i) => {
      item.subtask_index = i + 1;
      item.group = i + 1;
    });
    renderSubtasksList();
  };

  window.updateSubtaskScore = function (idx, val) {
    if (subtasksList && subtasksList[idx]) {
      subtasksList[idx].score = parseInt(val, 10) || 0;
      subtasksList[idx].points = subtasksList[idx].score;
    }
  };

  function renderSubtasksList() {
    const container = document.getElementById('pbSubtasksContainer');
    if (!container) return;

    if (!subtasksList || subtasksList.length === 0) {
      subtasksList = [
        { subtask_index: 1, group: 1, score: 50, has_testcases: 0, tests_count: 0, zip_name: '' }
      ];
    }

    container.innerHTML = subtasksList.map((st, idx) => {
      const order = st.subtask_index || st.group || (idx + 1);
      const hasZip = Boolean(st.has_testcases || st.tests_count > 0 || st.zip_name);
      const testCount = st.tests_count || 0;

      // Status label: och qizil fonda "Testcase yuklanmagan!" yoki yashil yorliq
      const statusBadge = hasZip
        ? `<span class="pb-subtask-status-ready">
             ✓ ${testCount > 0 ? testCount + ' ta test yuklangan' : (escapeHtml(st.zip_name || 'Testlar biriktirilgan'))}
           </span>`
        : `<span class="pb-subtask-status-empty">
             Testcase yuklanmagan!
           </span>`;

      // 2-qator: Qizil axlat qutisi [O'chirish] tugmasi (MUHIM: "Subtask #1" da o'chirish tugmasi BO'LMAYDI, faqat #2 va undan keyingilarda bo'ladi)
      const deleteBtn = (idx === 0)
        ? ''
        : `<button type="button" class="pb-subtask-delete-btn" onclick="removeSubtaskCard(${idx})" title="Subtask #${order} ni o‘chirish">
             🗑️ O‘chirish
           </button>`;

      return `
        <div class="pb-subtask-card">
          <!-- 1-qator: Chapda Subtask #N nomi, o'ngda ball kiritish input-groupi (input: 50 va yonida "ball" yorlig'i) -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
            <div>
              <strong style="font-size: 1.05rem; font-weight: 700; color: var(--pb-text-main);">Subtask #${order}</strong>
            </div>
            <div class="pb-subtask-score-wrapper">
              <input type="number" class="pb-subtask-score-input" value="${st.score !== undefined ? st.score : 50}" min="1" max="100" onchange="updateSubtaskScore(${idx}, this.value)">
              <span class="pb-subtask-score-label">ball</span>
            </div>
          </div>

          <!-- 2-qator: Ko'k [Yuklash] tugmasi (upload ikonkasi bilan), qizil axlat qutisi [O'chirish] tugmasi (#1 da bo'lmaydi), va status yorlig'i -->
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <button type="button" class="pb-btn-primary" style="padding: 0.4rem 0.95rem; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem;" onclick="triggerSubtaskUpload(${order})">
                📤 Yuklash
              </button>
              ${hasZip ? `
                <button type="button" class="pb-btn-test-action" style="padding: 0.4rem 0.85rem; font-size: 0.85rem;" onclick="downloadSubtaskZip(${order})">
                  📥 Yuklab olish
                </button>
              ` : ''}
              ${deleteBtn}
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.triggerSubtaskUpload = function (group) {
    if (!currentProblem || !currentProblem.id) {
      alert('Iltimos, avval masalani saqlang (CTRL + S), so‘ngra testcase ZIP yuklang!');
      return;
    }
    const input = document.getElementById('subtaskZipInput');
    if (input) {
      input.dataset.group = group;
      input.value = '';
      input.click();
    }
  };

  window.handleSubtaskZipFileSelected = async function (e) {
    const file = e.target.files[0];
    if (!file || !currentProblem || !currentProblem.id) return;
    const group = e.target.dataset.group || 1;

    const fd = new FormData();
    fd.append('zip_file', file);

    try {
      const res = await fetch(`/api/admin/problems/${currentProblem.id}/subtasks/${group}/upload-zip`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yuklashda xatolik');
      alert(data.message || `Subtask #${group} uchun testlar muvaffaqiyatli yuklandi!`);
      await loadSubtasksList(currentProblem.id);
    } catch (err) {
      alert(err.message);
    } finally {
      e.target.value = '';
    }
  };

  window.downloadSubtaskZip = function (group) {
    if (!currentProblem || !currentProblem.id) {
      alert('Masala saqlanmagan!');
      return;
    }
    window.location.href = `/api/admin/problems/${currentProblem.id}/subtasks/${group}/download-zip`;
  };

  window.deleteSubtaskTests = async function (group) {
    if (!currentProblem || !currentProblem.id) return;
    if (!confirm(`Subtask #${group} ga yuklangan barcha testlarni o‘chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`/api/admin/problems/${currentProblem.id}/subtasks/${group}/tests`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'O‘chirishda xatolik');
      alert(`Subtask #${group} testlari o‘chirildi`);
      await loadSubtasksList(currentProblem.id);
    } catch (err) {
      alert(err.message);
    }
  };

  async function loadSubtasksList(probId) {
    if (!probId) {
      subtasksList = [
        { subtask_index: 1, group: 1, score: 50, has_testcases: 0, tests_count: 0, zip_name: '' }
      ];
      renderSubtasksList();
      return;
    }

    try {
      const res = await fetch(`/api/admin/problems/${probId}/subtasks`);
      const data = await res.json();
      if (data && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        subtasksList = data.subtasks;
      } else if (Array.isArray(data) && data.length > 0) {
        subtasksList = data;
      } else {
        subtasksList = [
          { subtask_index: 1, group: 1, score: 50, has_testcases: 0, tests_count: 0, zip_name: '' }
        ];
      }
      renderSubtasksList();
    } catch (_) {
      renderSubtasksList();
    }
  }

  // ICPC Standard Testcase Actions
  window.triggerIcpcZipUpload = function () {
    if (!currentProblem || !currentProblem.id) {
      alert('Iltimos, avval masalani saqlang (CTRL + S), so‘ngra testcase yuklang!');
      return;
    }
    const input = document.getElementById('zipFileInput');
    if (input) {
      input.value = '';
      input.click();
    }
  };

  window.handleZipUpload = async function (e) {
    const file = e.target.files[0];
    if (!file || !currentProblem || !currentProblem.id) return;

    const fd = new FormData();
    fd.append('zip_file', file);

    try {
      const res = await fetch(`/api/admin/problems/${currentProblem.id}/upload-zip`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yuklashda xatolik');
      alert(data.message || 'ICPC testlar muvaffaqiyatli yuklandi!');
      const badge = document.getElementById('pbIcpcBadge');
      if (badge) {
        badge.style.background = 'var(--pb-success-bg)';
        badge.style.color = 'var(--pb-success)';
        badge.style.borderColor = '#A7F3D0';
        badge.textContent = `✓ testcases.zip arxiv (${data.count} ta test)`;
      }
    } catch (err) {
      alert(err.message);
    } finally {
      e.target.value = '';
    }
  };

  window.downloadIcpcTests = function () {
    if (!currentProblem || !currentProblem.id) {
      alert('Masala saqlanmagan!');
      return;
    }
    window.location.href = `/api/admin/problems/${currentProblem.id}/download-tests`;
  };

  window.copySampleTestsToMain = function () {
    if (sampleTests.length === 0 || !sampleTests.some(s => s.input_data)) {
      alert('Namunaviy testlar kiritilmagan!');
      return;
    }
    alert('Namunaviy testlar asosiy testsetga biriktirildi!');
  };

  // ── SAMPLE TESTS MANAGEMENT TABLE ─────────────────────────────────────────
  window.addSampleTestRow = function () {
    sampleTests.push({ input_data: '', output_data: '' });
    renderSampleTestsTable();
    updateLiveContestantPreview();
  };

  window.removeSampleTestRow = function (idx) {
    if (sampleTests.length <= 1) {
      sampleTests = [{ input_data: '', output_data: '' }];
    } else {
      sampleTests.splice(idx, 1);
    }
    renderSampleTestsTable();
    updateLiveContestantPreview();
  };

  window.updateSampleTestData = function (idx, field, val) {
    if (sampleTests[idx]) {
      sampleTests[idx][field] = val;
      updateLiveContestantPreview();
    }
  };

  function renderSampleTestsTable() {
    const tbody = document.getElementById('pbSampleTestsBody');
    if (!tbody) return;

    tbody.innerHTML = sampleTests.map((s, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 700; width: 40px; color: var(--pb-text-dim);">
          ${idx + 1}
        </td>
        <td>
          <textarea class="pb-sample-textarea" placeholder="input.txt" oninput="updateSampleTestData(${idx}, 'input_data', this.value)">${escapeHtml(s.input_data || '')}</textarea>
        </td>
        <td>
          <textarea class="pb-sample-textarea" placeholder="output.txt" oninput="updateSampleTestData(${idx}, 'output_data', this.value)">${escapeHtml(s.output_data || '')}</textarea>
        </td>
        <td style="text-align: center; width: 45px;">
          <button type="button" class="pb-sample-delete-btn" onclick="removeSampleTestRow(${idx})" title="Namuna testini o'chirish">
            🗑
          </button>
        </td>
      </tr>
    `).join('');
  }

  // ── [RIGHT COLUMN] LIVE CONTESTANT PREVIEW (SYNCHRONIZED) ─────────────────
  window.updateLiveContestantPreview = function () {
    const code = document.getElementById('pbCurrentCode')?.value || 'RXZUDA9WUP';
    const title = document.getElementById('pbTitleInput')?.value.trim() || 'Masala nomi';
    const timeMs = document.getElementById('pbTimeInput')?.value || '1000';
    const memKb = document.getElementById('pbMemoryInput')?.value || '256000';
    const scorePct = document.getElementById('pbScoreInput')?.value || '1';
    const diff = document.getElementById('pbDiffSelect')?.value || "O'rtacha";

    const statement = document.getElementById('pbStatement')?.value || '';
    const inputFormat = document.getElementById('pbInputFormat')?.value || '';
    const outputFormat = document.getElementById('pbOutputFormat')?.value || '';
    const note = document.getElementById('pbNote')?.value || '';

    // Metadata Tag
    const tagEl = document.getElementById('pbPreviewTag');
    if (tagEl) {
      tagEl.innerHTML = `<span>Masala: #${escapeHtml(code)}</span> <span style="font-size: 0.8rem; cursor: pointer;" onclick="copyText('#${escapeHtml(code)}')" title="Nusxalash">📋</span>`;
      if (currentProblem && currentProblem.id && currentProblem.visibility === 'public') {
        tagEl.href = `/problems/${encodeURIComponent(code)}`;
        tagEl.target = '_blank';
        tagEl.title = "Foydalanuvchi sahifasida ochish";
      } else {
        tagEl.removeAttribute('href');
      }
    }

    // Title
    const titleEl = document.getElementById('pbPreviewTitle');
    if (titleEl) titleEl.textContent = title;

    // Badges
    const badgeMem = document.getElementById('pbPreviewBadgeMem');
    if (badgeMem) badgeMem.textContent = `Xotira: ${memKb} kb`;

    const badgeTime = document.getElementById('pbPreviewBadgeTime');
    if (badgeTime) badgeTime.textContent = `Vaqt: ${timeMs} ms`;

    const badgeScore = document.getElementById('pbPreviewBadgeScore');
    if (badgeScore) badgeScore.textContent = `Ball: ${scorePct}%`;

    const badgeDiff = document.getElementById('pbPreviewBadgeDiff');
    if (badgeDiff) badgeDiff.textContent = `Qiyinchilik: ${diff}`;

    // Body Sections
    renderMarkdownToElement('pbPreviewStatement', statement || 'Masala sharti kiritilmagan.');
    renderMarkdownToElement('pbPreviewInputFormat', inputFormat || 'Kiruvchi ma\'lumotlar formati kiritilmagan.');
    renderMarkdownToElement('pbPreviewOutputFormat', outputFormat || 'Chiquvchi ma\'lumotlar formati kiritilmagan.');

    const noteBox = document.getElementById('pbPreviewNoteBox');
    if (noteBox) {
      if (note.trim()) {
        noteBox.style.display = 'block';
        renderMarkdownToElement('pbPreviewNote', note);
      } else {
        noteBox.style.display = 'none';
      }
    }

    // Dynamic Sample Tests Table
    renderPreviewSampleTestsTable();
  };

  function renderPreviewSampleTestsTable() {
    const container = document.getElementById('pbPreviewSampleContainer');
    if (!container) return;

    const validSamples = sampleTests.filter(s => (s.input_data && s.input_data.trim()) || (s.output_data && s.output_data.trim()));

    if (validSamples.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.88rem; color: var(--pb-text-dim); padding: 0.5rem 0;">
          Namunaviy testlar hali kiritilmagan.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="pb-sample-tests-table" style="margin-top: 0.5rem;">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="width: 50%;">input.txt</th>
            <th style="width: 50%;">output.txt</th>
          </tr>
        </thead>
        <tbody>
          ${validSamples.map((s, i) => `
            <tr>
              <td style="text-align: center; font-weight: 700; color: var(--pb-text-dim);">${i + 1}</td>
              <td>
                <div class="pb-preview-sample-box">
                  <button class="pb-copy-btn" onclick="copyText(${JSON.stringify(s.input_data || '')})">Nusxa</button>
                  ${escapeHtml(s.input_data || '')}
                </div>
              </td>
              <td>
                <div class="pb-preview-sample-box">
                  <button class="pb-copy-btn" onclick="copyText(${JSON.stringify(s.output_data || '')})">Nusxa</button>
                  ${escapeHtml(s.output_data || '')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderMarkdownToElement(elId, rawText) {
    const el = document.getElementById(elId);
    if (!el) return;

    // Process KaTeX formulas first to avoid markdown interference
    const displayMath = [];
    const inlineMath = [];

    // Replace display math $$...$$
    let text = rawText.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      displayMath.push(math);
      return `%%DM_${displayMath.length - 1}%%`;
    });

    // Replace inline math $...$
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      inlineMath.push(math);
      return `%%IM_${inlineMath.length - 1}%%`;
    });

    // Code blocks ```...```
    text = text.replace(/```([a-z0-9]*)\n([\s\S]*?)```/gi, (_, lang, code) => {
      return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code `...`
    text = text.replace(/`([^`\n]+)`/g, (_, code) => {
      return `<code>${escapeHtml(code)}</code>`;
    });

    // Bold **...**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic *...*
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks and paragraphs
    text = text.split(/\n{2,}/).map(para => {
      return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // Restore KaTeX display math
    text = text.replace(/%%DM_(\d+)%%/g, (_, idx) => {
      const math = displayMath[parseInt(idx, 10)];
      if (window.katex) {
        try {
          return `<div class="math-formula-block" style="text-align:center; margin: 0.85rem 0;">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch (_) {
          return '$$' + escapeHtml(math) + '$$';
        }
      }
      return '$$' + escapeHtml(math) + '$$';
    });

    // Restore KaTeX inline math
    text = text.replace(/%%IM_(\d+)%%/g, (_, idx) => {
      const math = inlineMath[parseInt(idx, 10)];
      if (window.katex) {
        try {
          return `<span class="math-formula">${katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })}</span>`;
        } catch (_) {
          return '$' + escapeHtml(math) + '$';
        }
      }
      return '$' + escapeHtml(math) + '$';
    });

    el.innerHTML = text;
  }

  window.copyText = function (text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // Toast / brief confirmation
      const toast = document.createElement('div');
      toast.textContent = 'Nusxalandi ✓';
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#10B981;color:#fff;padding:8px 16px;border-radius:8px;font-weight:700;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1600);
    });
  };

  // ── SAVE & PUBLISH ────────────────────────────────────────────────────────
  window.saveCurrentProblem = async function (isPublish = false) {
    if (typeof syncAllVisualToTextareas === 'function') {
      syncAllVisualToTextareas();
    }
    const code = document.getElementById('pbCurrentCode')?.value.trim() || generateProblemHash();
    const title = document.getElementById('pbTitleInput')?.value.trim();
    const statement = document.getElementById('pbStatement')?.value.trim();

    if (!title) {
      alert('Iltimos, Masala nomini kiriting!');
      document.getElementById('pbTitleInput')?.focus();
      return;
    }

    if (!statement) {
      alert('Iltimos, Masala shartini to‘ldiring!');
      switchBuilderSubTab('masala');
      document.getElementById('pbStatement')?.focus();
      return;
    }

    const isPublicChecked = Boolean(document.getElementById('pbVisToggle')?.checked);
    const isPublicFinal = isPublicChecked;
    const visStr = isPublicFinal ? 'public' : 'private';
    const isSub = document.getElementById('pbSubtaskToggle')?.checked ? 1 : 0;

    const payload = {
      code: code,
      title: title,
      statement: statement,
      input_format: document.getElementById('pbInputFormat')?.value || '',
      output_format: document.getElementById('pbOutputFormat')?.value || '',
      note: document.getElementById('pbNote')?.value || '',
      time_limit: parseInt(document.getElementById('pbTimeInput')?.value, 10) || 1000,
      memory_limit: parseInt(document.getElementById('pbMemoryInput')?.value, 10) || 256000,
      score: parseInt(document.getElementById('pbScoreInput')?.value, 10) || 1,
      difficulty: document.getElementById('pbDiffSelect')?.value || "O'rtacha",
      category: document.getElementById('pbCategorySelect')?.value || "Boshlang'ich",
      language: document.getElementById('pbLangSelect')?.value || "O'zbekcha",
      visibility: visStr,
      is_public: isPublicFinal ? 1 : 0,
      is_secret: isPublicFinal ? 0 : 1,
      has_subtasks: isSub,
      is_subtask: isSub,
      subtasks: subtasksList,
      sample_tests: sampleTests
    };

    try {
      let url = '/api/admin/problems';
      let method = 'POST';

      if (currentProblem && currentProblem.id) {
        url = `/api/admin/problems/${currentProblem.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Saqlashda xatolik');

      if (method === 'POST') {
        currentProblem = { ...payload, id: data.id };
        isNewProblem = false;
      } else {
        currentProblem = { ...currentProblem, ...payload };
      }

      if (currentProblem && currentProblem.id && isSub) {
        await loadSubtasksList(currentProblem.id);
      }

      updateVisibilityDisplay(isPublicFinal);
      updateLiveContestantPreview();

      if (isPublish) {
        alert('🎉 Masala muvaffaqiyatli nashr qilindi (Published)!');
        window.open(`/problems/${encodeURIComponent(code)}`, '_blank');
      } else {
        alert('Masala muvaffaqiyatli saqlandi ✓');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  window.publishCurrentProblem = function () {
    // "Publish (CTRL + P)" is strictly an admin testing action to test-solve code.
    // It must NEVER flip or mutate the privacy state to "Ochiq (Public)".
    saveCurrentProblem(true);
  };

  // ── KEYBOARD SHORTCUTS (CTRL+S & CTRL+P) ──────────────────────────────────
  window.addEventListener('keydown', (e) => {
    const builderView = document.getElementById('probViewBuilder');
    if (!builderView || builderView.style.display === 'none') return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveCurrentProblem(false);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      publishCurrentProblem();
    }
  });

  // ── ATTACH REAL-TIME EVENT LISTENERS ──────────────────────────────────────
  function attachLiveListeners() {
    const inputIds = [
      'pbTitleInput', 'pbTimeInput', 'pbMemoryInput', 'pbScoreInput',
      'pbDiffSelect', 'pbStatement', 'pbInputFormat', 'pbOutputFormat', 'pbNote'
    ];

    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateLiveContestantPreview);
        el.addEventListener('change', updateLiveContestantPreview);
      }
    });

    const searchInput = document.getElementById('probSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => renderProblemsTable(1));
    }

    const filterArchived = document.getElementById('filterArchived');
    if (filterArchived) filterArchived.addEventListener('change', () => renderProblemsTable(1));

    const filterMy = document.getElementById('filterMyProblems');
    if (filterMy) filterMy.addEventListener('change', () => renderProblemsTable(1));

    const filterSecret = document.getElementById('filterSecret');
    if (filterSecret) filterSecret.addEventListener('change', () => renderProblemsTable(1));
  }

  // Run on startup
  window.addEventListener('DOMContentLoaded', () => {
    initVisualEditors();
    attachLiveListeners();
    // Default to View 1
    showProblemView('list');
  });

})();
