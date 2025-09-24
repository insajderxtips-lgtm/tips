import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token nije validan ili je istekao.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) return setError("Nedostaje token.");

    if (password.length < 6) {
      return setError("Lozinka mora imati najmanje 6 karaktera.");
    }

    if (password !== confirmPassword) {
      return setError("Lozinke se ne poklapaju.");
    }

    // 🔧 Dummy API endpoint
    const api = "/resetPassword";

    try {
      const res = await fetch(api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Lozinka uspešno resetovana! Preusmeravamo vas na login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message || "Došlo je do greške.");
      }
    } catch (err) {
      console.error(err);
      setError("Neuspešno resetovanje. Pokušajte ponovo.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">
          Resetujte Lozinku
        </h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-1">
              Nova Lozinka
            </label>
            <input
              type="password"
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-1">
              Potvrdite Lozinku
            </label>
            <input
              type="password"
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Resetuj Lozinku
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
