// app/layout.tsx
import ReduxProvider from "@/store/ReduxProvider";
import "./globals.css";
import { League_Spartan } from "next/font/google";
import QueryProvider from "@/lib/QueryProvider";
import { Toaster } from "react-hot-toast";
import { DeviceTokenProvider } from "@/components/DeviceTokenProvider";
import { ApiSessionNotice } from "@/components/api-session-notice";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-league-spartan",
  display: "swap",
});
export const metadata = {
  title: "Flexi HRMS",
  icons: {
    icon: "/favicon.svg",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={leagueSpartan.variable}>
      <body>
        {" "}
        <QueryProvider>
          <ReduxProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <ApiSessionNotice />{" "}
            <DeviceTokenProvider>{children}</DeviceTokenProvider>
          </ReduxProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
