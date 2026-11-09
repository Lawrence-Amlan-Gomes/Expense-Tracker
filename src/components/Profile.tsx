// src/components/Profile.tsx
"use client";

import { updateUser } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { logout } from "@/store/features/auth/authSlice";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import PageBand from "./PageBand";
import Footer from "./Footer";

const Profile = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user: auth, googleUser, setAuth } = useAuth();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(auth.name || "");
    }
  }, [auth]);

  const handleUpdate = async () => {
    if (!auth || !name.trim()) return;
    setIsEditing(false);

    try {
      await updateUser(auth.email, { name, firstTimeLogin: false });
      setAuth({ ...auth, name });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Failed to update name. Please try again.");
      setName(auth.name || "");
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleUpdate();
    } else {
      setIsEditing(true);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;

    dispatch(logout());
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (!auth) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl">Please sign in</h1>
          <p className="text-sm font-light text-body">
            You need to be signed in to view this page.
          </p>
          <Link href="/login" className="btn-primary mt-5">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageBand crumb="Profile" title="Your profile" lead={auth.email} />

      <section className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 md:py-14">
        <div className="mx-auto grid max-w-3xl gap-6">
          {/* Name */}
          <div className="card p-6">
            <p className="eyebrow mb-2">Name</p>
            {isEditing ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field text-lg font-bold"
                placeholder="Your name"
                aria-label="Your name"
              />
            ) : (
              <p className="text-2xl font-bold text-ink">{name || "User"}</p>
            )}
          </div>

          {/* Subscription */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <p className="eyebrow mb-2">Subscription</p>
              <p className="text-lg font-bold text-ink">{auth.paymentType || "—"}</p>
            </div>
            <div className="card p-6">
              <p className="eyebrow mb-2">Expires</p>
              <p className="text-lg font-bold text-ink">
                {auth.expiredAt ? auth.expiredAt.split("T")[0] : "—"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid gap-3 sm:grid-cols-3">
            <button onClick={toggleEdit} className="btn-primary">
              {isEditing ? "Save changes" : "Edit profile"}
            </button>

            {!googleUser && (
              <Link href="/changePassword" className="btn-secondary">
                Change password
              </Link>
            )}

            <button onClick={handleLogout} className="btn-outline !border-error !text-error hover:!bg-error/10">
              Sign out
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profile;
