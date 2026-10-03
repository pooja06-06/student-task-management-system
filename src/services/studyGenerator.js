export const DEFAULT_SETTINGS = {
  flashcardCount: 10,
  quizCount: 10,
  difficulty: "mixed",
  questionType: "mcq",
  topicScope: "all",
  selectedTopics: [],
  provider: "demo",
};

const NOISE = /^(?:say\s*:|today i am going to|in this presentation|i will (?:briefly )?(?:explain|present)|so,? our idea|thank you|good morning|my name is|let'?s move to|now i will explain|welcome to)\b/i;

const SPEECH =
  /\b(?:today i am going to|in this presentation|i will briefly explain|i am going to present|let'?s move to|now i will explain|thank you for listening|good morning everyone|my name is)\b/i;

const GENERIC_HEADINGS = new Set([
  "abstract",
  "introduction",
  "objectives",
  "objective",
  "background",
  "results",
  "conclusion",
  "references",
  "appendix",
  "contents",
  "table of contents",
  "acknowledgements",
  "acknowledgments",
]);

const SECTION_TOPIC = {
  objectives: "System Purpose",
  objective: "System Purpose",
  features: "System Features",
  "main features": "System Features",
  architecture: "System Architecture",
  "system architecture": "System Architecture",
  implementation: "Implementation",
  "module implementation": "Module Implementation",
  results: "Results",
  conclusion: "Conclusions",
  "future work": "Future Work",
};

const clean = (value = "") =>
  String(value)
    .replace(/\u00ad/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s*say\s*:\s*/i, "")
    .replace(/^[\s"'“”‘’.,:;!?-]+|[\s"'“”‘’]+$/g, "")
    .trim();

const norm = (value = "") =>
  clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const uniqueBy = (list, key) =>
  list.filter(
    (item, index) =>
      key(item) &&
      list.findIndex((other) => key(other) === key(item)) === index
  );

const trimSentence = (text, max = 230) => {
  const value = clean(text).replace(/[.!?]+$/, "");

  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max).replace(/\s+\S*$/, "")}…`;
};

/* -------------------------------------------------------
   BASIC TEXT PROCESSING
------------------------------------------------------- */

function isHeading(line) {
  const value = clean(line).replace(/^\d+(?:\.\d+)*\s*/, "");

  if (!value || value.length > 90) {
    return false;
  }

  if (/[.!?]$/.test(value)) {
    return false;
  }

  return (
    /^[\d.]+\s+[A-Z]/.test(line) ||
    /^[A-Z][A-Z\d\s:&()/-]{2,}$/.test(value) ||
    (/^[A-Z][\p{L}\d-]*(?:\s+[A-Z][\p{L}\d-]*){0,6}$/u.test(value) &&
      value.split(/\s+/).length <= 7)
  );
}

function splitSentences(text) {
  return (
    text
      .match(/[^.!?\n]+(?:[.!?]+|$)/g)
      ?.map((sentence) =>
        clean(
          sentence.replace(
            /^(?:(?:abstract|introduction|objectives|features|architecture|implementation|results|conclusion)\s+)?say\s*:\s*/i,
            ""
          )
        )
      )
      .filter(
        (sentence) =>
          sentence.length >= 35 &&
          sentence.length < 700 &&
          /[a-z]{3}/i.test(sentence) &&
          !SPEECH.test(sentence) &&
          !NOISE.test(sentence)
      ) || []
  );
}

/* -------------------------------------------------------
   DOCUMENT ANALYSIS
------------------------------------------------------- */

export function analyzeDocument(text) {
  const cleaned = String(text || "")
    .replace(/\r/g, "")
    .replace(/\u00ad/g, "")
    .split("\n")
    .map(clean)
    .filter(Boolean)
    .join("\n");

  const lines = cleaned.split("\n");

  const sections = [];

  let current = {
    title: "",
    lines: [],
  };

  for (const line of lines) {
    if (isHeading(line)) {
      if (current.lines.length) {
        sections.push(current);
      }

      current = {
        title: clean(line.replace(/^\d+(?:\.\d+)*\s*/, "")),
        lines: [],
      };
    } else {
      current.lines.push(line);
    }
  }

  if (current.lines.length) {
    sections.push(current);
  }

  if (!sections.length) {
    sections.push({
      title: "",
      lines,
    });
  }

  const claims = [];

  for (const section of sections) {
    const sentences = splitSentences(section.lines.join(" "));

    for (const sentence of sentences) {
      const body = clean(
        sentence.replace(
          /^(?:in this (?:project|system|paper|work)|the authors? (?:propose|present|introduce))[, ]+/i,
          ""
        )
      );

      const patterns = [
        {
          kind: "purpose",
          verb: "is intended to",
          regex:
            /^(?:the )?(?:main )?(?:purpose|goal|objective|aim) of (.{2,100}?) is to\s+(.{15,})$/i,
        },

        {
          kind: "purpose",
          verb: "is designed to",
          regex:
            /^(.{2,100}?)\s+(?:is designed to|aims to|is intended to|was developed to)\s+(.{15,})$/i,
        },

        {
          kind: "definition",
          verb: "is",
          regex:
            /^(.{2,100}?)\s+(?:is|are|refers to|means|is defined as|can be defined as)\s+(.{20,})$/i,
        },

        {
          kind: "feature",
          regex:
            /^(.{2,100}?)\s+(supports|provides|offers|includes|enables|allows|consists of|comprises)\s+(.{15,})$/i,
          verbGroup: 2,
          detailGroup: 3,
        },

        {
          kind: "process",
          regex:
            /^(.{2,100}?)\s+(processes|analyzes|extracts|converts|generates|summarizes|retrieves|classifies)\s+(.{15,})$/i,
          verbGroup: 2,
          detailGroup: 3,
        },

        {
          kind: "relationship",
          regex:
            /^(.{2,100}?)\s+(uses|combines|integrates|connects|improves|reduces|increases|depends on)\s+(.{15,})$/i,
          verbGroup: 2,
          detailGroup: 3,
        },
      ];

      let matched = false;

      for (const pattern of patterns) {
        const match = body.match(pattern.regex);

        if (!match) {
          continue;
        }

        const subject = clean(match[1]);

        const detail = clean(
          match[pattern.detailGroup || 2]
        ).replace(/[.!?]+$/, "");

        if (
          subject.length < 3 ||
          subject.length > 100 ||
          detail.length < 18 ||
          GENERIC_HEADINGS.has(norm(subject))
        ) {
          break;
        }

        claims.push({
          id: makeId(),
          kind: pattern.kind,
          verb: pattern.verbGroup
            ? clean(match[pattern.verbGroup]).toLowerCase()
            : pattern.verb,
          subject,
          detail,
          source: body,
          sourceSection:
            section.title || "Document content",
        });

        matched = true;
        break;
      }

      /*
       * IMPORTANT:
       * If the sentence did not match one of the patterns above,
       * keep the sentence as a factual source item.
       *
       * This is what allows 15, 20, 30 etc. questions to be
       * generated from real PDF content instead of stopping
       * when only a few regex patterns match.
       */
      if (!matched && body.length >= 35) {
        const words = body.split(/\s+/);

        let subject = words.slice(0, Math.min(8, words.length)).join(" ");

        if (subject.length < 10) {
          subject = "The document";
        }

        claims.push({
          id: makeId(),
          kind: "statement",
          verb: "states that",
          subject,
          detail: body,
          source: body,
          sourceSection:
            section.title || "Document content",
        });
      }
    }
  }

  const conceptTitle = (claim) => {
    const subject = norm(claim.subject);

    if (
      /^(?:the )?(?:main )?(?:purpose|goal|objective|aim)/.test(
        subject
      )
    ) {
      return "System Purpose";
    }

    if (
      /^(?:the )?(?:system|application|prototype|project|platform|tool|software)$/.test(
        subject
      )
    ) {
      return (
        SECTION_TOPIC[norm(claim.sourceSection)] ||
        (claim.kind === "feature"
          ? "System Features"
          : claim.kind === "process"
            ? "Document Processing"
            : claim.sourceSection ||
              "Document Concepts")
      );
    }

    if (claim.kind === "statement") {
      return (
        SECTION_TOPIC[norm(claim.sourceSection)] ||
        claim.sourceSection ||
        "Document Concepts"
      );
    }

    return clean(claim.subject);
  };

  const distinctClaims = uniqueBy(
    claims,
    (claim) =>
      `${norm(claim.subject)}|${norm(claim.detail)}`
  ).map((claim) => ({
    ...claim,
    concept: conceptTitle(claim),
  }));

  const sectionTopics = sections
    .filter(
      (section) =>
        section.title &&
        ![
          "abstract",
          "introduction",
          "background",
          "references",
          "appendix",
          "contents",
          "table of contents",
        ].includes(norm(section.title)) &&
        section.lines.join(" ").length > 40
    )
    .map((section) => ({
      title:
        SECTION_TOPIC[norm(section.title)] ||
        section.title,
      sourceSection: section.title,
      evidence: section.lines.join(" "),
    }));

  const claimTopics = distinctClaims.map((claim) => ({
    title: conceptTitle(claim),
    sourceSection: claim.sourceSection,
    evidence: claim.source,
  }));

  const topicSeeds = uniqueBy(
    [...claimTopics, ...sectionTopics],
    (item) => norm(item.title)
  ).filter(
    (topic) =>
      topic.title.length > 2 &&
      !GENERIC_HEADINGS.has(norm(topic.title))
  );

  const topics = topicSeeds.map((topic) => {
    const related = distinctClaims.filter(
      (claim) =>
        norm(conceptTitle(claim)) ===
          norm(topic.title) ||
        norm(claim.sourceSection) ===
          norm(topic.sourceSection)
    );

    const evidence =
      related[0]?.detail || topic.evidence;

    const keyPoints = uniqueBy(
      related.map((claim) => compactClaim(claim)),
      norm
    ).slice(0, 3);

    return {
      id: makeId(),
      title: topic.title,
      description: trimSentence(evidence, 220),
      keyPoints,
      sourceSection: topic.sourceSection,
    };
  });

  return {
    cleaned,
    sections: sections
      .map((section) => ({
        title: section.title,
        text: section.lines.join(" ").trim(),
      }))
      .filter((section) => section.text),

    claims: distinctClaims,
    topics,
  };
}

/* -------------------------------------------------------
   CLAIM HELPERS
------------------------------------------------------- */

function compactClaim(claim) {
  const detail = clean(claim.detail).replace(
    /^(?:that|which)\s+/i,
    ""
  );

  const subject = clean(claim.subject);

  if (claim.kind === "statement") {
    return trimSentence(detail, 180);
  }

  const cleanDetail =
    claim.kind === "purpose"
      ? detail.replace(/^to\s+/i, "")
      : detail;

  const text = `${subject} ${
    claim.verb ||
    (claim.kind === "purpose"
      ? "is intended to"
      : claim.kind === "definition"
        ? "is"
        : "supports")
  } ${cleanDetail}`;

  return trimSentence(text, 180);
}

/* -------------------------------------------------------
   QUESTION DIFFICULTY
------------------------------------------------------- */

function resolveDifficulty(difficulty, index) {
  if (difficulty === "mixed") {
    return ["easy", "medium", "hard"][index % 3];
  }

  if (
    ["easy", "medium", "hard"].includes(
      String(difficulty).toLowerCase()
    )
  ) {
    return String(difficulty).toLowerCase();
  }

  return "medium";
}

/* -------------------------------------------------------
   TOPIC SELECTION
------------------------------------------------------- */

function getSelectedTopics(analysis, settings) {
  const allTopics = analysis.topics || [];

  if (settings.topicScope !== "selected") {
    return allTopics;
  }

  const selected = new Set(
    settings.selectedTopics || []
  );

  const result = allTopics.filter((topic) =>
    selected.has(topic.title)
  );

  return result.length ? result : allTopics;
}

function getTopicForClaim(claim, topics) {
  const matching =
    topics.find(
      (topic) =>
        norm(topic.title) ===
          norm(claim.concept) ||
        norm(topic.sourceSection) ===
          norm(claim.sourceSection)
    ) || topics[0];

  return matching?.title || "Document Content";
}

/* -------------------------------------------------------
   BUILD SOURCE FACT POOL
------------------------------------------------------- */

function buildFactPool(analysis, topics) {
  /*
   * Use ALL meaningful claims.
   *
   * We do NOT split the claims into:
   *
   *   flashcards = even
   *   quiz = odd
   *
   * because that was the reason the requested count
   * could not be reached.
   */

  const facts = analysis.claims
    .filter(
      (claim) =>
        claim &&
        typeof claim.detail === "string" &&
        clean(claim.detail).length >= 20
    )
    .map((claim) => ({
      ...claim,
      answer: clean(claim.detail),
      topic: getTopicForClaim(claim, topics),
    }));

  return uniqueBy(
    facts,
    (fact) =>
      norm(fact.answer) ||
      `${norm(fact.subject)}|${norm(fact.source)}`
  );
}

/* -------------------------------------------------------
   CREATE DIFFERENT FLASHCARD QUESTIONS
------------------------------------------------------- */

function createFlashcardQuestion(fact, index) {
  const subject = clean(fact.subject);
  const topic = clean(fact.topic);

  const styles = [
    `What does the document state about ${subject}?`,

    `What is explained about ${subject} in the PDF?`,

    `According to the document, what is the role of ${subject}?`,

    `What does the PDF mention regarding ${subject}?`,

    `Which statement about ${subject} is supported by the document?`,

    `What information does the document provide about ${subject}?`,

    `How is ${subject} described in the document?`,

    `What does the source explain about ${subject}?`,

    `What should a student remember about ${subject}?`,

    `Which fact about ${subject} is given in the PDF?`,
  ];

  /*
   * Rotate question wording so that increasing the
   * number of flashcards does not simply repeat
   * the same question format.
   */
  const base = styles[index % styles.length];

  if (
    fact.kind === "purpose" &&
    index % 3 === 0
  ) {
    return `What is the main purpose described in the document for ${subject}?`;
  }

  if (
    fact.kind === "definition" &&
    index % 3 === 1
  ) {
    return `How does the PDF define ${subject}?`;
  }

  if (
    fact.kind === "process" &&
    index % 3 === 2
  ) {
    return `What does ${subject} do according to the PDF?`;
  }

  if (topic && topic !== "Document Content") {
    return base;
  }

  return base;
}

/* -------------------------------------------------------
   CREATE FLASHCARDS
------------------------------------------------------- */

function buildFlashcards(facts, settings) {
  const requested = Math.max(
    1,
    Number(settings.flashcardCount) || 10
  );

  if (!facts.length) {
    return [];
  }

  const result = [];

  /*
   * First use every unique fact.
   */
  for (
    let i = 0;
    i < facts.length && result.length < requested;
    i += 1
  ) {
    const fact = facts[i];

    result.push({
      id: makeId(),
      question: createFlashcardQuestion(
        fact,
        result.length
      ),
      answer: fact.answer,
      topic: fact.topic,
      difficulty: resolveDifficulty(
        settings.difficulty,
        result.length
      ),
      sourceId: fact.id,
    });
  }

  /*
   * If the student asks for MORE cards than the PDF
   * has unique factual statements, create additional
   * questions from the same source facts using
   * different question wording.
   *
   * The answer always remains directly supported by
   * the PDF.
   */
  let cycle = 1;

  while (result.length < requested) {
    for (const fact of facts) {
      if (result.length >= requested) {
        break;
      }

      const questionIndex =
        result.length + cycle;

      result.push({
        id: makeId(),
        question: createFlashcardQuestion(
          fact,
          questionIndex
        ),
        answer: fact.answer,
        topic: fact.topic,
        difficulty: resolveDifficulty(
          settings.difficulty,
          result.length
        ),
        sourceId: fact.id,
      });
    }

    cycle += 1;

    /*
     * Safety guard.
     */
    if (cycle > requested + 5) {
      break;
    }
  }

  return result.slice(0, requested);
}

/* -------------------------------------------------------
   MCQ DISTRACTOR GENERATION
------------------------------------------------------- */

function getDifferentFacts(
  facts,
  correctFact,
  questionIndex,
  count = 3
) {
  if (facts.length <= 1) {
    return [];
  }

  const candidates = facts.filter(
    (fact) =>
      fact.id !== correctFact.id &&
      norm(fact.answer) !== norm(correctFact.answer)
  );

  if (!candidates.length) {
    return [];
  }

  const result = [];

  /*
   * Start from a different location for every question.
   * This prevents the same three options appearing again
   * and again.
   */
  const start =
    (questionIndex * 3) % candidates.length;

  for (let offset = 0; offset < candidates.length; offset += 1) {
    if (result.length >= count) {
      break;
    }

    const candidate =
      candidates[
        (start + offset) % candidates.length
      ];

    if (
      !result.some(
        (item) =>
          norm(item.answer) === norm(candidate.answer)
      )
    ) {
      result.push(candidate);
    }
  }

  return result;
}

/* -------------------------------------------------------
   DIFFERENT QUIZ QUESTION TYPES
------------------------------------------------------- */

function createQuizQuestion(
  fact,
  index,
  type
) {
  const subject = clean(fact.subject);

  const mcqStyles = [
    `Which statement about ${subject} is supported by the document?`,

    `According to the PDF, which of the following describes ${subject}?`,

    `Which option correctly explains ${subject} based on the document?`,

    `What does the document state about ${subject}?`,

    `Which description of ${subject} is given in the PDF?`,

    `Which statement is correct according to the source about ${subject}?`,

    `What information about ${subject} is supported by the PDF?`,

    `Which of the following is mentioned in the document about ${subject}?`,
  ];

  const trueFalseStyles = [
    `The document states that ${subject} ${fact.verb || "is described as"} ${fact.answer}.`,

    `According to the PDF, ${subject} ${fact.verb || "is"} ${fact.answer}.`,

    `The source explains that ${subject} ${fact.verb || "is described as"} ${fact.answer}.`,
  ];

  const shortStyles = [
    `What does the document say about ${subject}?`,

    `Explain ${subject} according to the PDF.`,

    `What is stated about ${subject} in the document?`,

    `Describe ${subject} based on the uploaded PDF.`,

    `What information is provided about ${subject}?`,
  ];

  if (type === "true_false") {
    return trueFalseStyles[
      index % trueFalseStyles.length
    ];
  }

  if (type === "short_answer") {
    return shortStyles[
      index % shortStyles.length
    ];
  }

  return mcqStyles[
    index % mcqStyles.length
  ];
}

/* -------------------------------------------------------
   BUILD QUIZ
------------------------------------------------------- */

function buildQuiz(facts, settings) {
  const requested = Math.max(
    1,
    Number(settings.quizCount) || 10
  );

  if (!facts.length) {
    return [];
  }

  const result = [];

  /*
   * Create the requested number of questions.
   *
   * Unlike the old implementation, we do NOT split
   * the source facts into odd/even groups.
   */
  let index = 0;

  while (result.length < requested) {
    const fact = facts[
      index % facts.length
    ];

    let type = settings.questionType;

    if (type === "mixed") {
      type = [
        "mcq",
        "true_false",
        "short_answer",
      ][index % 3];
    }

    const question = createQuizQuestion(
      fact,
      index,
      type
    );

    let options = [];

    let actualType = type;

    if (type === "mcq") {
      const distractorFacts =
        getDifferentFacts(
          facts,
          fact,
          index,
          3
        );

      /*
       * Correct answer + three different source
       * answers = four different options.
       */
      options = uniqueBy(
        [
          {
            text: fact.answer,
            sourceId: fact.id,
          },

          ...distractorFacts.map(
            (candidate) => ({
              text: candidate.answer,
              sourceId: candidate.id,
            })
          ),
        ],
        (option) => norm(option.text)
      ).slice(0, 4);

      /*
       * If the PDF contains fewer than four unique
       * factual statements, we cannot honestly create
       * four source-supported MCQ options.
       *
       * In that situation use short answer rather
       * than inventing information.
       */
      if (options.length < 4) {
        actualType = "short_answer";
        options = [];
      }
    }

    if (actualType === "true_false") {
      options = ["True", "False"];
    }

    result.push({
      id: makeId(),

      question,

      type: actualType,

      options:
        actualType === "mcq"
          ? options.map((option) => option.text)
          : options,

      answer:
        actualType === "true_false"
          ? "True"
          : fact.answer,

      explanation: `The source states: ${fact.answer}`,

      topic: fact.topic,

      difficulty: resolveDifficulty(
        settings.difficulty,
        index
      ),

      sourceId: fact.id,
    });

    index += 1;

    /*
     * Safety guard.
     */
    if (index > requested * 10 + 100) {
      break;
    }
  }

  return result.slice(0, requested);
}

/* -------------------------------------------------------
   IMPORTANT QUESTIONS
------------------------------------------------------- */

function buildImportantQuestions(
  facts,
  flashcards,
  quiz
) {
  if (!facts.length) {
    return [];
  }

  const result = [];

  for (let i = 0; i < facts.length; i += 1) {
    const fact = facts[i];

    const questionStyles = [
      `What is the significance of ${fact.subject}?`,

      `Why is ${fact.subject} important according to the document?`,

      `What should be understood about ${fact.subject}?`,

      `What key information does the PDF provide about ${fact.subject}?`,
    ];

    const question =
      questionStyles[
        i % questionStyles.length
      ];

    result.push({
      question,
      answer: fact.answer,
      topic: fact.topic,
    });

    if (result.length >= 15) {
      break;
    }
  }

  return uniqueBy(
    result,
    (item) => norm(item.question)
  );
}

/* -------------------------------------------------------
   SUMMARY
------------------------------------------------------- */

function buildSummary(facts, topics) {
  if (!facts.length) {
    return {
      keyPoints: [],
      shortSummary:
        "The PDF does not contain enough readable factual text for automatic study material generation.",
      detailedSummary:
        "No detailed summary could be generated.",
      importantQuestions: [],
    };
  }

  const keyPoints = uniqueBy(
    facts.map((fact) =>
      compactClaim(fact)
    ),
    norm
  ).slice(0, 15);

  const shortSummary = facts
    .slice(0, 4)
    .map((fact) =>
      `${clean(fact.answer).replace(
        /[.!?]+$/,
        ""
      )}.`
    )
    .join(" ");

  const detailSections = topics
    .map((topic) => {
      const related = facts
        .filter(
          (fact) =>
            norm(fact.topic) ===
            norm(topic.title)
        )
        .slice(0, 5);

      if (!related.length) {
        return "";
      }

      return `${topic.title}\n${related
        .map(
          (fact) =>
            `• ${compactClaim(fact)}`
        )
        .join("\n")}`;
    })
    .filter(Boolean);

  const detailedSummary =
    detailSections.join("\n\n") ||
    keyPoints
      .map((point) => `• ${point}`)
      .join("\n");

  return {
    keyPoints,
    shortSummary,
    detailedSummary,
    importantQuestions: [],
  };
}

/* -------------------------------------------------------
   BUILD ALL OUTPUTS
------------------------------------------------------- */

function buildOutputs(
  analysis,
  settings
) {
  const topics = getSelectedTopics(
    analysis,
    settings
  );

  /*
   * If topic filtering somehow produces nothing,
   * use all analyzed topics.
   */
  const usableTopics =
    topics.length > 0
      ? topics
      : analysis.topics || [];

  /*
   * THIS IS THE IMPORTANT PART:
   *
   * Build one large factual pool and allow both
   * flashcards and quiz to use it.
   */
  const facts = buildFactPool(
    analysis,
    usableTopics
  );

  const summary = buildSummary(
    facts,
    usableTopics
  );

  const flashcards = buildFlashcards(
    facts,
    settings
  );

  const quiz = buildQuiz(
    facts,
    settings
  );

  const importantQuestions =
    buildImportantQuestions(
      facts,
      flashcards,
      quiz
    );

  return {
    summary: {
      ...summary,
      importantQuestions,
    },

    topics: usableTopics,

    flashcards,

    quiz,
  };
}

/* -------------------------------------------------------
   VALIDATE GENERATED MATERIAL
------------------------------------------------------- */

export function validateStudyMaterial(
  raw,
  settings = DEFAULT_SETTINGS
) {
  const safe =
    raw && typeof raw === "object"
      ? raw
      : {};

  const rawSummary =
    safe.summary &&
    typeof safe.summary === "object"
      ? safe.summary
      : {};

  const topics = Array.isArray(
    safe.topics
  )
    ? uniqueBy(
        safe.topics
          .filter(
            (topic) =>
              topic &&
              typeof topic.title ===
                "string" &&
              topic.title.trim()
          )
          .map((topic) => ({
            ...topic,
            id: topic.id || makeId(),

            description: clean(
              topic.description
            ),

            keyPoints: Array.isArray(
              topic.keyPoints
            )
              ? uniqueBy(
                  topic.keyPoints
                    .map(clean)
                    .filter(Boolean),
                  norm
                )
              : [],
          })),
        (topic) => norm(topic.title)
      )
    : [];

  const topicNames = new Set(
    topics.map((topic) => topic.title)
  );

  /*
   * If topics are empty, still allow generated
   * content to survive validation.
   */
  const safeTopic = (topic) => {
    if (
      topicNames.size === 0
    ) {
      return true;
    }

    return topicNames.has(topic);
  };

  const difficulty = (value) =>
    ["easy", "medium", "hard"].includes(
      String(value).toLowerCase()
    )
      ? String(value).toLowerCase()
      : "medium";

  const flashcards = Array.isArray(
    safe.flashcards
  )
    ? uniqueBy(
        safe.flashcards
          .filter(
            (card) =>
              card &&
              typeof card.question ===
                "string" &&
              typeof card.answer ===
                "string" &&
              card.question.trim() &&
              card.answer.trim() &&
              safeTopic(card.topic)
          )
          .map((card) => ({
            ...card,

            id: card.id || makeId(),

            question: clean(
              card.question
            ),

            answer: clean(
              card.answer
            ),

            difficulty: difficulty(
              card.difficulty
            ),
          })),
        (card) => norm(card.question)
      ).slice(
        0,
        Number(settings.flashcardCount) ||
          30
      )
    : [];

  const cardQuestions = new Set(
    flashcards.map((card) =>
      norm(card.question)
    )
  );

  const quiz = Array.isArray(
    safe.quiz
  )
    ? uniqueBy(
        safe.quiz
          .filter(
            (item) =>
              item &&
              typeof item.question ===
                "string" &&
              typeof item.answer ===
                "string" &&
              item.question.trim() &&
              item.answer.trim() &&
              safeTopic(item.topic) &&
              !cardQuestions.has(
                norm(item.question)
              )
          )
          .map((item) => {
            const type = [
              "mcq",
              "true_false",
              "short_answer",
            ].includes(item.type)
              ? item.type
              : "short_answer";

            const options =
              type === "true_false"
                ? ["True", "False"]
                : Array.isArray(
                      item.options
                    )
                  ? uniqueBy(
                      item.options
                        .map(clean)
                        .filter(Boolean),
                      norm
                    ).slice(0, 4)
                  : [];

            /*
             * MCQ MUST have exactly 4 different
             * options and the correct answer must
             * be one of them.
             */
            if (
              type === "mcq" &&
              (options.length !== 4 ||
                !options.some(
                  (option) =>
                    norm(option) ===
                    norm(item.answer)
                ))
            ) {
              return null;
            }

            return {
              ...item,

              id: item.id || makeId(),

              question: clean(
                item.question
              ),

              answer: clean(
                item.answer
              ),

              type,

              options,

              explanation: clean(
                item.explanation
              ),

              difficulty: difficulty(
                item.difficulty
              ),
            };
          })
          .filter(Boolean),
        (item) => norm(item.question)
      ).slice(
        0,
        Number(settings.quizCount) ||
          30
      )
    : [];

  const importantQuestions =
    Array.isArray(
      rawSummary.importantQuestions
    )
      ? uniqueBy(
          rawSummary.importantQuestions
            .map((item) =>
              typeof item === "string"
                ? {
                    question: clean(item),
                    answer: "",
                    topic:
                      topics[0]?.title ||
                      "",
                  }
                : {
                    question: clean(
                      item?.question
                    ),

                    answer: clean(
                      item?.answer
                    ),

                    topic:
                      safeTopic(
                        item?.topic
                      )
                        ? item.topic
                        : topics[0]
                            ?.title ||
                          "",
                  }
            )
            .filter(
              (item) => item.question
            ),
          (item) =>
            norm(item.question)
        )
      : [];

  return {
    summary: {
      keyPoints: Array.isArray(
        rawSummary.keyPoints
      )
        ? uniqueBy(
            rawSummary.keyPoints
              .map(clean)
              .filter(Boolean),
            norm
          )
        : [],

      shortSummary: clean(
        rawSummary.shortSummary
      ),

      detailedSummary:
        typeof rawSummary.detailedSummary ===
        "string"
          ? rawSummary.detailedSummary
          : "",

      importantQuestions,
    },

    topics,

    flashcards,

    quiz,
  };
}

/* -------------------------------------------------------
   MAIN GENERATOR
------------------------------------------------------- */

export async function generateStudyMaterial({
  text,
  settings = DEFAULT_SETTINGS,
  provider =
    settings.provider || "demo",
  config = {},
}) {
  const analysis =
    analyzeDocument(text);

  /*
   * DEMO MODE
   *
   * Uses only the uploaded PDF.
   */
  if (provider === "demo") {
    const generated = buildOutputs(
      analysis,
      settings
    );

    return validateStudyMaterial(
      generated,
      settings
    );
  }

  if (
    provider !==
    "openai-compatible"
  ) {
    throw new Error(
      "Choose a supported study provider."
    );
  }

  if (
    !config.endpoint ||
    !config.model ||
    !config.key
  ) {
    throw new Error(
      "Enter the endpoint, model, and API key for the optional OpenAI-compatible provider, or switch to Demo."
    );
  }

  /* ---------------------------------------------------
     OPTIONAL AI PROVIDER
  --------------------------------------------------- */

  const prompt = `
You are an expert educational content generator.

Use ONLY the supplied PDF text.

IMPORTANT RULES:

1. Every question must be based on the supplied PDF.
2. Do not invent facts.
3. Do not use generic placeholder questions.
4. Flashcards must be different from quiz questions.
5. Questions should cover different parts of the PDF.
6. Do not repeatedly use the same answer.
7. MCQ questions must have exactly four different options.
8. Every MCQ option must be relevant to the PDF.
9. The correct answer must be exactly one of the four options.
10. Do not repeat the same three distractors.
11. Generate the requested number of flashcards.
12. Generate the requested number of quiz questions whenever the PDF contains enough information.
13. If the PDF has many sections, distribute questions across those sections.
14. Ignore greetings, introductions by speakers, and presentation directions.

Requested flashcards:
${settings.flashcardCount}

Requested quiz questions:
${settings.quizCount}

Question type:
${settings.questionType}

Difficulty:
${settings.difficulty}

Return JSON in this exact structure:

{
  "summary": {
    "keyPoints": [],
    "shortSummary": "",
    "detailedSummary": "",
    "importantQuestions": []
  },

  "topics": [
    {
      "title": "",
      "description": "",
      "keyPoints": [],
      "sourceSection": ""
    }
  ],

  "flashcards": [
    {
      "question": "",
      "answer": "",
      "topic": "",
      "difficulty": ""
    }
  ],

  "quiz": [
    {
      "question": "",
      "type": "mcq",
      "options": ["", "", "", ""],
      "answer": "",
      "explanation": "",
      "topic": "",
      "difficulty": ""
    }
  ]
}

PDF TEXT:

${analysis.cleaned.slice(
  0,
  60000
)}
`;

  const response = await fetch(
    config.endpoint,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${config.key}`,
      },

      body: JSON.stringify({
        model: config.model,

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        response_format: {
          type: "json_object",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Study provider request failed (${response.status}). Check the endpoint and provider settings.`
    );
  }

  const payload =
    await response.json();

  let parsed;

  try {
    parsed = JSON.parse(
      payload.choices?.[0]?.message
        ?.content || ""
    );
  } catch {
    throw new Error(
      "The study provider returned malformed JSON. Try again or switch to the demo provider."
    );
  }

  return validateStudyMaterial(
    parsed,
    settings
  );
}