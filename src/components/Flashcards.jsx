
import { useEffect, useMemo, useState } from "react";

const KEY = "taskflow_ai_study_material";
const BOOKMARK_KEY = "taskflow_bookmarked_flashcards";

const TABS = [
  ["key-points", "Key Points"],
  ["detailed", "Detailed Summary"],
  ["questions", "Important Questions"],
  ["flashcards", "Flashcards"],
  ["quiz", "Quiz"],
];

function loadMaterial() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));

    if (!saved || typeof saved !== "object") return null;

    const summary =
      saved.summary && typeof saved.summary === "object"
        ? saved.summary
        : {
            shortSummary:
              typeof saved.summary === "string" ? saved.summary : "",
            detailedSummary: "",
            keyPoints: [],
            importantQuestions: [],
          };

    return {
      ...saved,
      summary: {
        ...summary,
        keyPoints: Array.isArray(summary.keyPoints)
          ? summary.keyPoints
          : [],
        detailedSummary:
          typeof summary.detailedSummary === "string"
            ? summary.detailedSummary
            : "",
        importantQuestions: Array.isArray(summary.importantQuestions)
          ? summary.importantQuestions
          : [],
      },
      flashcards: Array.isArray(saved.flashcards)
        ? saved.flashcards.filter(
            (card) =>
              card &&
              typeof card.question === "string" &&
              typeof card.answer === "string"
          )
        : [],
      quiz: Array.isArray(saved.quiz)
        ? saved.quiz.filter(
            (item) =>
              item &&
              typeof item.question === "string" &&
              typeof item.answer === "string"
          )
        : [],
    };
  } catch {
    return null;
  }
}

