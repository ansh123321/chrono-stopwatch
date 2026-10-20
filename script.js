/* ==========================================
   CHRONO — PREMIUM STOPWATCH ENGINE
   Accurate timing • Lap tracking • Shortcuts
========================================== */

"use strict";

// ==========================================
// 1. DOM ELEMENTS
// ==========================================

const hoursDisplay = document.getElementById("hours");
const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const millisecondsDisplay = document.getElementById("milliseconds");

const statusText = document.getElementById("statusText");

const startButton = document.getElementById("startButton");
const startButtonText = document.getElementById("startButtonText");
const startIcon = document.getElementById("startIcon");

const resetButton = document.getElementById("resetButton");
const lapButton = document.getElementById("lapButton");
const clearLapsButton = document.getElementById("clearLapsButton");

const lapList = document.getElementById("lapList");
const emptyState = document.getElementById("emptyState");

const lapCountDisplay = document.getElementById("lapCount");
const lapCounter = document.getElementById("lapCounter");
const lapFooterText = document.getElementById("lapFooterText");

const bestLapDisplay = document.getElementById("bestLap");
const sessionNumberDisplay = document.getElementById("sessionNumber");

// ==========================================
// 2. STOPWATCH STATE
// ==========================================

let isRunning = false;

let startTimestamp = 0;
let elapsedBeforeStart = 0;

let animationFrameId = null;

let laps = [];
let previousLapTime = 0;
let sessionNumber = 1;

// ==========================================
// 3. TIME FORMATTING
// ==========================================

function padNumber(number, length = 2) {
    return String(number).padStart(length, "0");
}

function formatTime(milliseconds) {
    const totalCentiseconds = Math.floor(
        Math.max(0, milliseconds) / 10
    );

    const centiseconds = totalCentiseconds % 100;

    const totalSeconds = Math.floor(totalCentiseconds / 100);
    const seconds = totalSeconds % 60;

    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;

    const hours = Math.floor(totalMinutes / 60);

    return (
        `${padNumber(hours)}:` +
        `${padNumber(minutes)}:` +
        `${padNumber(seconds)}.` +
        `${padNumber(centiseconds)}`
    );
}

function renderTimer(milliseconds) {
    const formatted = formatTime(milliseconds);
    const [time, centiseconds] = formatted.split(".");

    const [hours, minutes, seconds] = time.split(":");

    hoursDisplay.textContent = hours;
    minutesDisplay.textContent = minutes;
    secondsDisplay.textContent = seconds;
    millisecondsDisplay.textContent = centiseconds;
}

// ==========================================
// 4. TIMER UPDATE LOOP
// ==========================================

function getElapsedTime() {
    if (!isRunning) {
        return elapsedBeforeStart;
    }

    return (
        elapsedBeforeStart +
        (performance.now() - startTimestamp)
    );
}

function updateTimer() {
    renderTimer(getElapsedTime());

    if (isRunning) {
        animationFrameId = requestAnimationFrame(updateTimer);
    }
}

// ==========================================
// 5. INTERFACE STATE
// ==========================================

function updateControls() {
    startButtonText.textContent = isRunning
        ? "Pause timer"
        : elapsedBeforeStart > 0
            ? "Resume timer"
            : "Start timer";

    startIcon.textContent = isRunning ? "Ⅱ" : "▶";

    startButton.setAttribute(
        "aria-label",
        isRunning
            ? "Pause stopwatch (Space)"
            : "Start stopwatch (Space)"
    );

    statusText.textContent = isRunning
        ? "RUNNING"
        : elapsedBeforeStart > 0
            ? "PAUSED"
            : "READY";

    resetButton.disabled =
        isRunning || elapsedBeforeStart === 0;

    lapButton.disabled = !isRunning;

    updateLapSummary();
}

function updateLapSummary() {
    const count = laps.length;

    lapCountDisplay.textContent = padNumber(count);
    lapCounter.textContent = `${padNumber(count)} LAPS`;

    lapFooterText.textContent = count
        ? `${count} LAP${count === 1 ? "" : "S"} RECORDED`
        : "NO LAPS RECORDED YET";

    clearLapsButton.disabled = count === 0;

    if (count === 0) {
        bestLapDisplay.textContent = "--:--.--";
        return;
    }

    const bestLap = laps.reduce((best, lap) =>
        lap.splitTime < best.splitTime ? lap : best
    );

    bestLapDisplay.textContent = formatShortTime(
        bestLap.splitTime
    );
}

// ==========================================
// 6. START / PAUSE
// ==========================================

function startStopwatch() {
    if (isRunning) {
        pauseStopwatch();
        return;
    }

    startTimestamp = performance.now();
    isRunning = true;

    startButton.classList.add("is-running");

    updateControls();

    // Start one animation loop.
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(updateTimer);
}

