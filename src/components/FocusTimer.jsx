import { useEffect, useState } from "react";

const SETTINGS_KEY = "taskflow_timer_settings";
const SESSIONS_KEY = "taskflow_focus_sessions";

const DEFAULT_SETTINGS = {
  focus: 25,
  short: 5,
  long: 15,
};

const MODE_LABELS = {
  focus: "Focus Time",
  short: "Short Break",
  long: "Long Break",
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));

    return {
      ...DEFAULT_SETTINGS,
      ...saved,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || {};
  } catch {
    return {};
  }
}

function getToday() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function FocusTimer() {
  const [settings, setSettings] = useState(loadSettings);
  const [draftSettings, setDraftSettings] = useState(settings);

  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(
    settings.focus * 60
  );

  const [running, setRunning] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [sessions, setSessions] = useState(loadSessions);

  const [showSettings, setShowSettings] = useState(false);

  const totalSeconds = settings[mode] * 60;
  const completedToday = sessions[getToday()] || 0;

  // Keep the countdown accurate when the browser tab is inactive.
  useEffect(() => {
    if (!running || endTime === null) return;

    const interval = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);
    }, 250);

    return () => window.clearInterval(interval);
  }, [running, endTime]);

  // Record a completed focus session.
  useEffect(() => {
    if (!running || secondsLeft !== 0) return;

    setRunning(false);
    setEndTime(null);

    if (mode === "focus") {
      setSessions((previous) => {
        const today = getToday();

        const updated = {
          ...previous,
          [today]: (previous[today] || 0) + 1,
        };

        localStorage.setItem(
          SESSIONS_KEY,
          JSON.stringify(updated)
        );

        return updated;
      });
    }
  }, [secondsLeft, running, mode]);

  const startPauseTimer = () => {
    if (running) {
      // Calculate the actual remaining time before pausing.
      setSecondsLeft(
        Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      );
      setRunning(false);
      setEndTime(null);
    } else if (secondsLeft > 0) {
      setEndTime(Date.now() + secondsLeft * 1000);
      setRunning(true);
    }
  };

  const resetTimer = () => {
    setRunning(false);
    setEndTime(null);
    setSecondsLeft(totalSeconds);
  };

  const changeMode = (newMode) => {
    setRunning(false);
    setEndTime(null);
    setMode(newMode);
    setSecondsLeft(settings[newMode] * 60);
  };

  const saveSettings = (event) => {
    event.preventDefault();

    const updated = {};

    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      const value = Number(draftSettings[key]);

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 180
      ) {
        alert("Enter a whole number between 1 and 180 minutes.");
        return;
      }

      updated[key] = value;
    }

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(updated)
    );

    setSettings(updated);
    setSecondsLeft(updated[mode] * 60);
    setRunning(false);
    setEndTime(null);
    setShowSettings(false);
  };

  const minutes = String(
    Math.floor(secondsLeft / 60)
  ).padStart(2, "0");

  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const progress = Math.min(
    100,
    ((totalSeconds - secondsLeft) / totalSeconds) * 100
  );

  return (
    <section className="focus-section">
      <div className="section-heading">
        <div>
          <span className="section-label">
            STUDENT PRODUCTIVITY
          </span>
          <h2>Pomodoro Study Timer</h2>
          <p>Customize your study sessions and breaks.</p>
        </div>
      </div>

      <div className="focus-layout">
        <div className="focus-timer-card">
          {/* Timer modes */}
          <div className="focus-modes">
            {Object.keys(MODE_LABELS).map((key) => (
              <button
                key={key}
                type="button"
                className={mode === key ? "selected" : ""}
                onClick={() => changeMode(key)}
              >
                {MODE_LABELS[key]}
                <br />
                <small>{settings[key]} min</small>
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <div
            className="focus-clock"
            style={{
              background: `conic-gradient(
                #2563eb ${progress}%,
                #e2e8f0 ${progress}%
              )`,
            }}
          >
            <div className="focus-clock-inner">
              <span>{MODE_LABELS[mode]}</span>

              <strong>
                {minutes}:{seconds}
              </strong>
            </div>
          </div>

          {/* Timer controls */}
          <div className="focus-actions">
            <button
              type="button"
              className="primary-button"
              onClick={startPauseTimer}
              disabled={secondsLeft === 0}
            >
              {running ? "⏸ Pause" : "▶ Start"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={resetTimer}
            >
              ↻ Reset
            </button>
          </div>

          {/* Customization */}
          <button
            type="button"
            className="timer-settings-button"
            onClick={() => {
              setDraftSettings(settings);
              setShowSettings((previous) => !previous);
            }}
          >
            ⚙ Customize Timer
          </button>

          {showSettings && (
            <form
              className="timer-settings-form"
              onSubmit={saveSettings}
            >
              <h3>Set Your Study Time</h3>

              {Object.keys(MODE_LABELS).map((key) => (
                <div
                  className="timer-setting-row"
                  key={key}
                >
                  <label htmlFor={`duration-${key}`}>
                    {MODE_LABELS[key]}
                  </label>

                  <div>
                    <input
                      id={`duration-${key}`}
                      type="number"
                      min="1"
                      max="180"
                      step="1"
                      required
                      value={draftSettings[key]}
                      onChange={(event) =>
                        setDraftSettings((previous) => ({
                          ...previous,
                          [key]: event.target.value,
                        }))
                      }
                    />

                    <span>minutes</span>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="primary-button"
              >
                Save Durations
              </button>

              <p>
                Saving new durations will reset the
                current timer.
              </p>
            </form>
          )}

          {secondsLeft === 0 && (
            <p className="focus-finished">
              {mode === "focus"
                ? "Great work! Your focus session is complete."
                : "Break completed! Ready to study?"}
            </p>
          )}
        </div>

        {/* Daily statistics */}
        <div className="focus-info-card">
          <h3>Today's Progress</h3>

          <div className="focus-session-count">
            {completedToday}
          </div>

          <p>Completed focus sessions today</p>

          <div className="focus-guide">
            <h4>Your Study Schedule</h4>

            <p>Focus: {settings.focus} minutes</p>
            <p>Short Break: {settings.short} minutes</p>
            <p>Long Break: {settings.long} minutes</p>

            <p>
              Complete four focus sessions before
              taking a longer break.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FocusTimer;