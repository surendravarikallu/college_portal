import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Building2, Users, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import collegeHeaderImg from "@assets/Screenshot 2025-07-25 113411_1753423944040.png";

const loginSchema = insertUserSchema.pick({ username: true, password: true });
type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    setTimeout(() => setLocation("/admin"), 0);
    return null;
  }

  const onLogin = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      setLocation("/admin");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={collegeHeaderImg} alt="KITS Logo" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800"> Training & Placement Cell Portal </h1>
            <p className="text-slate-600 mt-2">KITS Akshar Institute of Technology - TPO Access Panel</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>TPO Login</CardTitle>
              <CardDescription>
                Sign in to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    {...loginForm.register("username")}
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-500 mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-primary to-primary/90 p-8 text-white flex items-center justify-center">
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Manage Your Institution's Placements</h2>
          <p className="text-white/90 mb-8 text-lg font-medium">
            Streamline training and placement activities with our comprehensive management system
          </p>
          
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold mb-1 text-white">Event Management</h3>
              <p className="text-sm text-white/80">Organize and track placement drives</p>
            </div>
            <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <Users className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold mb-1 text-white">Student Database</h3>
              <p className="text-sm text-white/80">Manage student profiles and results</p>
            </div>
            <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold mb-1 text-white">Analytics</h3>
              <p className="text-sm text-white/80">Track placement statistics</p>
            </div>
            <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold mb-1 text-white">Alumni Network</h3>
              <p className="text-sm text-white/80">Maintain alumni connections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
