import './App.css';
import {Navigate, Route, Routes} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import ResetPasswordRoute from './components/ResetPasswordRoute.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import Login from './components/Login.jsx';
import ForgotPasswordChoice from './components/ForgotPasswordChoice.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import AdminDashboard from './components/admin-dashboard/adminDashboard.jsx';
import AdminContact from "./components/AdminContact";
import ITContact from "./components/ITContact";
import Announcements from "./components/announcements";


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
                        <Announcements/>
                    }>
                </Route>

                {/* DEV ONLY ADMIN ROUTE */}
                <Route
                    path="/admin-dashboard-test"
                    element={
                        <div style={{padding: "2rem"}}>
                            <h1>Admin Dashboard (Test)</h1>
                            <hr/>
                            <AdminDashboard/>
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
                            <div style={{ padding: "2rem" }}>
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
                        <Login/>
                    </GuestRoute>
                }/>
                <Route path="/forgot-password" element={
                    <GuestRoute>
                        <ForgotPasswordChoice/>
                    </GuestRoute>
                }/>
                <Route path="/ForgotPassWord" element={
                    <GuestRoute>
                        <ForgotPassword/>
                    </GuestRoute>
                }/>
                <Route path="/reset-password" element={
                    <GuestRoute>
                        <ResetPasswordRoute>
                            <ResetPassword/>
                        </ResetPasswordRoute>
                    </GuestRoute>
                }/>
                <Route path="/ITContact" element={
                    <GuestRoute>
                        <ITContact/>
                    </GuestRoute>
                }/>
                <Route path="/AdminContact" element={
                    <GuestRoute>
                        <AdminContact/>
                    </GuestRoute>
                }/>

                {/* Catch-all: redirect unknown routes */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </div>
    );
}

export default App;

