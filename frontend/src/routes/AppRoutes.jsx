import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AIChatPage from "../pages/AIChat/AIChatPage";

function PlaceholderPage({ title }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-secondary-100">{title}</h1>
      <p className="mt-2 text-secondary-300">Module đang được phát triển...</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/ai-chat" replace />} />
        <Route path="ai-chat" element={<AIChatPage />} />
        <Route
          path="notifications"
          element={<PlaceholderPage title="Notifications" />}
        />
        <Route path="payment" element={<PlaceholderPage title="Payment" />} />
        <Route path="alumni" element={<PlaceholderPage title="Alumni" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
      </Route>
    </Routes>
  );
}
