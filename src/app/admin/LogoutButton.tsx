"use client";

export default function LogoutButton() {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/login";
      }}
      style={{ marginTop: 16 }}
    >
      <button
        style={{
          padding: 10,
          borderRadius: 12,
          border: "1px solid #111",
          cursor: "pointer",
          fontWeight: 900,
        }}
      >
        Logout
      </button>
    </form>
  );
}
