"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type User = {
  id: number;
  name: string;
  email: string;
};

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch("http://localhost:4000/api/auth/usuarios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Status:", response.status); // para depuración

      if (!response.ok) {
        if (response.status === 403) {
          setError("Acceso denegado: no tienes permisos.");
        } else if (response.status === 401) {
          setError("Token no válido o no enviado.");
        } else {
          setError("Error al cargar usuarios.");
        }
        setUsers([]);
        return;
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      setError("Error de red al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="w-screen h-screen flex justify-center items-center p-4 bg-background">
      <Card className="p-6 mt-8 min-w-[400px]">
        <h2 className="text-2xl font-bold mb-4">Lista de Usuarios</h2>
        <Button onClick={fetchUsers} disabled={loading}>
          {loading ? "Cargando..." : "Recargar"}
        </Button>

        {error && (
          <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
        )}

        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  {error ? "Sin resultados" : "No hay usuarios"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