function loadBookmarks() {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function Flashcards() {
  const [material] = useState(loadMaterial);

  const [tab, setTab] = useState(
    () => localStorage.getItem("taskflow_study_active_tab") || "key-points"
  );

  // Flashcard states
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState({});
  const [bookmarkedCards, setBookmarkedCards] = useState(loadBookmarks);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  // Quiz states
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const [revealedQuestions, setRevealedQuestions] = useState({});

  const cards = useMemo(() => material?.flashcards || [], [material]);
  const card = cards[cardIndex];

  const quiz = useMemo(() => material?.quiz || [], [material]);
  const question = quiz[quizIndex];

  // One minute per question
  const totalQuizTime = quiz.length * 60;

  // Initialize timer when quiz material is loaded
  useEffect(() => {
    if (quiz.length > 0) {
      setTimeLeft(totalQuizTime);
    }
  }, [totalQuizTime, quiz.length]);

  // Countdown while Quiz tab is open
  useEffect(() => {
    if (
      tab !== "quiz" ||
      submitted ||
      timeLeft === null ||
      timeLeft <= 0
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) =>
        previous === null ? null : Math.max(0, previous - 1)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [tab, submitted, timeLeft]);

  // Automatically submit when time runs out
  useEffect(() => {
    if (
      tab === "quiz" &&
      timeLeft === 0 &&
      quiz.length > 0 &&
      !submitted
    ) {
      setSubmitted(true);
    }
  }, [tab, timeLeft, quiz.length, submitted]);

  // Save bookmarks whenever they change
  useEffect(() => {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarkedCards));
  }, [bookmarkedCards]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const changeTab = (next) => {
    setTab(next);
    localStorage.setItem("taskflow_study_active_tab", next);
  };

  const setAnswer = (index, answer) => {
    setAnswers((old) => ({
      ...old,
      [index]: answer,
    }));
  };

  // Flashcard functions
  const goToCard = (index) => {
    setCardIndex(index);
    setFlipped(false);
  };

  const nextCard = () => {
    goToCard((cardIndex + 1) % cards.length);
  };

  const markCard = (known) => {
    setKnownCards((old) => ({
      ...old,
      [cardIndex]: known,
    }));

    setFlipped(false);

    if (cardIndex < cards.length - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      setCardIndex(0);
    }
  };

  const shuffleCards = () => {
    if (cards.length <= 1) return;

    let randomIndex = cardIndex;

    while (randomIndex === cardIndex) {
      randomIndex = Math.floor(Math.random() * cards.length);
    }

    goToCard(randomIndex);
  };

  const restartCards = () => {
    setCardIndex(0);
    setFlipped(false);
    setKnownCards({});
    setShowBookmarkedOnly(false);
  };

  // Bookmark functions
  const getCardKey = (flashcard) =>
    `${flashcard.question}|||${flashcard.answer}`;

  const isBookmarked = (flashcard) =>
    bookmarkedCards.includes(getCardKey(flashcard));

  const toggleBookmark = (flashcard) => {
    const key = getCardKey(flashcard);

    setBookmarkedCards((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    );
  };

  const bookmarkedCardList = cards
    .map((flashcard, index) => ({ flashcard, index }))
    .filter(({ flashcard }) =>
      bookmarkedCards.includes(getCardKey(flashcard))
    );

  const knownCount = Object.values(knownCards).filter(Boolean).length;
  const progress = cards.length
    ? Math.round((knownCount / cards.length) * 100)
    : 0;

  // Quiz score
  const score = quiz.reduce(
    (sum, item, index) =>
      sum +
      (String(answers[index] || "").trim().toLowerCase() ===
      String(item.answer).trim().toLowerCase()
        ? 1
        : 0),
    0
  );

  const restartQuiz = () => {
    setAnswers({});
    setSubmitted(false);
    setQuizIndex(0);
    setTimeLeft(totalQuizTime);
  };

  if (!material) {
    return (
      <section className="ai-study-material tf-study-material">
        <div className="ai-empty-material">
          <div aria-hidden="true">▤</div>
          <h2>No study material yet</h2>
          <p>
            Upload a PDF in PDF Manager to create a summary, flashcards, and
            quiz.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ai-study-material tf-study-material">
      <header className="ai-material-header tf-study-header">
        <div>
          <span>STUDY MATERIAL</span>
          <h2>{material.documentName}</h2>
          <p>
            {cards.length} flashcards
            {" · "}
            {quiz.length} quiz questions
            {" · "}
            Generated{" "}
            {material.generatedAt
              ? new Date(material.generatedAt).toLocaleDateString()
              : "date unavailable"}
          </p>
        </div>
      </header>

      {/* STUDY MATERIAL TABS */}
      <nav
        className="ai-material-tabs tf-study-tabs"
        aria-label="Study material sections"
      >
        {TABS.map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={`tf-study-tab ${tab === id ? "active" : ""}`}
            onClick={() => changeTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* KEY POINTS */}
      {tab === "key-points" && (
        <div className="ai-summary-card">
          <h3>Key Points</h3>

          {material.summary?.keyPoints?.length > 0 ? (
            <ul>
              {material.summary.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          ) : (
            <p>No key points available.</p>
          )}
        </div>
      )}

      {/* DETAILED SUMMARY */}
      {tab === "detailed" && (
        <div className="ai-summary-card">
          <h3>Detailed Summary</h3>
          <p className="study-prewrap">
            {material.summary?.detailedSummary ||
              "No detailed summary available."}
          </p>
        </div>
      )}

      {/* IMPORTANT QUESTIONS */}
      {tab === "questions" && (
        <div className="ai-summary-card">
          <h3>Important Questions</h3>

          {material.summary?.importantQuestions?.length > 0 ? (
            <div className="study-question-list">
              {material.summary.importantQuestions.map((item, i) => {
                const questionItem =
                  typeof item === "string"
                    ? { question: item, answer: "" }
                    : item;

                return (
                  <article key={i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>

                    <div>
                      <strong>{questionItem.question}</strong>

                      {questionItem.answer && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedQuestions((previous) => ({
                                ...previous,
                                [i]: !previous[i],
                              }))
                            }
                          >
                            {revealedQuestions[i]
                              ? "Hide answer"
                              : "Show answer"}
                          </button>

                          {revealedQuestions[i] && (
                            <p>{questionItem.answer}</p>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>No important questions available.</p>
          )}
        </div>
      )}

      {/* INTERACTIVE FLASHCARDS */}
      {tab === "flashcards" && (
        <div className="tf-fc-container">
          {!card ? (
            <div className="ai-empty-material">
              <div aria-hidden="true">✦</div>
              <h3>No flashcards available</h3>
              <p>Upload a PDF to generate flashcards for this subject.</p>
            </div>
          ) : (
            <>
              <div className="tf-fc-heading">
                <div>
                  <span className="tf-fc-eyebrow">ACTIVE RECALL</span>
                  <h3>Test your knowledge</h3>
                  <p>Think of the answer, then flip the card to check.</p>
                </div>

                <div className="tf-fc-count">
                  <strong>{cardIndex + 1}</strong>
                  <span>/ {cards.length}</span>
                </div>
              </div>

              {/* BOOKMARK ACTIONS */}
              <div className="tf-fc-bookmark-actions">
                <button
                  type="button"
                  className={`tf-fc-bookmark-button ${
                    isBookmarked(card) ? "bookmarked" : ""
                  }`}
                  onClick={() => toggleBookmark(card)}
                >
                  {isBookmarked(card) ? "★ Bookmarked" : "☆ Bookmark"}
                </button>

                <button
                  type="button"
                  className={`tf-fc-bookmark-button ${
                    showBookmarkedOnly ? "bookmarked" : ""
                  }`}
                  onClick={() =>
                    setShowBookmarkedOnly((previous) => !previous)
                  }
                >
                  {showBookmarkedOnly
                    ? "Hide Bookmarked List"
                    : `View Bookmarked (${bookmarkedCardList.length})`}
                </button>
              </div>

              {/* BOOKMARKED FLASHCARD LIST */}
              {showBookmarkedOnly && (
                <div className="tf-fc-bookmarked-list">
                  <h3>⭐ Bookmarked Flashcards</h3>

                  {bookmarkedCardList.length === 0 ? (
                    <p>You haven't bookmarked any flashcards yet.</p>
                  ) : (
                    bookmarkedCardList.map(({ flashcard, index }) => (
                      <button
                        type="button"
                        key={getCardKey(flashcard)}
                        className={`tf-fc-bookmarked-item ${
                          index === cardIndex ? "active" : ""
                        }`}
                        onClick={() => {
                          goToCard(index);
                          setShowBookmarkedOnly(false);
                        }}
                      >
                        <span>{flashcard.question}</span>
                        <span>Open →</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="tf-fc-progress">
                <div className="tf-fc-progress-label">
                  <span>Cards mastered</span>
                  <strong>
                    {knownCount} of {cards.length}
                  </strong>
                </div>

                <div
                  className="tf-fc-progress-track"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="Flashcards mastered"
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>

              <button
                type="button"
                className={`tf-fc-card ${flipped ? "is-flipped" : ""}`}
                onClick={() => setFlipped((value) => !value)}
                aria-label={
                  flipped
                    ? "Show flashcard question"
                    : "Reveal flashcard answer"
                }
              >
                <span className="tf-fc-card-top">
                  <span className="tf-fc-card-label">
                    {flipped ? "✦ ANSWER" : "✧ QUESTION"}
                  </span>

                  <span className="tf-fc-flip-icon" aria-hidden="true">
                    ↻
                  </span>
                </span>

                <span className="tf-fc-card-content">
                  <span className="tf-fc-card-text">
                    {flipped ? card.answer : card.question}
                  </span>
                </span>

                <span className="tf-fc-card-bottom">
                  <span>{card.topic || "Study card"}</span>
                  <span>{card.difficulty || "Practice"}</span>
                </span>

                <span className="tf-fc-hint">
                  Click anywhere on the card to{" "}
                  {flipped ? "see question" : "reveal answer"}
                </span>
              </button>

              <div className="tf-fc-rating">
                <p>How well did you know this?</p>

                <div className="tf-fc-rating-actions">
                  <button
                    type="button"
                    className="tf-fc-review-button"
                    onClick={() => markCard(false)}
                  >
                    <span aria-hidden="true">↻</span>
                    Review again
                  </button>

                  <button
                    type="button"
                    className="tf-fc-known-button"
                    onClick={() => markCard(true)}
                  >
                    <span aria-hidden="true">✓</span>
                    Got it!
                  </button>
                </div>
              </div>

              <div className="tf-fc-navigation">
                <button
                  type="button"
                  className="tf-fc-nav-button"
                  disabled={cardIndex === 0}
                  onClick={() => goToCard(cardIndex - 1)}
                >
                  ← Previous
                </button>

                <div className="tf-fc-dots" aria-label="Flashcard position">
                  {cards.map((_, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`${i === cardIndex ? "active" : ""} ${
                        knownCards[i] ? "mastered" : ""
                      }`}
                      onClick={() => goToCard(i)}
                      aria-label={`Go to card ${i + 1}`}
                      title={`Card ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="tf-fc-nav-button"
                  onClick={nextCard}
                >
                  Next →
                </button>
              </div>

              <div className="tf-fc-utility-actions">
                <button type="button" onClick={shuffleCards}>
                  <span aria-hidden="true">⤨</span> Shuffle cards
                </button>

                <button type="button" onClick={restartCards}>
                  <span aria-hidden="true">⟲</span> Start over
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* QUIZ */}
      {tab === "quiz" && (
        <div className="ai-quiz-area">
          {!question ? (
            <p className="ai-empty-material">
              No quiz questions are available.
            </p>
          ) : submitted ? (
            <>
              {/* RESULT SUMMARY */}
              <section className="quiz-result-card">
                <div className="quiz-result-icon">!</div>

                <span className="quiz-result-label">QUIZ COMPLETED</span>

                <h2>{material.documentName || "Quiz"}</h2>

                <p className="quiz-result-description">
                  {timeLeft === 0
                    ? "Time is up! Your quiz was submitted automatically."
                    : "Your score and answer review are shown below."}
                </p>

                <div className="quiz-score-circle">
                  <strong>{score}</strong>
                  <span>/{quiz.length}</span>
                </div>

                <p className="quiz-percentage">
                  {quiz.length
                    ? Math.round((score / quiz.length) * 100)
                    : 0}
                  %
                </p>
              </section>

              {/* RESULT BUTTONS */}
              <div className="quiz-result-actions">
                <button
                  type="button"
                  onClick={() => changeTab("key-points")}
                >
                  ← Study Material
                </button>

                <button
                  type="button"
                  className="quiz-retake-button"
                  onClick={restartQuiz}
                >
                  Retake Quiz ↻
                </button>
              </div>

              {/* ANSWER REVIEW */}
              <section className="quiz-answer-review">
                <div className="quiz-review-heading">
                  <div>
                    <h3>Answer Review</h3>
                    <p>Review every response after your attempt.</p>
                  </div>

                  <div className="quiz-review-legend">
                    <span className="quiz-correct-badge">
                      ✓ {score} Correct
                    </span>

                    <span className="quiz-wrong-badge">
                      ✕ {quiz.length - score} Wrong
                    </span>
                  </div>
                </div>

                {quiz.map((item, i) => {
                  const userAnswer = answers[i] || "";

                  const correct =
                    userAnswer.trim().toLowerCase() ===
                    String(item.answer).trim().toLowerCase();

                  return (
                    <article
                      key={item.id || i}
                      className={`quiz-review-card ${
                        correct ? "review-is-correct" : "review-is-wrong"
                      }`}
                    >
                      <div className="quiz-review-top">
                        <span>
                          Q{String(i + 1).padStart(2, "0")} ·{" "}
                          {item.topic || "Quiz"}
                        </span>

                        <strong
                          className={
                            correct ? "text-correct" : "text-wrong"
                          }
                        >
                          {correct ? "✓ Correct" : "✕ Incorrect"}
                        </strong>
                      </div>

                      <h4>{item.question}</h4>

                      <div className="quiz-review-answer your-answer">
                        <span>Your Answer</span>
                        <strong>{userAnswer || "Not answered"}</strong>
                      </div>

                      <div className="quiz-review-answer correct-answer">
                        <span>Correct Answer</span>
                        <strong>{item.answer}</strong>
                      </div>

                      {item.explanation && (
                        <p className="quiz-review-explanation">
                          <strong>Explanation:</strong> {item.explanation}
                        </p>
                      )}
                    </article>
                  );
                })}
              </section>
            </>
          ) : (
            <>
              {/* QUESTION PROGRESS + TIMER */}
              <div className="tf-quiz-topbar">
                <div className="ai-progress">
                  Question {quizIndex + 1} of {quiz.length}

                  <span className="study-progress-track">
                    <span
                      style={{
                        width: `${
                          ((quizIndex + 1) / quiz.length) * 100
                        }%`,
                      }}
                    />
                  </span>
                </div>

                <div
                  className={`tf-quiz-timer ${
                    timeLeft !== null && timeLeft <= 60
                      ? "tf-quiz-timer-warning"
                      : ""
                  }`}
                  aria-live="polite"
                >
                  <span aria-hidden="true">◷</span>
                  <span>
                    {timeLeft === null ? "--:--" : formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* QUESTION CARD */}
              <div className="ai-question-card">
                <span>
                  {question.topic} · {question.difficulty}
                </span>

                <h3>{question.question}</h3>

                {question.type === "mcq" ||
                question.type === "true_false" ? (
                  <div className="ai-options">
                    {(
                      question.options ||
                      (question.type === "true_false"
                        ? ["True", "False"]
                        : [])
                    ).map((option, i) => (
                      <button
                        type="button"
                        key={i}
                        className={
                          answers[quizIndex] === option ? "selected" : ""
                        }
                        onClick={() => setAnswer(quizIndex, option)}
                      >
                        <span>
                          {question.type === "mcq"
                            ? String.fromCharCode(65 + i)
                            : "•"}
                        </span>
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    aria-label="Your answer"
                    rows="4"
                    value={answers[quizIndex] || ""}
                    onChange={(e) => setAnswer(quizIndex, e.target.value)}
                    placeholder="Write your answer…"
                  />
                )}
              </div>

              {/* QUIZ NAVIGATION */}
              <div className="ai-flashcard-controls">
                <button
                  type="button"
                  disabled={quizIndex === 0}
                  onClick={() => setQuizIndex(quizIndex - 1)}
                >
                  Previous
                </button>

                {quizIndex < quiz.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setQuizIndex(quizIndex + 1)}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSubmitted(true)}
                  >
                    Submit Quiz
                  </button>
                )}

                <button type="button" onClick={restartQuiz}>
                  Restart Quiz
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}