import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function GeneratedUI(): React.JSX.Element {
  return (
    <>
      <Label>FORM LOGIN</Label>
      <Label>Usuario:</Label>
      <Input />
      <Label>Contrasena:</Label>
      <Input />
      <Button>Iniciar sesion</Button>
    </>
  );
}
