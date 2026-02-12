import "./App.css";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./Layout/Mainlayout/MainLayout";
import Home from "./Pages/Home";
import Settings from "./Pages/Settings";
import Login from "./Pages/login";
import RegistrationForm from "./Pages/Registration";
import ExcelEdit from "./Pages/ExcelTemplate";
import { useState } from "react";
import Popup from "./Pages/Popup";
import Tablenames from "./Pages/Tablenames";
// import { Login } from "@mui/icons-material";
// import LoginPage from "./pages/login/LoginPage";
// import DashBoardPage from "./pages/dashboard/DashBoardPage";
// import Flats from "./pages/flats/Flats";
// import Visitors from "./pages/visitors/Visitors";
// import NoPage from "./pages/nopage/NoPage";

// import LoginRoleAuthGuard from "./components/auth/LoginRoleAuthGuard";

function App() {
  const [popup, setPopup] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const triggerPopup = (message, type) => {
    setPopup({ open: true, message, type });
  };
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Login triggerPopup={triggerPopup} />} />
        <Route path="/" element={<MainLayout />}>
          {/* <Route
            // path="/admin"
            element={
              <LoginRoleAuthGuard allowedRoles={["Admin", "Security"]} />
            }
          > */}
          {/* <Route index element={<DashBoardPage />}></Route> */}
          {/* <Route path="flats" element={<Flats />}></Route> */}
          {/* <Route path="*" element={<NoPage />} /> */}
          <Route path="/home" element={<Home triggerPopup={triggerPopup} />} />
          <Route
            path="/register"
            element={<RegistrationForm triggerPopup={triggerPopup} />}
          />
          <Route
            path="/settings"
            element={<Settings triggerPopup={triggerPopup} />}
          />
          <Route
            path="/excelTemplate"
            element={<ExcelEdit triggerPopup={triggerPopup} />}
          />
          <Route
            path="/tablenames"
            // element={<ExcelEdit triggerPopup={triggerPopup} />}
            element={<Tablenames triggerPopup={triggerPopup} />}
          />
        </Route>

        {/* </Route> */}
        {/* <Route path="/login" element={<LoginPage />}></Route> */}
        {/* <Route
          // path="/admin"
          element={<LoginRoleAuthGuard allowedRoles={["Security"]} />}
        >
            <Route index element={<DashBoardPage />}></Route>
            <Route path="flats" element={<Flats />}></Route>
          <Route path="/login" element={<LoginPage />}></Route>
        </Route> */}
      </Routes>
      {popup.open && (
        <Popup
          message={popup.message}
          type={popup.type}
          duration={6000}
          onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
