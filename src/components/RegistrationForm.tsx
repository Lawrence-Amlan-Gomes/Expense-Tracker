// src/components/RegistrationForm.tsx
"use client";

import { createUser } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";
import AuthShell from "./AuthShell";

const RegistrationForm = () => {
  const router = useRouter();
  const { setGoogleAuth } = useAuth();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isGoogleClicked, setIsGoogleClicked] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nameError, setNameError] = useState({
    iserror: true,
    error: "Name is required",
  });
  const [emailError, setEmailError] = useState({
    iserror: true,
    error: "Email is required",
  });
  const [passwordError, setPasswordError] = useState({
    iserror: true,
    error: "Your password must be at least 8 characters",
  });
  const [googleError, setGoogleError] = useState({ isError: false, error: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const [noError, setNoError] = useState(false);

  // Sync Google session
  useEffect(() => {
    if (session?.user) {
      setGoogleAuth({
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || "",
      });
    }
  }, [session, setGoogleAuth]);

  // Validation
  useEffect(() => {
    setNameError(
      name
        ? { iserror: false, error: "" }
        : { iserror: true, error: "Name is required" },
    );
  }, [name]);

  useEffect(() => {
    if (!email) {
      setEmailError({ iserror: true, error: "Email is required" });
    } else if (!email.endsWith("@gmail.com")) {
      setEmailError({
        iserror: true,
        error: "Use @gmail.com as your email format",
      });
    } else {
      setEmailError({ iserror: false, error: "" });
    }
  }, [email]);

  useEffect(() => {
    setPasswordError(
      password.length >= 8
        ? { iserror: false, error: "" }
        : {
            iserror: true,
            error: "Your password must be at least 8 characters",
          },
    );
  }, [password]);

  useEffect(() => {
    setNoError(
      !nameError.iserror && !emailError.iserror && !passwordError.iserror,
    );
  }, [nameError.iserror, emailError.iserror, passwordError.iserror]);

  useEffect(() => {
    if (googleError.isError) {
      const t = setTimeout(
        () => setGoogleError({ isError: false, error: "" }),
        5000,
      );
      return () => clearTimeout(t);
    }
  }, [googleError.isError]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(t);
    }
  }, [successMessage, router]);

  const submitForm = async () => {
    if (!noError) return;
    if (!confirm("Are you sure to Register?")) return;
    setIsLoading(true);
    try {
      await createUser({ name, email, password, photo: "" });
      setSuccessMessage(`${email} successfully registered`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.message === "EMAIL_ALREADY_EXISTS") {
        setEmailError({
          iserror: true,
          error: "This email is already registered",
        });
      } else {
        setEmailError({
          iserror: true,
          error: "Registration failed. Try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoadingGoogle(true);
    setIsGoogleClicked(true);
    if (!session?.user) {
      await signIn("google");
    }
    setIsLoadingGoogle(false);
  };

  /* ------------------------------------------------------------------ */
  /*  Google-auth registration – now fully type-safe                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (session?.user && isGoogleClicked) {
      const user = session.user; // Now guaranteed to be defined

      const run = async () => {
        // `user` is in scope and type-narrowed
        if (!user.email) {
          setGoogleError({
            isError: true,
            error: "Google account has no email. Please try again.",
          });
          setIsGoogleClicked(false);
          return;
        }

        const userEmail = user.email;

        try {
          await createUser({
            name: user.name ?? userEmail.split("@")[0],
            email: userEmail,
            password: "",
            photo: "",
          });
          setSuccessMessage(`${userEmail} successfully registered`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          if (err.message === "EMAIL_ALREADY_EXISTS") {
            setGoogleError({
              isError: true,
              error: `${userEmail} is already registered. Please log in.`,
            });
          } else {
            setGoogleError({
              isError: true,
              error: "Auto-registration failed.",
            });
          }
        } finally {
          setIsGoogleClicked(false);
        }
      };

      run();
    }
  }, [session, isGoogleClicked]);

  /* ------------------------------------------------------------------ */

  return (
    <div
      className="flex w-full flex-1 flex-col"
      onKeyDown={(e) => e.key === "Enter" && submitForm()}
    >
      <AuthShell
        title="Create your account"
        subtitle="Free for 7 days. No card needed."
      >
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
          label="Name"
          type="name"
          name="name"
          isReal={true}
          placeholder="Your name"
          value={name}
          setValue={setName}
          iserror={nameError.iserror}
          error={nameError.error}
        />
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
          placeholder="At least 8 characters"
          value={password}
          setValue={setPassword}
          iserror={passwordError.iserror}
          error={passwordError.error}
        />

        <button
          onClick={submitForm}
          disabled={!noError || isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? "Creating account…" : "Create account"}
        </button>

        <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
          <span className="h-px flex-1 bg-hairline" />
          or
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <button
          onClick={handleGoogleRegister}
          className="btn-outline w-full !normal-case"
        >
          <Image src="/googleIcon.png" alt="" width={20} height={20} />
          {isLoadingGoogle
            ? "Creating account…"
            : session
              ? `${session.user?.email}`
              : "Continue with Google"}
        </button>

        {successMessage && (
          <p className="text-sm font-medium text-brand" role="status">
            {successMessage}
          </p>
        )}
        {googleError.isError && (
          <p className="text-sm font-medium text-error" role="alert">
            {googleError.error}
          </p>
        )}

        <p className="pt-2 text-center text-sm text-body">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </AuthShell>
    </div>
  );
};

export default RegistrationForm;
