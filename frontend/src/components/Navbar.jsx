import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold tracking-tight text-pine">Taskboard</Link>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">{user.name}</span>
            <button className="btn-ghost" onClick={() => { logout(); navigate("/login"); }}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
