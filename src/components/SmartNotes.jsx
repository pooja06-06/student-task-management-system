import { useState } from "react";

export default function SmartNotes() {
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("taskflow_notes")) || [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function addNote(event) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) return;

    const updated = [
      {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date().toLocaleDateString(),
      },
      ...notes,
    ];

    setNotes(updated);
    localStorage.setItem("taskflow_notes", JSON.stringify(updated));
    setTitle("");
    setContent("");
  }

  function deleteNote(id) {
    const updated = notes.filter((note) => note.id !== id);
    setNotes(updated);
    localStorage.setItem("taskflow_notes", JSON.stringify(updated));
  }

  return (
    <section className="notes-section">
      <div className="section-heading">
    
        <h2>My Study Notes</h2>
        <p>Keep your important ideas and study materials organized.</p>
      </div>

      <form className="notes-form" onSubmit={addNote}>
        <h3>Create a Note</h3>

        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <textarea
          placeholder="Write your note here..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          required
        />

        <button type="submit" className="primary-button">
          + Save Note
        </button>
      </form>

      <div className="notes-grid">
        {notes.length === 0 ? (
          <p>No notes yet. Create your first study note.</p>
        ) : (
          notes.map((note) => (
            <article className="note-card" key={note.id}>
              <div className="note-card-header">
                <h3>{note.title}</h3>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                >
                  Delete
                </button>
              </div>

              <p>{note.content}</p>
              <small>{note.createdAt}</small>
            </article>
          ))
        )}
      </div>
    </section>
  );
}