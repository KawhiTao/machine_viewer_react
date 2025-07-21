import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Demo from "@/pages/demo/index";
import Home from "@/pages/Home";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <ModeToggle />
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace></Navigate>} />
          <Route path="/home" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          {/* 其他路由可以在这里添加 */}
          {/* <Route path="/about" element={<About />} /> */}
          {/* <Route path="/contact" element={<Contact />} /> */}
          {/* 404 页面 */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
