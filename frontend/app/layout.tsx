import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Smart Garage",
    description: "Minimalist Apple/Tesla style IoT Garage Dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased min-h-screen selection:bg-white/20">
                {children}
            </body>
        </html>
    );
}
