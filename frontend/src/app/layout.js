// app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav>Main Navigation</nav>
        <main>{children}</main>
      </body>
    </html>
  );
}

