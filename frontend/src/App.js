import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import './theme/themeVariables.css';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import GuestRoute from './components/auth/GuestRoute.jsx';
import ResetPassword from './components/auth/ResetPassword.jsx';
import Login from './components/auth/Login.jsx';
import ForgotPassword from './components/auth/ForgotPassword.jsx';
import AdminDashboardLayout from './components/dashboard/AdminDashboardLayout.jsx';
import AdminDashboard from './components/dashboard/adminDashboard.jsx';
import ThemePage from './components/dashboard/theme/ThemePage.jsx';
import SupportContact from "./components/support/SupportContact.jsx";
import Announcements from "./components/welcome/announcements.jsx";
import AdminDashboardTable from "./components/dashboard/tables/table.tsx";
import Groups from "./components/dashboard/Groups.tsx";
import Home from "./components/home/home.tsx";


function App() {
    return (
        <ThemeProvider>
        <div className="App">
            <Routes>
                {}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <button onClick={() => {
                                localStorage.removeItem("token");
                                window.location.href = "/login";
                            }}>
                                Sign out
                            </button>
                            <Home/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/Groups"
                    element={
                        <Groups />
                    }
                />
                <Route
                    path="/announcements"
                    element={
                        <Announcements />
                    }>
                </Route>

                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']}>
                            <div className="app-container">
                                <AdminDashboardLayout />
                            </div>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="table" element={<AdminDashboardTable />} />
                    <Route path="theme" element={<ThemePage />} />
                </Route>
                <Route path="/login" element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                } />
                <Route path="/forgot-password" element={
                    <GuestRoute>
                        <ForgotPassword />
                    </GuestRoute>
                } />
                <Route path="/reset-password" element={
                    <GuestRoute>
                        <ResetPassword />
                    </GuestRoute>
                } />
                <Route path="/ITContact" element={
                    <GuestRoute>
                        <SupportContact target="it" />
                    </GuestRoute>
                } />
                <Route path="/AdminContact" element={
                    <GuestRoute>
                        <SupportContact target="admin" />
                    </GuestRoute>
                } />
                <Route path="/register-subjects" element={
                    <ProtectedRoute>
                        put register new subjects component here
                    </ProtectedRoute>
                }
                />

                <Route path="*" element={<Navigate to="/announcements" replace />}/>
            </Routes>
        </div>
        </ThemeProvider>
    );
}

export default App;

