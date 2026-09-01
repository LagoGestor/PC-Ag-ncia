"use client";

export function LogoutButton({ className, title }: { className?: string; title?: string }) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button className={className ?? "btn btn-ghost icon-btn"} onClick={handleLogout} title={title ?? "Sair"}>
      <i className="fas fa-right-from-bracket" />
    </button>
  );
}
