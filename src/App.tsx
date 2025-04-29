import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./components/Login"
import Register from "./components/Register"
import Dashboard from "./components/Dashboard"
import StarUMLViewer from "./components/StarUML"
import SubirFoto from "./components/SubirFoto"
import GrapesEditor from "./components/GrapesEditor"
import TestCode from "./components/TestCode"
import { UserList } from "./components/UserList";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/staruml" element={<StarUMLViewer />} />
        <Route path="/subirfoto" element={<SubirFoto />} />
        <Route path="/lienzo" element={<GrapesEditor />} />
        <Route path="/Lienzo/:id" element={<GrapesEditor />} />
        <Route path="/usuarios" element={<UserList />} />
        <Route path="/test" element={<TestCode/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
