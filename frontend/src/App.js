import './App.css';
import {Navigate, Route, Routes} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {ThemeProvider} from './context/ThemeContext';
import './styles/themeVariables.css';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import GuestRoute from './components/auth/GuestRoute.jsx';
import { useAuth } from './context/AuthContext';
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
import PlacesPanel from "./components/dashboard/panels/placesPanel.tsx";
import AnnouncementsPage from "./components/dashboard/panels/announcementsPage.tsx";
import RegistrationPage from "./components/dashboard/panels/registrationPage.tsx";
import AcademicRequestsPage from "./components/dashboard/panels/academicRequestsPage.tsx";
import Groups from "./components/groups/Groups.tsx";
import Home from "./components/common/home.tsx";
import AdminAnalysis from "./components/dashboard/AdminAnalysis/AdminAnalysis.tsx";
import RegisterSubjects from "./components/reg/RegisterSubjects.tsx";
import AcademicHistory from "./components/academicHistory/AcademicHistory.tsx";
import StudentProfileView from "./components/dashboard/students/studentProfileView.tsx";
import StudentComplaintPage from "./components/complaints/studentsComplaints.tsx";
import AiChatBox from "./components/common/aiChatBox.tsx"; // Add this import

function App() {
    const {t} = useTranslation();
    const { user } = useAuth();

    const AdminDashboardIndex = () => {
        return <Navigate to="/admin-dashboard/announcements" replace />;
    };

    return (
        <ThemeProvider>
            <div className="App">
                <LanguageFloatingButton/>

                {/* Add AiChatBox here - outside Routes, but NOT wrapped in ProtectedRoute */}
                <AiChatBox />

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
                        path={"admin-dashboard/students/:id"}
                        element={
                            <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator']}>
                                <div className="app-container">
                                    <StudentProfileView/>
                                </div>
                            </ProtectedRoute>
                        }/>

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
                        <Route index element={<AdminDashboardIndex/>}/>
                        <Route path="announcements" element={
                            <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']}>
                                <AnnouncementsPage/>
                            </ProtectedRoute>
                        }/>
                        <Route path="registration" element={
                            <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator']}>
                                <RegistrationPage/>
                            </ProtectedRoute>
                        }/>
                        <Route path="requests" element={
                            <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator']}>
                                <AcademicRequestsPage/>
                            </ProtectedRoute>
                        }/>
                        <Route path="table" element={
                            <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']}>
                                <AdminDashboardTable/>
                            </ProtectedRoute>
                        }/>
                        <Route path="groups" element={
                            <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']}>
                                <GroupPanel/>
                            </ProtectedRoute>
                        }/>
                        <Route path="places" element={
                            <ProtectedRoute allowedRoles={['admin', 'academic_guide', 'academic_guide_coordinator']}>
                                <PlacesPanel/>
                            </ProtectedRoute>
                        }/>
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

                    <Route path="/academic-history" element={
                        <ProtectedRoute>
                            <AcademicHistory/>
                        </ProtectedRoute>
                    }/>
                    <Route path="/students-complaints" element={
                        <ProtectedRoute>
                            <StudentComplaintPage/>
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