const chromatic = [
    { name: "C", label: "DO", black: false },
    { name: "C♯", label: "DO♯", black: true },
    { name: "D", label: "RE", black: false },
    { name: "D♯", label: "RE♯", black: true },
    { name: "E", label: "MI", black: false },
    { name: "F", label: "FA", black: false },
    { name: "F♯", label: "FA♯", black: true },
    { name: "G", label: "SOL", black: false },
    { name: "G♯", label: "SOL♯", black: true },
    { name: "A", label: "LA", black: false },
    { name: "A♯", label: "LA♯", black: true },
    { name: "B", label: "SI", black: false }
];
const keyboardRows = [
    ["z", "1", "x", "2", "c", "v", "3", "b", "4", "n", "5", "m", ","],
    ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "k"]
];
const sampleFiles = {
    c4: "do.ogg", d4: "re.ogg", e4: "me.ogg", f4: "fa.ogg", g4: "sol.ogg",
    a4: "la.ogg", b4: "si.ogg", c5: "do_h.ogg", "c♯4": "do_th.ogg",
    "d♯4": "re_th.ogg", "f♯4": "fa_th.ogg", "g♯4": "sol_th.ogg", "a♯4": "la_th.ogg"
};
const sampleMidi = {
    "do.ogg": 60, "do_th.ogg": 61, "re.ogg": 62, "re_th.ogg": 63,
    "me.ogg": 64, "fa.ogg": 65, "fa_th.ogg": 66, "sol.ogg": 67,
    "sol_th.ogg": 68, "la.ogg": 69, "la_th.ogg": 70, "si.ogg": 71,
    "do_h.ogg": 72
};
const notes = {};
for (let midi = 48; midi <= 72; midi += 1) {
    const octave = Math.floor(midi / 12) - 1;
    const definition = chromatic[midi % 12];
    const id = `${definition.name.toLowerCase().replace("♯", "s")}${octave}`;
    const pitchKey = `${definition.name.toLowerCase()}${octave}`;
    notes[id] = {
        label: definition.label,
        pitch: `${definition.name}${octave}`,
        midi,
        frequency: 440 * Math.pow(2, (midi - 69) / 12),
        black: definition.black,
        keyboard: octave === 4 ? keyboardRows[1][midi - 60] : octave === 3 ? keyboardRows[0][midi - 48] : "",
        file: sampleFiles[pitchKey] || sampleFiles[`${definition.name.toLowerCase()}4`] || null
    };
}

const melodies = {
    sunrise: ["c4", "d4", "e4", "g4"],
    bunny: ["c4", "e4", "g4", "e4", "c4"],
    stars: ["c4", "e4", "g4", "c5", "b4", "g4", "c5"]
};

const modeDetails = {
    free: {
        badge: "FREE PLAY",
        title: "Explore the keys",
        description: "There are no wrong notes here. Make a melody and have fun!"
    },
    learn: {
        badge: "LEARN NOTES",
        title: "Follow the glowing notes",
        description: "Play the note shown above the piano to complete Sunny Steps."
    },
    challenge: {
        badge: "30 SEC CHALLENGE",
        title: "How many can you catch?",
        description: "Follow the notes before the clock runs out. Build a big streak!"
    }
};

