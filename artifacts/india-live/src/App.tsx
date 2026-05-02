import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import Feed from "@/pages/feed";
import Upload from "@/pages/upload";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import VideoView from "@/pages/video-view";
import SearchPage from "@/pages/search";
import Settings from "@/pages/settings";
import GoLive from "@/pages/go-live";
import LiveWatch from "@/pages/live-watch";
import NotificationsPage from "@/pages/notifications";
import HashtagPage from "@/pages/hashtag";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Feed} />
      <Route path="/search" component={SearchPage} />
      <Route path="/upload" component={Upload} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/profile/:username" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/video/:id" component={VideoView} />
      <Route path="/go-live" component={GoLive} />
      <Route path="/live/:username" component={LiveWatch} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/hashtag/:tag" component={HashtagPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
