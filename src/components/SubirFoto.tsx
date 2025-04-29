import React, { useState, useMemo } from "react";
import Tesseract from "tesseract.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Tipo de componente detectado
export type DetectedComponent =
  | { type: "input"; text?: string }
  | { type: "button"; text: string }
  | { type: "checkbox" }
  | { type: "label"; text: string };

export const SubirFoto: React.FC = () => {
  const [components, setComponents] = useState<DetectedComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // pestaña activa: html, css, ts
  const [activeTab, setActiveTab] = useState<"html" | "css" | "ts">("html");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setImageSrc(URL.createObjectURL(file));
    setLoading(true);
    setComponents([]);
    setProgress(0);

    try {
      const { data } = await Tesseract.recognize(file, "eng+spa", {
        logger: (m) => {
          if (m.progress !== undefined) setProgress(Math.round(m.progress * 100));
        },
      });

      const lines = data.text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      const parsed: DetectedComponent[] = [];
      let match: RegExpExecArray | null;

      lines.forEach((line) => {
        if ((match = /^IMPT\"(.+)\"$/.exec(line)))
          parsed.push({ type: "input", text: match[1] });
        else if (/^IMPT$/.test(line)) parsed.push({ type: "input" });
        else if ((match = /^BTTN\"(.+)\"$/.exec(line)))
          parsed.push({ type: "button", text: match[1] });
        else if (/^CHKB$/.test(line)) parsed.push({ type: "checkbox" });
        else if ((match = /^LBL\"(.+)\"$/.exec(line)))
          parsed.push({ type: "label", text: match[1] });
      });

      setComponents(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // Generar HTML
  const htmlCode = useMemo(() => {
    return [
      `<div class=\"card\">`,
      `  <div class=\"card-content\">`,
      `    <h2>Formulario</h2>`,
      ...components.map((comp) => {
        switch (comp.type) {
          case "input":
            return comp.text
              ? `    <input type=\"text\" value=\"${comp.text}\" />`
              : `    <input type=\"text\" />`;
          case "button":
            return `    <button>${comp.text}</button>`;
          case "checkbox":
            return `    <input type=\"checkbox\" /> Checkbox`;
          case "label":
            return `    <label>${comp.text}</label>`;
        }
      }),
      `  </div>`,
      `</div>`
    ].join("\n");
  }, [components]);

  // Generar CSS base
  const cssCode = useMemo(() => {
    return [
      `.card {`,
      `  max-width: 400px;`,
      `  margin: auto;`,
      `  padding: 2rem;`,
      `  box-shadow: 0 4px 6px rgba(0,0,0,0.1);`,
      `  border-radius: 0.5rem;`,
      `  display: flex;`,
      `  flex-direction: column;`,
      `  gap: 1rem;`,
      `}`,
      `.card-content {`,
      `  display: flex;`,
      `  flex-direction: column;`,
      `}`,
      `input, button, label {`,
      `  width: 100%;`,
      `}`
    ].join("\n");
  }, []);

  // Generar TS para React
  const tsCode = useMemo(() => {
    return [
      `import React from 'react';`,
      ``,
      `export function GeneratedUI(): JSX.Element {`,
      `  return (`,
      `    <div className=\"card\">`,
      `      <div className=\"card-content\">`,
      `        <h2>Formulario</h2>`,
      ...components.map((comp) => {
        switch (comp.type) {
          case "input":
            return comp.text
              ? `        <input type=\"text\" defaultValue=\"${comp.text}\" />`
              : `        <input type=\"text\" />`;
          case "button":
            return `        <button>${comp.text}</button>`;
          case "checkbox":
            return `        <input type=\"checkbox\" /> Checkbox`;
          case "label":
            return `        <label>${comp.text}</label>`;
        }
      }),
      `      </div>`,
      `    </div>`,
      `  );`,
      `}`
    ].join("\n");
  }, [components]);

  const handleDownloadProject = async () => {
    try {
      // Hacer la solicitud al backend para generar el proyecto Angular
      const response = await fetch("http://localhost:4000/generar-proyecto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlCode, // El código HTML generado
          css: cssCode, // El código CSS generado
          ts: tsCode, // El código TypeScript generado
        }),
      });

      // Comprobar si la solicitud fue exitosa
      if (response.ok) {
        // Obtener el archivo .zip desde la respuesta
        const blob = await response.blob();
        
        // Crear un enlace para descargar el archivo
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "proyecto-angular.zip"; // Nombre del archivo a descargar
        link.click(); // Iniciar la descarga
      } else {
        throw new Error("Error al generar el proyecto");
      }
    } catch (error) {
      console.error("Error en la descarga del proyecto:", error);
    }
  };














  
  return (
    <div className="w-screen flex justify-center items-center p-4">
      <div className="flex min-h-[500px] space-x-6 w-full max-w-screen-xl">
        {/* Carga e imagen */}
        <Card className="w-1/4">
          <CardHeader>
            <CardTitle>Generador de UI desde Imagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button disabled={loading} className="relative overflow-hidden w-full">
              Seleccionar imagen (PNG/JPG)
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>
            {loading && <Progress value={progress} className="w-full" />}
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Vista previa"
                className="mt-2 w-full object-contain rounded"
              />
            )}
          </CardContent>
        </Card>

        {/* Vista previa */}
        {components.length > 0 && (
          <Card className="w-1/4">
            <CardHeader>
              <CardTitle>Vista Previa de Componentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {components.map((comp, idx) => {
                switch (comp.type) {
                  case "input":
                    return comp.text ? (
                      <Input key={idx} defaultValue={comp.text} />
                    ) : (
                      <Input key={idx} placeholder="" />
                    );
                  case "button":
                    return <Button key={idx}>{comp.text}</Button>;
                  case "checkbox":
                    return (
                      <div key={idx} className="flex items-center space-x-2">
                        <Checkbox id={`chk-${idx}`} />
                        <Label htmlFor={`chk-${idx}`}>Checkbox</Label>
                      </div>
                    );
                  case "label":
                    return (
                      <Label key={idx} className="block">
                        {comp.text}
                      </Label>
                    );
                }
              })}
            </CardContent>
          </Card>
        )}

        {/* Código Generado */}
        {components.length > 0 && (
          <Card className="flex-1 max-w-[600px]">
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <CardTitle className="m-0">Código Generado</CardTitle>
                <Button size="sm" onClick={handleDownloadProject}>
                  Descargar Proyecto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "html" | "css" | "ts")} className="w-full">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="ts">TS</TabsTrigger>
                </TabsList>
                <TabsContent value="html">
                  <pre className="mt-2 overflow-x-auto text-sm">
                    <code>{htmlCode}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="css">
                  <pre className="mt-2 overflow-x-auto text-sm">
                    <code>{cssCode}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="ts">
                  <pre className="mt-2 overflow-x-auto text-sm">
                    <code>{tsCode}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubirFoto;
