// src/components/LoginForm.tsx
"use client";

import {
  findUserByEmail,
  generateJwtForGoogle,
  performLogin,
  updateUser,
} from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { CleanUser } from "@/store/features/auth/authSlice";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";
import AuthShell from "./AuthShell";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const { user: auth, setAuth, setGoogleAuth } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState({
    iserror: true,
    error: "Email is required",
  });
  const [passwordError, setPasswordError] = useState({
    iserror: true,
    error: "Password is required",
  });
  const [mainError, setMainError] = useState({ isError: false, error: "" });
  const [googleError, setGoogleError] = useState({ isError: false, error: "" });

  useEffect(() => {
    setEmailError(
      email
        ? { iserror: false, error: "" }
        : { iserror: true, error: "Email is required" },
    );
    setPasswordError(
      password
        ? { iserror: false, error: "" }
        : { iserror: true, error: "Password is required" },
    );
    setMainError({ isError: false, error: "" });
    setGoogleError({ isError: false, error: "" });
  }, [email, password]);

  useEffect(() => {
    if (googleError.isError) {
      const t = setTimeout(
        () => setGoogleError({ isError: false, error: "" }),
        3000,
      );
      return () => clearTimeout(t);
    }
  }, [googleError.isError]);

  useEffect(() => {
    if (auth) {
      router.push("/");
    }
  }, [auth, router]);

  const submitForm = async () => {
    if (emailError.iserror || passwordError.iserror) return;

    setIsLoading(true);
    try {
      const result = await performLogin({ email, password });

      if (result) {
        const { user, token } = result;

        if (
          typeof window !== "undefined" &&
          !localStorage.getItem("authUser")
        ) {
          localStorage.setItem("authToken", token);
        }

        setAuth(user);
        router.push("/");
      } else {
        setMainError({
          isError: true,
          error: "Email or password is incorrect",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      setMainError({
        isError: true,
        error: "Something went wrong. Try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    try {
      if (!session?.user) {
        await signIn("google");
        return;
      }

      const userEmail = session.user.email!;
      const user = await findUserByEmail(userEmail);

      if (user) {
        // Update photo and firstTimeLogin if needed
        if (user.firstTimeLogin && session.user.image) {
          user.photo = session.user.image;
          await updateUser(userEmail, { firstTimeLogin: false });
        }

        // Normalize paymentType to satisfy CleanUser type
        const cleanUser: CleanUser = {
          ...user,
          paymentType: user.paymentType ?? "Expired",
        };

        const token = await generateJwtForGoogle(cleanUser);

        if (
          typeof window !== "undefined" &&
          !localStorage.getItem("authUser")
        ) {
          localStorage.setItem("authToken", token);
        }

        setAuth(cleanUser);
        setGoogleAuth({
          name: session.user.name!,
          email: session.user.email!,
          image: session.user.image!,
        });
        router.push("/");
      } else {
        setGoogleError({
          isError: true,
          error: `Your email ${userEmail} hasn't registered yet`,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Google login error:", err);
      setGoogleError({
        isError: true,
        error: err.message || "Google login failed. Try again.",
      });
    } finally {
      setIsLoadingGoogle(false);
    }
  };
  const canSubmit = !emailError.iserror && !passwordError.iserror && !isLoading;

  return (
    <div
      className="flex w-full flex-1 flex-col"
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          submitForm();
        }
      }}
    >
      <AuthShell title="Sign in" subtitle="Welcome back. Pick up where you left off.">
        <div className="absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
          <EachField
            label="fake"
            type="email"
            name="email"
            isReal={false}
            placeholder="Enter your email"
            value={email}
            setValue={setEmail}
            iserror={emailError.iserror}
            error={emailError.error}
          />
          <EachField
            label="fake"
            type="password"
            name="password"
            isReal={false}
            placeholder="Enter your password"
            value={password}
            setValue={setPassword}
            iserror={passwordError.iserror}
            error={passwordError.error}
          />
        </div>

        <EachField
          label="Email"
          type="email"
          name="email"
          isReal={true}
          placeholder="you@example.com"
          value={email}
          setValue={setEmail}
          iserror={emailError.iserror}
          error={emailError.error}
        />
        <EachField
          label="Password"
          type="password"
          name="password"
          isReal={true}
          placeholder="Enter your password"
          value={password}
          setValue={setPassword}
          iserror={passwordError.iserror}
          error={passwordError.error}
        />

        {mainError.isError && (
          <p className="text-sm font-medium text-error" role="alert">
            {mainError.error}
          </p>
        )}

        <button
          onClick={submitForm}
          disabled={!canSubmit}
          className="btn-primary w-full"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
          <span className="h-px flex-1 bg-hairline" />
          or
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="btn-outline w-full !normal-case"
        >
          <Image src="/googleIcon.png" alt="" width={20} height={20} />
          {isLoadingGoogle
            ? "Signing in…"
            : session
              ? `${session.user?.email}`
              : "Continue with Google"}
        </button>
        {googleError.isError && (
          <p className="text-sm font-medium text-error" role="alert">
            {googleError.error}
          </p>
        )}

        <p className="pt-2 text-center text-sm text-body">
          No account?{" "}
          <Link href="/register" className="font-bold text-brand underline underline-offset-4">
            Create one
          </Link>
        </p>
      </AuthShell>
    </div>
  );
};

export default LoginForm;
