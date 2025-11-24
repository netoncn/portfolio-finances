import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    if (process.env.NEXTAUTH_DEBUG === "true") {
      console.log("========== MIDDLEWARE ==========");
      console.log("Path:", req.nextUrl.pathname);
      console.log("Token exists:", !!req.nextauth.token);
      console.log("================================");
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        if (path === "/" || path === "/auth/error") {
          return true;
        }
        if (path.startsWith("/dashboard")) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  },
);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|api/health).*)",
  ],
};
