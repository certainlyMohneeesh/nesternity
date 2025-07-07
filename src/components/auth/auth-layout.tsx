"use client";
import Link from "next/link";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-6 sm:px-4 lg:px-8 overflow-hidden">
      {/* Responsive Background Overlay Image */}
      <img
        src="/nesternity.svg"
        alt="Nesternity background"
        className="
          absolute
          left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2
          w-[200vw] h-[200vw] max-w-none
          sm:w-[300vw] sm:h-[300vw]
          md:w-[150vw] md:h-[150vw]
          lg:w-[80vw] lg:h-[80vw]
          opacity-10 pointer-events-none select-none
          transition-all duration-500
        "
        aria-hidden="true"
      />
      <div className="relative z-10 sm:mx-auto w-full max-w-md px-2 sm:px-0">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center space-x-3">
            <Link
              href="/"
              className="text-2xl font-bold text-[#a300cc] hover:text-indigo-500 transition-colors"
              style={{ letterSpacing: "1px" }}
            >
              Nesternity
            </Link>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto w-full max-w-md px-2 sm:px-0">
        <div className="bg-white/1 backdrop-blur-lg py-6 px-2 sm:py-8 sm:px-4 shadow-xl rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
