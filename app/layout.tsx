import "./globals.css";
export const metadata = { title:"BCT VIRAL STUDIO", description:"Bangladesh Cyber Troops — AI Social Automation" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="bn"><body>{children}</body></html>;
}
