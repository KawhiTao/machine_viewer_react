import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion } from "motion/react";

import Demo from "@/pages/demo/index";
import Home from "@/pages/Home";
import { NavigationMenuDemo } from "@/layout/navigator/index";
import { ThemeProvider } from "./components/theme-provider";
import ContextMenuDemo from "./layout/contextMenu/index";
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <div className="h-screen flex flex-col">
          <motion.header
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            className="flex-shrink-0"
          >
            <NavigationMenuDemo />
          </motion.header>

          {/* <ModeToggle /> */}

          <main className="flex-1 overflow-auto">
            <ContextMenuDemo>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/home" replace></Navigate>}
                />
                <Route path="/home" element={<Home />} />
                <Route path="/demo" element={<Demo />} />
                {/* 其他路由可以在这里添加 */}
                {/* <Route path="/about" element={<About />} /> */}
                {/* <Route path="/contact" element={<Contact />} /> */}
                {/* 404 页面 */}
              </Routes>
            </ContextMenuDemo>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