const state = {
    mode: "free",
    song: localStorage.getItem("flat-piano-song") || "sunrise",
    sequence: [],
    noteIndex: 0,
    roundActive: false,
    score: Number(localStorage.getItem("flat-piano-score") || 0),
    streak: 0,
    notesPlayed: Number(localStorage.getItem("flat-piano-notes") || 0),
    volume: Number(localStorage.getItem("flat-piano-volume") || 75),
    voice: localStorage.getItem("flat-piano-voice") || "piano",
    sustain: localStorage.getItem("flat-piano-sustain") === "on",
    soundOn: localStorage.getItem("flat-piano-sound") !== "off",
    dark: localStorage.getItem("flat-piano-theme") === "dark",
    metronome: false,
    tempo: Number(localStorage.getItem("flat-piano-tempo") || 90),
    recording: false,
    recordingStartedAt: 0,
    recordedNotes: [],
    replayTimers: [],
    loopReplay: false,
    roundStats: { hits: 0, misses: 0, bestStreak: 0, timingHits: 0 },
    noteStartedAt: 0,
    timeLeft: 30,
    timer: null,
    metronomeTimer: null,
    nextClickTime: 0
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const scoreEl = $("#score");
const streakEl = $("#streak");
const levelEl = $("#level");
const xpLabelEl = $("#xp-label");
const xpPercentEl = $("#xp-percent");
const xpBarEl = $("#xp-bar");
const missionBarEl = $("#mission-bar");
const missionLabelEl = $("#mission-label");
const lessonPanel = $("#lesson-panel");
const toastEl = $("#toast");

function noteLabel(note) {
    return notes[note]?.label || note.toUpperCase();
}

function notePitch(note) {
    return notes[note]?.pitch || "";
}

function currentLevel() {
    return Math.min(9, Math.floor(state.score / 100) + 1);
}

function levelName(level) {
    return ["starter", "listener", "learner", "player", "groover", "creator", "performer", "maestro", "star"][level - 1];
}

function saveProgress() {
    localStorage.setItem("flat-piano-score", state.score);
    localStorage.setItem("flat-piano-notes", state.notesPlayed);
    localStorage.setItem("flat-piano-song", state.song);
}

function renderStats() {
    const level = currentLevel();
    const xp = state.score % 100;
    scoreEl.textContent = String(state.score).padStart(4, "0");
    streakEl.innerHTML = `${state.streak} <i>notes</i>`;
    levelEl.innerHTML = `${level} <i>${levelName(level)}</i>`;
    xpLabelEl.textContent = state.score ? `${xp} / 100 to level ${Math.min(level + 1, 9)}` : "Ready to play";
    xpPercentEl.textContent = `${xp}%`;
    xpBarEl.style.width = `${xp}%`;
    const missionProgress = Math.min(100, state.notesPlayed * 10);
    missionBarEl.style.width = `${missionProgress}%`;
    missionLabelEl.textContent = state.notesPlayed >= 10 ? "Mission complete · first star earned" : `${state.notesPlayed} / 10 notes played`;
}

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

let audioContext;
let masterGain;
let sampleLoadPromise;
const sampleBuffers = new Map();

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.connect(audioContext.destination);
    }
    if (audioContext.state === "suspended") audioContext.resume();
    masterGain.gain.setTargetAtTime(state.volume / 100, audioContext.currentTime, .02);
    return audioContext;
}

function sampleExtension() {
    const audio = document.createElement("audio");
    return audio.canPlayType("audio/ogg; codecs=\"vorbis\"") ? ".ogg" : ".m4a";
}

function loadSamples() {
    if (sampleLoadPromise) return sampleLoadPromise;
    const context = getAudioContext();
    const extension = sampleExtension();
    const files = [...new Set(Object.values(sampleFiles))];
    sampleLoadPromise = Promise.all(files.map(async (file) => {
        const source = file.replace(".ogg", extension);
        try {
            const response = await fetch(`media/${source}`);
            if (!response.ok) throw new Error(`Could not load ${source}`);
            sampleBuffers.set(file, await context.decodeAudioData(await response.arrayBuffer()));
        } catch (error) {
            // The synthesized voice remains available when a sample cannot be decoded.
        }
    }));
    return sampleLoadPromise;
}

function playSample(note, when) {
    const context = getAudioContext();
    const definition = notes[note];
    const buffer = sampleBuffers.get(definition.file);
    if (!buffer) return false;
    const source = context.createBufferSource();
    const envelope = context.createGain();
    const startAt = Math.max(when || context.currentTime, context.currentTime);
    const duration = state.sustain ? 1.8 : .9;
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2, (definition.midi - sampleMidi[definition.file]) / 12);
    envelope.gain.setValueAtTime(.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(.72, startAt + .008);
    envelope.gain.setTargetAtTime(.0001, startAt + duration * .55, duration * .18);
    source.connect(envelope);
    envelope.connect(masterGain);
    source.start(startAt);
    source.stop(startAt + duration + .25);
    return true;
}

