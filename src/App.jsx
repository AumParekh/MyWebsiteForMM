import { useEffect, useState } from 'react'
import './App.css'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import {
  About,
  Projects,
  Writing,
  AiWorkflows,
  MentalModels,
  Footer,
} from './components/Sections.jsx'
import ProjectModal from './components/ProjectModal.jsx'
import CursorGlow from './components/CursorGlow.jsx'
import { PROJECTS } from './data/projects.jsx'

/*
 * Page shell. Owns the project-modal state and its #project/<id> hash
 * routing (shareable deep links); everything visual lives in the components.
 */
function App() {
  const [activeProject, setActiveProject] = useState(null)

  // Keep modal state in sync with the URL hash (back button, shared links)
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash
      if (hash.startsWith('#project/')) {
        const id = hash.slice('#project/'.length)
        const project = PROJECTS.find((p) => p.id === id)
        setActiveProject(project || null)
      } else {
        setActiveProject(null)
      }
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const openProject = (project) => {
    setActiveProject(project)
    const target = `#project/${project.id}`
    if (window.location.hash !== target) {
      window.history.pushState(null, '', target)
    }
  }

  const closeProject = () => {
    setActiveProject(null)
    if (window.location.hash.startsWith('#project/')) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      )
    }
  }

  return (
    <div className="site">
      <CursorGlow />
      <Nav />
      <Hero />
      <main>
        <About />
        <Projects onOpenProject={openProject} />
        <Writing />
        <AiWorkflows />
        <MentalModels />
      </main>
      <Footer />
      {activeProject && (
        <ProjectModal project={activeProject} onClose={closeProject} />
      )}
    </div>
  )
}

export default App
