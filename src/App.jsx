import { useEffect, useState } from 'react'
import Lenis from 'lenis'
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

  // Lenis smooth-scroll init.
  // Skipped entirely for reduced-motion users — the RAF loop drives every frame,
  // so we must cancel it on cleanup to avoid a zombie animation loop.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis()

    // RAF loop: lenis.raf(time) processes scroll easing each frame.
    // We store the handle so cleanup can cancel it before lenis.destroy().
    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  // Direct state + hash update (no wormhole).
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