function pauseStopwatch() {
    if (!isRunning) return;

    elapsedBeforeStart = getElapsedTime();
    isRunning = false;

    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;

    renderTimer(elapsedBeforeStart);

    startButton.classList.remove("is-running");

    updateControls();
}

// ==========================================
// 7. RESET
// ==========================================

function resetStopwatch() {
    if (isRunning) return;

    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;

    elapsedBeforeStart = 0;
    startTimestamp = 0;
    previousLapTime = 0;

    laps = [];
    sessionNumber++;

    renderTimer(0);

    sessionNumberDisplay.textContent = padNumber(
        sessionNumber
    );

    lapList.innerHTML = "";
    emptyState.hidden = false;

    startButton.classList.remove("is-running");

    updateControls();
}

// ==========================================
// 8. LAP TRACKING
// ==========================================

function formatShortTime(milliseconds) {
    const centiseconds = Math.floor(
        Math.max(0, milliseconds) / 10
    );

    const seconds = Math.floor(centiseconds / 100);
    const remainder = centiseconds % 100;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        `${padNumber(minutes)}:` +
        `${padNumber(remainingSeconds)}.` +
        `${padNumber(remainder)}`
    );
}

function recordLap() {
    if (!isRunning) return;

    const totalTime = getElapsedTime();

    const lap = {
        number: laps.length + 1,
        totalTime,
        splitTime: totalTime - previousLapTime
    };

    laps.push(lap);

    previousLapTime = totalTime;

    emptyState.hidden = true;

    renderLapHistory();
    updateControls();
}

function renderLapHistory() {
    lapList.innerHTML = "";

    if (laps.length === 0) {
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    const bestLap = laps.reduce((best, lap) =>
        lap.splitTime < best.splitTime ? lap : best
    );

    const slowestLap = laps.reduce((slowest, lap) =>
        lap.splitTime > slowest.splitTime ? lap : slowest
    );

    // Newest laps appear first.
    [...laps].reverse().forEach((lap) => {
        const row = document.createElement("div");
        row.className = "lap-row";

        if (lap.number === bestLap.number) {
            row.classList.add("best");
        }

        if (
            laps.length > 1 &&
            lap.number === slowestLap.number &&
            lap.number !== bestLap.number
        ) {
            row.classList.add("slowest");
        }

        const numberCell = document.createElement("span");
        numberCell.className = "lap-number";
        numberCell.textContent = `#${padNumber(lap.number)}`;

        const splitCell = document.createElement("span");
        splitCell.className = "lap-time";
        splitCell.textContent = formatShortTime(lap.splitTime);

        const totalCell = document.createElement("span");
        totalCell.className = "lap-total";
        totalCell.textContent = formatShortTime(lap.totalTime);

        const performanceCell = document.createElement("span");
        performanceCell.className = "lap-performance";

        const tag = document.createElement("span");
        tag.className = "performance-tag";

        if (lap.number === bestLap.number) {
            tag.textContent = "BEST";
        } else if (
            laps.length > 1 &&
            lap.number === slowestLap.number
        ) {
            tag.textContent = "SLOWEST";
        } else {
            tag.textContent = "RECORDED";
        }

        performanceCell.appendChild(tag);

        row.append(
            numberCell,
            splitCell,
            totalCell,
            performanceCell
        );

        lapList.appendChild(row);
    });
}

// ==========================================
// 9. CLEAR LAP HISTORY
// ==========================================

function clearLapHistory() {
    laps = [];
    previousLapTime = 0;

    lapList.innerHTML = "";
    emptyState.hidden = false;

    updateControls();
}

// ==========================================
// 10. KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener("keydown", (event) => {
    // Don't hijack keyboard input inside interactive fields.
    const target = event.target;

    if (
        target instanceof HTMLElement &&
        (
            target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        )
    ) {
        return;
    }

    if (event.code === "Space") {
        event.preventDefault();
        startStopwatch();
    }

    if (event.key.toLowerCase() === "r") {
        resetStopwatch();
    }

    if (event.key.toLowerCase() === "l") {
        recordLap();
    }
});

// ==========================================
// 11. BUTTON EVENTS
// ==========================================

startButton.addEventListener("click", startStopwatch);
resetButton.addEventListener("click", resetStopwatch);
lapButton.addEventListener("click", recordLap);
clearLapsButton.addEventListener("click", clearLapHistory);

// ==========================================
// 12. INITIALIZE
// ==========================================

renderTimer(0);

sessionNumberDisplay.textContent = padNumber(sessionNumber);

updateControls();

console.log("CHRONO stopwatch initialized successfully.");