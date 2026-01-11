// src/components/Profile.tsx
"use client";

import { updateUser } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { logout } from "@/store/features/auth/authSlice";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import ProfilePic from "./ProfilePic";

const Profile = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { user: auth, googleUser, setAuth } = useAuth();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(auth.name);
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
      alert("Failed to update name. Try again.");
      setName(auth.name);
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

  return auth ? (
    <div className="w-full overflow-y-auto lg:overflow-hidden lg:flex lg:justify-center lg:items-center pt-[15%] sm:pt-[12%]">
      <div
        className={`p-5 sm:p-10 overflow-hidden rounded-lg w-[80%] mx-[10%] mt-5 xl:w-[700px] lg:w-[600px] 2xl:w-[900px] lg:my-0 text-center ${
          theme ? `${colors.cardLight}` : `${colors.cardDark}`
        }`}
      >
        <div className="w-full sm:hidden block">
          <ProfilePic />
          {auth ? (
            <>
              <div className="w-full sm:mt-5 sm:mb-5 mt-5 text-[14px] flex items-center justify-center font-bold">
                {isEditing ? (
                  <input
                    className={`bg-transparent border-[2px] ${colors.keyBorder} focus:border-green-700 focus:outline-none text-center rounded-lg w-[70%] sm:w-full p-1 sm:p-3`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                ) : (
                  <div>{name}</div>
                )}
              </div>
              <div className="w-full sm:mt-5 sm:mb-5 my-2 text-[12px] sm:text-[20px] flex items-center justify-center">
                {auth.email}
              </div>
              <div className="w-full sm:mt-5 sm:mb-5 my-2 text-[12px] sm:text-[20px] flex items-center justify-center">
                {`Subscription: ${auth.paymentType}`}
              </div>
              <div className="w-full sm:mt-5 sm:mb-5 my-2 text-[12px] sm:text-[20px] flex items-center justify-center">
                {`Expired At: ${auth.expiredAt.split("T")[0]}`}
              </div>
              <div className="w-full mt-5 mb-5 flex text-[12px] sm:text-[18px] items-center justify-center">
                <button
                  onClick={toggleEdit}
                  className={`${
                    isEditing
                      ? "bg-green-700 hover:bg-green-800"
                      : `${colors.keyBg} ${colors.keyHoverBg}`
                  } bg-[#161616] sm:p-3 py-2 px-5 w-[70%] sm:w-full rounded-lg hover:bg-[#202020] tracking-wider text-white`}
                >
                  {isEditing ? "Update" : "Edit"}
                </button>
              </div>

              {/* CHANGE PASSWORD BUTTON – ONLY FOR EMAIL LOGIN */}
              {!googleUser && (
                <div className="w-full mt-5 mb-5 flex items-center justify-center">
                  <Link href="/changePassword" className="w-full">
                    <button
                      className={`sm:p-3 p-1 w-[70%] text-[12px] sm:text-[18px] sm:w-full tracking-wider py-2 px-5 shadow-lg rounded-lg ${
                        theme
                          ? "text-white bg-black border-[1px] border-black hover:bg-white hover:text-black hover:border-white"
                          : "text-black bg-white border-[1px] border-white hover:bg-black hover:text-white hover:border-black"
                      }`}
                    >
                      Change Password
                    </button>
                  </Link>
                </div>
              )}

              <div className="w-full mt-5 mb-5 flex items-center justify-center">
                <button
                  onClick={handleLogout}
                  className={`sm:p-3 p-1 w-[70%] text-[12px] sm:text-[18px] sm:w-full text-white tracking-wider py-2 px-5 shadow-lg rounded-lg ${
                    theme
                      ? "bg-red-700 hover:bg-red-800"
                      : "bg-red-800 hover:bg-red-900"
                  }`}
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>

        <div className={`w-full float-left sm:block hidden mb-5`}>
          <div
            className={`w-[50%] float-left h-[200px] flex justify-center items-center pb-5`}
          >
            <ProfilePic />
          </div>
          <div
            className={`w-[50%] float-left h-[200px] flex justify-center items-center`}
          >
            {auth ? (
              <div>
                <div className="w-full mt-5 mb-5 flex items-center justify-center font-bold text-[20px]">
                  {isEditing ? (
                    <input
                      className={`bg-transparent border-[2px] ${colors.keyBorder} focus:border-green-700 focus:outline-none text-center rounded-lg w-full p-3`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  ) : (
                    <div>{name}</div>
                  )}
                </div>
                <div className="w-full mt-5 mb-5 flex items-center justify-center">
                  {auth.email}
                </div>
                <div className="w-full mt-5 mb-5 flex items-center justify-center">
                  {`Subscription: ${auth.paymentType}`}
                </div>
                <div className="w-full mt-5 mb-5 flex items-center justify-center">
                  {`Expired At: ${auth.expiredAt.split("T")[0]}`}
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>

        <div className={`w-full float-left h-[50px] sm:block hidden`}>
          <div
            className={`${
              googleUser ? "w-[47.5%]" : "w-[25%]"
            } mr-[5%] h-full float-left flex items-center justify-center`}
          >
            <button
              onClick={toggleEdit}
              className={`${
                isEditing
                  ? "bg-green-700 hover:bg-green-800"
                  : `${colors.keyBg} ${colors.keyHoverBg}`
              } text-[16px] py-2 px-5 w-[70%] sm:w-full rounded-lg hover:bg-[#202020] text-white`}
            >
              {isEditing ? "Update" : "Edit"}
            </button>
          </div>

          {/* CHANGE PASSWORD – DESKTOP */}
          {!googleUser && (
            <div className="w-[40%] mr-[5%] h-full float-left flex items-center justify-center">
              <Link href="/changePassword" className="w-full">
                <button
                  className={`p-3 w-full text-[16px] py-2 px-5 rounded-lg ${
                    theme
                      ? "text-white bg-black border-[1px] border-black hover:bg-white hover:text-black hover:border-black"
                      : "text-black bg-white border-[1px] border-white hover:bg-black hover:text-white hover:border-white"
                  }`}
                >
                  Change Password
                </button>
              </Link>
            </div>
          )}

          <div
            className={`${
              googleUser ? "w-[47.5%]" : "w-[25%]"
            } h-full float-left flex items-center justify-center`}
          >
            <button
              onClick={handleLogout}
              className={`p-3 w-full text-white text-[16px] py-2 px-5 shadow-lg rounded-lg ${
                theme
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-red-800 hover:bg-red-900"
              }`}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div
      className={`w-full h-full flex justify-center items-center ${
        theme ? "bg-[#ffffff] text-[#0a0a0a]" : "bg-[#000000] text-[#ebebeb]"
      }`}
    >
      <div className="p-[100px] text-[18px] sm:text-[20px] md:text-[25px] lg:text-[30px] xl:text-[35px] 2xl:text-[40px]">
        You have to login first
      </div>
    </div>
  );
};

export default Profile;
