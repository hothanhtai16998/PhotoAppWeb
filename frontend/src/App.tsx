import { Route, Routes } from "react-router";
import HomePage from './pages/HomePage'
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import UploadPage from "./pages/UploadPage";


function App() {
  return (
    <Routes>
      {/**public routes */}

      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />

      {/**protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/upload" element={<UploadPage />} />

      </Route>

    </Routes>
  )
}

export default App