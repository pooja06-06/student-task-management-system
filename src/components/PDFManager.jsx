import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  DEFAULT_SETTINGS,
  analyzeDocument,
  generateStudyMaterial,
} from "../services/studyGenerator";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const DOC_KEY = "taskflow_pdf_document";
const MATERIAL_KEY = "taskflow_ai_study_material";
const PREF_KEY = "taskflow_study_preferences";

function readStorage(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeDocument(value) {
  if (!value || typeof value !== "object") return null;

  const text =
    typeof value.text === "string"
      ? value.text
      : typeof value.extractedText === "string"
        ? value.extractedText
        : "";

  if (!text) return null;

  return {
    ...value,
    text,
    extractedText: text,
    documentName:
      typeof value.documentName === "string"
        ? value.documentName
        : "Saved PDF",
    pages: Number(value.pages || value.pageCount) || 0,
    pageCount: Number(value.pageCount || value.pages) || 0,
  };
}

function normalizeMaterial(value) {
  if (!value || typeof value !== "object") return null;

  const summary =
    value.summary && typeof value.summary === "object"
      ? value.summary
      : {
          shortSummary:
            typeof value.summary === "string" ? value.summary : "",
          detailedSummary: "",
          keyPoints: [],
          importantQuestions: [],
        };

  return {
    ...value,

    documentName:
      typeof value.documentName === "string"
        ? value.documentName
        : "Saved study material",

    summary: {
      keyPoints: Array.isArray(summary.keyPoints)
        ? summary.keyPoints
        : [],
      shortSummary: summary.shortSummary || "",
      detailedSummary: summary.detailedSummary || "",
      importantQuestions: Array.isArray(summary.importantQuestions)
        ? summary.importantQuestions
        : [],
    },

    topics: Array.isArray(value.topics)
      ? value.topics
          .map((topic) =>
            typeof topic === "string"
              ? {
                  title: topic,
                  description: "",
                  keyPoints: [],
                  sourceSection: "",
                }
              : topic && typeof topic === "object"
                ? {
                    ...topic,
                    keyPoints: Array.isArray(topic.keyPoints)
                      ? topic.keyPoints
                      : [],
                  }
                : null
          )
          .filter(
            (topic) => topic && typeof topic.title === "string"
          )
      : [],

    flashcards: Array.isArray(value.flashcards)
      ? value.flashcards.filter(
          (card) =>
            card &&
            typeof card.question === "string" &&
            typeof card.answer === "string"
        )
      : [],

    quiz: Array.isArray(value.quiz)
      ? value.quiz.filter(
          (item) =>
            item &&
            typeof item.question === "string" &&
            typeof item.answer === "string"
        )
      : [],
  };
}

function readPreferences() {
  const saved = readStorage(PREF_KEY, {});

  return {
    ...DEFAULT_SETTINGS,
    ...(saved && typeof saved === "object" ? saved : {}),
  };
}

async function extractPdf(file, onProgress) {
  const pdf = await pdfjsLib.getDocument({
    data: await file.arrayBuffer(),
  }).promise;

  const pages = [];

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    onProgress(
      `Extracting page ${pageNo} of ${pdf.numPages}…`
    );

    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();

    const rows = [];

    for (const item of content.items) {
      if (!item.str?.trim()) continue;

      const y = Math.round(item.transform?.[5] || 0);

      let row = rows.find(
        (candidate) => Math.abs(candidate.y - y) <= 2
      );

      if (!row) {
        row = {
          y,
          parts: [],
        };

        rows.push(row);
      }

      row.parts.push({
        x: item.transform?.[4] || 0,
        text: item.str,
      });
    }

    pages.push(
      rows
        .sort((a, b) => b.y - a.y)
        .map((row) =>
          row.parts
            .sort((a, b) => a.x - b.x)
            .map((part) => part.text)
            .join(" ")
        )
        .join("\n")
    );
  }

  return {
    text: pages.join("\n\n"),
    pages: pdf.numPages,
  };
}

