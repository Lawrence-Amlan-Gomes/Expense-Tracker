// src/app/(auth)/change-password/ChangePassword.tsx
"use client";

import { verifyAndChangePassword } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";
import AuthShell from "./AuthShell";

const ChangePassword = () => {
  const router = useRouter();
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
      <div className="flex w-full flex-1 items-center justify-center bg-soft p-10">
        <p className="text-lg font-bold text-ink">You have to sign in first</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      <AuthShell
        title="Change password"
        subtitle="Use at least 8 characters. Pick something you don't use elsewhere."
      >
        <div className="absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
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

        <EachField
          label="Old password"
          type="password"
          name="password"
          isReal={true}
          placeholder="Enter your old password"
          value={oldPassword}
          setValue={setOldPassword}
          iserror={oldError.iserror}
          error={oldError.error}
        />
        <EachField
          label="New password"
          type="password"
          name="password"
          isReal={true}
          placeholder="Enter your new password"
          value={newPassword}
          setValue={setNewPassword}
          iserror={newError.iserror}
          error={newError.error}
        />
        <EachField
          label="Confirm new password"
          type="password"
          name="password"
          isReal={true}
          placeholder="Confirm your new password"
          value={confirmPassword}
          setValue={setConfirmPassword}
          iserror={confirmError.iserror}
          error={confirmError.error}
        />

        <button
          onClick={submitForm}
          disabled={!noError || isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? "Changing…" : "Change password"}
        </button>

        {serverMsg && (
          <p className="text-sm font-medium text-error" role="alert">
            {serverMsg}
          </p>
        )}
      </AuthShell>
    </div>
  );
};

export default ChangePassword;
