// src/app/api/verify-email/route.ts
import { verifyUserEmail } from "@/app/actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { success: false, message: "Invalid verification link" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyUserEmail(email);

    if (result.success) {
      // Return simple success message
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Email Verified</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f0f9ff;
              }
              .container {
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 500px;
              }
              .success-icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              h1 {
                color: #16a34a;
                margin-bottom: 10px;
              }
              p {
                color: #666;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Email Verified Successfully!</h1>
              <p>Your email has been verified. A confirmation email has been sent to your inbox.</p>
              <p>You can now close this window and log in to your account.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    } else {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #fef2f2;
              }
              .container {
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 500px;
              }
              .error-icon {
                font-size: 64px;
                color: #dc2626;
                margin-bottom: 20px;
              }
              h1 {
                color: #dc2626;
                margin-bottom: 10px;
              }
              p {
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Verification Failed</h1>
              <p>${result.error || "Unable to verify email."}</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  } catch (error) {
    console.error("Verification error:", error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Verification Error</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #fef2f2;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            .error-icon {
              font-size: 64px;
              color: #dc2626;
              margin-bottom: 20px;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 10px;
            }
            p {
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Verification Error</h1>
            <p>An unexpected error occurred. Please try again later.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}