function playSynth(note, voice = state.voice, when) {
    const context = getAudioContext();
    const now = Math.max(when || context.currentTime, context.currentTime);
    const frequency = notes[note].frequency;
    const isBell = voice === "bell";
    const isOrgan = voice === "organ";
    const isPad = voice === "pad";
    const duration = state.sustain ? (isBell ? 2.5 : isPad ? 2.2 : 1.5) : (isBell ? 1.3 : isPad ? 1.5 : .75);
    const output = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = isBell ? 3600 : isOrgan ? 2400 : isPad ? 1300 : 1900;
    filter.Q.value = .5;
    output.gain.setValueAtTime(.0001, now);
    output.gain.exponentialRampToValueAtTime(isBell ? .18 : isPad ? .12 : .24, now + (isPad ? .08 : .012));
    output.gain.exponentialRampToValueAtTime(.0001, now + duration);
    output.connect(filter);
    filter.connect(masterGain);

    const voices = isBell
        ? [{ type: "sine", ratio: 1, gain: .9 }, { type: "sine", ratio: 2.01, gain: .28 }, { type: "triangle", ratio: 3.01, gain: .11 }]
        : isOrgan
            ? [{ type: "sine", ratio: 1, gain: .55 }, { type: "sine", ratio: 2, gain: .22 }, { type: "triangle", ratio: 3, gain: .08 }]
            : isPad
                ? [{ type: "sine", ratio: .997, gain: .65 }, { type: "triangle", ratio: 1.005, gain: .2 }, { type: "sine", ratio: 2, gain: .08 }]
                : [{ type: "triangle", ratio: 1, gain: .8 }, { type: "sine", ratio: 2, gain: .12 }];
    voices.forEach((voice) => {
        const oscillator = context.createOscillator();
        const voiceGain = context.createGain();
        oscillator.type = voice.type;
        oscillator.frequency.value = frequency * voice.ratio;
        voiceGain.gain.value = voice.gain;
        oscillator.connect(voiceGain);
        voiceGain.connect(output);
        oscillator.start(now);
        oscillator.stop(now + duration + .05);
    });
}

function playAudio(note, when) {
    if (!state.soundOn || state.volume === 0 || !notes[note]) return;
    if (state.voice === "piano" && notes[note].file && playSample(note, when)) return;
    playSynth(note, state.voice === "piano" ? "felt" : state.voice, when);
    if (state.voice === "piano") loadSamples();
}

function pressKey(note) {
    const key = document.querySelector(`[data-note="${note}"]`);
    if (!key) return;
    key.classList.add("pressed");
    setTimeout(() => key.classList.remove("pressed"), 130);
}

function createSparkles() {
    for (let i = 0; i < 9; i += 1) {
        const sparkle = document.createElement("span");
        sparkle.className = "sparkle-pop";
        sparkle.textContent = ["✦", "✧", "•"][i % 3];
        sparkle.style.setProperty("--x", `${15 + Math.random() * 70}%`);
        sparkle.style.setProperty("--y", `${20 + Math.random() * 55}%`);
        sparkle.style.setProperty("--delay", `${i * 25}ms`);
        lessonPanel.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 700);
    }
}

function updateLessonPanel() {
    const detail = modeDetails[state.mode];
    $("#mode-badge").textContent = detail.badge;
    $("#mode-title").textContent = detail.title;
    $("#mode-description").textContent = detail.description;
    const targetCaption = $("#target-caption");
    const targetNote = $("#target-note");
    const roundButton = $("#round-button");
    const dots = $("#note-dots");

    dots.innerHTML = "";
    if (state.mode === "free") {
        targetCaption.textContent = "YOUR TURN";
        targetNote.innerHTML = "<strong>♪</strong><small>Choose a note</small>";
        roundButton.innerHTML = "Try Learn Notes <span>→</span>";
        return;
    }

    if (state.mode === "challenge") {
        targetCaption.textContent = state.roundActive ? `TIME ${state.timeLeft}s` : "READY?";
    } else {
        targetCaption.textContent = state.roundActive ? "PLAY THIS" : "NEXT NOTE";
    }
    targetNote.innerHTML = state.roundActive
        ? `<strong>${noteLabel(state.sequence[state.noteIndex])}</strong><small>${notePitch(state.sequence[state.noteIndex])}</small>`
        : "<strong>♪</strong><small>Start a round</small>";
    state.sequence.forEach((note, index) => {
        const dot = document.createElement("span");
        dot.className = index < state.noteIndex ? "done" : index === state.noteIndex && state.roundActive ? "current" : "";
        dot.setAttribute("aria-label", noteLabel(note));
        dots.appendChild(dot);
    });
    if (state.roundActive) {
        roundButton.innerHTML = "Reset round <span>↻</span>";
    } else {
        roundButton.innerHTML = state.mode === "challenge" ? "Start challenge <span>→</span>" : "Start a round <span>→</span>";
    }
}

