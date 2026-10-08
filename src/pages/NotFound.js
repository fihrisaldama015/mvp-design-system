import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-7xl mb-4">🔍</div>
      <h1 className="text-5xl font-black text-gray-300 tracking-tight">404</h1>
      <p className="mt-3 text-gray-600">We can't find the page you are looking for.</p>
      <Link to="/" className="mt-6 text-blue-600 underline">
        Go back home
      </Link>
    </div>
  );
}
