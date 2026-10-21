let photoData = null;
let selectedSectionId = null;

// Order sections appear in by default (before any manual reordering)
let sectionOrder = ['about', 'experience', 'projects', 'skills'];

// Per-section style overrides: { about: { font, size, color }, ... }
let sectionStyles = {};

const templates = [
  { name: 'Coral Diagonal' },
  { name: 'Minimal Mono' },
  { name: 'Ocean Blue' },
  { name: 'Forest Sidebar' },
];
let currentTemplate = 0;

// ---------- Dynamic entry management ----------
function addEntry(type) {
  const container = document.getElementById(type + 'List');
  const block = document.createElement('div');
  block.className = 'entry-block';

  if (type === 'experience') {
    block.innerHTML = `
      <button class="remove-btn" onclick="this.parentElement.remove(); renderResume();">✕</button>
      <label>Role / Title</label>
      <input type="text" class="exp-title" placeholder="e.g. Intern">
      <label>Organization</label>
      <input type="text" class="exp-org" placeholder="e.g. Company or Club name">
      <label>Dates</label>
      <input type="text" class="exp-dates" placeholder="e.g. Jun 2025 - Aug 2025">
      <label>Description</label>
      <textarea class="exp-desc" rows="2" placeholder="What did you do?"></textarea>
    `;
  } else if (type === 'projects') {
    block.innerHTML = `
      <button class="remove-btn" onclick="this.parentElement.remove(); renderResume();">✕</button>
      <label>Project Name</label>
      <input type="text" class="proj-name" placeholder="e.g. My Cool App">
      <label>Description</label>
      <textarea class="proj-desc" rows="2" placeholder="What did you build and how?"></textarea>
    `;
  }

  container.appendChild(block);
  attachLiveListeners(block);
  renderResume();
}

function attachLiveListeners(scope) {
  scope.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', renderResume);
  });
}

// ---------- Photo handling ----------
document.getElementById('photoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) { photoData = null; renderResume(); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    photoData = ev.target.result;
    renderResume();
  };
  reader.readAsDataURL(file);
});

// ---------- Live listeners on static fields ----------
['name', 'tagline', 'email', 'phone', 'school', 'bio', 'skills'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderResume);
});

// ---------- Background color ----------
document.getElementById('bgColorPicker').addEventListener('input', (e) => {
  document.getElementById('resumeBody').style.background = e.target.value;
});

// ---------- Template switching ----------
document.getElementById('prevTemplate').addEventListener('click', () => {
  currentTemplate = (currentTemplate - 1 + templates.length) % templates.length;
  applyTemplate();
});
document.getElementById('nextTemplate').addEventListener('click', () => {
  currentTemplate = (currentTemplate + 1) % templates.length;
  applyTemplate();
});
function applyTemplate() {
  document.getElementById('resume').setAttribute('data-template', currentTemplate);
  document.getElementById('templateName').textContent = templates[currentTemplate].name;
  // Data and manual section order/styles are kept on purpose — only the look changes.
}

