import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CourseLevels from "./pages/CourseLevels";
import LevelDetail from "./pages/LevelDetail";
import ChapterViewer from "./pages/ChapterViewer";
import AITutor from "./pages/AITutor";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/levels"} component={CourseLevels} />
      <Route path={"/level/:slug"} component={LevelDetail} />
      <Route path={"/chapter/:slug"} component={ChapterViewer} />
      <Route path={"/ai-tutor"} component={AITutor} />
      <Route path={"/dashboard"} component={UserDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

