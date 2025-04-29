"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    try {
      const json = JSON.parse(text)
      const classes = extractClasses(json)

      const initialRecords: { [key: string]: RecordData[] } = {}
      const initialFormData: { [key: string]: RecordData } = {}
      const initialEditing: { [key: string]: number | null } = {}

      classes.forEach(cls => {
        initialRecords[cls.name] = []
        initialFormData[cls.name] = {}
        initialEditing[cls.name] = null
      })

      setUmlClasses(classes)
      setRecords(initialRecords)
      setFormData(initialFormData)
      setEditingIndex(initialEditing)
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
      attributes: (cls.attributes ?? []).map((attr: any) => ({
        name: attr.name,
        type: attr.type?.name ?? inferType(attr.name),
      })),
    }))
  }

  const findClasses = (elements: any[]): any[] => {
    const classes: any[] = []
    const recurse = (elems: any[]) => {
      for (const elem of elems) {
        if (elem._type === "UMLClass") {
          classes.push(elem)
        }
        if (elem.ownedElements) {
          recurse(elem.ownedElements)
        }
      }
    }
    recurse(elements)
    return classes
  }

  const handleChange = (className: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [className]: {
        ...prev[className],
        [e.target.name]: e.target.value,
      },
    }))
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
      setRecords(prev => ({
        ...prev,
        [className]: [...prev[className], formData[className]],
      }))
    }

    setFormData(prev => ({ ...prev, [className]: {} }))
  }

  const handleEdit = (className: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [className]: records[className][index],
    }))
    setEditingIndex(prev => ({ ...prev, [className]: index }))
  }

  const handleDelete = (className: string, index: number) => {
    setRecords(prev => ({
      ...prev,
      [className]: prev[className].filter((_, i) => i !== index),
    }))
    if (editingIndex[className] === index) {
      setFormData(prev => ({ ...prev, [className]: {} }))
      setEditingIndex(prev => ({ ...prev, [className]: null }))
    }
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col items-center justify-center mx-auto max-w-6xl p-6 gap-10">
        {/* Selector de archivo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl space-y-4">
          <Label className="text-white">Seleccionar archivo .mdj</Label>
          <Input type="file" accept=".mdj" onChange={handleFileUpload} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </motion.div>

        {/* Para cada clase, 3 tarjetas en fila */}
        {umlClasses.map((cls, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex justify-center items-start p-4"
          >
            <div className="flex space-x-6 w-full max-w-screen-xl">
              {/* Tarjeta 1: Atributos */}
              <Card className="w-1/3">
                <CardHeader>
                  <CardTitle>📦 Clase: {cls.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="border px-4 py-2">Atributo</th>
                          <th className="border px-4 py-2">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cls.attributes.map((attr, j) => (
                          <tr key={j}>
                            <td className="border px-4 py-2">{attr.name}</td>
                            <td className="border px-4 py-2">{attr.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta 2: CRUD */}
              <Card className="w-1/3">
                <CardHeader>
                  <CardTitle>🛠 CRUD para {cls.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={e => handleSubmit(cls.name, e)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cls.attributes.map((attr, j) => (
                      <div key={j} className="space-y-1">
                        <Label htmlFor={attr.name}>{attr.name}</Label>
                        <Input
                          name={attr.name}
                          value={formData[cls.name]?.[attr.name] || ""}
                          onChange={e => handleChange(cls.name, e)}
                        />
                      </div>
                    ))}
                    <div className="col-span-full">
                      <Button type="submit">
                        {editingIndex[cls.name] !== null ? "Actualizar" : "Agregar Registro"}
                      </Button>
                    </div>
                  </form>
                  {records[cls.name]?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border mt-4">
                        <thead className="bg-muted">
                          <tr>
                            {cls.attributes.map((attr, j) => (
                              <th key={j} className="border px-4 py-2">{attr.name}</th>
                            ))}
                            <th className="border px-4 py-2">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records[cls.name].map((record, idx) => (
                            <tr key={idx}>
                              {cls.attributes.map((attr, k) => (
                                <td key={k} className="border px-4 py-2">{record[attr.name]}</td>
                              ))}
                              <td className="border px-4 py-2 space-x-2">
                                <Button variant="outline" onClick={() => handleEdit(cls.name, idx)}>Editar</Button>
                                <Button variant="destructive" onClick={() => handleDelete(cls.name, idx)}>Eliminar</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tarjeta 3: Vista de formulario + Editar en Canvas */}
              <Card className="w-1/3">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>📝 Vista de {cls.name}</CardTitle>
                  <Button size="sm" onClick={() => navigate("/canvas-editor", { state: { className: cls.name } })}>
                    Editar en Canvas
                  </Button>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    {cls.attributes
                      .filter(attr => !attr.name.toLowerCase().includes("id"))
                      .map((attr, j) => (
                        <div key={j} className="space-y-1">
                          <Label htmlFor={attr.name}>{attr.name}</Label>
                          <Input
                            id={attr.name}
                            type={
                              attr.name.toLowerCase().includes("pass") ? "password" :
                              attr.name.toLowerCase().includes("email") ? "email" :
                              attr.type === "int" || attr.type === "float" ? "number" :
                              "text"
                            }
                            placeholder={`Ingrese ${attr.name}`}
                          />
                        </div>
                      ))}
                    <Button type="button" className="w-full">
                      Guardar {cls.name}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  )
}
