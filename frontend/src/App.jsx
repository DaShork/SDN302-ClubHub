import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Alumni from "./pages/Alumni";
import { KnowledgeBase, AIAssistant } from "./pages/Placeholders";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-primary-900 text-secondary-100 selection:bg-accent-green/30 selection:text-white">
          {/* Main Top Navbar */}
          <Navbar />

          {/* Page Routing Container */}
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/alumni" element={<Alumni />} />
              <Route path="/kb" element={<KnowledgeBase />} />
              <Route path="/ai" element={<AIAssistant />} />
            </Routes>
          </main>

          {/* Main Bottom Footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
