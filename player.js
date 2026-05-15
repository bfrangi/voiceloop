const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const prevBtn = document.getElementById('prevBtn');
const stopBtn = document.getElementById('stopBtn');
const nextBtn = document.getElementById('nextBtn');
const statusEl = document.getElementById('status');
const trackEl = document.getElementById('track');
const progressEl = document.getElementById('progress');
const listEl = document.getElementById('list');
const repeatInput = document.getElementById('repeatCount');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');
const fileCount = document.getElementById('fileCount');

let files = [];
let trackIndex = 0;
let repeatsDone = 0;
let playing = false;
let items = [];
let audioCtx = null;
let shifter = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function stopShifter() {
  if (shifter) {
    shifter.disconnect();
    shifter = null;
  }
}

document.getElementById('filePicker').addEventListener('change', e => {
  const raw = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
  raw.sort((a, b) => a.name.localeCompare(b.name));
  files = raw;
  fileCount.textContent = files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : '';
  trackIndex = 0;
  repeatsDone = 0;
  playing = false;
  stopShifter();
  renderList();
  if (files.length) {
    playBtn.disabled = false;
    statusEl.textContent = 'ready';
    trackEl.textContent = '';
    progressEl.textContent = '';
  } else {
    statusEl.textContent = 'no audio files found';
    playBtn.disabled = true;
  }
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;
});

function renderList() {
  listEl.innerHTML = '';
  items = [];
  files.forEach(f => {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = f.name;
    listEl.appendChild(div);
    items.push(div);
  });
}

function updateList() {
  items.forEach((el, i) => {
    el.className = 'item' + (i < trackIndex ? ' done' : i === trackIndex ? ' current' : '');
  });
}

function updateProgress() {
  const repeats = parseInt(repeatInput.value) || 1;
  progressEl.textContent = `track ${trackIndex + 1}/${files.length} · repeat ${repeatsDone + 1}/${repeats}`;
}

async function loadTrack(index) {
  stopShifter();
  const file = files[index];
  trackEl.textContent = file.name;
  updateList();

  const ctx = getAudioCtx();
  await ctx.resume();

  const audioBuffer = await ctx.decodeAudioData(await file.arrayBuffer());

  let ended = false;
  shifter = new PitchShifter(ctx, audioBuffer, 4096, () => {
    if (ended) return;
    ended = true;
    onTrackEnd();
  });
  shifter.tempo = parseFloat(speedSlider.value);
  shifter.connect(ctx.destination);

  updateProgress();
}

function onTrackEnd() {
  const repeats = parseInt(repeatInput.value) || 1;
  repeatsDone++;
  if (repeatsDone < repeats) {
    loadTrack(trackIndex);
  } else {
    repeatsDone = 0;
    trackIndex++;
    if (trackIndex < files.length) {
      prevBtn.disabled = false;
      nextBtn.disabled = trackIndex === files.length - 1;
      loadTrack(trackIndex);
    } else {
      stopShifter();
      playing = false;
      trackIndex = 0;
      statusEl.textContent = 'done';
      trackEl.textContent = '';
      progressEl.textContent = '';
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      updateList();
    }
  }
}

playBtn.addEventListener('click', async () => {
  if (!files.length) return;
  playing = true;

  if (audioCtx && audioCtx.state === 'suspended' && shifter) {
    await audioCtx.resume();
  } else {
    await loadTrack(trackIndex);
  }

  statusEl.textContent = 'playing';
  playBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
  prevBtn.disabled = trackIndex === 0;
  nextBtn.disabled = trackIndex === files.length - 1;
  updateProgress();
});

pauseBtn.addEventListener('click', async () => {
  if (playing && audioCtx) {
    await audioCtx.suspend();
    playing = false;
    statusEl.textContent = 'paused';
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    prevBtn.disabled = trackIndex === 0;
    nextBtn.disabled = trackIndex === files.length - 1;
  }
});

stopBtn.addEventListener('click', async () => {
  stopShifter();
  if (audioCtx) await audioCtx.suspend();
  playing = false;
  trackIndex = 0;
  repeatsDone = 0;
  statusEl.textContent = 'stopped';
  trackEl.textContent = '';
  progressEl.textContent = '';
  playBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  updateList();
});

speedSlider.addEventListener('input', () => {
  const speed = parseFloat(speedSlider.value);
  speedLabel.textContent = speed.toFixed(2) + '×';
  if (shifter) shifter.tempo = speed;
});

async function jumpToTrack(index) {
  repeatsDone = 0;
  trackIndex = index;
  prevBtn.disabled = trackIndex === 0;
  nextBtn.disabled = trackIndex === files.length - 1;
  if (playing) {
    await loadTrack(trackIndex);
    statusEl.textContent = 'playing';
  } else {
    stopShifter();
    if (audioCtx) await audioCtx.suspend();
    trackEl.textContent = files[trackIndex].name;
    updateList();
    updateProgress();
    statusEl.textContent = 'paused';
  }
}

prevBtn.addEventListener('click', () => { if (trackIndex > 0) jumpToTrack(trackIndex - 1); });
nextBtn.addEventListener('click', () => { if (trackIndex < files.length - 1) jumpToTrack(trackIndex + 1); });
