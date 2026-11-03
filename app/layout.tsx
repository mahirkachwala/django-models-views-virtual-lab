import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Models and Views in Django | Virtual Lab',
  description:
    'A student experiment on Django models, the ORM, migrations and views, with interactive simulations, worked examples and quizzes.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
