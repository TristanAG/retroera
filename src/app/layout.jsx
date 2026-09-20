import "bulma/css/bulma.min.css";
import "@/index.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "RetroEra",
  description: "Catalog, collect, and discover retro game collections.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
