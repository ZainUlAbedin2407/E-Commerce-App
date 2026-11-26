import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShopLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
