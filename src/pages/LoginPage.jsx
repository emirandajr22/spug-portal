import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import bg from "../assets/bg-inpc.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Support both: full email or bare username → append @spug.internal
    const loginEmail = email.trim().toLowerCase();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authError) {
      setError("Access Denied: Incorrect credentials.");
      setLoading(false);
      return;
    }

    const user = data.user;

    const { data: profile, error: profileError } = await supabase
      .schema("spug")
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(profileError);

      setError("Unable to verify user profile.");
      setLoading(false);
      return;
    }

    if (!profile) {
      // Account already exists in Supabase Auth (auth.users), so it was
      // already provisioned/approved there — no need for a second
      // "pending" approval step inside the webapp.
      const { error: insertError } = await supabase
        .schema("spug")
        .from("users")
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "",
          role: "user",
          status: "active",
        });

      if (insertError) {
        console.error(insertError);

        setError("Unable to create user profile. Contact administrator.");

        setLoading(false);
        return;
      }
    }

    const { data: finalProfile, error: finalProfileError } = await supabase
      .schema("spug")
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (finalProfileError) {
      console.error(finalProfileError);

      setError("Unable to load user profile.");
      setLoading(false);
      return;
    }

    if (finalProfile.status !== "active") {
      await supabase.auth.signOut();

      setError("Your account is pending approval by an administrator.");

      setLoading(false);
      return;
    }

    localStorage.removeItem("sso_return_url");
    navigate("/", { replace: true });

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── LEFT — background image panel ── */}
      <div
        className="hidden lg:flex w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      >
        {/* Dark base overlay */}
        <div className="absolute inset-0 bg-dark/60" />

        {/* Gradient fade toward the form side */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark/40 to-sky" />

        {/* Text content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <h1 className="text-3xl font-semibold">SPUG Energy Portal</h1>
            <p className="mt-3 text-gray-200">Secure. Reliable. Sustainable.</p>
          </div>
          <p className="text-sm text-gray-300">
            Powering energy insights across regions.
          </p>
        </div>
      </div>

      {/* ── RIGHT — login form ── */}
      <div className="flex flex-1 items-center justify-center bg-sky p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8"
        >
          <h2 className="text-2xl font-semibold text-moss mb-2">Welcome</h2>
          <p className="text-gray-500 mb-6">Sign in to your account</p>

          {error && (
            <p className="text-ember text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Email / Username */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Email or Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. email@vivant.com.ph"
              required
              autoComplete="username"
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
    w-full
    bg-moss
    text-white
    p-3
    rounded-lg
    hover:bg-moss-light
    transition duration-200
    disabled:opacity-60
    disabled:cursor-not-allowed
  "
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-darkblue font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
