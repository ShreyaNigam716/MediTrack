
import './globals.css';

export const metadata = {
  title: 'MediTrack',
  description: 'Patient, Lab and Pharmacy Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
  