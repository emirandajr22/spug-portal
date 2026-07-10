import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function SSOLogin() {
  const navigate = useNavigate();
  const hasRun = useRef(false);

  const redirectByRole = (role) => {
    if (role === "admin") return "/";
    if (role === "manager") return "/manager";
    return "/";
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    autoLogin();
  }, []);

  const autoLogin = async () => {
    console.log("========== SSO LOGIN ==========");
    console.log(window.location.href);

    try {
      const params = new URLSearchParams(window.location.search);

      const token = params.get("sso_token");
      const source = params.get("source");

      console.log("token:", token);
      console.log("source:", source);

      if (!token || source !== "vec") {
        navigate("/login", { replace: true });
        return;
      }

      console.log("STEP 1");

      const { data, error } = await supabase.functions.invoke(
        "consume-sso-token",
        {
          body: { token },
        },
      );

      console.log("ACCESS:", data.access_token);
      console.log("REFRESH:", data.refresh_token);

      if (error || !data) {
        console.error(error);
        navigate("/login", { replace: true });
        return;
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

      console.log(sessionData);
      console.log(sessionError);

      console.log("STEP 2");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("STEP 3");

      if (authError || !user) {
        console.error(authError);
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return;
      }

      const { data: userData, error: userError } = await supabase
        .schema("spug")
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      console.log("STEP 4");

      if (userError || !userData) {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return;
      }

      if (userData.status === "pending") {
        await supabase.auth.signOut();
        navigate("/login", {
          replace: true,
          state: {
            error: "Your account is still pending approval.",
          },
        });
        return;
      }

      if (userData.status !== "active") {
        await supabase.auth.signOut();
        navigate("/login", {
          replace: true,
          state: {
            error: "Your account is inactive.",
          },
        });
        return;
      }

      // Update last login (same as your normal login)
      const previousLastLogin = userData.last_login || null;

      const now = new Date();
      const manilaTime = new Date(
        now.toLocaleString("en-US", {
          timeZone: "Asia/Manila",
        }),
      );

      const manilaISO = manilaTime.toISOString().replace("Z", "");

      await supabase
        .schema("spug")
        .from("users")
        .update({
          last_login: manilaISO,
        })
        .eq("auth_user_id", user.id);

      if (previousLastLogin) {
        localStorage.setItem("previous_last_login", previousLastLogin);
      } else {
        localStorage.removeItem("previous_last_login");
      }

      console.log("STEP 5");

      // Save where the user came from
      localStorage.setItem(
        "sso_return_url",
        "http://localhost:5173/", // <-- your VEC Portal URL for development
      );

      // For production later:
      // localStorage.setItem(
      //   "sso_return_url",
      //   "https://portal.vec-powerconnect.com/login", // <-- your VEC Portal URL for production
      // );

      console.log("Saved!");
      console.log(localStorage.getItem("sso_return_url"));

      navigate(redirectByRole(userData.role), {
        replace: true,
      });
    } catch (err) {
      console.error(err);

      await supabase.auth.signOut();

      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#00313a] border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>

        <h2 className="text-xl font-semibold text-[#00313a]">
          Signing you in...
        </h2>

        <p className="text-gray-500 mt-2">Please wait...</p>
      </div>
    </div>
  );
}
