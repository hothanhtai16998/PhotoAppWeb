import { Route, Routes } from "react-router";
import HomePage from './pages/HomePage'
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import GoogleCallbackPage from "./pages/GoogleCallbackPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import EditProfilePage from "./pages/EditProfilePage";
import ProfilePage from "./pages/ProfilePage";
import UploadPage from "./pages/UploadPage";


function App() {
  return (
    <Routes>
      {/**public routes */}

      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      {/**protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/upload" element={<UploadPage />} />

      </Route>

    </Routes>
  )
}

export default App