export default function PDFManager({ onOpenQuizzes }) {
  const [document, setDocument] = useState(() =>
    normalizeDocument(readStorage(DOC_KEY))
  );

  const [material, setMaterial] = useState(() =>
    normalizeMaterial(readStorage(MATERIAL_KEY))
  );

  const [settings, setSettings] = useState(readPreferences);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [customCount, setCustomCount] = useState(() => ({
    flashcardCount: ![5, 10, 15, 20, 30].includes(
      settings.flashcardCount
    ),

    quizCount: ![5, 10, 15, 20, 30].includes(
      settings.quizCount
    ),
  }));

  const updateSettings = (next) => {
    const updated = {
      ...settings,
      ...next,
    };

    setSettings(updated);

    localStorage.setItem(
      PREF_KEY,
      JSON.stringify(updated)
    );
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setError("");
    setStatus("");
    setBusy(true);

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please choose a PDF file.");
      setBusy(false);
      return;
    }

    try {
      const extracted = await extractPdf(
        file,
        setStatus
      );

      if (!extracted.text.trim()) {
        throw new Error(
          "This PDF appears to be scanned or image-based. Text extraction is not available for this PDF."
        );
      }

      const analysis = analyzeDocument(
        extracted.text
      );

      const nextDocument = {
        documentName: file.name,
        pages: extracted.pages,
        pageCount: extracted.pages,
        text: extracted.text,
        extractedText: extracted.text,
        sections: analysis.sections,
        topics: analysis.topics,
        uploadedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        DOC_KEY,
        JSON.stringify(nextDocument)
      );

      setDocument(nextDocument);

      // Clear old generated material when a new PDF is uploaded
      setMaterial(null);

      localStorage.removeItem(MATERIAL_KEY);

      localStorage.removeItem(
        "taskflow_study_active_tab"
      );

      setStatus(
        `Extracted text from ${extracted.pages} pages. Ready to generate study material.`
      );
    } catch (cause) {
      setError(
        cause.message || "Could not read this PDF."
      );

      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  // DELETE PDF
  const handleDeletePdf = () => {
    // Remove PDF and generated material from browser storage
    localStorage.removeItem(DOC_KEY);
    localStorage.removeItem(MATERIAL_KEY);
    localStorage.removeItem(
      "taskflow_study_active_tab"
    );

    // Clear React state
    setDocument(null);
    setMaterial(null);

    // Clear messages
    setStatus("");
    setError("");
    setBusy(false);
  };

  const generate = async () => {
    if (!document?.text) return;

    setBusy(true);
    setError("");

    setStatus(
      "Generating study material from the extracted content…"
    );

    try {
      const generated = await generateStudyMaterial({
        text: document.text,

        settings: {
          ...settings,

          // Provider/topic/difficulty are no longer
          // controlled from this screen.
          // The generator will use its default behavior.
        },

        provider: "demo",
      });

      const saved = {
        ...generated,
        documentName: document.documentName,
        pageCount:
          document.pageCount ||
          document.pages ||
          0,
        generatedAt: new Date().toISOString(),
        settings,
      };

      localStorage.setItem(
        MATERIAL_KEY,
        JSON.stringify(saved)
      );

      setMaterial(saved);

      localStorage.setItem(
        "taskflow_study_active_tab",
        "flashcards"
      );

      setStatus("");

      onOpenQuizzes?.();
    } catch (cause) {
      setError(
        cause.message ||
          "Could not generate study material."
      );

      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const countSelect = (key, label) => (
    <label>
      {label}

      <select
        value={
          customCount[key]
            ? "custom"
            : settings[key]
        }
        onChange={(event) => {
          if (event.target.value === "custom") {
            setCustomCount({
              ...customCount,
              [key]: true,
            });

            updateSettings({
              [key]: 10,
            });
          } else {
            setCustomCount({
              ...customCount,
              [key]: false,
            });

            updateSettings({
              [key]: Number(event.target.value),
            });
          }
        }}
      >
        {[5, 10, 15, 20, 30].map((count) => (
          <option
            key={count}
            value={count}
          >
            {count}
          </option>
        ))}

        <option value="custom">
          Custom
        </option>
      </select>

      {customCount[key] && (
        <input
          type="number"
          min="1"
          max="50"
          value={settings[key]}
          onChange={(event) =>
            updateSettings({
              [key]: Math.max(
                1,
                Math.min(
                  50,
                  Number(event.target.value) || 1
                )
              ),
            })
          }
          aria-label={`Custom ${label.toLowerCase()} count`}
        />
      )}
    </label>
  );

  return (
    <section className="ai-pdf-manager">
      <header className="ai-pdf-header">
        <span className="ai-pdf-label">
          PDF STUDY GENERATOR
        </span>

        <h2>
          Turn your PDF into study material
        </h2>

        <p>
          Text is extracted in your browser and
          saved locally for future regeneration.
        </p>
      </header>

      <div className="ai-pdf-upload-card">
        <div
          className="ai-pdf-icon"
          aria-hidden="true"
        >
          ▤
        </div>

        <h3>Upload PDF</h3>

        <p>
          Choose a text-based PDF. No backend or
          database is used.
        </p>

        <label className="ai-pdf-upload-button">
          {busy
            ? "Working…"
            : "＋ Choose PDF"}

          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={upload}
            disabled={busy}
            hidden
          />
        </label>

        {document && (
          <div className="pdf-document-info">
            <div className="pdf-document-header">
              <div className="pdf-document-details">
                <strong>
                  Document: {document.documentName}
                </strong>

                <span>
                  Pages: {document.pages || "Unknown"}
                </span>
              </div>

              <button
                type="button"
                className="pdf-delete-button"
                onClick={handleDeletePdf}
                disabled={busy}
              >
                Delete PDF
              </button>
            </div>

            <details>
              <summary>
                Extracted text
              </summary>

              <pre>
                {document.text.slice(0, 10000)}
                {document.text.length > 10000
                  ? "…"
                  : ""}
              </pre>
            </details>
          </div>
        )}

        {status && (
          <p
            className="pdf-status"
            role="status"
          >
            {busy && (
              <span
                className="pdf-inline-spinner"
                aria-hidden="true"
              />
            )}

            {status}
          </p>
        )}

        {error && (
          <p
            className="pdf-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      {document && (
        <section className="pdf-settings-card">
          <h3>
            Generation settings
          </h3>

          <div className="pdf-settings-grid">
            {countSelect(
              "flashcardCount",
              "Flashcards"
            )}

            {countSelect(
              "quizCount",
              "Quiz questions"
            )}

            <label>
              Question type

              <select
                value={settings.questionType}
                onChange={(e) =>
                  updateSettings({
                    questionType:
                      e.target.value,
                  })
                }
              >
                <option value="mcq">
                  Multiple Choice
                </option>

                <option value="true_false">
                  True / False
                </option>

                <option value="short_answer">
                  Short Answer
                </option>

                <option value="mixed">
                  Mixed
                </option>
              </select>
            </label>
          </div>

          <button
            className="ai-open-quiz-button"
            type="button"
            disabled={busy}
            onClick={generate}
          >
            {busy
              ? material
                ? "Regenerating..."
                : "Generating..."
              : material
                ? "Regenerate"
                : "Generate Study Material"}
          </button>
        </section>
      )}
    </section>
  );
}