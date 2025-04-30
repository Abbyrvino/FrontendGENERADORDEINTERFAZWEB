import React, { useState, useMemo } from "react";
import Tesseract from "tesseract.js";
import JSZip from "jszip";
import { saveAs } from "file-saver";
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
  const [activeTab, setActiveTab] = useState<"html" | "css" | "ts">("html");

  // Manejo de carga y OCR
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
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
      const lines = data.text.split("\n").map((l) => l.trim()).filter(Boolean);
      const parsed: DetectedComponent[] = [];
      let match;
      lines.forEach((line) => {
        if ((match = /^IMPT\"(.+)\"$/.exec(line))) parsed.push({ type: "input", text: match[1] });
        else if (/^IMPT$/.test(line)) parsed.push({ type: "input" });
        else if ((match = /^BTTN\"(.+)\"$/.exec(line))) parsed.push({ type: "button", text: match[1] });
        else if (/^CHKB$/.test(line)) parsed.push({ type: "checkbox" });
        else if ((match = /^LBL\"(.+)\"$/.exec(line))) parsed.push({ type: "label", text: match[1] });
      });
      setComponents(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // Generación de código
  const htmlCode = useMemo(
    () => [
      `<div class=\"card\">`,
      `  <div class=\"card-content\">`,
      `    <h2>Formulario</h2>`,
      ...components.map((c) => {
        switch (c.type) {
          case "input":
            return c.text
              ? `    <input type=\"text\" value=\"${c.text}\" />`
              : `    <input type=\"text\" />`;
          case "button":
            return `    <button>${c.text}</button>`;
          case "checkbox":
            return `    <input type=\"checkbox\" /> Checkbox`;
          case "label":
            return `    <label>${c.text}</label>`;
        }
      }),
      `  </div>`,
      `</div>`,
    ].join("\n"),
    [components]
  );

  const cssCode = useMemo(
    () => [
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
      `.card-content { display: flex; flex-direction: column; }`,
      `input, button, label { width: 100%; }`,
    ].join("\n"),
    []
  );

  const tsCode = useMemo(
    () => [
      `import React from 'react';`,
      ``,
      `export function GeneratedUI(): JSX.Element {`,
      `  return (`,
      `    <div className=\"card\">`,
      `      <div className=\"card-content\">`,
      `        <h2>Formulario</h2>`,
      ...components.map((c) => {
        switch (c.type) {
          case "input":
            return c.text
              ? `        <input type=\"text\" defaultValue=\"${c.text}\" />`
              : `        <input type=\"text\" />`;
          case "button":
            return `        <button>${c.text}</button>`;
          case "checkbox":
            return `        <input type=\"checkbox\" /> Checkbox`;
          case "label":
            return `        <label>${c.text}</label>`;
        }
      }),
      `      </div>`,
      `    </div>`,
      `  );`,
      `}`,
    ].join("\n"),
    [components]
  );

  // Pre-generate Angular project structure and zip
  const handleDownloadProject = async () => {
    try {
      const zip = new JSZip();
      // package.json
      zip.file(
        "package.json",
        JSON.stringify(
          {
            name: "angular-export",
            version: "0.1.0",
            scripts: {
  start: "node --openssl-legacy-provider ./node_modules/@angular/cli/bin/ng serve",
  build: "node --openssl-legacy-provider ./node_modules/@angular/cli/bin/ng build"
},

            dependencies: {
              "@angular/animations": "~12.2.0",
              "@angular/common": "~12.2.0",
              "@angular/compiler": "~12.2.0",
              "@angular/core": "~12.2.0",
              "@angular/forms": "~12.2.0",
              "@angular/platform-browser": "~12.2.0",
              "@angular/platform-browser-dynamic": "~12.2.0",
              "@angular/router": "~12.2.0",
              rxjs: "~6.6.0",
              tslib: "^2.3.0",
              "zone.js": "~0.11.4",
            },
            devDependencies: {
              "@angular/cli": "~12.2.0",
              "@angular/compiler-cli": "~12.2.0",
              "@angular-devkit/build-angular": "~12.2.0",
              typescript: "~4.3.5",
            },
          },
          null,
          2
        )
      );
      // angular.json
      zip.file(
        "angular.json",
        JSON.stringify({
          version: 1,
          defaultProject: "angular-export",
          projects: {
            "angular-export": {
              projectType: "application",
              schematics: {},
              root: "",
              sourceRoot: "src",
              prefix: "app",
              architect: {
                build: {
                  builder: "@angular-devkit/build-angular:browser",
                  options: {
                    outputPath: "dist/angular-export",
                    index: "src/index.html",
                    main: "src/main.ts",
                    polyfills: "src/polyfills.ts",
                    tsConfig: "tsconfig.json",
                    assets: [],
                    styles: ["src/styles.css"],
                    scripts: []
                  },
                  configurations: {
                    production: {
                      fileReplacements: [],
                      optimization: true,
                      outputHashing: "all",
                      sourceMap: false,
                      extractCss: true,
                      namedChunks: false,
                      extractLicenses: true,
                      vendorChunk: false,
                      buildOptimizer: true
                    }
                  }
                },
                serve: {
                  builder: "@angular-devkit/build-angular:dev-server",
                  options: {
                    browserTarget: "angular-export:build"
                  },
                  configurations: {
                    production: {
                      browserTarget: "angular-export:build:production"
                    }
                  }
                }
              }
            }
          }
        }, null, 2)
      );
      // tsconfig.json
      zip.file(
        "tsconfig.json",
        JSON.stringify({ compilerOptions: { target: "es2015", module: "es2020", moduleResolution: "node", experimentalDecorators: true, emitDecoratorMetadata: true, strict: true, skipLibCheck: true } }, null, 2)
      );
      // src files
      const src = zip.folder("src")!;
      src.file(
        "index.html",
        `<!doctype html><html><head><meta charset=\"utf-8\"><title>AngularExport</title></head><body><app-root></app-root></body></html>`
      );
      src.file(
        "main.ts",
        `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';import { AppModule } from './app/app.module';platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));`
      );
      src.file("polyfills.ts", `import 'zone.js';`);
      src.file("styles.css", `/* global styles */`);
      const app = src.folder("app")!;
      // app.module.ts
      app.file(
        "app.module.ts",
        `import { NgModule } from '@angular/core';import { BrowserModule } from '@angular/platform-browser';import { RouterModule, Routes } from '@angular/router';import { AppComponent } from './app.component';import { GeneratedComponent } from './generated.component';const routes: Routes = [{ path: '', component: GeneratedComponent }];@NgModule({ declarations: [AppComponent, GeneratedComponent], imports: [BrowserModule, RouterModule.forRoot(routes)], bootstrap: [AppComponent] })export class AppModule {}`
      );
      // app.component
      app.file(
        "app.component.ts",
        `import { Component } from '@angular/core';@Component({ selector: 'app-root', template: '<router-outlet></router-outlet>' })export class AppComponent {}`
      );
      app.file("app.component.html", `<router-outlet></router-outlet>`);
      app.file("app.component.css", ``);
      // generated component
      app.file(
        "generated.component.ts",
        `import { Component } from '@angular/core';@Component({ selector: 'app-generated', templateUrl: './generated.component.html', styleUrls: ['./generated.component.css'] })export class GeneratedComponent {}`
      );
      app.file("generated.component.html", htmlCode);
      app.file("generated.component.css", cssCode);

      // README file
      zip.file("README.md", `# Angular Export UI

Este proyecto fue generado automáticamente a partir de una imagen.

## Instrucciones

1. Asegúrate de tener **Node.js** y **Angular CLI** instalados globalmente:
   \\\`\\\`\\\`bash
   npm install -g @angular/cli
   \\\`\\\`\\\`

2. Extrae el archivo ZIP descargado.

3. Abre una terminal en la carpeta extraída y ejecuta:
   \\\`\\\`\\\`bash
   npm install
   npm start
   \\\`\\\`\\\`

4. Abre tu navegador en:
   [http://localhost:4200](http://localhost:4200)

---

**Contenido Generado:**
- \`generated.component.html\`: el HTML detectado desde la imagen
- \`generated.component.css\`: estilos por defecto
- \`generated.component.ts\`: componente Angular

> Proyecto generado automáticamente con ❤️ usando React, Tesseract.js y JSZip.
`);


      // download
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "angular-export.zip");
    } catch (err) {
      console.error("Error al empaquetar proyecto Angular:", err);
    }
  };

  return (
    <div className="w-screen flex justify-center items-center p-4">
      <div className="flex min-h-[500px] space-x-6 w-full max-w-screen-xl">
        {/* Carga e imagen */}
        <Card className="w-1/4">
          <CardHeader><CardTitle>Generador de UI desde Imagen</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button disabled={loading} className="relative overflow-hidden w-full">
              Seleccionar imagen (PNG/JPG)
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>
            {loading && <Progress value={progress} className="w-full" />}
            {imageSrc && <img src={imageSrc} alt="Vista previa" className="mt-2 w-full object-contain rounded" />}        
          </CardContent>
        </Card>
        {/* Vista previa */}
        {components.length > 0 && (
          <Card className="w-1/4">
            <CardHeader><CardTitle>Vista Previa de Componentes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {components.map((comp, idx) => {
                switch (comp.type) {
                  case "input":
                    return comp.text ? <Input key={idx} defaultValue={comp.text} /> : <Input key={idx} />;
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
                    return <Label key={idx}>{comp.text}</Label>;
                }
              })}
            </CardContent>
          </Card>
        )}
        {/* Código Generado */}
        {components.length > 0 && (
          <Card className="flex-1 max-w-[600px] bg-background">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Código Generado</CardTitle>
              <Button size="sm" onClick={handleDownloadProject}>Descargar Proyecto Angular</Button>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList><TabsTrigger value="html">HTML</TabsTrigger><TabsTrigger value="css">CSS</TabsTrigger><TabsTrigger value="ts">TS</TabsTrigger></TabsList>
                <TabsContent value="html"><pre className="mt-2 overflow-x-auto text-sm bg-background p-2 rounded"><code className="text-white">{htmlCode}</code></pre></TabsContent>
                <TabsContent value="css"><pre className="mt-2 overflow-x-auto text-sm bg-background p-2 rounded"><code className="text-white">{cssCode}</code></pre></TabsContent>
                <TabsContent value="ts"><pre className="mt-2 overflow-x-auto text-sm bg-background p-2 rounded"><code className="text-white">{tsCode}</code></pre></TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubirFoto;
