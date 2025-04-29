import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Tesseract from "tesseract.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

// Tipo de componente detectado
type DetectedComponent =
  | { type: "input"; text?: string }
  | { type: "button"; text: string }
  | { type: "checkbox" }
  | { type: "label"; text: string };

const SubirFoto: React.FC = () => {
  const navigate = useNavigate();
  const [components, setComponents] = useState<DetectedComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Estado para pestaña activa
  const [activeTab, setActiveTab] = useState<"javascript" | "typescript">(
    "javascript"
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setImageSrc(URL.createObjectURL(file));
    setLoading(true);
    setComponents([]);
    setProgress(0);

    try {
      const { data } = await Tesseract.recognize(file, "eng", {
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
        if ((match = /^IMPT\."(.+)"$/.exec(line)))
          parsed.push({ type: "input", text: match[1] });
        else if (/^IMPT$/.test(line)) parsed.push({ type: "input" });
        else if ((match = /^BTTN\."(.+)"$/.exec(line)))
          parsed.push({ type: "button", text: match[1] });
        else if (/^CHKB$/.test(line)) parsed.push({ type: "checkbox" });
        else if ((match = /^LBL\."(.+)"$/.exec(line)))
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

  // Genera código JS y TS según componentes
  const jsCode = useMemo(() => {
    const lines = components.map((comp) => {
      switch (comp.type) {
        case "input":
          return comp.text
            ? `<Input defaultValue=\"${comp.text}\" />`
            : `<Input />`;
        case "button":
          return `<Button>${comp.text}</Button>`;
        case "checkbox":
          return `<Checkbox />`;
        case "label":
          return `<Label>${comp.text}</Label>`;
        default:
          return ``;
      }
    });
    return `import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function GeneratedUI() {
  return (
    <>${lines.map((l) => `\n      ${l}`).join('')}\n    </>
  );
}`;
  }, [components]);

  const tsCode = useMemo(() => {
    const lines = components.map((comp) => {
      switch (comp.type) {
        case "input":
          return comp.text
            ? `<Input defaultValue={\"${comp.text}\"} />`
            : `<Input />`;
        case "button":
          return `<Button>${comp.text}</Button>`;
        case "checkbox":
          return `<Checkbox />`;
        case "label":
          return `<Label>${comp.text}</Label>`;
        default:
          return ``;
      }
    });
    return `import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function GeneratedUI(): JSX.Element {
  return (
    <>${lines.map((l) => `\n      ${l}`).join('')}\n    </>
  );
}`;
  }, [components]);

  return (
    <div className="w-screen flex justify-center items-center p-4">
      <div className="flex space-x-6 w-full max-w-screen-xl">
        {/* Primera tarjeta: carga e imagen */}
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

        {/* Segunda tarjeta: preview componentes */}
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
                  default:
                    return null;
                }
              })}
            </CardContent>
          </Card>
        )}

        {/* Tercera tarjeta: código */}
        {components.length > 0 && (
          <Card className="flex-1">
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <CardTitle className="m-0">Código Generado</CardTitle>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate("/editor", {
                      state: {
                        code: activeTab === "javascript" ? jsCode : tsCode,
                        language: activeTab,
                      },
                    })
                  }
                >
                  Editar en Canvas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "javascript" | "typescript")}
                className="w-full"
              >
                <TabsList>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                </TabsList>
                <TabsContent value="javascript">
                  <pre className="mt-2 overflow-x-auto text-sm">
                    <code>{jsCode}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="typescript">
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
