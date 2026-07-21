import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter, Manrope } from 'next/font/google';
import { FloatingChat } from '@/components/floating-chat';

// Body typography — retained to avoid a readability/loading regression.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Display/interface typography — headings, navigation, controls.
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <FloatingChat />
      </body>
    </html>
  );
}
