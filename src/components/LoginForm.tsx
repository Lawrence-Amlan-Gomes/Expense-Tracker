// src/components/LoginForm.tsx
"use client";

import {
  findUserByEmail,
  generateJwtForGoogle,
  performLogin,
  updateUser,
} from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { CleanUser } from "@/store/features/auth/authSlice";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const { theme } = useTheme();
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
  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          submitForm();
        }
      }}
      className={`h-screen w-full sm:pt-[5%] pt-[30%] sm:px-0 px-[10%] overflow-y-auto lg:overflow-hidden lg:flex lg:justify-center lg:items-center ${
        theme ? `bg-white ${colors.bgLight}` : `bg-black ${colors.bgDark}`
      }`}
    >
      <div
        className={`sm:p-10 p-5 rounded-md sm:my-[5%] sm:w-[50%] sm:mx-[25%] lg:w-[400px] xl:w-[450px] 2xl:w-[500px] lg:my-0 text-center ${
          theme ? `${colors.cardLight}` : `${colors.cardDark}`
        }`}
      >
        <div className="text-[20px] lg:text-[25px] 2xl:text-[40px] font-bold sm:mb-10">
          Login
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

        {mainError.isError && (
          <div className="mt-3 text-red-600 text-[10px] lg:text-[14px] 2xl:text-[22px]">
            {mainError.error}
          </div>
        )}

        <button
          onClick={submitForm}
          disabled={emailError.iserror || passwordError.iserror || isLoading}
          className={`
    text-[12px] lg:text-[16px] 2xl:text-[25px]
    ${!emailError.iserror && !passwordError.iserror ? "cursor-pointer" : "cursor-not-allowed"} rounded-lg mt-6 sm:mt-12 py-2 sm:py-2.5 md:py-3 px-5 sm:px-6 md:px-8
    font-medium transition-all duration-300 ease-out
    shadow-sm hover:shadow-md active:scale-[0.98]
    border border-transparent
    ${
      !emailError.iserror && !passwordError.iserror
        ? theme
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-green-700 hover:bg-green-800 text-white"
        : theme
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-gray-800 text-gray-500 cursor-not-allowed"
    }
  `}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <div className="w-full flex flex-col items-center justify-center">
          <button
            onClick={handleGoogleSignIn}
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
                {isLoadingGoogle
                  ? `Logging...`
                  : session
                    ? `${session.user?.email}`
                    : `Login with Google`}
              </div>
            </div>
          </button>
          {googleError.isError && (
            <div className="mt-2 text-red-600 text-[10px] lg:text-[14px] 2xl:text-[22px]">
              {googleError.error}
            </div>
          )}
        </div>

        <div className="sm:mt-18 mt-5 text-[12px] lg:text-[16px] 2xl:text-[26px]">
          No Account?{" "}
          <Link
            href="/register"
            className={`${colors.keyText} ${colors.keyHoverText}`}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
