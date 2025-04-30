"use client"

import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { motion } from "framer-motion"

interface UMLClass {
  name: string
  attributes: { name: string; type: string }[]
}

interface RecordData {
  [key: string]: any
}

export default function StarUMLViewer() {
  const navigate = useNavigate()
  const [umlClasses, setUmlClasses] = useState<UMLClass[]>([])
  const [error, setError] = useState<string | null>(null)
  const [records, setRecords] = useState<{ [className: string]: RecordData[] }>({})
  const [formData, setFormData] = useState<{ [className: string]: RecordData }>({})
  const [editingIndex, setEditingIndex] = useState<{ [className: string]: number | null }>({})
  // Estado para pestañas de código generado
  const [activeCodeTab, setActiveCodeTab] = useState<"html" | "css" | "ts">("html")

  // Generación de código con useMemo
  const htmlCode = useMemo(() => {
    return umlClasses.map(cls => {
      return [
        `<div class=\"card\">`,
        `  <div class=\"card-content\">`,
        `    <h2>${cls.name}</h2>`,
        ...cls.attributes.map(attr => `    <input type=\"text\" placeholder=\"${attr.name}\" />`),
        `  </div>`,
        `</div>`
      ].join("\n")
    }).join("\n\n")
  }, [umlClasses])

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
      `input {`,
      `  width: 100%;`,
      `  padding: 0.5rem;`,
      `  border: 1px solid #ccc;`,
      `  border-radius: 0.25rem;`,
      `}`
    ].join("\n")
  }, [])

  const tsCode = useMemo(() => {
    return [
      `import React from 'react';`,
      ``,
      `export function GeneratedUI(): JSX.Element {`,
      `  return (`,
      `    <>`,
      ...umlClasses.map(cls => [
        `      <div className=\"card\">`,
        `        <div className=\"card-content\">`,
        `          <h2>${cls.name}</h2>`,
        ...cls.attributes.map(attr => `          <input type=\"text\" placeholder=\"${attr.name}\" />`),
        `        </div>`,
        `      </div>`
      ].join("\n")),
      `    </>`,
      `  );`,
      `}`
    ].join("\n")
  }, [umlClasses])

  // Función para descargar proyecto Angular
  const handleDownloadProject = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/generar-proyecto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlCode, css: cssCode, ts: tsCode })
      })
      if (!response.ok) throw new Error("Error al generar el proyecto")
      const blob = await response.blob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "proyecto-angular.zip"
      link.click()
    } catch (err) {
      console.error("Descarga fallida:", err)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    try {
      const json = JSON.parse(text)
      const classes = extractClasses(json)
      const initRec: { [key: string]: RecordData[] } = {}
      const initForm: { [key: string]: RecordData } = {}
      const initEdit: { [key: string]: number | null } = {}
      classes.forEach(cls => {
        initRec[cls.name] = []
        initForm[cls.name] = {}
        initEdit[cls.name] = null
      })
      setUmlClasses(classes)
      setRecords(initRec)
      setFormData(initForm)
      setEditingIndex(initEdit)
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Archivo inválido o estructura no reconocida.")
    }
  }

  const inferType = (name: string): string => {
    const lower = name.toLowerCase()
    if (lower.includes("id")) return "int"
    if (lower.includes("nombre") || lower.includes("email") || lower.includes("desc")) return "string"
    if (lower.includes("fecha") || lower.includes("date")) return "Date"
    if (lower.includes("precio") || lower.includes("monto") || lower.includes("total")) return "float"
    if (lower.includes("activo") || lower.includes("habilitado")) return "boolean"
    if (lower.includes("pass")) return "password"
    return "string"
  }

  const extractClasses = (json: any): UMLClass[] => {
    const elements = json?.ownedElements ?? []
    const classElements = findClasses(elements)
    return classElements.map((cls: any) => ({
      name: cls.name,
      attributes: (cls.attributes ?? []).map((attr: any) => ({ name: attr.name, type: attr.type?.name ?? inferType(attr.name) }))
    }))
  }

  const findClasses = (elements: any[]): any[] => {
    const classes: any[] = []
    const recurse = (elems: any[]) => {
      for (const elem of elems) {
        if (elem._type === "UMLClass") classes.push(elem)
        if (elem.ownedElements) recurse(elem.ownedElements)
      }
    }
    recurse(elements)
    return classes
  }

  const handleChange = (className: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [className]: { ...prev[className], [e.target.name]: e.target.value } }))
  }

  const handleSubmit = (className: string, e: React.FormEvent) => {
    e.preventDefault()
    const index = editingIndex[className]
    if (index !== null) {
      const updated = [...records[className]]
      updated[index] = formData[className]
      setRecords(prev => ({ ...prev, [className]: updated }))
      setEditingIndex(prev => ({ ...prev, [className]: null }))
    } else {
      setRecords(prev => ({ ...prev, [className]: [...prev[className], formData[className]] }))
    }
    setFormData(prev => ({ ...prev, [className]: {} }))
  }

  const handleEdit = (className: string, index: number) => {
    setFormData(prev => ({ ...prev, [className]: records[className][index] }))
    setEditingIndex(prev => ({ ...prev, [className]: index }))
  }

  const handleDelete = (className: string, index: number) => {
    setRecords(prev => ({ ...prev, [className]: prev[className].filter((_, i) => i !== index) }))
    if (editingIndex[className] === index) {
      setFormData(prev => ({ ...prev, [className]: {} }))
      setEditingIndex(prev => ({ ...prev, [className]: null }))
    }
  }

  return (
    <ScrollArea className="h-full w-screen">
      <div className="flex flex-col items-center justify-center mx-auto max-w-screen p-6 gap-10">
        {/* Selector de archivo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl space-y-4">
          <Label className="text-white">Seleccionar archivo .mdj</Label>
          <Input type="file" accept=".mdj" onChange={handleFileUpload} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </motion.div>

        {/* Para cada clase, 3 tarjetas en fila */}
        {umlClasses.map((cls, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex justify-center items-start p-4">
            <div className="flex space-x-6 w-full max-w-screen-xl">
              {/* Tarjeta atributo */}
              <Card className="w-screen">
                <CardHeader><CardTitle>📦 Clase: {cls.name}</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border">
                      <thead className="bg-muted"><tr><th className="border px-4 py-2">Atributo</th><th className="border px-4 py-2">Tipo</th></tr></thead>
                      <tbody>{cls.attributes.map((attr, j) => (<tr key={j}><td className="border px-4 py-2">{attr.name}</td><td className="border px-4 py-2">{attr.type}</td></tr>))}</tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              {/* Tarjeta CRUD */}
              <Card className="w-screen">
                <CardHeader><CardTitle>🛠 CRUD para {cls.name}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={e => handleSubmit(cls.name, e)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cls.attributes.map((attr, j) => (<div key={j} className="space-y-1"><Label htmlFor={attr.name}>{attr.name}</Label><Input name={attr.name} value={formData[cls.name]?.[attr.name] || ""} onChange={e => handleChange(cls.name, e)}/></div>))}
                    <div className="col-span-full"><Button type="submit">{editingIndex[cls.name] !== null ? "Actualizar" : "Agregar Registro"}</Button></div>
                  </form>
                  {records[cls.name]?.length > 0 && (<div className="overflow-x-auto"><table className="w-full border mt-4"><thead className="bg-muted"><tr>{cls.attributes.map((attr,j)=><th key={j} className="border px-4 py-2">{attr.name}</th>)}<th className="border px-4 py-2">Acciones</th></tr></thead><tbody>{records[cls.name].map((record,idx)=><tr key={idx}>{cls.attributes.map((attr,k)=><td key={k} className="border px-4 py-2">{record[attr.name]}</td>)}<td className="border px-4 py-2 space-x-2"><Button variant="outline" onClick={()=>handleEdit(cls.name,idx)}>Editar</Button><Button variant="destructive" onClick={()=>handleDelete(cls.name,idx)}>Eliminar</Button></td></tr>)}</tbody></table></div>)}
                </CardContent>
              </Card>
              {/* Tarjeta vista formulario */}
              <Card className="w-screen">
                <CardHeader className="flex justify-between items-center"><CardTitle>📝 Vista de {cls.name}</CardTitle><Button size="sm" onClick={()=>navigate("/canvas-editor",{state:{className:cls.name}})}>Editar en Canvas</Button></CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    {cls.attributes.filter(a=>!a.name.toLowerCase().includes("id")).map((attr,j)=><div key={j} className="space-y-1"><Label htmlFor={attr.name}>{attr.name}</Label><Input id={attr.name} type={attr.name.toLowerCase().includes("pass")?"password":attr.name.toLowerCase().includes("email")?"email":(attr.type==="int"||attr.type==="float")?"number":"text"} placeholder={`Ingrese ${attr.name}`}/></div>)}
                    <Button type="button" className="w-full">Guardar {cls.name}</Button>
                  </form>
                </CardContent>
              </Card>
               {/* Tarjeta con pestañas de código generado */}
        {umlClasses.length > 0 && (
          <Card className="w-full max-w-72">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Código Generado</CardTitle>
              <Button size="sm" onClick={handleDownloadProject}>Descargar Proyecto</Button>
            </CardHeader>
            <CardContent>
            <Tabs value={activeCodeTab} onValueChange={(value: string) => setActiveCodeTab(value as "html" | "css" | "ts")} className="w-full">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="ts">TS</TabsTrigger>
                </TabsList>
                <TabsContent value="html">
                  <pre className="mt-2 overflow-x-auto text-sm bg-background-100 p-2 rounded"><code>{htmlCode}</code></pre>
                </TabsContent>
                <TabsContent value="css">
                  <pre className="mt-2 overflow-x-auto text-sm bg-background-100 p-2 rounded"><code>{cssCode}</code></pre>
                </TabsContent>
                <TabsContent value="ts">
                  <pre className="mt-2 overflow-x-auto text-sm bg-background-100 p-2 rounded"><code>{tsCode}</code></pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  )
}
