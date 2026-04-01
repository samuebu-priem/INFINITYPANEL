import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-slate-400 mt-3">Página não encontrada.</p>
        <Link to="/" className="inline-block mt-6 rounded-2xl bg-sky-600 hover:bg-sky-500 px-4 py-3 font-semibold">
          Voltar
        </Link>
      </div>
    </div>
  );
}