function setMode(mode) {
    stopTimer();
    state.mode = mode;
    state.roundActive = false;
    state.noteIndex = 0;
    state.sequence = melodies[state.song].slice();
    $$(".mode-tab").forEach((tab) => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
    });
    updateLessonPanel();
}

function startRound() {
    if (state.mode === "free") {
        setMode("learn");
    }
    state.sequence = melodies[state.song].slice();
    state.noteIndex = 0;
    state.roundActive = true;
    state.timeLeft = 30;
    state.noteStartedAt = performance.now();
    state.roundStats = { hits: 0, misses: 0, bestStreak: 0, timingHits: 0 };
    if (state.mode === "challenge") {
        state.timer = setInterval(() => {
            state.timeLeft -= 1;
            updateLessonPanel();
            if (state.timeLeft <= 0) finishRound(false);
        }, 1000);
    }
    updateLessonPanel();
    showToast(state.mode === "challenge" ? "The clock is running. Good luck." : "Your melody is ready.");
}

function stopTimer() {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
}

function finishRound(completed) {
    stopTimer();
    state.roundActive = false;
    if (completed) {
        state.score += state.mode === "challenge" ? 75 : 50;
        state.streak += 2;
        renderStats();
        createSparkles();
        showToast(state.mode === "challenge" ? "Challenge complete. Beautiful work." : "Melody complete. Well played.");
        $("#encouragement").textContent = "You just made music — that was brilliant!";
    } else {
        state.streak = 0;
        showToast("Time's up! Try again and beat your score.");
    }
    saveProgress();
    updateLessonPanel();
    showSummary(completed);
}

function handleGameNote(note) {
    if (!state.roundActive) return;
    const target = state.sequence[state.noteIndex];
    if (note === target) {
        const expectedInterval = 60000 / state.tempo;
        const timeSinceTarget = performance.now() - state.noteStartedAt;
        state.roundStats.hits += 1;
        if (state.metronome && Math.abs(timeSinceTarget - expectedInterval) <= expectedInterval * .35) state.roundStats.timingHits += 1;
        state.noteIndex += 1;
        state.streak += 1;
        state.roundStats.bestStreak = Math.max(state.roundStats.bestStreak, state.streak);
        state.score += state.mode === "challenge" ? 15 : 10;
        createSparkles();
        if (state.noteIndex >= state.sequence.length) {
            finishRound(true);
        } else {
            showToast(`Nice. ${noteLabel(note)} was right.`);
        }
    } else {
        state.roundStats.misses += 1;
        state.streak = 0;
        lessonPanel.classList.remove("mistake");
        void lessonPanel.offsetWidth;
        lessonPanel.classList.add("mistake");
        showToast(`Almost. Try ${noteLabel(target)}.`);
    }
    state.noteStartedAt = performance.now();
    renderStats();
    updateLessonPanel();
    saveProgress();
}

function showSummary(completed) {
    const total = state.roundStats.hits + state.roundStats.misses;
    const accuracy = total ? Math.round((state.roundStats.hits / total) * 100) : 0;
    $("#summary-title").textContent = completed ? "A lovely little performance." : "That was a useful practice run.";
    $("#summary-copy").textContent = state.metronome
        ? state.roundStats.timingHits
            ? `${state.roundStats.timingHits} notes landed within the beat window.`
            : "Try once more with the metronome and listen for an even pulse."
        : completed
            ? `You played all ${state.roundStats.hits} notes in the melody.`
            : "Your notes are saved in this summary. Try the melody once more.";
    $("#summary-accuracy").textContent = `${accuracy}%`;
    $("#summary-notes").textContent = String(state.roundStats.hits);
    $("#summary-streak").textContent = String(state.roundStats.bestStreak);
    const modal = $("#summary-modal");
    state.summaryReturnFocus = document.activeElement;
    modal.hidden = false;
    $(".summary-card").focus();
}

