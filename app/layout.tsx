// app/layout.tsx
import ReduxProvider from "@/store/ReduxProvider";
import "./globals.css";
import localFont from "next/font/local";
import QueryProvider from "@/lib/QueryProvider";
import { Toaster } from "react-hot-toast";
import { DeviceTokenProvider } from "@/components/DeviceTokenProvider";
import { ApiSessionNotice } from "@/components/api-session-notice";

const leagueSpartan = localFont({
  src: "./fonts/dfs/LeagueSpartan-variable.ttf",
  weight: "400 700",
  variable: "--font-league-spartan",
  display: "swap",
});
const poppins = localFont({
  src: [
    { path: "./fonts/dfs/Poppins-Regular.ttf", weight: "400" },
    { path: "./fonts/dfs/Poppins-Medium.ttf", weight: "500" },
    { path: "./fonts/dfs/Poppins-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-poppins",
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
    <html lang="en" className={`${leagueSpartan.variable} ${poppins.variable}`}>
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
