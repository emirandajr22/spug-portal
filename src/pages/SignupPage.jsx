import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import bg from "../assets/bg-inpc.png";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      const user = data.user;

      if (!user) {
        throw new Error("Unable to create account.");
      }

      const { error: profileError } = await supabase
        .schema("spug")
        .from("users")
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: fullName,
          department,
          position,
          role: "user",
          status: "pending",
        });

      if (profileError) {
        throw profileError;
      }

      setMessage(
        "Account created successfully. Awaiting administrator approval.",
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── LEFT ── */}
      <div
        className="hidden lg:flex w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="absolute inset-0 bg-dark/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark/40 to-sky" />
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

      {/* ── RIGHT ── */}
      <div className="flex flex-1 items-center justify-center bg-sky p-6">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-xl bg-white/90 backdrop-blur-md border border-white/40
                     rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-8"
        >
          <h2 className="text-3xl font-semibold text-dark mb-2">
            Create account
          </h2>
          <p className="text-gray-500 mb-6">Sign up to get started</p>

          {error && (
            <p className="text-accentRed text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-green-600 text-sm mb-4 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg
                 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Position</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg
                 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg
                 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg
                 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full mt-1 p-3 pr-10 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-primary outline-none transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full mt-1 p-3 pr-10 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-primary outline-none transition"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
    mt-6
    w-full
    bg-primary
    text-white
    p-3
    rounded-lg
    shadow-md
    hover:shadow-lg
    hover:bg-dark
    transition-all
    duration-300
    disabled:opacity-60
    disabled:cursor-not-allowed
  "
          >
            {loading ? "Creating…" : "Create Account"}
          </button>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
