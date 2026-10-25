import './globals.css';
import { Suspense } from 'react';
import Shell from '../components/Shell';

export const metadata = {
  title: 'MediTrack',
  description: 'Patient, Lab and Pharmacy Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Suspense fallback={<div>Loading...</div>}>
          <Shell>{children}</Shell>
        </Suspense>
      </body>
    </html>
  );
}