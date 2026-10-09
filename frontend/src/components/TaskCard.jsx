const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-emerald-100 text-emerald-800",
};

function dueInfo(due, status) {
  if (!due) return null;
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" compares correctly as text
  const overdue = due < today && status !== "done";
  const label = new Date(due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { label, overdue };
}

export default function TaskCard({ task, onClick, onDragStart }) {
  const due = dueInfo(task.due_date, task.status);

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      onKeyDown={(e) => e.key === "Enter" && onClick(task)}
      tabIndex={0}
      className="cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm hover:border-pine focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/50 active:cursor-grabbing"
    >
      <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{task.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded px-1.5 py-0.5 font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        {due && (
          <span className={due.overdue ? "font-semibold text-red-700" : "text-slate-500"}>
            {due.overdue ? "Overdue · " : "Due "}{due.label}
          </span>
        )}
        {task.assignee && (
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-pine-light font-semibold text-pine-dark"
                title={task.assignee.name}>
            {task.assignee.name[0].toUpperCase()}
          </span>
        )}
      </div>
    </article>
  );
}
