import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Dashboard() {
  const [projects, setProjects] = useState(null); // null = still loading
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    api.listProjects().then(setProjects).catch((e) => setError(e.message));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const created = await api.createProject(form);
      setProjects([created, ...projects]);
      setForm({ name: "", description: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Your projects</h1>

      <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="pname">Project name</label>
          <input id="pname" className="input" value={form.name} required
                 onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="flex-[2]">
          <label className="label" htmlFor="pdesc">Description (optional)</label>
          <input id="pdesc" className="input" value={form.description}
                 onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn-primary">Create project</button>
      </form>

      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}

      {projects === null ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="mt-8 text-slate-600">No projects yet. Name your first one above to get a board.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const pct = p.task_count ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <li key={p.id}>
                <Link to={`/projects/${p.id}`}
                      className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-pine focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/50">
                  <h2 className="font-semibold">{p.name}</h2>
                  {p.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.description}</p>}
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-board">
                    <div className="h-full bg-pine" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {p.done_count} of {p.task_count} tasks done
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
