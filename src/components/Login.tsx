// src/Login.tsx

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const { message } = await res.json()
        throw new Error(message || "Error al iniciar sesión")
      }

      const { token, user } = await res.json()
      // Guarda el token y datos de usuario
      localStorage.setItem("authToken", token)
      localStorage.setItem("user", JSON.stringify(user))

      // Redirige a la ruta protegida
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex w-screen h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-md border border-border mx-4">
        <CardContent className="py-8 px-6 space-y-6">
          <div>
            <h1 className="text-center text-2xl font-bold text-foreground">
            Generador Interfaz Web
            </h1>
            <p className="text-center text-muted-foreground">
              INICIE SESIÓN
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-center text-red-500">{error}</p>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button className="w-full" type="submit">
              Iniciar sesión
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <a href="/registro" className="underline hover:text-primary">
              Regístrate
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
