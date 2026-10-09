import { useState } from "react";

// task === null  -> creating a new task
// task === {...} -> editing that task
export default function TaskModal({ task, members, onSave, onDelete, onClose }) {
  const isNew = task === null;
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "todo",
    priority: task?.priority ?? "medium",
    due_date: task?.due_date ?? "",
    assignee_id: task?.assignee_id ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      // Empty strings become null so the API clears the value.
      await onSave({
        ...form,
        due_date: form.due_date || null,
        assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
            className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold">{isNew ? "New task" : "Edit task"}</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="t-title">Title</label>
            <input id="t-title" className="input" value={form.title} onChange={set("title")} required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="t-desc">Description</label>
            <textarea id="t-desc" rows={3} className="input" value={form.description} onChange={set("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="t-status">Column</label>
              <select id="t-status" className="input" value={form.status} onChange={set("status")}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-prio">Priority</label>
              <select id="t-prio" className="input" value={form.priority} onChange={set("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-due">Deadline</label>
              <input id="t-due" type="date" className="input" value={form.due_date} onChange={set("due_date")} />
            </div>
            <div>
              <label className="label" htmlFor="t-assignee">Assigned to</label>
              <select id="t-assignee" className="input" value={form.assignee_id} onChange={set("assignee_id")}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex items-center gap-2">
          {!isNew && (
            <button type="button" className="btn-danger" onClick={() => window.confirm("Delete this task?") && onDelete(task)}>
              Delete task
            </button>
          )}
          <button type="button" className="btn-ghost ml-auto" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{isNew ? "Add task" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}
