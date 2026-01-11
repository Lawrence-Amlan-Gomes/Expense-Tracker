// src/app/(auth)/change-password/ChangePassword.tsx
"use client";

import { verifyAndChangePassword } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";

const ChangePassword = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user: auth } = useAuth(); // never touch auth.password

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [oldError, setOldError] = useState({
    iserror: true,
    error: "Old password is required",
  });
  const [newError, setNewError] = useState({
    iserror: true,
    error: "Your password must be at least 8 characters",
  });
  const [confirmError, setConfirmError] = useState({
    iserror: true,
    error: "Your password must be at least 8 characters",
  });

  const [serverMsg, setServerMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [noError, setNoError] = useState(false);

  /* --------------------------------------------------------------------- */
  /* Redirect if not logged in                                            */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    if (!auth) router.push("/login");
  }, [auth, router]);

  /* --------------------------------------------------------------------- */
  /* Validation – old password                                            */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    setOldError({
      iserror: !oldPassword,
      error: oldPassword ? "" : "Old password is required",
    });
  }, [oldPassword]);

  /* --------------------------------------------------------------------- */
  /* Validation – new password                                            */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    const ok = newPassword.length >= 8;
    setNewError({
      iserror: !ok,
      error: ok ? "" : "Your password must be at least 8 characters",
    });
  }, [newPassword]);

  /* --------------------------------------------------------------------- */
  /* Validation – confirm password                                        */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    if (confirmPassword.length < 8) {
      setConfirmError({
        iserror: true,
        error: "Your password must be at least 8 characters",
      });
    } else if (newPassword !== confirmPassword) {
      setConfirmError({ iserror: true, error: "Passwords do not match" });
    } else {
      setConfirmError({ iserror: false, error: "" });
    }
  }, [newPassword, confirmPassword]);

  /* --------------------------------------------------------------------- */
  /* Enable submit button                                                 */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    setNoError(!oldError.iserror && !newError.iserror && !confirmError.iserror);
  }, [oldError.iserror, newError.iserror, confirmError.iserror]);

  /* --------------------------------------------------------------------- */
  /* Submit                                                               */
  /* --------------------------------------------------------------------- */
  const submitForm = async () => {
    if (!noError || !auth) return;

    const sure = confirm("Are you sure you want to change your password?");
    if (!sure) return;

    setIsLoading(true);
    setServerMsg("");

    try {
      await verifyAndChangePassword(auth.email, oldPassword, newPassword);
      alert("Password changed successfully!");
      router.push("/profile");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "INCORRECT_OLD_PASSWORD") {
        setOldError({ iserror: true, error: "Old password is incorrect" });
      } else {
        setServerMsg("Failed to change password. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* --------------------------------------------------------------------- */
  /* Render                                                               */
  /* --------------------------------------------------------------------- */
  if (!auth) {
    return (
      <div
        className={`w-full h-full flex justify-center items-center ${
          theme ? "bg-[#ffffff] text-[#0a0a0a]" : "bg-[#000000] text-[#ebebeb]"
        }`}
      >
        <div className="p-10 text-[18px] sm:text-[20px] md:text-[25px] lg:text-[30px] xl:text-[35px] 2xl:text-[40px]">
          You have to login first
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:p-0 p-[5%] overflow-y-auto lg:overflow-hidden lg:flex lg:justify-center lg:items-center sm:pt-[12%]">
      <div
        className={`p-10 overflow-hidden rounded-lg sm:my-[5%] sm:w-[80%] sm:mx-[10%] lg:w-[700px] xl:w-[800px] 2xl:w-[900px] lg:my-0 text-center ${
          theme ? colors.cardLight : colors.cardDark
        }`}
      >
        {/* Title + fake field (keeps autofill happy) */}
        <div className="w-full overflow-hidden">
          <div className="text-[20px] sm:text-[25px] md:text-[30px] lg:text-[35px] xl:text-[40px] 2xl:text-[45px] font-bold mb-10">
            Change Password
          </div>
          <div className="opacity-0">
            <EachField
              label="fake"
              type="password"
              name="password"
              isReal={false}
              placeholder="Enter your password"
              value={oldPassword}
              setValue={setOldPassword}
              iserror={oldError.iserror}
              error={oldError.error}
            />
          </div>
        </div>

        {/* ────── MOBILE ────── */}
        <div className="w-full sm:hidden block overflow-hidden space-y-4">
          <EachField
            label="Old Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Enter your old Password"
            value={oldPassword}
            setValue={setOldPassword}
            iserror={oldError.iserror}
            error={oldError.error}
          />
          <EachField
            label="New Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Enter your new Password"
            value={newPassword}
            setValue={setNewPassword}
            iserror={newError.iserror}
            error={newError.error}
          />
          <EachField
            label="Confirm New Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Confirm your Password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            iserror={confirmError.iserror}
            error={confirmError.error}
          />
          <button
            onClick={submitForm}
            disabled={!noError || isLoading}
            className={`text-[18px] cursor-pointer rounded-lg mt-10 py-2 px-6 mb-5 shadow-md w-full ${
              noError && !isLoading
                ? "bg-green-700 text-white"
                : theme
                ? "bg-[#dbdbdb] text-[#808080]"
                : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            {isLoading ? "Changing…" : "Change Password"}
          </button>
        </div>

        {/* ────── DESKTOP ────── */}
        <div className="hidden sm:block">
          <div className="float-left w-[50%] pr-5 overflow-hidden">
            <EachField
              label="New Password"
              type="password"
              name="password"
              isReal={true}
              placeholder="Enter your new Password"
              value={newPassword}
              setValue={setNewPassword}
              iserror={newError.iserror}
              error={newError.error}
            />
            <EachField
              label="Confirm New Password"
              type="password"
              name="password"
              isReal={true}
              placeholder="Confirm your Password"
              value={confirmPassword}
              setValue={setConfirmPassword}
              iserror={confirmError.iserror}
              error={confirmError.error}
            />
          </div>

          <div className="float-left w-[50%] pl-5 overflow-hidden">
            <EachField
              label="Old Password"
              type="password"
              name="password"
              isReal={true}
              placeholder="Enter your old Password"
              value={oldPassword}
              setValue={setOldPassword}
              iserror={oldError.iserror}
              error={oldError.error}
            />
            <button
              onClick={submitForm}
              disabled={!noError || isLoading}
              className={`text-[12px] lg:text-[16px] 2xl:text-[25px] cursor-pointer rounded-lg mt-10 py-2 px-6 mb-5 w-full ${
                noError && !isLoading
                  ? "bg-green-700 text-white"
                  : theme
                  ? "bg-[#dbdbdb] text-[#808080]"
                  : "bg-[#1a1a1a] text-[#696969]"
              }`}
            >
              {isLoading ? "Changing…" : "Change Password"}
            </button>
          </div>
        </div>

        {/* Server error */}
        {serverMsg && <p className="mt-4 text-red-600 text-sm">{serverMsg}</p>}
      </div>
    </div>
  );
};

export default ChangePassword;