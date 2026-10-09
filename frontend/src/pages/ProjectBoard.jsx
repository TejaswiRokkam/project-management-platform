import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";

const COLUMNS = [
  { key: "todo", title: "To Do", dot: "bg-slate-400" },
  { key: "in_progress", title: "In Progress", dot: "bg-blue-500" },
  { key: "done", title: "Done", dot: "bg-pine" },
];

export default function ProjectBoard() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ search: "", priority: "", assignee_id: "" });
  const [reload, setReload] = useState(0); // bump this number to refetch tasks
  const [modalTask, setModalTask] = useState(undefined); // undefined = closed, null = new, object = editing
  const [dragOver, setDragOver] = useState(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProject(id).then(setProject).catch((e) => setError(e.message));
  }, [id]);

  // Refetch whenever filters change. The timeout waits for the user to stop typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      api.listTasks(id, filters).then(setTasks).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [id, filters, reload]);

  const refresh = () => setReload((n) => n + 1);

  async function saveTask(data) {
    if (modalTask === null) await api.createTask(id, data);
    else await api.updateTask(modalTask.id, data);
    setModalTask(undefined);
    refresh();
    api.getProject(id).then(setProject); // keep progress counts fresh
  }

  async function deleteTask(task) {
    await api.deleteTask(task.id);
    setModalTask(undefined);
    refresh();
    api.getProject(id).then(setProject);
  }

  // ----- drag and drop (built into the browser, no library needed) -----
  function handleDragStart(e, task) {
    e.dataTransfer.setData("text/plain", String(task.id));
  }

  function handleDrop(e, status) {
    e.preventDefault();
    setDragOver(null);
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;

    // Optimistic update: move the card instantly, then tell the server.
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
    api.updateTask(taskId, { status })
      .then(() => api.getProject(id).then(setProject))
      .catch((err) => { setError(err.message); refresh(); });
  }

  async function handleAddMember(e) {
    e.preventDefault();
    setError("");
    try {
      setProject(await api.addMember(id, memberEmail));
      setMemberEmail("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteProject() {
    if (!window.confirm(`Delete "${project.name}" and all its tasks?`)) return;
    await api.deleteProject(id);
    navigate("/");
  }

  if (!project) return <p className="p-8 text-slate-500">{error || "Loading…"}</p>;
  const isOwner = project.owner_id === user.id;
  const setFilter = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/" className="text-sm text-slate-600 hover:underline">← All projects</Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && <p className="mt-1 max-w-prose text-sm text-slate-600">{project.description}</p>}
        </div>
        <button className="btn-primary" onClick={() => setModalTask(null)}>Add task</button>
      </div>

      {/* Team */}
      <section className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-slate-700">Team:</span>
        {project.members.map((m) => (
          <span key={m.id} className="rounded-full bg-pine-light px-2.5 py-0.5 text-pine-dark" title={m.email}>
            {m.name}
          </span>
        ))}
        {isOwner && (
          <form onSubmit={handleAddMember} className="flex gap-2">
            <input type="email" required placeholder="teammate@email.com" className="input !w-52 !py-1"
                   value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} aria-label="Teammate email" />
            <button className="btn-ghost !py-1">Add member</button>
          </form>
        )}
      </section>

      {/* Search + filters */}
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <input className="input" type="search" placeholder="Search tasks…" aria-label="Search tasks"
               value={filters.search} onChange={setFilter("search")} />
        <select className="input" aria-label="Filter by priority" value={filters.priority} onChange={setFilter("priority")}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="input" aria-label="Filter by assignee" value={filters.assignee_id} onChange={setFilter("assignee_id")}>
          <option value="">Everyone</option>
          {project.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </section>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error} <button className="ml-2 underline" onClick={() => setError("")}>Dismiss</button>
        </p>
      )}

      {/* Kanban board */}
      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key}
                 onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                 onDragLeave={() => setDragOver(null)}
                 onDrop={(e) => handleDrop(e, col.key)}
                 className={`min-h-[16rem] rounded-lg bg-board p-3 transition-shadow ${dragOver === col.key ? "ring-2 ring-pine" : ""}`}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                {col.title}
                <span className="font-normal text-slate-500">{items.length}</span>
              </h2>
              <div className="space-y-2">
                {items.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={setModalTask} onDragStart={handleDragStart} />
                ))}
                {items.length === 0 && <p className="py-6 text-center text-xs text-slate-500">Drop a task here</p>}
              </div>
            </div>
          );
        })}
      </section>

      {isOwner && (
        <div className="mt-10 border-t border-slate-200 pt-4">
          <button className="btn-danger" onClick={handleDeleteProject}>Delete this project</button>
        </div>
      )}

      {modalTask !== undefined && (
        <TaskModal task={modalTask} members={project.members} onSave={saveTask}
                   onDelete={deleteTask} onClose={() => setModalTask(undefined)} />
      )}
    </main>
  );
}
