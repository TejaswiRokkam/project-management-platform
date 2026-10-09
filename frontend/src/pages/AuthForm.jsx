import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

// One form used by both the Login and Register pages.
export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto mt-16 w-full max-w-sm px-4">
      <h1 className="text-2xl font-bold">{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {isRegister ? "Start organising your team's work." : "Log in to see your projects."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {isRegister && (
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={form.name} onChange={set("name")} required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" minLength={6} className="input" value={form.password}
                 onChange={set("password")} required />
          {isRegister && <p className="mt-1 text-xs text-slate-500">At least 6 characters.</p>}
        </div>

        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Please wait…" : isRegister ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link className="font-semibold text-pine hover:underline" to={isRegister ? "/login" : "/register"}>
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </main>
  );
}
