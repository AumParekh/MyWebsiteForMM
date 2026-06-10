/*
 * Build-notes article for the Socratic co-pilot project.
 * Copy is canonical and preserved verbatim — styling lives in App.css.
 */
export default function SocraticArticle() {
  return (
    <article className="article">
      <header className="article-head">
        <span className="article-eyebrow">Project · Build notes</span>
        <h1 className="article-title">
          Building a Live Socratic <em>Presentation Co-Pilot</em>
        </h1>
        <p className="article-deck">
          How to turn a static teaching script into a real-time, AI-driven,
          dual-screen Socratic instrument — and the design lessons learned
          along the way.
        </p>
      </header>

      <section className="article-lead">
        <p>
          <strong>What if an LLM and a presentation could merge</strong> into a
          single teaching instrument — a deck that asks instead of tells,
          branches instead of plays linearly, and lets a presenter steer a
          live Socratic session in real time?
        </p>
        <p>
          This is the account of building that tool. The specific subject was
          an actuarial topic — dynamic lapse modelling in annuities — but the
          pattern generalises to any guided teaching session. It is not a code
          manual; it is a record of the design decisions, the architecture
          that emerged, and the problems that only surfaced once the tool met
          reality.
        </p>
      </section>

      <section className="article-section">
        <h2>1. The core idea</h2>
        <p>
          The goal was a presentation run by the Socratic method: instead of
          showing the audience answers, the presenter poses questions, the
          room reasons aloud, and the material is drawn out of them. A
          language model drives the questioning live — judging answers,
          branching, going deeper — while the presenter steers.
        </p>
        <p>
          The naïve version is to share a chatbot window on a projector and
          type into it. That fails immediately for three reasons, and
          understanding why is the whole design brief:
        </p>
        <ul className="article-list">
          <li>
            <strong>Spoilers.</strong> The raw model output, the presenter's
            prompts, the answer keys — everything is visible to the room. A
            Socratic session cannot show the answer before the question.
          </li>
          <li>
            <strong>Mess.</strong> The audience sees typos, hedging, false
            starts, and reasoning scaffolding that should stay private.
          </li>
          <li>
            <strong>No control surface.</strong> The presenter has no clean
            way to say "they got it right, go deeper" versus "they're wrong,
            ask it differently" without typing paragraphs mid-talk.
          </li>
        </ul>
        <aside className="principle">
          <span className="principle-label">First principle</span>
          <p>
            Separate what the room sees from what the operator sees.
            Everything else in the design follows from this single split.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>2. The architecture that emerged</h2>
        <p>
          The solution is a two-surface design: an audience stage and an
          operator console.
        </p>
        <ul className="article-list">
          <li>
            <strong>The stage</strong> (on the projector) shows only the
            current concept, a scenario, and one question — typeset cleanly,
            scannable from the back of a room.
          </li>
          <li>
            <strong>The console</strong> (on the presenter's laptop) holds the
            private answer key, steering notes, the conversation log, and a
            row of command buttons.
          </li>
        </ul>
        <p>
          Crucially, the model is given the entire teaching script as hidden
          context — every question, answer, mental model, and formula. It
          always knows where each thread should land. But it is instructed to
          emit only the question to the stage; the answers live on the
          operator's side. The model becomes a Socratic engine that knows the
          destination but reveals only the path.
        </p>

        <h3>The structured-output contract</h3>
        <p>
          The key mechanism that makes this work is forcing the model into a
          rigid output shape every turn:
        </p>
        <pre className="article-pre">
{`DISPLAY:
  the projector content (concept, scenario, prime, question)
---NOTES---
  the private operator note (target answer + steering tip)`}
        </pre>
        <p>
          The application parses this, routes <code>DISPLAY</code> to the
          stage and <code>NOTES</code> to the console. Within{' '}
          <code>DISPLAY</code>, tagged fields (<code>SCENARIO:</code>,{' '}
          <code>PRIME:</code>, <code>QUESTION:</code>, <code>CORRECT:</code>,{' '}
          <code>RETRY:</code>, <code>REVEAL:</code>) let the app render each
          part differently and animate them in sequence.
        </p>
        <aside className="principle">
          <span className="principle-label">Second principle</span>
          <p>
            Don't ask a model to "behave well." Give it a strict output
            contract and have the application enforce it. Free-form trust
            breaks live; structure survives.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>3. Pedagogical design — making it teach, not quiz</h2>
        <p>
          An early version simply read the script's questions in order. It
          felt like an interrogation. Three deliberate teaching behaviours
          were added to make it feel like genuine instruction:
        </p>
        <ul className="article-list">
          <li>
            <strong>Priming before every question.</strong> Each question is
            preceded by a one- or two-sentence setup — a "prime" — that
            recalls what was just established and plants a concrete hook, so
            the question never lands cold.
          </li>
          <li>
            <strong>Building, not resetting.</strong> Each new concept opens
            by referencing the prior answer, so the session reads as one
            continuous argument rather than a series of disconnected slides.
          </li>
          <li>
            <strong>Probing on success.</strong> When the room answers
            correctly, the model is told to reward them with a harder
            follow-up that stress-tests the idea — not just to move on.
          </li>
        </ul>
        <aside className="principle">
          <span className="principle-label">Third principle</span>
          <p>
            The quality of a Socratic session lives in the connective tissue
            — the priming and the bridges between ideas — far more than in
            the questions themselves. Design for the transitions.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>4. The operator's control surface</h2>
        <p>
          The presenter never needs to type full instructions. A small set of
          buttons each expand into a precise instruction to the model behind
          the scenes:
        </p>
        <div className="table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Button</th>
                <th>What the presenter means</th>
                <th>What the model is told</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mark Right</td>
                <td>"They got it"</td>
                <td>Affirm with a takeaway, then deepen this same idea</td>
              </tr>
              <tr>
                <td>Mark Wrong</td>
                <td>"Not quite"</td>
                <td>Don't correct or reveal — pose a simpler counter-question</td>
              </tr>
              <tr>
                <td>Go Deeper</td>
                <td>"Harder question"</td>
                <td>Tougher follow-up on the same concept; assume nothing</td>
              </tr>
              <tr>
                <td>Move On</td>
                <td>"Next concept"</td>
                <td>Don't restate the answer — bridge to a brand-new question</td>
              </tr>
              <tr>
                <td>Give Answer</td>
                <td>"We're stuck / short on time"</td>
                <td>Reveal the full answer (with formula/chart), then continue</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The presenter can also type what the audience actually said, and the
          model judges it. The buttons are an override for when the presenter
          wants to drive directly.
        </p>
        <aside className="principle">
          <span className="principle-label">Fourth principle</span>
          <p>
            A live tool needs one-tap intent, not free-text. Under the
            pressure of a room, the presenter should express what they want to
            happen in a single click; the verbose instruction to the model is
            assembled by the app.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>5. The hardest lesson — anchoring commands to state</h2>
        <p>
          The single most instructive bug: commands like "go deeper" and "move
          on" misbehaved because the model did not know which question was
          currently on the screen. It was told "deepen this idea" but had to
          guess which idea, and guessed wrong — drifting into the wrong
          topic, or revealing an answer when it shouldn't.
        </p>
        <p>
          The fix reshaped the whole approach: the application captures the
          exact question currently displayed and injects it verbatim into
          every command. "Go deeper" became "pose a harder follow-up on this
          specific question: [the actual text]." Ambiguity vanished.
        </p>
        <aside className="principle">
          <span className="principle-label">Fifth principle</span>
          <p>
            A stateless model has no idea what is "on screen." The application
            owns the state; every instruction must carry the relevant state
            with it. Never assume the model remembers the visible context.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>6. Defensive engineering — the safety net</h2>
        <p>
          Models under live load skip rules. Telling the model "always
          include a prime" was not enough — sometimes it didn't. So the
          application was given a self-correcting layer that inspects every
          reply before showing it:
        </p>
        <ul className="article-list">
          <li>
            Did this turn actually pose a question? If not, silently ask the
            model to redo it (a takeaway with no follow-up question is a dead
            end on screen).
          </li>
          <li>
            Is there a question with no prime? Re-ask for the prime — a cold
            question never reaches the room.
          </li>
          <li>
            Did it forget the private answer key? Flag it so the operator is
            never left blind.
          </li>
        </ul>
        <p>
          This retries up to twice before giving up, and surfaces a small
          notice in the operator's console so the presenter knows a correction
          happened. The room sees only the polished result.
        </p>
        <aside className="principle">
          <span className="principle-label">Sixth principle</span>
          <p>
            Treat the model as unreliable and verify its output
            programmatically. The prompt sets intent; the app guarantees the
            contract. Build the net <em>and</em> the prompt — neither alone is
            enough.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>7. Rendering — math and visuals on the fly</h2>
        <p>For a technical subject, words aren't enough. Two capabilities were layered in:</p>
        <ul className="article-list">
          <li>
            <strong>Typeset mathematics.</strong> The model emits formulas in
            LaTeX; the stage renders them as proper equations. The lesson
            here: provide the formulas pre-written in LaTeX inside the
            script, rather than asking the model to convert ASCII on the fly
            — it does the conversion poorly or skips it.
          </li>
          <li>
            <strong>Live charts.</strong> The model can emit a compact data
            specification and the app draws the curve or bars on a canvas.
            This is genuinely dynamic — it can plot a relationship the
            audience just predicted, or contrast two parameter choices on the
            spot.
          </li>
        </ul>
        <aside className="principle">
          <span className="principle-label">Seventh principle</span>
          <p>
            If you want the model to produce a specific artifact reliably (a
            formula, a chart spec), give it the exact thing to copy rather
            than asking it to generate the format from scratch. Pre-load the
            hard parts.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>8. The source material matters more than the prompt</h2>
        <p>
          A recurring failure — the model asking cold, context-free questions
          — was eventually traced not to the prompt but to the script. The
          original script listed bare questions with no surrounding scenario,
          so the model had no raw material to build a setup from. The cure
          was to write a concrete, vivid scenario into the script before
          every single question. Once the context existed in the source, the
          priming behaviour appeared naturally.
        </p>
        <aside className="principle">
          <span className="principle-label">Eighth principle</span>
          <p>
            When a model behaves thinly, check whether you've given it thin
            inputs. No amount of prompt-instruction compensates for source
            material that lacks the substance you want it to use.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>9. Deployment realities</h2>
        <p>
          The path from "works in the chat" to "works in the room" surfaced
          its own constraints:
        </p>
        <ul className="article-list">
          <li>
            <strong>Where the model runs.</strong> In-chat AI access only
            exists inside the host platform. A standalone file needs its own
            API key. The tool was rebuilt to call an external model API with
            a key the presenter pastes locally — never stored, never
            transmitted elsewhere.
          </li>
          <li>
            <strong>Two real windows.</strong> The cleanest projector setup is
            the stage and console as separate browser windows: stage to the
            projector, console to the laptop. This requires one window to
            launch the other and the two to share state.
          </li>
          <li>
            <strong>Graceful failure.</strong> Network errors, popup
            blocking, and missing dependencies all need visible, recoverable
            handling — a tool that dies silently in front of a room is worse
            than no tool.
          </li>
          <li>
            <strong>No persistence by design.</strong> A fresh start every
            session avoids the nightmare of resuming into a half-finished
            state mid-presentation.
          </li>
        </ul>
        <aside className="principle">
          <span className="principle-label">Ninth principle</span>
          <p>
            Design for the venue, not the demo. The failure modes that matter
            are the ones that happen with an audience watching: connectivity,
            blocked popups, a closed window. Make each one visible and
            recoverable.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>10. The general recipe</h2>
        <p>
          Stripped of the specific subject, here is the reusable pattern for
          building a live AI teaching instrument:
        </p>
        <ol className="article-list article-list--ordered">
          <li>
            Write a rich source script: concepts in order, each with a
            scenario, a target answer, and any formula or visual
            pre-formatted.
          </li>
          <li>
            Give the model the whole script as hidden context, with a strict
            output contract separating audience content from operator notes.
          </li>
          <li>
            Split the interface: a clean audience surface and a private
            operator surface, ideally as separate windows.
          </li>
          <li>
            Give the operator one-tap commands that expand into precise,
            state-anchored instructions.
          </li>
          <li>
            Make the model teach: mandatory priming, explicit bridges between
            concepts, probing on success.
          </li>
          <li>
            Wrap everything in a verification layer that re-asks when the
            model violates the contract.
          </li>
          <li>
            Render rich output (math, charts) by pre-loading the hard formats
            into the script.
          </li>
          <li>
            Handle the venue: external API key, separate windows, visible
            error recovery, no fragile persistence.
          </li>
        </ol>
        <aside className="principle principle--meta">
          <span className="principle-label">The meta-lesson</span>
          <p>
            Almost every improvement came not from a cleverer prompt, but
            from moving responsibility out of the model and into the
            application — capturing state, enforcing structure, verifying
            output, and pre-loading inputs. The model is the reasoning
            engine; the application is the discipline around it. A reliable
            live AI tool is mostly the discipline.
          </p>
        </aside>
      </section>

      <footer className="article-footnote">
        <p>
          <em>Conceptual build notes.</em> The companion artifact is a
          self-contained dual-window Socratic co-pilot driven by a live
          language-model API. This document records the reasoning behind it
          so the approach can be adapted to other subjects and sessions.
        </p>
      </footer>
    </article>
  )
}
