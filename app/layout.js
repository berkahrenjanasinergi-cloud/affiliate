import "./globals.css";

export const metadata = {
  title: "Affily Agent 🤖",
  description: "AI agent affiliate e-commerce ASEAN",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
