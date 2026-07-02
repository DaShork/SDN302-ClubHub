import Navbar from '@/components/Navbar/Navbar.jsx';
import Footer from '@/components/Footer/Footer.jsx';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, Helvetica, system-ui, sans-serif' }}>
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
}