// ---------- Collect data from the form ----------
function collectData() {
  const experience = Array.from(document.querySelectorAll('#experienceList .entry-block')).map(b => ({
    title: b.querySelector('.exp-title').value.trim(),
    org: b.querySelector('.exp-org').value.trim(),
    dates: b.querySelector('.exp-dates').value.trim(),
    desc: b.querySelector('.exp-desc').value.trim(),
  })).filter(e => e.title || e.org || e.desc);

  const projects = Array.from(document.querySelectorAll('#projectsList .entry-block')).map(b => ({
    name: b.querySelector('.proj-name').value.trim(),
    desc: b.querySelector('.proj-desc').value.trim(),
  })).filter(p => p.name || p.desc);

  return {
    name: document.getElementById('name').value.trim(),
    tagline: document.getElementById('tagline').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    school: document.getElementById('school').value.trim(),
    bio: document.getElementById('bio').value.trim(),
    skills: document.getElementById('skills').value.trim(),
    experience,
    projects,
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Build section HTML by id ----------
function buildSectionHtml(id, data) {
  if (id === 'about') {
    if (!data.bio) return null;
    return `<div class="r-section-title">About</div><div class="r-bio">${escapeHtml(data.bio)}</div>`;
  }
  if (id === 'experience') {
    if (!data.experience.length) return null;
    return `<div class="r-section-title">Experience</div>${data.experience.map(e => `
      <div class="r-entry">
        <div class="r-entry-title">${escapeHtml(e.title || e.org)}</div>
        <div class="r-entry-sub">${[e.org, e.dates].filter(Boolean).map(escapeHtml).join(' · ')}</div>
        ${e.desc ? `<div class="r-entry-desc">${escapeHtml(e.desc)}</div>` : ''}
      </div>`).join('')}`;
  }
  if (id === 'projects') {
    if (!data.projects.length) return null;
    return `<div class="r-section-title">Projects</div>${data.projects.map(p => `
      <div class="r-entry">
        <div class="r-entry-title">${escapeHtml(p.name)}</div>
        ${p.desc ? `<div class="r-entry-desc">${escapeHtml(p.desc)}</div>` : ''}
      </div>`).join('')}`;
  }
  if (id === 'skills') {
    if (!data.skills) return null;
    return `<div class="r-section-title">Skills</div><div class="r-skills">${escapeHtml(data.skills)}</div>`;
  }
  return null;
}

function sectionWeight(id, data) {
  if (id === 'experience') return data.experience.length * 2;
  if (id === 'projects') return data.projects.length * 2;
  if (id === 'about') return 1;
  if (id === 'skills') return 0.5;
  return 0;
}

// ---------- Main render ----------
function renderResume() {
  const data = collectData();

  document.getElementById('pName').textContent = data.name || 'Your Name';
  document.getElementById('pTagline').textContent = data.tagline || 'Your tagline appears here';

  const contactParts = [data.email, data.phone, data.school].filter(Boolean);
  document.getElementById('pContact').innerHTML = contactParts.map(c => `<span>${escapeHtml(c)}</span>`).join('');

  const photoEl = document.getElementById('pPhoto');
  if (photoData) {
    photoEl.src = photoData;
    photoEl.style.display = 'block';
  } else {
    photoEl.style.display = 'none';
  }

  // If the user hasn't manually reordered, sort by importance (weight).
  // Once they drag/reorder manually, sectionOrder is respected as-is.
  if (!window.__manualOrder) {
    sectionOrder.sort((a, b) => sectionWeight(b, data) - sectionWeight(a, data));
  }

  const bodyEl = document.getElementById('resumeBody');
  bodyEl.innerHTML = '';

  sectionOrder.forEach(id => {
    const html = buildSectionHtml(id, data);
    if (!html) return; // empty section, skip entirely

    const wrap = document.createElement('div');
    wrap.className = 'r-section';
    wrap.dataset.sectionId = id;
    wrap.innerHTML = html;

    const style = sectionStyles[id];
    if (style) {
      if (style.font) wrap.style.fontFamily = style.font;
      if (style.color) wrap.style.color = style.color;
      if (style.size) wrap.style.fontSize = (style.size / 100) + 'em';
    }

    if (id === selectedSectionId) wrap.classList.add('selected');

    wrap.addEventListener('click', (e) => {
      e.stopPropagation();
      selectSection(id);
    });

    bodyEl.appendChild(wrap);
  });

  checkFillPage();
}

// ---------- Section selection + style toolbar ----------
function selectSection(id) {
  selectedSectionId = id;
  document.querySelectorAll('.r-section').forEach(el => {
    el.classList.toggle('selected', el.dataset.sectionId === id);
  });

  const toolbar = document.getElementById('styleToolbar');
  toolbar.classList.remove('hidden');

  const style = sectionStyles[id] || {};
  document.getElementById('fontSelect').value = style.font || "'Segoe UI', Arial, sans-serif";
  document.getElementById('sizeSlider').value = style.size || 100;
  document.getElementById('colorPicker').value = style.color || '#222222';
}

document.addEventListener('click', () => {
  // Clicking outside a section deselects it
  selectedSectionId = null;
  document.querySelectorAll('.r-section').forEach(el => el.classList.remove('selected'));
  document.getElementById('styleToolbar').classList.add('hidden');
});

document.getElementById('fontSelect').addEventListener('click', e => e.stopPropagation());
document.getElementById('styleToolbar').addEventListener('click', e => e.stopPropagation());

document.getElementById('fontSelect').addEventListener('change', (e) => {
  if (!selectedSectionId) return;
  sectionStyles[selectedSectionId] = sectionStyles[selectedSectionId] || {};
  sectionStyles[selectedSectionId].font = e.target.value;
  renderResume();
  selectSection(selectedSectionId);
});

document.getElementById('sizeSlider').addEventListener('input', (e) => {
  if (!selectedSectionId) return;
  sectionStyles[selectedSectionId] = sectionStyles[selectedSectionId] || {};
  sectionStyles[selectedSectionId].size = e.target.value;
  renderResume();
  selectSection(selectedSectionId);
});

document.getElementById('colorPicker').addEventListener('input', (e) => {
  if (!selectedSectionId) return;
  sectionStyles[selectedSectionId] = sectionStyles[selectedSectionId] || {};
  sectionStyles[selectedSectionId].color = e.target.value;
  renderResume();
  selectSection(selectedSectionId);
});

document.getElementById('resetSectionBtn').addEventListener('click', () => {
  if (!selectedSectionId) return;
  delete sectionStyles[selectedSectionId];
  renderResume();
  selectSection(selectedSectionId);
});

document.getElementById('moveUpBtn').addEventListener('click', () => {
  moveSection(selectedSectionId, -1);
});
document.getElementById('moveDownBtn').addEventListener('click', () => {
  moveSection(selectedSectionId, 1);
});

function moveSection(id, dir) {
  if (!id) return;
  const idx = sectionOrder.indexOf(id);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= sectionOrder.length) return;
  [sectionOrder[idx], sectionOrder[newIdx]] = [sectionOrder[newIdx], sectionOrder[idx]];
  window.__manualOrder = true; // stop auto-sorting once the user takes control
  renderResume();
  selectSection(id);
}

// ---------- Fill-page detection ----------
function checkFillPage() {
  const scaleWrap = document.getElementById('resumeBodyScale');
  const resume = document.getElementById('resume');
  const header = document.getElementById('resumeHeader');
  const fillBox = document.getElementById('fillPageBox');
  const checkbox = document.getElementById('fillPageCheckbox');

  // Reset scale to measure true content height first
  scaleWrap.style.transform = 'scale(1)';
  scaleWrap.style.width = '100%';

  const totalHeightPx = resume.offsetHeight; // ~297mm rendered height
  const headerHeightPx = header.offsetHeight;
  const availableHeight = totalHeightPx - headerHeightPx;
  const contentHeight = document.getElementById('resumeBody').scrollHeight;

  const freeSpace = availableHeight - contentHeight;
  const freeRatio = freeSpace / availableHeight;

  if (freeRatio > 0.18 && contentHeight > 50) {
    fillBox.classList.remove('hidden');
  } else {
    fillBox.classList.add('hidden');
    checkbox.checked = false;
    scaleWrap.style.transform = 'scale(1)';
    scaleWrap.style.width = '100%';
    return;
  }

  if (checkbox.checked) {
    let ratio = availableHeight / contentHeight;
    ratio = Math.min(ratio, 1.5); // don't blow it up too much, keep it looking normal
    scaleWrap.style.transform = `scale(${ratio})`;
    scaleWrap.style.width = (100 / ratio) + '%';
  }
}

document.getElementById('fillPageCheckbox').addEventListener('change', checkFillPage);

// ---------- PDF export ----------
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const btn = document.getElementById('downloadBtn');
  btn.textContent = 'Generating...';
  btn.disabled = true;

  const resumeEl = document.getElementById('resume');

  const canvas = await html2canvas(resumeEl, {
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const fileName = (document.getElementById('name').value.trim() || 'my') + '_CV.pdf';
  pdf.save(fileName.replace(/\s+/g, '_'));

  btn.textContent = '⬇ Download as PDF';
  btn.disabled = false;
});

// Initial render
renderResume();
