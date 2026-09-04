import type { Metadata } from 'next';
import { AppProvider } from '@/lib/app-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'leadjet',
  description: 'Find, qualify and export local business leads.',
};

const noFlash = `try{var t=localStorage.getItem('lj_theme')||'dark';document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
