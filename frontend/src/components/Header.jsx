import Topbar from "./Topbar";
import Navbar from "./Navbar";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <Topbar />
      <Navbar />
    </header>
  );
}
