"use client";

export function Topbar() {
  return (
    <header
      className="
        h-20 w-full
        bg-white/60 backdrop-blur-xl
        border-b border-[#BFDBFE]/60
        shadow-[0_4px_12px_rgba(191,219,254,0.35)]
        flex items-center justify-center
      "
    >
      <h1 
        className="
          text-3xl font-extrabold tracking-tight select-none
          bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA]
          bg-clip-text text-transparent
          drop-shadow-[0_2px_6px_rgba(59,130,246,0.35)]
        "
      >
        
        Alex Waisberg
      </h1>
    </header>
  );
}
