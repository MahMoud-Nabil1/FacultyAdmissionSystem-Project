import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import GuestRoute from './components/auth/GuestRoute.jsx';
import ResetPassword from './components/auth/ResetPassword.jsx';
import Login from './components/auth/Login.jsx';
import ForgotPassword from './components/auth/ForgotPassword.jsx';
import AdminDashboard from './components/admin-dashboard/adminDashboard.jsx';
import SupportContact from "./components/support/SupportContact.jsx";
import Announcements from "./components/admin-dashboard/announcements.jsx";


function App() {
    return (
        <div className="App">

            <Routes>
                {/* Protected home route — require login */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <h1>Home</h1>
                            <button onClick={() => {
                                localStorage.removeItem("token");
                                localStorage.removeItem("role");
                                localStorage.removeItem("user");
                                window.location.href = "/login";
                            }}>
                                Sign out
                            </button>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/announcements"
                    element={
                        <Announcements />
                    }>
                </Route>

                {/* DEV ONLY ADMIN ROUTE */}
                <Route
                    path="/admin-dashboard-test"
                    element={
                        <div className="app-container">
                            <h1>Admin Dashboard (Test)</h1>
                            <hr />
                            <AdminDashboard />
                        </div>
                    }
                />

                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']}>
                            <button onClick={() => {
                                localStorage.removeItem("token");
                                window.location.href = "/login";
                            }}>
                                Sign out
                            </button>
                            <div className="app-container">
                                <h1>Admin Dashboard</h1>
                                <hr />
                                <AdminDashboard />
                            </div>
                        </ProtectedRoute>
                    }
                />
                {/* Guest-only routes — redirect to / if already logged in */}
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

                {/* Catch-all: redirect unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default App;

