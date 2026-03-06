import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import GuestRoute from './components/auth/GuestRoute.jsx';
import ResetPassword from './components/auth/ResetPassword.jsx';
import Login from './components/auth/Login.jsx';
import ForgotPassword from './components/auth/ForgotPassword.jsx';
import AdminDashboard from './components/dashboard/adminDashboard.jsx';
import SupportContact from "./components/support/SupportContact.jsx";
import Announcements from "./components/welcome/announcements.jsx";
import AdminDashboardTable from "./components/dashboard/tables/table.tsx";
import Groups from "./components/dashboard/Groups.tsx";
import Home from "./components/home/home.tsx";


function App() {
    return (
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
                {}
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
                <Route
                    path="/admin-dashboard/table"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']}>
                            <AdminDashboardTable />
                        </ProtectedRoute>
                    }
                />

                {}
                <Route path="*" element={<Navigate to="/announcements" replace />} />
            </Routes>
        </div>
    );
}

export default App;

