/**
 * Testcase Generator Module (polygon-problems-generator)
 * JS-based test generation, manual test adding, live editing, and ZIP download.
 */

(function () {
  'use strict';

  let testsList = [];

  const defaultGeneratorCode = `function generateInputAndOutput() {
    const a = Math.floor(Math.random() * 100) + 1;
    const b = Math.floor(Math.random() * 100) + 1;
    const input = \`\${a} \${b}\`;
    const output = \`\${a + b}\`;
    return { input, output };
}

const tests = [];
const count = 10;
for (let i = 0; i < count; i++) {
    tests.push(generateInputAndOutput());
}
return tests;`;

  function initTestcaseGenerator() {
    const editor = document.getElementById('tgCodeEditor');
    const lineNumbers = document.getElementById('tgLineNumbers');
    if (editor && (!editor.value || !editor.value.trim())) {
      editor.value = defaultGeneratorCode;
    }
    updateLineNumbers();

    if (editor && lineNumbers && !editor.dataset.hasEvents) {
      editor.dataset.hasEvents = 'true';

      editor.addEventListener('input', updateLineNumbers);

      editor.addEventListener('scroll', function () {
        lineNumbers.scrollTop = editor.scrollTop;
      });

      editor.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = this.selectionStart;
          const end = this.selectionEnd;
          this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
          this.selectionStart = this.selectionEnd = start + 4;
          updateLineNumbers();
        }
      });
    }

    renderTestCards();
  }

  function updateLineNumbers() {
    const editor = document.getElementById('tgCodeEditor');
    const lineNumbers = document.getElementById('tgLineNumbers');
    if (!editor || !lineNumbers) return;

    const lines = editor.value.split('\n').length;
    let numsHtml = '';
    for (let i = 1; i <= lines; i++) {
      numsHtml += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = numsHtml;
  }

  function renderTestCards() {
    const container = document.getElementById('tgTestcardsContainer');
    const emptyState = document.getElementById('tgEmptyState');
    if (!container) return;

    if (testsList.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = testsList.map((t, idx) => {
      const order = idx + 1;
      const pad = String(order).padStart(4, '0');
      const inFilename = `${pad}.in`;
      const outFilename = `${pad}.out`;
      const inVal = t && t.input !== undefined ? t.input : '';
      const outVal = t && t.output !== undefined ? t.output : '';

      return `
        <div class="tg-test-card" data-index="${idx}" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; transition: all 0.2s ease;">
          <!-- Karta sarlavhasi: Chapda Test #N, o'ngda qizil axlat qutisi [🗑] tugmasi -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.25rem; background: var(--bg-card-hover); border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #2563EB;"></span>
              <strong style="font-size: 1rem; color: var(--text-main); font-weight: 700;">Test #${order}</strong>
            </div>
            <button type="button" onclick="removeTestcaseCard(${idx})" style="background: transparent; color: #DC2626; border: 1px solid transparent; border-radius: 6px; padding: 0.35rem 0.6rem; cursor: pointer; font-size: 1rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s;" title="Test #${order} ni o‘chirish" onmouseover="this.style.background='rgba(239,68,68,0.15)'; this.style.borderColor='rgba(239,68,68,0.35)';" onmouseout="this.style.background='transparent'; this.style.borderColor='transparent';">
              🗑️
            </button>
          </div>

          <!-- Karta tanasi (2 ta teng ustun: Kirish 000N.in va Chiqish 000N.out) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; padding: 1.25rem;">
            <!-- Chap ustun: Kirish -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Kirish <code style="background: #EFF6FF; color: #1D4ED8; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.82rem; font-family: monospace;">${inFilename}</code></label>
              </div>
              <textarea class="tg-input-textarea" oninput="updateTestValue(${idx}, 'input', this.value)" style="width: 100%; min-height: 90px; padding: 0.65rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 6px; font-family: 'Fira Code', Consolas, monospace; font-size: 0.88rem; line-height: 1.45; resize: vertical; box-sizing: border-box; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border);" placeholder="Kiruvchi ma'lumotlar...">${escapeHtml(inVal)}</textarea>
            </div>

            <!-- O'ng ustun: Chiqish -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Chiqish <code style="background: #ECFDF5; color: #047857; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.82rem; font-family: monospace;">${outFilename}</code></label>
              </div>
              <textarea class="tg-output-textarea" oninput="updateTestValue(${idx}, 'output', this.value)" style="width: 100%; min-height: 90px; padding: 0.65rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 6px; font-family: 'Fira Code', Consolas, monospace; font-size: 0.88rem; line-height: 1.45; resize: vertical; box-sizing: border-box; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border);" placeholder="Chiquvchi ma'lumotlar...">${escapeHtml(outVal)}</textarea>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function syncLiveTestValues() {
    const cards = document.querySelectorAll('.tg-test-card');
    cards.forEach((card, idx) => {
      const inEl = card.querySelector('.tg-input-textarea');
      const outEl = card.querySelector('.tg-output-textarea');
      if (testsList[idx]) {
        if (inEl) testsList[idx].input = inEl.value;
        if (outEl) testsList[idx].output = outEl.value;
      }
    });
  }

  window.updateTestValue = function (idx, type, val) {
    if (testsList[idx]) {
      testsList[idx][type] = val;
    }
  };

  window.runGeneratorCode = async function () {
    const editor = document.getElementById('tgCodeEditor');
    const runBtn = document.getElementById('tgBtnRun');
    if (!editor) return;

    const code = editor.value;
    if (!code || !code.trim()) {
      alert('Iltimos, generator kodini kiriting!');
      return;
    }

    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = '⏳ Generatsiya qilinmoqda...';
    }

    try {
      const res = await fetch('/api/admin/generator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generatsiya jarayonida xatolik yuz berdi');
      }

      testsList = data.tests || [];
      renderTestCards();

      // Show temporary notification
      showToast(`${testsList.length} ta test muvaffaqiyatli generatsiya qilindi!`, 'success');
    } catch (err) {
      alert('Xatolik: ' + err.message);
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerHTML = '▶ Run';
      }
    }
  };

  window.clearAllTests = function () {
    if (testsList.length === 0) return;
    if (!confirm('Haqiqatan ham barcha testlarni tozalashni xohlaysizmi?')) return;
    testsList = [];
    renderTestCards();
    showToast('Barcha testlar tozalandi', 'info');
  };

  window.addNewTestcaseCard = function () {
    syncLiveTestValues();
    testsList.push({ input: '', output: '' });
    renderTestCards();

    // Scroll to the bottom of the list
    setTimeout(() => {
      const cards = document.querySelectorAll('.tg-test-card');
      if (cards.length > 0) {
        cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const lastInput = cards[cards.length - 1].querySelector('.tg-input-textarea');
        if (lastInput) lastInput.focus();
      }
    }, 50);
  };

  window.removeTestcaseCard = function (idx) {
    syncLiveTestValues();
    testsList.splice(idx, 1);
    renderTestCards();
  };

  window.downloadAllTestsZip = async function () {
    syncLiveTestValues();

    if (testsList.length === 0) {
      alert('Hech qanday test mavjud emas! Avval test generatsiya qiling yoki qo‘lda qo‘shing.');
      return;
    }

    const downloadBtn = document.getElementById('tgBtnDownload');
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '⏳ Yuklanmoqda...';
    }

    try {
      const res = await fetch('/api/admin/generator/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tests: testsList })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'ZIP arxivni shakllantirishda xatolik');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'testcases.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast('testcases.zip muvaffaqiyatli yuklab olindi!', 'success');
    } catch (err) {
      alert('Xatolik: ' + err.message);
    } finally {
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '📥 Yuklab olish';
      }
    }
  };

  function showToast(msg, type = 'info') {
    let toast = document.getElementById('tgToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tgToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 99999;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(10px);
      `;
      document.body.appendChild(toast);
    }

    if (type === 'success') {
      toast.style.background = '#059669';
      toast.style.color = '#ffffff';
    } else {
      toast.style.background = '#1E293B';
      toast.style.color = '#ffffff';
    }

    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2800);
  }

  // Expose to window
  window.initTestcaseGenerator = initTestcaseGenerator;
  window.updateLineNumbers = updateLineNumbers;

  // Auto-init on page load if container exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('sec-generator')) {
        initTestcaseGenerator();
      }
    });
  } else {
    if (document.getElementById('sec-generator')) {
      initTestcaseGenerator();
    }
  }
})();
