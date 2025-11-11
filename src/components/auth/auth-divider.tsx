"use client";

export function AuthDivider({ text = "or" }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white/10 backdrop-blur-lg text-gray-500 font-medium">{text}</span>
      </div>
    </div>
  );
}
