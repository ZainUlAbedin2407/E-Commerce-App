import Topbar from "./Topbar";
import Navbar from "./Navbar";

// The Navbar is sticky on its own (top-0). It must NOT be wrapped in a
// header of its own, or sticky stops working: a sticky element only
// sticks within its parent's bounds, and this header is exactly as tall
// as the navbar. So the Topbar scrolls away and the Navbar sticks.
export default function Header() {
  return (
    <>
      <Topbar />
      <Navbar />
    </>
  );
}
