import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  return (
    <div className="w-screen min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex space-x-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>Inicio</Button>
          {user.id === 5 && (
            <Button variant="ghost" onClick={() => navigate("/usuarios")}>Usuarios</Button>
          )}
          {/*    <Button variant="ghost" onClick={() => navigate("/productos")}>Productos</Button>  */}
        </div>
        <span className="font-bold text-2xl text-card-foreground">GENERADOR DE INTERFAZ WEB</span>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={user.avatarUrl || "/avatar-placeholder.png"} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-card-foreground">{user.name}</span>
          <Button variant="outline" onClick={() => { localStorage.clear(); navigate("/") }}>
            Cerrar sesión
          </Button>
        </div>
      </nav>

      {/* Content cards */}
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          <Card className="w-96 h-48 bg-card shadow-lg">
            <CardContent className="flex flex-col justify-between h-full p-4">
              <h3 className="text-xl font-semibold text-card-foreground">Crea o Edita tu Diseño</h3>
              <Button onClick={() => navigate("/Lienzo")}>Ir</Button>
            </CardContent>
          </Card>
          <Card className="w-96 h-48 bg-card shadow-lg">
            <CardContent className="flex flex-col justify-between h-full p-4">
              <h3 className="text-xl font-semibold text-card-foreground">Genera tu Diseño desde de un Boceto</h3>
              <Button onClick={() => navigate("/SubirFoto")}>Generar</Button>
            </CardContent>
          </Card>
          <Card className="w-96 h-48 bg-card shadow-lg">
            <CardContent className="flex flex-col justify-between h-full p-4">
              <h3 className="text-xl font-semibold text-card-foreground">Genera tu de Diseño desde de un Diagrama UML</h3>
              <Button onClick={() => navigate("/StarUML")}>Generar</Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <nav className="flex justify-end px-6 py-4 bg-card border fixed bottom-0 right-0 left-0 border-border">
        <span className="font-medium text-card-foreground">Version 1.6 ABBY/NXZ</span>
      </nav>
    </div>
  )
}
