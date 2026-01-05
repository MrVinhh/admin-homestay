import { getSession } from "../../../lib/session-node";
import LogoutButton from "./LogoutButton";

export default async function AdminHome() {
  const session = await getSession();

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Admin Dashboard</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Xin chào: <b>{session?.email}</b>
      </p>

      <LogoutButton />

      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 14,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>Nội dung admin</h2>
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          Bạn nhét CRUD / bảng dữ liệu / dashboard vào đây. Sau này cắm API là
          lên đời.
        </p>
      </div>
    </main>
  );
}
