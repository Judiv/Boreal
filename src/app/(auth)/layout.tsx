// src/app/(auth)/layout.tsx
// Ce layout est minimaliste et ne contient PAS de Navbar ou de BorgiaProvider
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-wrapper">
      {children}
    </div>
  );
}