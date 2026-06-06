/* ============================================================================
   KEEPKASE — TIMELINE.JS  (the interactive, editable build timeline)
   ----------------------------------------------------------------------------
   Mounts on any <div data-timeline-root ...>. Reads the published default from
   window.KEEPKASE_TIMELINE_SEED, lets the owner edit live (add / split / delete
   / reorder nodes, edit milestones, attach links any time), autosaves to
   localStorage, and exports / imports JSON for publishing.

   Data attributes on the root:
     data-storage-key   localStorage key            (default keepkase_timeline_v1)
     data-editable      "true" | "false"            (default true) — shows edit UI
   ----------------------------------------------------------------------------
   No dependencies. Vanilla. ~ self-contained.
   ========================================================================== */
(function () {
  'use strict';

  var KINDS = ['video', 'discord', 'alpha', 'waitlist', 'link'];
  var KIND_GLYPH = { video: '►', discord: 'D', alpha: '★', waitlist: '◷', link: '↗' };
  var STATUSES = [
    { v: 'done', l: 'Done' },
    { v: 'in-progress', l: 'In progress' },
    { v: 'upcoming', l: 'Upcoming' }
  ];
  var MILE_STATES = [
    { v: 'done', l: 'Done' },
    { v: 'active', l: 'In progress' },
    { v: 'pending', l: 'Pending' }
  ];

  /* ---- utilities -------------------------------------------------------- */
  function uid(p) { return (p || 'n') + '_' + Math.random().toString(36).slice(2, 9); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function sanitizeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '#';
    if (/^(https?:\/\/|\/|mailto:|#)/i.test(u)) return u;
    if (/^javascript:/i.test(u)) return '#';
    return 'https://' + u; // assume bare domain
  }
  function inferKind(url) {
    var u = String(url || '').toLowerCase();
    if (/youtu\.?be|vimeo|\.mp4|\/watch/.test(u)) return 'video';
    if (/discord/.test(u)) return 'discord';
    return 'link';
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---- the controller --------------------------------------------------- */
  function Timeline(root) {
    this.root = root;
    this.key = root.getAttribute('data-storage-key') || 'keepkase_timeline_v1';
    this.editable = root.getAttribute('data-editable') !== 'false';
    this.editMode = false;
    this.active = null;          // { id, mode: 'edit'|'split' }
    this.data = this.load();
    this.dragId = null;
    this.render();
  }

  Timeline.prototype.seed = function () {
    var s = window.KEEPKASE_TIMELINE_SEED;
    return s ? this.normalize(clone(s)) : { version: 1, nodes: [] };
  };

  Timeline.prototype.load = function () {
    try {
      var raw = localStorage.getItem(this.key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.nodes)) return this.normalize(parsed);
      }
    } catch (e) { /* ignore */ }
    return this.seed();
  };

  Timeline.prototype.save = function () {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); this.savedAt = Date.now(); }
    catch (e) { if (window.KK) window.KK.toast('Could not save (storage full)'); }
  };

  Timeline.prototype.normalize = function (d) {
    d.version = d.version || 1;
    d.nodes = (d.nodes || []).map(function (n) {
      n.id = n.id || uid('node');
      n.depth = n.depth === 1 ? 1 : 0;
      n.status = (n.status === 'done' || n.status === 'in-progress' || n.status === 'upcoming') ? n.status : 'upcoming';
      n.title = n.title || 'Untitled step';
      n.description = n.description || '';
      n.date = n.date || '';
      n.milestones = (n.milestones || []).map(function (m) {
        return { id: m.id || uid('m'), label: m.label || '', state: (m.state === 'done' || m.state === 'active') ? m.state : 'pending' };
      });
      n.links = (n.links || []).map(function (l) {
        return { id: l.id || uid('l'), label: l.label || 'Link', url: l.url || '#', kind: KINDS.indexOf(l.kind) > -1 ? l.kind : inferKind(l.url) };
      });
      return n;
    });
    return d;
  };

  Timeline.prototype.nodeById = function (id) {
    for (var i = 0; i < this.data.nodes.length; i++) if (this.data.nodes[i].id === id) return { node: this.data.nodes[i], i: i };
    return null;
  };

  /* ====================================================================== */
  /*  RENDER                                                                */
  /* ====================================================================== */
  Timeline.prototype.render = function () {
    var self = this;
    var d = this.data;
    var total = d.nodes.length;
    var done = d.nodes.filter(function (n) { return n.status === 'done'; }).length;
    var prog = d.nodes.filter(function (n) { return n.status === 'in-progress'; }).length;
    var up = total - done - prog;
    var pct = total ? Math.round(((done + prog * 0.5) / total) * 100) : 0;

    var html = '';
    /* toolbar */
    html += '<div class="tl-toolbar">';
    html += '  <div class="tl-progress" role="img" aria-label="' + pct + ' percent of the build complete">';
    html += '    <div class="tl-progress-bar"><div class="tl-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '    <div class="tl-progress-meta"><span>' + pct + '% of the build</span><span>' + done + ' done · ' + prog + ' in progress · ' + up + ' upcoming</span></div>';
    html += '  </div>';
    html += '  <div class="tl-legend">';
    html += '    <span class="tl-leg"><span class="dot done"></span>Done</span>';
    html += '    <span class="tl-leg"><span class="dot in-progress"></span>In progress</span>';
    html += '    <span class="tl-leg"><span class="dot upcoming"></span>Upcoming</span>';
    html += '  </div>';
    if (this.editable) {
      html += '  <div class="tl-actions">';
      html += '    <button class="tl-btn tl-btn--edit' + (this.editMode ? ' is-on' : '') + '" data-act="toggle-edit"><span class="ic">' + (this.editMode ? '✓' : '✎') + '</span>' + (this.editMode ? 'Done editing' : 'Edit timeline') + '</button>';
      html += '  </div>';
    }
    html += '</div>';

    /* edit banner */
    if (this.editable) {
      html += '<div class="tl-editbar">';
      html += '  <div class="eb-txt"><strong>You\'re editing.</strong> Changes save to <strong>this browser only</strong> — visitors still see the published version. Use Export to publish (see README).</div>';
      html += '  <button class="tl-btn" data-act="export"><span class="ic">⬇</span>Export JSON</button>';
      html += '  <button class="tl-btn" data-act="import"><span class="ic">⬆</span>Import</button>';
      html += '  <button class="tl-btn tl-btn--ghost" data-act="reset"><span class="ic">↺</span>Reset to published</button>';
      html += '  <input type="file" accept="application/json,.json" class="hidden" data-file>';
      html += '</div>';
    }

    /* track */
    html += '<div class="tl-track">';
    if (!d.nodes.length) {
      html += '<div class="tl-empty">No steps yet. ' + (this.editable ? 'Turn on edit mode and add the first one.' : '') + '</div>';
    } else {
      d.nodes.forEach(function (n) {
        html += (self.active && self.active.id === n.id && self.active.mode === 'edit')
          ? self.renderEditForm(n)
          : self.renderNode(n);
      });
    }
    html += '</div>';

    /* add node */
    if (this.editable) {
      html += '<div class="tl-add-node-wrap"><button class="btn btn--ink btn--sm tl-add-node" data-act="add-node">+ Add a step</button></div>';
    }

    this.root.innerHTML = html;
    this.root.classList.toggle('is-editing', this.editMode);
    this.bind();

    // animate progress fill from 0
    var fill = this.root.querySelector('.tl-progress-fill');
    if (fill) { fill.style.width = '0%'; requestAnimationFrame(function () { fill.style.width = pct + '%'; }); }
  };

  Timeline.prototype.renderNode = function (n) {
    var self = this;
    var milesDone = n.milestones.filter(function (m) { return m.state === 'done'; }).length;
    var h = '';
    h += '<div class="tl-node depth-' + n.depth + '" data-id="' + n.id + '" data-status="' + n.status + '"' + (this.editMode ? ' draggable="true"' : '') + '>';
    if (n.depth === 1) h += '<span class="tl-fork"></span>';
    h += '<span class="tl-dot">' + (n.status === 'done' ? '✓' : (n.status === 'in-progress' ? '' : '')) + '</span>';
    h += '<div class="tl-card">';
    h += '  <div class="tl-card-head">';
    h += '    <div style="flex:1;min-width:0">';
    h += '      <div class="tl-card-meta">';
    h += '        <span class="tl-status-pill ' + n.status + '">' + (n.status === 'in-progress' ? 'In progress' : (n.status === 'done' ? 'Done' : 'Upcoming')) + '</span>';
    if (n.date) h += '        <span class="tl-date">' + esc(self.fmtDate(n.date)) + '</span>';
    if (n.milestones.length) h += '        <span class="tl-date">' + milesDone + '/' + n.milestones.length + ' milestones</span>';
    h += '      </div>';
    h += '      <h3>' + esc(n.title) + '</h3>';
    h += '    </div>';
    /* node tools */
    h += '    <div class="tl-node-tools">';
    h += '      <button class="tl-tool tl-drag" title="Drag to reorder" data-act="noop">⠿</button>';
    h += '      <button class="tl-tool" title="Move up" data-act="move-up" data-id="' + n.id + '">↑</button>';
    h += '      <button class="tl-tool" title="Move down" data-act="move-down" data-id="' + n.id + '">↓</button>';
    h += '      <button class="tl-tool" title="' + (n.depth ? 'Outdent to main step' : 'Indent as sub-step') + '" data-act="indent" data-id="' + n.id + '">' + (n.depth ? '⇤' : '⇥') + '</button>';
    h += '      <button class="tl-tool tl-tool--split tl-tool--wide" title="Split into sub-steps" data-act="split" data-id="' + n.id + '">⑂ Split</button>';
    h += '      <button class="tl-tool tl-tool--wide" title="Edit" data-act="edit" data-id="' + n.id + '">✎ Edit</button>';
    h += '      <button class="tl-tool tl-tool--danger" title="Delete" data-act="delete" data-id="' + n.id + '">🗑</button>';
    h += '    </div>';
    h += '  </div>';

    if (n.description) h += '<p class="tl-desc">' + esc(n.description) + '</p>';

    if (n.milestones.length) {
      h += '<div class="tl-miles">';
      n.milestones.forEach(function (m) {
        h += '<div class="tl-mile" data-state="' + m.state + '"><span class="mk">' + (m.state === 'done' ? '✓' : '') + '</span><span class="ml">' + esc(m.label) + '</span></div>';
      });
      h += '</div>';
    }

    if (n.links.length) {
      h += '<div class="tl-links">';
      n.links.forEach(function (l) {
        h += '<a class="tl-link" data-kind="' + l.kind + '" href="' + esc(sanitizeUrl(l.url)) + '" target="_blank" rel="noopener"><span class="lk-ic">' + (KIND_GLYPH[l.kind] || '↗') + '</span>' + esc(l.label) + '</a>';
      });
      h += '</div>';
    }

    /* split panel */
    if (this.active && this.active.id === n.id && this.active.mode === 'split') {
      h += this.renderSplitPanel(n);
    }

    h += '</div></div>';
    return h;
  };

  Timeline.prototype.renderSplitPanel = function (n) {
    var h = '<div class="tl-split-suggest" data-split-panel>';
    h += '<b>Split “' + esc(n.title) + '”.</b> Break it into a focused sub-step that has to happen first. New sub-steps appear indented right below.';
    if (n.suggestedSplit && n.suggestedSplit.length) {
      h += '<div class="tl-split-chips">';
      n.suggestedSplit.forEach(function (s, i) {
        h += '<button class="tl-addrow" data-act="split-suggested" data-id="' + n.id + '" data-i="' + i + '">+ ' + esc(s.title) + '</button>';
      });
      h += '</div>';
    }
    h += '<div class="tl-editrow-item" style="margin-top:10px"><input class="tl-input grow" data-split-input placeholder="New sub-step name (e.g. Find a recyclable cardboard supplier)"><button class="tl-btn tl-btn--edit" data-act="split-add" data-id="' + n.id + '">Add sub-step</button></div>';
    h += '<div class="tl-form-foot" style="border:none;padding-top:4px"><button class="tl-btn tl-btn--ghost" data-act="cancel">Close</button></div>';
    h += '</div>';
    return h;
  };

  Timeline.prototype.renderEditForm = function (n) {
    var h = '';
    h += '<div class="tl-node depth-' + n.depth + '" data-id="' + n.id + '" data-status="' + n.status + '">';
    if (n.depth === 1) h += '<span class="tl-fork"></span>';
    h += '<span class="tl-dot">✎</span>';
    h += '<div class="tl-card"><form class="tl-edit-form" data-edit-form data-id="' + n.id + '" onsubmit="return false">';
    h += '  <input class="tl-input title" name="title" value="' + esc(n.title) + '" placeholder="Step title" autofocus>';
    h += '  <div class="tl-edit-row">';
    h += '    <div><label class="tl-edit-label">Status</label><select class="tl-select" name="status">' + STATUSES.map(function (s) { return '<option value="' + s.v + '"' + (n.status === s.v ? ' selected' : '') + '>' + s.l + '</option>'; }).join('') + '</select></div>';
    h += '    <div><label class="tl-edit-label">Date / month</label><input class="tl-input" name="date" value="' + esc(n.date) + '" placeholder="2026-04"></div>';
    h += '    <div><label class="tl-edit-label">Level</label><select class="tl-select" name="depth"><option value="0"' + (n.depth === 0 ? ' selected' : '') + '>Main step</option><option value="1"' + (n.depth === 1 ? ' selected' : '') + '>Sub-step</option></select></div>';
    h += '  </div>';
    h += '  <div><label class="tl-edit-label">Description</label><textarea class="tl-textarea" name="description" placeholder="What happened in this step?">' + esc(n.description) + '</textarea></div>';

    /* milestones editor */
    h += '  <div class="tl-sub"><label class="tl-edit-label">Milestones</label><div data-miles>';
    n.milestones.forEach(function (m) { h += Timeline.mileRow(m); });
    h += '  </div><button type="button" class="tl-addrow" data-act="add-mile">+ Add milestone</button></div>';

    /* links editor */
    h += '  <div class="tl-sub"><label class="tl-edit-label">Links (add a video recap, a Discord thread, anything — even weeks later)</label><div data-links>';
    n.links.forEach(function (l) { h += Timeline.linkRow(l); });
    h += '  </div><button type="button" class="tl-addrow" data-act="add-link">+ Add link</button></div>';

    h += '  <div class="tl-form-foot">';
    h += '    <button type="button" class="tl-btn tl-btn--ghost" data-act="cancel">Cancel</button>';
    h += '    <button type="button" class="tl-btn tl-btn--edit" data-act="save" data-id="' + n.id + '"><span class="ic">✓</span>Save step</button>';
    h += '  </div>';
    h += '</form></div></div>';
    return h;
  };

  Timeline.mileRow = function (m) {
    m = m || { id: uid('m'), label: '', state: 'pending' };
    return '<div class="tl-editrow-item" data-mile-row data-id="' + m.id + '">' +
      '<input class="tl-input grow" data-mfield="label" value="' + esc(m.label) + '" placeholder="Milestone">' +
      '<select class="tl-select" data-mfield="state">' + MILE_STATES.map(function (s) { return '<option value="' + s.v + '"' + (m.state === s.v ? ' selected' : '') + '>' + s.l + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="tl-mini-del" data-act="del-mile" title="Remove">×</button></div>';
  };

  Timeline.linkRow = function (l) {
    l = l || { id: uid('l'), label: '', url: '', kind: 'link' };
    return '<div class="tl-editrow-item" data-link-row data-id="' + l.id + '">' +
      '<input class="tl-input grow" data-lfield="label" value="' + esc(l.label) + '" placeholder="Label (e.g. Watch the recap)">' +
      '<input class="tl-input grow" data-lfield="url" value="' + esc(l.url) + '" placeholder="https://…">' +
      '<select class="tl-select" data-lfield="kind">' + KINDS.map(function (k) { return '<option value="' + k + '"' + (l.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="tl-mini-del" data-act="del-link" title="Remove">×</button></div>';
  };

  Timeline.prototype.fmtDate = function (s) {
    // accept "YYYY-MM" or "YYYY-MM-DD" or free text
    var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s);
    if (!m) return s;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var out = months[parseInt(m[2], 10) - 1] + ' ' + m[1];
    if (m[3]) out = months[parseInt(m[2], 10) - 1] + ' ' + parseInt(m[3], 10) + ', ' + m[1];
    return out;
  };

  /* ====================================================================== */
  /*  EVENTS                                                                */
  /* ====================================================================== */
  Timeline.prototype.bind = function () {
    var self = this;

    // delegated clicks
    this.root.onclick = function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      var id = btn.getAttribute('data-id');
      switch (act) {
        case 'toggle-edit': self.editMode = !self.editMode; self.active = null; self.render(); break;
        case 'add-node': self.addNode(); break;
        case 'edit': self.active = { id: id, mode: 'edit' }; self.render(); self.focusForm(); break;
        case 'cancel': self.active = null; self.render(); break;
        case 'save': self.saveForm(id); break;
        case 'delete': self.deleteNode(id); break;
        case 'move-up': self.move(id, -1); break;
        case 'move-down': self.move(id, 1); break;
        case 'indent': self.toggleDepth(id); break;
        case 'split': self.active = { id: id, mode: 'split' }; self.render(); break;
        case 'split-add': self.splitAdd(id); break;
        case 'split-suggested': self.splitSuggested(id, parseInt(btn.getAttribute('data-i'), 10)); break;
        case 'add-mile': self.addRow(btn, 'mile'); break;
        case 'add-link': self.addRow(btn, 'link'); break;
        case 'del-mile': var r = btn.closest('[data-mile-row]'); if (r) r.remove(); break;
        case 'del-link': var rl = btn.closest('[data-link-row]'); if (rl) rl.remove(); break;
        case 'export': self.exportJSON(); break;
        case 'import': var f = self.root.querySelector('[data-file]'); if (f) f.click(); break;
        case 'reset': self.reset(); break;
        default: break;
      }
    };

    // import file
    var file = this.root.querySelector('[data-file]');
    if (file) file.onchange = function () { self.importJSON(file.files[0]); };

    // drag reorder (edit mode)
    if (this.editMode) this.bindDrag();
  };

  Timeline.prototype.focusForm = function () {
    var t = this.root.querySelector('[data-edit-form] input[name="title"]');
    if (t) { t.focus(); if (t.setSelectionRange) { try { t.setSelectionRange(t.value.length, t.value.length); } catch (e) {} } }
  };

  Timeline.prototype.addRow = function (btn, type) {
    var container = btn.parentElement.querySelector(type === 'mile' ? '[data-miles]' : '[data-links]');
    if (!container) return;
    var temp = document.createElement('div');
    temp.innerHTML = (type === 'mile') ? Timeline.mileRow() : Timeline.linkRow();
    container.appendChild(temp.firstChild);
    var input = container.lastElementChild.querySelector('input');
    if (input) input.focus();
  };

  Timeline.prototype.collectForm = function (id) {
    var form = this.root.querySelector('[data-edit-form][data-id="' + id + '"]');
    if (!form) return null;
    var ref = this.nodeById(id); if (!ref) return null;
    var n = ref.node;
    function val(sel, fallback) { var el = form.querySelector(sel); return el ? el.value : (fallback || ''); }
    n.title = val('[name="title"]').trim() || 'Untitled step';
    n.status = val('[name="status"]', 'upcoming');
    n.date = val('[name="date"]').trim();
    n.depth = parseInt(val('[name="depth"]', '0'), 10) === 1 ? 1 : 0;
    n.description = val('[name="description"]').trim();
    n.milestones = Array.prototype.map.call(form.querySelectorAll('[data-mile-row]'), function (row) {
      return {
        id: row.getAttribute('data-id') || uid('m'),
        label: row.querySelector('[data-mfield="label"]').value.trim(),
        state: row.querySelector('[data-mfield="state"]').value
      };
    }).filter(function (m) { return m.label; });
    n.links = Array.prototype.map.call(form.querySelectorAll('[data-link-row]'), function (row) {
      var url = row.querySelector('[data-lfield="url"]').value.trim();
      return {
        id: row.getAttribute('data-id') || uid('l'),
        label: row.querySelector('[data-lfield="label"]').value.trim() || 'Link',
        url: url,
        kind: row.querySelector('[data-lfield="kind"]').value
      };
    }).filter(function (l) { return l.url; });
    return n;
  };

  Timeline.prototype.saveForm = function (id) {
    var n = this.collectForm(id);
    if (!n) return;
    this.save();
    this.active = null;
    this.render();
    if (window.KK) window.KK.toast('Step saved ✦');
  };

  Timeline.prototype.addNode = function () {
    var n = this.normalize({ nodes: [{ title: 'New step', status: 'upcoming', date: '', description: '', milestones: [], links: [] }] }).nodes[0];
    this.data.nodes.push(n);
    this.save();
    this.active = { id: n.id, mode: 'edit' };
    this.render();
    this.focusForm();
    var el = this.root.querySelector('[data-edit-form][data-id="' + n.id + '"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  Timeline.prototype.deleteNode = function (id) {
    var ref = this.nodeById(id); if (!ref) return;
    if (!window.confirm('Delete “' + ref.node.title + '”? This also removes its milestones and links.')) return;
    this.data.nodes.splice(ref.i, 1);
    this.save();
    this.active = null;
    this.render();
    if (window.KK) window.KK.toast('Step deleted');
  };

  Timeline.prototype.move = function (id, dir) {
    var ref = this.nodeById(id); if (!ref) return;
    var j = ref.i + dir;
    if (j < 0 || j >= this.data.nodes.length) return;
    var arr = this.data.nodes;
    var tmp = arr[ref.i]; arr[ref.i] = arr[j]; arr[j] = tmp;
    this.save();
    this.render();
  };

  Timeline.prototype.toggleDepth = function (id) {
    var ref = this.nodeById(id); if (!ref) return;
    ref.node.depth = ref.node.depth === 1 ? 0 : 1;
    this.save();
    this.render();
  };

  /* ---- split ------------------------------------------------------------ */
  Timeline.prototype.insertAfter = function (parentId, node) {
    var ref = this.nodeById(parentId);
    if (!ref) { this.data.nodes.push(node); if (window.KK) window.KK.toast('Step not found — added at the end'); return; }
    // insert after the parent AND after any existing consecutive sub-steps of it
    var idx = ref.i + 1;
    while (idx < this.data.nodes.length && this.data.nodes[idx].depth === 1) idx++;
    this.data.nodes.splice(idx, 0, node);
  };

  Timeline.prototype.splitAdd = function (id) {
    var input = this.root.querySelector('[data-split-input]');
    var title = input ? input.value.trim() : '';
    if (!title) { if (input) input.focus(); return; }
    var ref = this.nodeById(id); if (!ref) return;
    // parent becomes in-progress (it now has prerequisite work)
    if (ref.node.status === 'upcoming') ref.node.status = 'in-progress';
    var node = this.normalize({ nodes: [{ title: title, status: 'in-progress', depth: 1, description: '', milestones: [], links: [] }] }).nodes[0];
    this.insertAfter(id, node);
    this.save();
    this.active = null;
    this.render();
    if (window.KK) window.KK.toast('Split into a sub-step ✦');
  };

  Timeline.prototype.splitSuggested = function (id, i) {
    var ref = this.nodeById(id); if (!ref || !ref.node.suggestedSplit) return;
    var s = ref.node.suggestedSplit[i]; if (!s) return;
    if (ref.node.status === 'upcoming') ref.node.status = 'in-progress';
    var node = this.normalize({ nodes: [{ title: s.title, status: s.status || 'in-progress', depth: 1, description: s.description || '', milestones: [], links: [] }] }).nodes[0];
    this.insertAfter(id, node);
    // remove this suggestion so it isn't added twice
    ref.node.suggestedSplit.splice(i, 1);
    this.save();
    // re-open the split panel only if more suggestions remain to add
    this.active = (ref.node.suggestedSplit && ref.node.suggestedSplit.length) ? { id: id, mode: 'split' } : null;
    this.render();
    if (window.KK) window.KK.toast('Added “' + s.title + '” ✦');
  };

  /* ---- drag reorder ----------------------------------------------------- */
  Timeline.prototype.bindDrag = function () {
    var self = this;
    var nodes = Array.prototype.slice.call(this.root.querySelectorAll('.tl-node[draggable="true"]'));
    nodes.forEach(function (el) {
      el.addEventListener('dragstart', function (e) {
        self.dragId = el.getAttribute('data-id');
        el.classList.add('dragging');
        try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', self.dragId); } catch (x) {}
      });
      el.addEventListener('dragend', function () {
        el.classList.remove('dragging');
        nodes.forEach(function (n) { n.classList.remove('drop-before', 'drop-after'); });
      });
      el.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (el.getAttribute('data-id') === self.dragId) return;
        var rect = el.getBoundingClientRect();
        var after = e.clientY > rect.top + rect.height / 2;
        el.classList.toggle('drop-after', after);
        el.classList.toggle('drop-before', !after);
      });
      el.addEventListener('dragleave', function () { el.classList.remove('drop-before', 'drop-after'); });
      el.addEventListener('drop', function (e) {
        e.preventDefault();
        var targetId = el.getAttribute('data-id');
        if (!self.dragId || targetId === self.dragId) return;
        var after = el.classList.contains('drop-after');
        self.reorder(self.dragId, targetId, after);
      });
    });
  };

  Timeline.prototype.reorder = function (dragId, targetId, after) {
    var arr = this.data.nodes;
    var from = this.nodeById(dragId); if (!from) return;
    var moved = arr.splice(from.i, 1)[0];
    var t = this.nodeById(targetId); // index after removal
    var idx = t ? (after ? t.i + 1 : t.i) : arr.length;
    arr.splice(idx, 0, moved);
    this.save();
    this.dragId = null;
    this.render();
  };

  /* ---- export / import / reset ----------------------------------------- */
  Timeline.prototype.exportJSON = function () {
    var blob = new Blob([JSON.stringify({ version: this.data.version, updated: new Date().toISOString().slice(0, 10), nodes: this.data.nodes }, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'keepkase-timeline.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    if (window.KK) window.KK.toast('Exported keepkase-timeline.json ✦');
  };

  Timeline.prototype.importJSON = function (file) {
    var self = this;
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.nodes)) throw new Error('no nodes');
        self.data = self.normalize(parsed);
        self.save();
        self.active = null;
        self.render();
        if (window.KK) window.KK.toast('Timeline imported ✦');
      } catch (e) {
        if (window.KK) window.KK.toast('That file isn\'t a valid timeline export');
      }
    };
    reader.readAsText(file);
  };

  Timeline.prototype.reset = function () {
    if (!window.confirm('Reset to the published timeline? This discards your local edits.')) return;
    try { localStorage.removeItem(this.key); } catch (e) {}
    this.data = this.seed();
    this.active = null;
    this.render();
    if (window.KK) window.KK.toast('Reset to published');
  };

  /* ---- boot ------------------------------------------------------------- */
  function boot() {
    document.querySelectorAll('[data-timeline-root]').forEach(function (root) {
      if (root.__kkTimeline) return;
      root.__kkTimeline = new Timeline(root);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.KeepKaseTimeline = Timeline;
})();