function closeSummary() {
    $("#summary-modal").hidden = true;
    if (state.summaryReturnFocus?.focus) state.summaryReturnFocus.focus();
}

function stopReplay() {
    state.replayTimers.forEach((timer) => clearTimeout(timer));
    state.replayTimers = [];
}

function replayRecording() {
    if (!state.recordedNotes.length) {
        showToast("Record a few notes first.");
        return;
    }
    stopReplay();
    const speed = Number($("#replay-speed").value);
    const context = getAudioContext();
    const startAt = context.currentTime + .06;
    const duration = state.recordedNotes[state.recordedNotes.length - 1].time / speed;
    state.recordedNotes.forEach((recorded) => {
        playAudio(recorded.note, startAt + (recorded.time / speed / 1000));
        const timer = setTimeout(() => {
            pressKey(recorded.note);
        }, recorded.time / speed);
        state.replayTimers.push(timer);
    });
    const endTimer = setTimeout(() => {
        state.replayTimers = [];
        if (state.loopReplay) replayRecording();
    }, duration + 400);
    state.replayTimers.push(endTimer);
    showToast(`${state.loopReplay ? "Looping" : "Playing"} your recording.`);
}

function toggleRecording() {
    state.recording = !state.recording;
    const button = $("#record-toggle");
    button.classList.toggle("recording", state.recording);
    button.setAttribute("aria-pressed", String(state.recording));
    if (state.recording) {
        state.recordedNotes = [];
        state.recordingStartedAt = performance.now();
        button.innerHTML = "■ STOP";
        $("#replay-button").disabled = true;
        showToast("Recording started.");
    } else {
        button.innerHTML = "● RECORD";
        $("#replay-button").disabled = !state.recordedNotes.length;
        showToast(state.recordedNotes.length ? `${state.recordedNotes.length} notes recorded.` : "Nothing recorded yet.");
    }
}

function playMetronomeTick(when = getAudioContext().currentTime) {
    if (!state.soundOn || state.volume === 0) return;
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(.12, when + .005);
    gain.gain.exponentialRampToValueAtTime(.0001, when + .08);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(when);
    oscillator.stop(when + .1);
}

function scheduleMetronome() {
    const context = getAudioContext();
    while (state.nextClickTime < context.currentTime + .12) {
        playMetronomeTick(state.nextClickTime);
        state.nextClickTime += 60 / state.tempo;
    }
}

function toggleMetronome() {
    state.metronome = !state.metronome;
    const button = $("#metronome-toggle");
    button.classList.toggle("on", state.metronome);
    button.setAttribute("aria-pressed", String(state.metronome));
    button.innerHTML = `METRO <i>${state.metronome ? "ON" : "OFF"}</i>`;
    if (state.metronome) {
        state.nextClickTime = getAudioContext().currentTime + .04;
        scheduleMetronome();
        state.metronomeTimer = setInterval(scheduleMetronome, 25);
    } else {
        clearInterval(state.metronomeTimer);
    }
}

function handleMidiMessage(event) {
    const [status, midiNumber, velocity] = event.data;
    const command = status & 0xf0;
    const matched = Object.entries(notes).find(([, note]) => note.midi === midiNumber);
    if (!matched) return;
    const [id] = matched;
    if (command === 0x90 && velocity > 0) playNote(id);
    if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        const key = document.querySelector(`[data-note="${id}"]`);
        if (key) key.classList.remove("pressed");
    }
}

async function connectMidi() {
    const button = $("#midi-toggle");
    if (!navigator.requestMIDIAccess) {
        showToast("MIDI is not supported in this browser.");
        return;
    }
    try {
        const access = await navigator.requestMIDIAccess();
        state.midiAccess = access;
        access.inputs.forEach((input) => { input.onmidimessage = handleMidiMessage; });
        button.classList.add("on");
        button.textContent = access.inputs.size ? "MIDI ON" : "MIDI READY";
        showToast(access.inputs.size ? "MIDI keyboard connected." : "MIDI is ready. Connect a keyboard.");
    } catch (error) {
        showToast("MIDI connection was not allowed.");
    }
}

