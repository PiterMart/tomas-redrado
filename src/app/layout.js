import localFont from "next/font/local";
import "./styles/globals.css";
import Nav from "./components/nav";
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'],
})

const geistSans = localFont({
  src: "./assets/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./assets/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Tomas Redrado Art",
  description: " Committed to advancing the appreciation of contemporary art through a dynamic and historically rooted aesthetic. ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.className}`}>
        <Nav/>
        {children}
      </body>
    </html>
  );
}
