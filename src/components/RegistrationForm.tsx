// src/components/RegistrationForm.tsx
"use client";

import { createUser } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";

const RegistrationForm = () => {
  const { theme } = useTheme();
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
        : { iserror: true, error: "Name is required" }
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
          }
    );
  }, [password]);

  useEffect(() => {
    setNoError(
      !nameError.iserror && !emailError.iserror && !passwordError.iserror
    );
  }, [nameError.iserror, emailError.iserror, passwordError.iserror]);

  useEffect(() => {
    if (googleError.isError) {
      const t = setTimeout(
        () => setGoogleError({ isError: false, error: "" }),
        5000
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
            photo: user.image ?? "",
          });
          setSuccessMessage(`${userEmail} successfully registered`);
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
      onKeyDown={(e) => e.key === "Enter" && submitForm()}
      className={`h-screen w-full sm:pt-[5%] pt-[30%] sm:px-0 px-[10%] overflow-y-auto lg:overflow-hidden lg:flex lg:justify-center lg:items-center ${
        theme
          ? `${colors.bgLight} ${colors.bgLight}`
          : `${colors.bgDark} ${colors.bgDark}`
      }`}
    >
      <div
        className={`sm:p-10 p-5 overflow-hidden rounded-lg sm:my-[5%] sm:w-[80%] sm:mx-[10%] lg:w-[700px] xl:w-[800px] 2xl:w-[900px] lg:my-0 text-center ${
          theme ? `${colors.cardLight}` : `${colors.cardDark}`
        }`}
      >
        <div className="w-full overflow-hidden">
          <div className="text-[20px] lg:text-[25px] 2xl:text-[40px] font-bold sm:mb-5 w-full float-left flex justify-center items-center">
            Registration
          </div>
          <div className="opacity-0">
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
        </div>

        {/* Mobile */}
        <div className="w-full sm:hidden block overflow-hidden">
          <EachField
            label="Name"
            type="name"
            name="name"
            isReal={true}
            placeholder="Enter your name"
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
            placeholder="Enter your email"
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
          <button
            onClick={submitForm}
            className={`text-[12px] cursor-pointer rounded-md mt-5 py-2 px-4 ${
              noError
                ? "bg-green-800 hover:bg-green-700 text-white"
                : theme
                ? "bg-[#dbdbdb] text-[#808080]"
                : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            {isLoading ? `Registering...` : `Register`}
          </button>
        </div>

        {/* Desktop */}
        <div className="float-left w-[50%] sm:block hidden pr-5">
          <EachField
            label="Email"
            type="email"
            name="email"
            isReal={true}
            placeholder="Enter your email"
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
        </div>

        <div className="float-left w-[50%] sm:block hidden pl-5">
          <EachField
            label="Name"
            type="name"
            name="name"
            isReal={true}
            placeholder="Enter your name"
            value={name}
            setValue={setName}
            iserror={nameError.iserror}
            error={nameError.error}
          />
          <button
            onClick={submitForm}
            className={`text-[12px] lg:text-[16px] 2xl:text-[25px] cursor-pointer rounded-md sm:mt-10 py-2 px-6 ${
              noError
                ? "bg-green-800 hover:bg-green-700 text-white"
                : theme
                ? "bg-[#dbdbdb] text-[#808080]"
                : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            {isLoading ? `Registering...` : `Register`}
          </button>
        </div>

        <div className="w-full flex flex-col items-center justify-center">
          <button
            onClick={handleGoogleRegister}
            className={`text-[12px] lg:text-[16px] 2xl:text-[25px] flex items-center gap-4 lg:h-[60px] h-[40px] cursor-pointer rounded-md mt-10 py-2 px-4 lg:px-6 ${
              theme
                ? `${colors.keyBg} ${colors.keyHoverBg}`
                : `${colors.keyBg} ${colors.keyHoverBg}`
            } text-white`}
          >
            <div className="h-full flex justify-center items-center">
              <div className="h-[30px] sm:h-[50px] w-[30px] sm:w-[50px] relative">
                <Image
                  priority
                  src="/googleIcon.png"
                  alt="Google Icon"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="h-full text-center flex justify-center items-center">
              <div>
                {isLoadingGoogle ? `Registering...` : `Register in with Google`}
              </div>
            </div>
          </button>

          {successMessage && (
            <div className="mt-3 text-green-700 text-[12px] lg:text-[16px] 2xl:text-[24px] font-medium animate-pulse">
              {successMessage}
            </div>
          )}
          {googleError.isError && (
            <div className="mt-2 text-red-600 text-[10px] lg:text-[14px] 2xl:text-[22px]">
              {googleError.error}
            </div>
          )}
        </div>

        <div className="float-left w-full overflow-hidden">
          <p className="sm:mt-10 mt-5 text-[12px] lg:text-[16px] 2xl:text-[26px]">
            Already Have An Account?{" "}
            <Link
              href="/login"
              className={`${colors.keyText} ${colors.keyHoverText}`}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
