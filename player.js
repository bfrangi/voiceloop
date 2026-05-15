const player = document.getElementById('player');
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
const fileCount = document.getElementById('fileCount');

let files = [];
let trackIndex = 0;
let repeatsDone = 0;
let playing = false;
let items = [];

document.getElementById('filePicker').addEventListener('change', e => {
  const raw = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
  raw.sort((a, b) => a.name.localeCompare(b.name));
  files = raw;
  fileCount.textContent = files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : '';
  trackIndex = 0;
  repeatsDone = 0;
  playing = false;
  player.src = '';
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
  files.forEach((f, i) => {
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

function loadTrack(index) {
  const url = URL.createObjectURL(files[index]);
  player.src = url;
  trackEl.textContent = files[index].name;
  updateList();
}

function updateProgress() {
  const repeats = parseInt(repeatInput.value) || 1;
  progressEl.textContent = `track ${trackIndex + 1}/${files.length} · repeat ${repeatsDone + 1}/${repeats}`;
}

playBtn.addEventListener('click', () => {
  if (!files.length) return;
  if (!playing) {
    playing = true;
    if (!player.src || player.ended || player.src === window.location.href) {
      trackIndex = 0;
      repeatsDone = 0;
      loadTrack(0);
    }
    player.play();
    statusEl.textContent = 'playing';
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    prevBtn.disabled = trackIndex === 0;
    nextBtn.disabled = trackIndex === files.length - 1;
    updateProgress();
  }
});

pauseBtn.addEventListener('click', () => {
  if (playing) {
    player.pause();
    playing = false;
    statusEl.textContent = 'paused';
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    prevBtn.disabled = trackIndex === 0;
    nextBtn.disabled = trackIndex === files.length - 1;
  }
});

stopBtn.addEventListener('click', () => {
  player.pause();
  player.src = '';
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

function jumpToTrack(index) {
  repeatsDone = 0;
  trackIndex = index;
  loadTrack(trackIndex);
  prevBtn.disabled = trackIndex === 0;
  nextBtn.disabled = trackIndex === files.length - 1;
  if (playing) {
    player.play();
    updateProgress();
  } else {
    updateProgress();
    statusEl.textContent = 'paused';
  }
}

prevBtn.addEventListener('click', () => {
  if (trackIndex > 0) jumpToTrack(trackIndex - 1);
});

nextBtn.addEventListener('click', () => {
  if (trackIndex < files.length - 1) jumpToTrack(trackIndex + 1);
});

player.addEventListener('ended', () => {
  const repeats = parseInt(repeatInput.value) || 1;
  repeatsDone++;
  if (repeatsDone < repeats) {
    player.currentTime = 0;
    player.play();
    updateProgress();
  } else {
    repeatsDone = 0;
    trackIndex++;
    if (trackIndex < files.length) {
      loadTrack(trackIndex);
      player.play();
      prevBtn.disabled = trackIndex === 0;
      nextBtn.disabled = trackIndex === files.length - 1;
      updateProgress();
    } else {
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
});