function playNote(note) {
    pressKey(note);
    playAudio(note);
    if (state.recording) state.recordedNotes.push({ note, time: performance.now() - state.recordingStartedAt });
    state.notesPlayed += 1;
    if (state.mode === "free") {
        state.score += 1;
        state.streak = Math.min(state.streak + 1, 99);
    } else {
        handleGameNote(note);
    }
    renderStats();
    saveProgress();
    if (state.notesPlayed === 10) showToast("Mission complete. First star earned.");
}

function chooseSong(song) {
    if (!melodies[song]) return;
    state.song = song;
    $$(".song-option").forEach((option) => option.classList.toggle("selected", option.dataset.song === song));
    setMode(state.mode);
    saveProgress();
    const songNames = { sunrise: "Sunny Steps", bunny: "Bunny Hop", stars: "Star Sparkle" };
    showToast(`${songNames[song]} selected.`);
}

function toggleSound() {
    state.soundOn = !state.soundOn;
    $("#sound-toggle").textContent = state.soundOn ? "◖" : "○";
    $("#sound-toggle").setAttribute("aria-label", state.soundOn ? "Mute sound" : "Turn sound on");
    localStorage.setItem("flat-piano-sound", state.soundOn ? "on" : "off");
}

function updateSustainButton() {
    const button = $("#sustain-toggle");
    button.classList.toggle("on", state.sustain);
    button.setAttribute("aria-pressed", String(state.sustain));
    button.innerHTML = `SUSTAIN <i>${state.sustain ? "ON" : "OFF"}</i>`;
}

function setupControls() {
    $("#volume").value = state.volume;
    $("#tempo").value = state.tempo;
    $("#tempo-value").textContent = state.tempo;
    $("#sound-toggle").textContent = state.soundOn ? "◖" : "○";
    if (state.dark) document.body.classList.add("dark");
    $$(".voice-option").forEach((option) => option.classList.toggle("active", option.dataset.voice === state.voice));
    $$(".song-option").forEach((option) => option.classList.toggle("selected", option.dataset.song === state.song));
    $("#sound-toggle").addEventListener("click", toggleSound);
    $("#theme-toggle").addEventListener("click", () => {
        state.dark = !state.dark;
        document.body.classList.toggle("dark", state.dark);
        $("#theme-toggle").setAttribute("aria-label", state.dark ? "Use dark theme" : "Use light theme");
        localStorage.setItem("flat-piano-theme", state.dark ? "dark" : "light");
    });
    $("#volume").addEventListener("input", (event) => {
        state.volume = Number(event.target.value);
        if (state.volume === 0 && state.soundOn) toggleSound();
        if (state.volume > 0 && !state.soundOn) toggleSound();
        localStorage.setItem("flat-piano-volume", state.volume);
    });
    $$(".voice-option").forEach((option) => option.addEventListener("click", () => {
        state.voice = option.dataset.voice;
        $$(".voice-option").forEach((item) => item.classList.toggle("active", item === option));
        localStorage.setItem("flat-piano-voice", state.voice);
        showToast(`${option.textContent.toLowerCase()} voice selected.`);
    }));
    updateSustainButton();
    $("#sustain-toggle").addEventListener("click", () => {
        state.sustain = !state.sustain;
        localStorage.setItem("flat-piano-sustain", state.sustain ? "on" : "off");
        updateSustainButton();
        showToast(state.sustain ? "Sustain is on." : "Sustain is off.");
    });
    $("#record-toggle").addEventListener("click", toggleRecording);
    $("#replay-button").addEventListener("click", replayRecording);
    $("#loop-toggle").addEventListener("click", () => {
        state.loopReplay = !state.loopReplay;
        const button = $("#loop-toggle");
        button.classList.toggle("on", state.loopReplay);
        button.setAttribute("aria-pressed", String(state.loopReplay));
        button.innerHTML = `LOOP <i>${state.loopReplay ? "ON" : "OFF"}</i>`;
    });
    $("#tempo").addEventListener("input", (event) => {
        state.tempo = Number(event.target.value);
        $("#tempo-value").textContent = state.tempo;
        localStorage.setItem("flat-piano-tempo", state.tempo);
        if (state.metronome) {
            clearInterval(state.metronomeTimer);
            state.nextClickTime = getAudioContext().currentTime + .04;
            state.metronomeTimer = setInterval(scheduleMetronome, 25);
        }
    });
    $("#metronome-toggle").addEventListener("click", toggleMetronome);
    $("#midi-toggle").addEventListener("click", connectMidi);
    $("#summary-close").addEventListener("click", closeSummary);
    $("#summary-replay").addEventListener("click", () => {
        closeSummary();
        startRound();
    });
    $("#summary-modal").addEventListener("click", (event) => {
        if (event.target.id === "summary-modal") closeSummary();
    });
    $("#summary-modal").addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeSummary();
        if (event.key !== "Tab") return;
        const focusable = $$("#summary-modal button:not(:disabled)");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === $(".summary-card"))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
    $("#round-button").addEventListener("click", () => {
        if (state.mode === "free" || !state.roundActive) startRound();
        else {
            state.roundActive = false;
            stopTimer();
            updateLessonPanel();
        }
    });
    $$(".mode-tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
    $$(".mode-tab").forEach((tab, index, tabs) => tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        setMode(tabs[nextIndex].dataset.mode);
    }));
    $$(".song-option").forEach((option) => option.addEventListener("click", () => chooseSong(option.dataset.song)));
    $("#shuffle-song").addEventListener("click", () => chooseSong(state.song === "sunrise" ? "bunny" : "sunrise"));
}

