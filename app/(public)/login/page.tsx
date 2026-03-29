import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";
import invictusLogo from "@/public/invictusleaguelogo.png";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <img src={invictusLogo.src} alt="Invictus League" className="mx-auto h-80 w-80" />
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <p className="text-sm text-muted-foreground">Para obtener tu cuenta, ten el visto bueno del administrador (wells/tucu en discord)</p>
        </CardHeader>

        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}