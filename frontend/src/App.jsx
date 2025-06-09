import { Route, Routes } from "react-router-dom";
import UserLayout from "./components/Layout/UserLayout";
import Home from "./pages/Home";
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<UserLayout />}>
            <Route index element={<Home />}/>
         </Route>
        <Route> {/*Admin Layout*/} </Route>
      </Routes>
    </>
  );
}

export default App;
