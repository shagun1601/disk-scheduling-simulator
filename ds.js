document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const maxCylinderInput = document.getElementById('maxCylinder');
  const initialHeadInput = document.getElementById('initialHead');
  const requestCountInput = document.getElementById('requestCount');
  const generateBtn = document.getElementById('generateRequests');
  const addBtn = document.getElementById('addRequest');
  const clearBtn = document.getElementById('clearRequests');
  const requestsList = document.getElementById('requestsList');
  const runSelectedBtn = document.getElementById('runSelected');
  const runAllBtn = document.getElementById('runAll');
  const algorithmSelect = document.getElementById('algorithm');
  const visualizeBtn = document.getElementById('visualize');

  const seekSequenceSpan = document.getElementById('seek-sequence');
  const metricsInfo = document.getElementById('metrics-info');

  const diskHead = document.querySelector('.disk-head');
  const requestPointsContainer = document.querySelector('.request-points');
  const currentPosition = document.getElementById('current-position');
  const nextRequest = document.getElementById('next-request');
  const headDirection = document.getElementById('head-direction');

  const canvas = document.getElementById('visualizationCanvas');
  const ctx = canvas.getContext('2d');

  // Internal state
  let requests = [];
  let results = {
    fcfs: { movements: [], total: 0 },
    scan: { movements: [], total: 0 },
    cscan: { movements: [], total: 0 }
  };

  // Helpers
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function updateRequestsList() {
    requestsList.innerHTML = '';
    requests.forEach(r => {
      const chip = document.createElement('span');
      chip.className = 'request-chip';
      chip.textContent = r;
      requestsList.appendChild(chip);
    });
    createRequestPoints();
  }

  function createRequestPoints() {
    requestPointsContainer.innerHTML = '';
    const maxCyl = parseInt(maxCylinderInput.value) || 1;
    requests.forEach(req => {
      const p = document.createElement('div');
      p.className = 'request-point';
      const leftPct = (req / maxCyl) * 100;
      p.style.left = leftPct + '%';
      p.dataset.position = req;
      requestPointsContainer.appendChild(p);
    });
  }

  function generateRandomRequests() {
    const maxCyl = parseInt(maxCylinderInput.value) || 999;
    const count = clamp(parseInt(requestCountInput.value) || 8, 1, 1000);
    requests = [];
    for (let i = 0; i < count; i++) requests.push(Math.floor(Math.random() * (maxCyl + 1)));
    updateRequestsList();
  }

  function addManualRequest() {
    const maxCyl = parseInt(maxCylinderInput.value) || 999;
    const val = prompt(`Enter cylinder request (0-${maxCyl}):`, '0');
    if (val === null) return;
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0 && n <= maxCyl) {
      requests.push(n);
      updateRequestsList();
    } else alert('Invalid number');
  }

  function clearRequests() {
    requests = [];
    results = { fcfs: { movements: [], total: 0 }, scan: { movements: [], total: 0 }, cscan: { movements: [], total: 0 } };
    updateRequestsList();
    clearTables();
    drawEmptyCanvas();
    seekSequenceSpan.textContent = '';
    metricsInfo.textContent = '';
    diskHead.style.left = '0%';
    currentPosition.textContent = '0';
  }

  function clearTables() {
    document.querySelector('#resultsTable tbody').innerHTML = '';
    document.querySelector('#comparisonTable tbody').innerHTML = '';
    document.getElementById('visualSummary').innerHTML = 'Run an algorithm to see the visualization.';
    document.getElementById('resultSummary').innerHTML = '';
  }

  // Algorithms -> each fills a movements[] with {from,to,move,total,wrap?}
  function runFCFS(head) {
    let cur = head, total = 0, movements = [];
    for (let i = 0; i < requests.length; i++) {
      const to = requests[i];
      const mv = Math.abs(to - cur);
      total += mv;
      movements.push({ from: cur, to, move: mv, total });
      cur = to;
    }
    results.fcfs = { movements, total };
  }

  function runSSTF(head) {
    // returns sequence array (for visualize mode)
    let rem = [...requests];
    let cur = head;
    const seq = [head];
    while (rem.length) {
      let nearestIdx = 0, minD = Math.abs(rem[0] - cur);
      for (let i = 1; i < rem.length; i++) {
        const d = Math.abs(rem[i] - cur);
        if (d < minD) { minD = d; nearestIdx = i; }
      }
      cur = rem.splice(nearestIdx, 1)[0];
      seq.push(cur);
    }
    return seq;
  }

  function runSCAN(head, maxCyl) {
    const sorted = [...requests].sort((a,b) => a - b);
    const right = sorted.filter(x => x >= head);
    const left = sorted.filter(x => x < head).reverse();
    const seq = [head, ...right, maxCyl, ...left];
    // build movements
    let cur = seq[0], total = 0, movements = [];
    for (let i = 1; i < seq.length; i++) {
      const mv = Math.abs(seq[i] - cur);
      total += mv;
      movements.push({ from: cur, to: seq[i], move: mv, total });
      cur = seq[i];
    }
    results.scan = { movements, total };
  }

  function runCSCAN(head, maxCyl) {
    const sorted = [...requests].sort((a,b) => a - b);
    const right = sorted.filter(x => x >= head);
    const left = sorted.filter(x => x < head);
    let cur = head, total = 0, movements = [];
    // service right
    for (let i = 0; i < right.length; i++) {
      const mv = Math.abs(right[i] - cur);
      total += mv;
      movements.push({ from: cur, to: right[i], move: mv, total });
      cur = right[i];
    }
    // go to end if not at end
    if (cur < maxCyl) {
      const mv = Math.abs(maxCyl - cur);
      total += mv;
      movements.push({ from: cur, to: maxCyl, move: mv, total });
      cur = maxCyl;
    }
    // wrap
    movements.push({ from: cur, to: 0, move: cur, total: total + cur, wrap: true });
    total += cur;
    cur = 0;
    // service left
    for (let i = 0; i < left.length; i++) {
      const mv = Math.abs(left[i] - cur);
      total += mv;
      movements.push({ from: cur, to: left[i], move: mv, total });
      cur = left[i];
    }
    results.cscan = { movements, total };
  }

  // Utility sequences for visualize (return array of positions)
  function sequenceFCFS(head) { return [head, ...requests]; }
  function sequenceSSTF(head) { return runSSTF(head); }
  function sequenceSCAN(head, maxCyl) {
    const sorted = [...requests].sort((a,b) => a - b);
    const right = sorted.filter(x => x >= head);
    const left = sorted.filter(x => x < head).reverse();
    return [head, ...right, maxCyl, ...left];
  }
  function sequenceCSCAN(head, maxCyl) {
    const sorted = [...requests].sort((a,b) => a - b);
    const right = sorted.filter(x => x >= head);
    const left = sorted.filter(x => x < head);
    return [head, ...right, maxCyl, 0, ...left];
  }
  function sequenceLOOK(head) {
    const sorted = [...requests].sort((a,b) => a - b);
    const right = sorted.filter(x => x >= head);
    const left = sorted.filter(x => x < head).reverse();
    return [head, ...right, ...left];
  }
  function sequenceCLOOK(head) {
    const sorted = [...requests].sort((a,b) => a - b);
    const right = sorted.filter(x => x >= head);
    const left = sorted.filter(x => x < head);
    return [head, ...right, ...left];
  }

  function calcTotal(sequence) {
    let total = 0;
    for (let i = 1; i < sequence.length; i++) total += Math.abs(sequence[i] - sequence[i-1]);
    return total;
  }

  // Drawing helpers (canvas)
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    // dark grid background
    ctx.fillStyle = '#061018';
    ctx.fillRect(0,0,w,h);

    // vertical grid lines (cylinder axis)
    ctx.strokeStyle = 'rgba(60,140,200,0.06)';
    ctx.lineWidth = 1;
    const maxCyl = parseInt(maxCylinderInput.value) || 999;
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const x = 50 + (i / steps) * (w - 100);
      ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, h - 60); ctx.stroke();
      // label
      ctx.fillStyle = '#93c9ff';
      ctx.font = '12px Inter, Arial';
      const label = Math.round((i / steps) * maxCyl);
      ctx.fillText(label, x - 12, h - 40);
    }

    // horizontal lines (time steps)
    ctx.strokeStyle = 'rgba(60,140,200,0.04)';
    for (let i = 0; i < 8; i++) {
      const y = 30 + (i / 7) * (h - 100);
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w - 40, y); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = '#2c82c9';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(40, 30); ctx.lineTo(40, h - 60); ctx.lineTo(w - 40, h - 60); ctx.stroke();
    // axis labels
    ctx.fillStyle = '#a9d9ff';
    ctx.fillText('Cylinder Position →', w/2 - 40, h - 18);
    ctx.save();
    ctx.translate(14, h/2 + 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Time / Step →', 0, 0);
    ctx.restore();
  }

  // draw path for a sequence (like UI-2 straight line style)
  function drawPath(sequence, color = '#4aa3ff', dashed = false) {
    if (!sequence || sequence.length < 2) return;
    const w = canvas.width, h = canvas.height;
    const maxCyl = parseInt(maxCylinderInput.value) || 999;
    const xScale = (w - 100) / maxCyl;
    const yStep = (h - 100) / (sequence.length + 1);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (dashed) ctx.setLineDash([6,6]);

    ctx.beginPath();
    // starting point (x,y)
    let x = 50 + sequence[0] * xScale;
    let y = h - 60;
    ctx.moveTo(x, y);

    for (let i = 1; i < sequence.length; i++) {
      const nx = 50 + sequence[i] * xScale;
      const ny = h - 60 - i * yStep;
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // draw circle marker
      ctx.beginPath();
      ctx.fillStyle = '#f05a5a';
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();

      // continue path
      ctx.beginPath();
      ctx.moveTo(nx, ny);
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  // draw multi algorithm comparison (colors)
  function drawComparison() {
    clearCanvas();
    drawGrid();
    // draw FCFS
    if (results.fcfs.movements.length) {
      const seq = [results.fcfs.movements[0]?.from || 0].concat(results.fcfs.movements.map(m => m.to));
      drawPath(seq, '#4aa3ff', false);
    }
    if (results.scan.movements.length) {
      const seq = [results.scan.movements[0]?.from || 0].concat(results.scan.movements.map(m => m.to));
      drawPath(seq, '#2ecc71', false);
    }
    if (results.cscan.movements.length) {
      const seq = [results.cscan.movements[0]?.from || 0].concat(results.cscan.movements.map(m => m.to));
      // mark wrap segments dashed - we draw whole path dashed for clarity
      drawPath(seq, '#ff9f9f', true);
    }
  }

  // draw for single algorithm type
  function drawForType(type) {
    clearCanvas();
    drawGrid();
    if (!results[type] || !results[type].movements.length) return;
    const seq = [results[type].movements[0].from].concat(results[type].movements.map(m => m.to));
    const color = type === 'fcfs' ? '#4aa3ff' : (type === 'scan' ? '#2ecc71' : '#ff9f9f');
    const dashed = type === 'cscan';
    drawPath(seq, color, dashed);
  }

  // animate disk head movement for a sequence
  function animateHeadSequence(sequence, speed = 450) {
    // moves diskHead element and marks request points
    return new Promise(async resolve => {
      const maxCyl = parseInt(maxCylinderInput.value) || 999;
      for (let i = 0; i < sequence.length - 1; i++) {
        const from = sequence[i], to = sequence[i + 1];
        headDirection.textContent = from < to ? '→' : '←';
        currentPosition.textContent = from;
        nextRequest.textContent = to;
        const leftPct = (to / maxCyl) * 100;
        diskHead.style.left = leftPct + '%';

        // mark request point if exists
        const pts = document.querySelectorAll('.request-point');
        pts.forEach(p => {
          if (parseInt(p.dataset.position) === to) {
            p.classList.add('active');
            setTimeout(() => p.classList.add('completed'), speed - 100);
          }
        });

        // wait for movement
        await new Promise(r => setTimeout(r, speed));
      }
      headDirection.textContent = '-';
      nextRequest.textContent = '-';
      resolve();
    });
  }

  // UI updates: results table and comparison
  function updateResultsTableFor(type) {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';
    const movements = results[type].movements || [];
    movements.forEach((m, i) => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = i + 1;
      row.insertCell(1).textContent = m.from;
      row.insertCell(2).textContent = m.to;
      row.insertCell(3).textContent = m.wrap ? `${m.move} (wrap)` : m.move;
      row.insertCell(4).textContent = m.total;
    });
    document.getElementById('resultSummary').innerHTML = `<p><strong>${type.toUpperCase()} Results:</strong></p>
      <p>Total head movement: ${results[type].total || 0}</p>
      <p>Average per request: ${requests.length ? (results[type].total / requests.length).toFixed(2) : 0}</p>`;
  }

  function updateComparisonTable() {
    const tbody = document.querySelector('#comparisonTable tbody');
    tbody.innerHTML = '';
    const fcfsTotal = results.fcfs.total || 0;
    const algos = [
      { name: 'FCFS', total: results.fcfs.total || 0 },
      { name: 'SCAN', total: results.scan.total || 0 },
      { name: 'C-SCAN', total: results.cscan.total || 0 }
    ];
    algos.forEach(a => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = a.name;
      row.insertCell(1).textContent = a.total;
      row.insertCell(2).textContent = requests.length ? (a.total / requests.length).toFixed(2) : '0.00';
      row.insertCell(3).textContent = a.name === 'FCFS' ? '-' : (fcfsTotal ? (((fcfsTotal - a.total) / fcfsTotal) * 100).toFixed(2) + '%' : '-');
    });
  }

  // Event handlers
  generateBtn.addEventListener('click', () => {
    generateRandomRequests();
    drawEmptyCanvas();
  });
  addBtn.addEventListener('click', () => { addManualRequest(); drawEmptyCanvas(); });
  clearBtn.addEventListener('click', () => { clearRequests(); });

  runSelectedBtn.addEventListener('click', () => {
    if (!requests.length) { alert('Add or generate requests first'); return; }
    clearTables();
    const head = clamp(parseInt(initialHeadInput.value) || 0, 0, parseInt(maxCylinderInput.value));
    const maxCyl = parseInt(maxCylinderInput.value) || 999;
    const algo = algorithmSelect.value;

    if (algo === 'fcfs') runFCFS(head);
    else if (algo === 'scan') runSCAN(head, maxCyl);
    else if (algo === 'cscan') runCSCAN(head, maxCyl);
    else if (algo === 'sstf') {
      const seq = runSSTF(head);
      results.fcfs = { movements: seqToMovements(seq), total: calcTotal(seq) };
    }
    else if (algo === 'look') {
      const seq = sequenceLOOK(head);
      results.fcfs = { movements: seqToMovements(seq), total: calcTotal(seq) };
    }
    else if (algo === 'clook') {
      const seq = sequenceCLOOK(head);
      results.fcfs = { movements: seqToMovements(seq), total: calcTotal(seq) };
    }

    updateResultsTableFor(algo === 'sstf' || algo === 'look' || algo === 'clook' ? 'fcfs' : algo);
    updateComparisonTable();
    drawForType(algo === 'sstf' || algo === 'look' || algo === 'clook' ? 'fcfs' : algo);
  });

  runAllBtn.addEventListener('click', () => {
    if (!requests.length) { alert('Add or generate requests first'); return; }
    clearTables();
    const head = clamp(parseInt(initialHeadInput.value) || 0, 0, parseInt(maxCylinderInput.value));
    const maxCyl = parseInt(maxCylinderInput.value) || 999;
    runFCFS(head); runSCAN(head, maxCyl); runCSCAN(head, maxCyl);
    updateResultsTableFor('fcfs');
    updateComparisonTable();
    drawComparison();
  });

  visualizeBtn.addEventListener('click', async () => {
    if (!requests.length) { alert('Add or generate requests first'); return; }
    const head = clamp(parseInt(initialHeadInput.value) || 0, 0, parseInt(maxCylinderInput.value));
    const maxCyl = parseInt(maxCylinderInput.value) || 999;
    const algo = algorithmSelect.value;
    let sequence = [];

    if (algo === 'fcfs') sequence = sequenceFCFS(head);
    else if (algo === 'sstf') sequence = sequenceSSTF(head);
    else if (algo === 'scan') sequence = sequenceSCAN(head, maxCyl);
    else if (algo === 'cscan') sequence = sequenceCSCAN(head, maxCyl);
    else if (algo === 'look') sequence = sequenceLOOK(head);
    else if (algo === 'clook') sequence = sequenceCLOOK(head);

    // show sequence + metrics
    seekSequenceSpan.textContent = sequence.join(' → ');
    const total = calcTotal(sequence);
    metricsInfo.textContent = `Total Head Movement: ${total} | Average: ${requests.length ? (total / requests.length).toFixed(2) : 0}`;

    // draw path and animate head
    clearCanvas();
    drawGrid();
    drawPath(sequence, '#ffd27a', algo === 'cscan');
    await animateHeadSequence(sequence, 480);
  });

  // convert simple sequence to movements array used by table code
  function seqToMovements(seq) {
    const mov = []; let total = 0;
    for (let i = 1; i < seq.length; i++) {
      const m = Math.abs(seq[i] - seq[i-1]); total += m;
      mov.push({ from: seq[i-1], to: seq[i], move: m, total });
    }
    return mov;
  }

  // small wrappers for sequence functions
  function sequenceSSTF(head) { return runSSTF(head); }

  // Initialize canvas resolution for crisp drawing
  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(1100 * ratio);
    canvas.height = Math.floor(320 * ratio);
    canvas.style.width = '100%';
    canvas.style.height = '320px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  window.addEventListener('resize', () => { resizeCanvas(); drawEmptyCanvas(); });
  resizeCanvas();

  function drawEmptyCanvas() { clearCanvas(); drawGrid(); }

  // initial draw
  drawEmptyCanvas();

  // tab behaviour
  document.querySelectorAll('.tablinks').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tablinks').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const tab = e.currentTarget.dataset.tab;
      document.querySelectorAll('.tabcontent').forEach(tc => tc.style.display = 'none');
      document.getElementById(tab).style.display = 'block';
    });
  });

  // initial UI updates
  updateRequestsList();
  document.getElementById('max-number').textContent = maxCylinderInput.value;

});