function buildPiano() {
    const piano = $("#piano");
    const whiteKeys = [];
    const blackKeys = [];
    let whiteIndex = 0;
    Object.entries(notes).forEach(([id, note]) => {
        const keyText = note.keyboard ? `<span class="key-letter">${note.keyboard.toUpperCase()}</span>` : "";
        const ariaKey = note.keyboard ? `, keyboard ${note.keyboard.toUpperCase()}` : "";
        const button = `<button class="piano-key ${note.black ? "black-key" : "white-key"}" data-note="${id}" ${note.keyboard ? `data-key="${note.keyboard}"` : ""} aria-label="${note.label}, ${note.pitch}${ariaKey}">${note.black ? `<span>${note.keyboard ? note.keyboard.toUpperCase() : "♯"}</span>` : `${keyText}<strong>${note.label}</strong><small>${note.pitch}</small>`}</button>`;
        if (note.black) blackKeys.push({ button, whiteIndex });
        else {
            whiteKeys.push(button);
            whiteIndex += 1;
        }
    });
    const blackMarkup = blackKeys.map((key) => key.button.replace("black-key", `black-key" style="--white-index:${key.whiteIndex}`)).join("");
    piano.innerHTML = `<div class="white-keys">${whiteKeys.join("")}</div><div class="black-keys">${blackMarkup}</div>`;
}

function setupPiano() {
    buildPiano();
    $$(".piano-key").forEach((key) => {
        key.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            loadSamples();
            key.dataset.pointerAt = String(Date.now());
            playNote(key.dataset.note);
        });
        key.addEventListener("click", () => {
            if (Date.now() - Number(key.dataset.pointerAt || 0) < 400) return;
            playNote(key.dataset.note);
        });
        key.addEventListener("pointerup", () => key.classList.remove("pressed"));
        key.addEventListener("pointercancel", () => key.classList.remove("pressed"));
    });
    window.addEventListener("keydown", (event) => {
        if (event.target.matches("input")) return;
        const key = event.key.toLowerCase();
        const pianoKey = document.querySelector(`[data-key="${key}"]`);
        if (!pianoKey || event.repeat) return;
        event.preventDefault();
        loadSamples();
        pianoKey.classList.add("pressed");
        playNote(pianoKey.dataset.note);
    });
    window.addEventListener("keyup", (event) => {
        const pianoKey = document.querySelector(`[data-key="${event.key.toLowerCase()}"]`);
        if (pianoKey) pianoKey.classList.remove("pressed");
    });
}

renderStats();
setupControls();
setupPiano();
setMode(state.mode);

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
        // Offline installation is optional when the browser blocks service workers.
    });
}
