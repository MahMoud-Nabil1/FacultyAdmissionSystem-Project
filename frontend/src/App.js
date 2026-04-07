import './App.css';
import {Navigate, Route, Routes} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {ThemeProvider} from './context/ThemeContext';
import './styles/themeVariables.css';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import GuestRoute from './components/auth/GuestRoute.jsx';
import ResetPassword from './components/auth/ResetPassword.jsx';
import Login from './components/auth/Login.jsx';
import ForgotPassword from './components/auth/ForgotPassword.jsx';
import AdminDashboardLayout from './components/dashboard/AdminDashboardLayout.jsx';
import AdminDashboard from './components/dashboard/adminDashboard.jsx';
import LanguageFloatingButton from "./components/common/LanguageFloatingButton.jsx";
import SupportContact from "./components/support/SupportContact.jsx";
import Announcements from "./components/common/announcements.jsx";
import AdminDashboardTable from "./components/dashboard/tables/table.tsx";
import GroupPanel from "./components/dashboard/panels/groupPanel.tsx";
import Groups from "./components/groups/Groups.tsx";
import Home from "./components/common/home.tsx";
import AdminAnalysis from "./components/dashboard/AdminAnalysis/AdminAnalysis.tsx";
import RegisterSubjects from "./components/reg/RegisterSubjects.tsx";
import AcademicHistory from "./components/academicHistory/AcademicHistory.tsx";
import StudentComplaintPage from "./components/complaints/studentsComplaints.tsx";


function App() {
    const {t} = useTranslation();
    return (
        <ThemeProvider>
            <div className="App">
                <LanguageFloatingButton/>

                <Routes>
                    {}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Home/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/Groups"
                        element={
                            <Groups/>
                        }
                    />
                    <Route
                        path="/announcements"
                        element={
                            <Announcements/>
                        }>
                    </Route>

                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute
                                allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']}>
                                <div className="app-container">
                                    <AdminDashboardLayout/>
                                </div>
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<AdminDashboard/>}/>
                        <Route path="table" element={<AdminDashboardTable/>}/>
                        <Route path="groups" element={<GroupPanel/>}/>
                    </Route>
                    <Route path="/login" element={
                        <GuestRoute>
                            <Login/>
                        </GuestRoute>
                    }/>
                    <Route path="/forgot-password" element={
                        <GuestRoute>
                            <ForgotPassword/>
                        </GuestRoute>
                    }/>
                    <Route path="/reset-password" element={
                        <GuestRoute>
                            <ResetPassword/>
                        </GuestRoute>
                    }/>
                    <Route path="/ITContact" element={
                        <GuestRoute>
                            <SupportContact target="it"/>
                        </GuestRoute>
                    }/>
                    <Route path="/AdminContact" element={
                        <GuestRoute>
                            <SupportContact target="admin"/>
                        </GuestRoute>
                    }/>
                    <Route path="/register-subjects" element={
                        <ProtectedRoute>
                            <RegisterSubjects/>
                        </ProtectedRoute>
                    }
                    />
                    <Route path="/students-complaints" element={
                        <ProtectedRoute allowedRoles={['student', 'admin', 'academic_guide']}>
                            <StudentComplaintPage/>
                        </ProtectedRoute>
                    }
                    />

                    <Route path="/academic-history" element={
                        <ProtectedRoute>
                            <AcademicHistory/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/test-analysis" element={
                        <AdminAnalysis/>
                    }/>

                    <Route path="*" element={<Navigate to="/announcements" replace/>}/>
                </Routes>
            </div>
        </ThemeProvider>
    );
}

export default App;
