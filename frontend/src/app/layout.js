import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "DuelCode | Arena",
  description: "Real-time competitive programming duels",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}