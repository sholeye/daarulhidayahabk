/**
 * App.tsx - Root application component with routing
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ThemeProvider } from "@/features/app/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SharedDataProvider } from "@/contexts/SharedDataContext";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

// Public Pages
import Landing from "./pages/Landing";
import About from "./pages/About";
import Curriculum from "./pages/Curriculum";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import QuizTake from "./pages/QuizTake";
import Gallery from "./pages/Gallery";
import Blog from "./pages/Blog";
import Signup from "./pages/Signup";
import Register from "./pages/Register";
import Check from "./pages/Check";
import AttendanceDetail from "./pages/AttendanceDetail";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Admin
import { AdminLayout } from "@/features/admin/AdminLayout";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { StudentsPage } from "@/features/admin/StudentsPage";
import { AttendancePage } from "@/features/admin/AttendancePage";
import { FinancePage } from "@/features/admin/FinancePage";
import { ResultsPage } from "@/features/admin/ResultsPage";
import { AnnouncementsPage } from "@/features/admin/AnnouncementsPage";
import { SettingsPage } from "@/features/admin/SettingsPage";
import { AdminQuizPage } from "@/features/admin/AdminQuizPage";
import { AdminBlogPage } from "@/features/admin/AdminBlogPage";
import { AssignmentsPage } from "@/features/admin/AssignmentsPage";
import { ClassesSubjectsPage } from "@/features/admin/ClassesSubjectsPage";

// Learner //
import { LearnerLayout } from "@/features/learner/LearnerLayout";
import { LearnerDashboard } from "@/features/learner/LearnerDashboard";
import { LearnerProfile } from "@/features/learner/LearnerProfile";
import { LearnerAttendance } from "@/features/learner/LearnerAttendance";
import { LearnerResults } from "@/features/learner/LearnerResults";
import { LearnerFees } from "@/features/learner/LearnerFees";

// Instructor
import { InstructorLayout } from "@/features/instructor/InstructorLayout";
import { InstructorDashboard } from "@/features/instructor/InstructorDashboard";
import { InstructorClasses } from "@/features/instructor/InstructorClasses";
import { InstructorStudents } from "@/features/instructor/InstructorStudents";
import { InstructorAttendance } from "@/features/instructor/InstructorAttendance";
import { InstructorResults } from "@/features/instructor/InstructorResults";

// Parent
import { ParentLayout } from "@/features/parent/ParentLayout";
import { ParentDashboard } from "@/features/parent/ParentDashboard";
import { ParentChildren } from "@/features/parent/ParentChildren";
import { ParentAttendance } from "@/features/parent/ParentAttendance";
import { ParentResults } from "@/features/parent/ParentResults";
import { ParentFees } from "@/features/parent/ParentFees";
import { ParentAnnouncements } from "@/features/parent/ParentAnnouncements";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SharedDataProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/curriculum" element={<Curriculum />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/quiz/take" element={<QuizTake />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/check" element={<Check />} />
                  <Route path="/check/:id" element={<AttendanceDetail />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="students" element={<StudentsPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="finance" element={<FinancePage />} />
                    <Route path="results" element={<ResultsPage />} />
                    <Route path="quiz" element={<AdminQuizPage />} />
                    <Route
                      path="announcements"
                      element={<AnnouncementsPage />}
                    />
                    <Route path="blog" element={<AdminBlogPage />} />
                    <Route path="assignments" element={<AssignmentsPage />} />
                    <Route path="classes" element={<ClassesSubjectsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Instructor Routes */}
                  <Route
                    path="/instructor"
                    element={
                      <ProtectedRoute allowedRoles={["instructor"]}>
                        <InstructorLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<InstructorDashboard />} />
                    <Route path="classes" element={<InstructorClasses />} />
                    <Route path="students" element={<InstructorStudents />} />
                    <Route
                      path="attendance"
                      element={<InstructorAttendance />}
                    />
                    <Route path="results" element={<InstructorResults />} />
                  </Route>

                  {/* Learner Routes */}
                  <Route
                    path="/learner"
                    element={
                      <ProtectedRoute allowedRoles={["learner"]}>
                        <LearnerLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<LearnerDashboard />} />
                    <Route path="profile" element={<LearnerProfile />} />
                    <Route path="attendance" element={<LearnerAttendance />} />
                    <Route path="results" element={<LearnerResults />} />
                    <Route path="fees" element={<LearnerFees />} />
                  </Route>

                  {/* Parent Routes */}
                  <Route
                    path="/parent"
                    element={
                      <ProtectedRoute allowedRoles={["parent"]}>
                        <ParentLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<ParentDashboard />} />
                    <Route path="children" element={<ParentChildren />} />
                    <Route path="attendance" element={<ParentAttendance />} />
                    <Route path="results" element={<ParentResults />} />
                    <Route path="fees" element={<ParentFees />} />
                    <Route
                      path="announcements"
                      element={<ParentAnnouncements />}
                    />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SharedDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
