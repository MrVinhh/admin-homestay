export type User = {
  email: string;
  password: string; // demo only (plaintext). Prod: hash bcrypt/argon2
  role?: "admin" | "staff";
};

// ✅ Acc cứng trong code
const USERS: User[] = [
  { email: "admin@gmail.com", password: "admin123", role: "admin" },
  { email: "staff@gmail.com", password: "staff123", role: "staff" },
];

// ✅ Allowlist Gmail (demo: không cần password)
const ALLOWED_GMAILS = new Set<string>(["you@gmail.com", "another@gmail.com"]);

export function isGmail(email: string) {
  return /^[^\s@]+@gmail\.com$/i.test(email.trim());
}

export function verifyLogin(emailRaw: string, passwordRaw?: string) {
  const email = emailRaw.trim().toLowerCase();
  const password = (passwordRaw ?? "").trim();

  if (!isGmail(email)) {
    return { ok: false as const, reason: "Chỉ cho phép Gmail (@gmail.com)." };
  }

  // 1) user hardcoded
  const user = USERS.find((u) => u.email.toLowerCase() === email);
  if (user) {
    if (user.password !== password) {
      return { ok: false as const, reason: "Sai mật khẩu." };
    }
    return { ok: true as const, email, role: user.role ?? "admin" };
  }

  // 2) allowlist gmail (demo: không cần pass)
  if (ALLOWED_GMAILS.has(email)) {
    return { ok: true as const, email, role: "staff" as const };
  }

  return { ok: false as const, reason: "Email chưa được đăng ký/cho phép." };
}
