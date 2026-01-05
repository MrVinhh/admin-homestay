import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Admin Homestay</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>Đi login rồi vào admin.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Link href="/login">/login</Link>
        <Link href="/admin">/admin</Link>
      </div>
    </main>
  );
}
