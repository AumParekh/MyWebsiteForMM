/*
 * Build-notes article for the FRM Part II study portal.
 * Companion to SocraticArticle — same editorial voice; styling lives in App.css.
 */
export default function FrmPortalArticle() {
  return (
    <article className="article">
      <header className="article-head">
        <span className="article-eyebrow">Project · Build notes</span>
        <h1 className="article-title">
          Building a Study Portal Where <em>Code Is the Registrar</em> and
          the AI Only Teaches
        </h1>
        <p className="article-deck">
          How to study for a dense professional exam by drawing a hard line:
          deterministic code owns every date, queue, and count; a
          retrieval-grounded language model owns only explanation, questions,
          and grading.
        </p>
      </header>

      <section className="article-lead">
        <p>
          <strong>The FRM Part II exam is a wall of dense material</strong> —
          six textbooks, hundreds of learning objectives, and a question style
          that punishes anyone who confuses a concept with its near-sibling.
          The portal is a single-user web app for studying it: you open it,
          click START, and it runs the session — reviewing what is due,
          quizzing, teaching new material, and generating recall prompts for
          later.
        </p>
        <p>
          This is the account of building that tool. It is not a code manual;
          it is a record of the one governing decision that every other
          decision followed from, the architecture that emerged, and the
          problems that only surfaced once the thing met a real exam date.
        </p>
      </section>

      <section className="article-section">
        <h2>1. The load-bearing principle</h2>
        <p>
          One sentence carried the whole design. Sort every responsibility into
          one of two buckets:
        </p>
        <ul className="article-list">
          <li>
            <strong>What varies → the LLM.</strong> Explanation, question
            generation, grading free recall, autopsying wrong answers, the
            Socratic back-and-forth. Judgement calls with no single right form.
          </li>
          <li>
            <strong>What is fixed → code and SQL.</strong> Scheduling, due
            queues, coverage math, pacing against the exam date, mode routing,
            error counting. Things with exactly one correct answer that must
            never drift.
          </li>
        </ul>
        <p>
          The model never decides dates, never tracks state in its "memory,"
          never picks what is due. It <strong>reads state and writes state
          through tools.</strong> It is the teacher, not the registrar.
        </p>
        <aside className="principle">
          <span className="principle-label">First principle</span>
          <p>
            An LLM cannot be your database. Anything that must be exact, durable,
            or auditable belongs in code; the model is for the parts where
            judgement, not precision, is the point.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>2. Three framing corrections</h2>
        <p>
          Before writing anything, three common ways this kind of project goes
          wrong were named explicitly, so the architecture could be built
          against them:
        </p>
        <ul className="article-list">
          <li>
            <strong>The LLM is not the memory.</strong> All scheduling state
            lives in Postgres. The model's recollection of "what's due" is
            reconstructed each session from the database, never carried across
            sessions in its head.
          </li>
          <li>
            <strong>Books via retrieval, never stuffed into context.</strong>
            Six textbooks are roughly 2,500 chunks. Pasting them into the prompt
            would blow the token budget, cost a fortune, and drown the model's
            attention. Instead every claim is grounded in passages retrieved for
            that specific question.
          </li>
          <li>
            <strong>The API key never touches the browser.</strong> All model
            calls go through server-side routes; the build output is grepped for
            key prefixes before every deploy.
          </li>
        </ul>
        <aside className="principle">
          <span className="principle-label">Second principle</span>
          <p>
            Name the failure modes before you build. The architecture is mostly
            a set of defenses against mistakes you can predict in advance — write
            them down first and the design falls out of them.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>3. Grounding every claim in the books</h2>
        <p>
          The heart of the tool is retrieval-augmented generation. The textbooks
          are chunked (~800–900 tokens each, with overlap), embedded into
          vectors, and stored in a Postgres table with a vector index. When the
          student asks a question, the query is embedded the same way, the
          nearest passages are pulled by similarity, and only those passages are
          handed to the model — with a non-negotiable instruction: ground every
          claim in the provided text, and if the passages don't cover it, say so
          rather than inventing an answer.
        </p>
        <p>
          A subtle but decisive detail: how many passages to retrieve depends on
          the task. A focused chat answer needs 8–10 chunks. But diffing a
          student's recall of an entire reading needs far more — early versions
          pulled 8 chunks for that and the model flagged "gaps" for concepts it
          had simply never been shown. Raising the retrieval to 16 chunks, built
          from a query of the reading title plus every learning objective, let it
          tell a real gap from a retrieval gap.
        </p>
        <aside className="principle">
          <span className="principle-label">Third principle</span>
          <p>
            A grounded model is only as good as what you retrieve for it. When it
            looks like it "doesn't know" something, the first suspect is the
            retrieval, not the model — you may simply never have handed it the
            passage.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>4. Eight techniques, each with a mechanic</h2>
        <p>
          The portal is not a generic chatbot pointed at textbooks. It implements
          eight evidence-based learning techniques, and crucially, each one has a
          concrete database mechanic behind it rather than living only as advice
          in a prompt:
        </p>
        <div className="table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Technique</th>
                <th>What it does</th>
                <th>The mechanic behind it</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Successive relearning</td>
                <td>Retrieve to criterion, then at spreading intervals</td>
                <td>Recall-prompt table; deterministic 3 → 10 → 30 day ladder</td>
              </tr>
              <tr>
                <td>Interleaving</td>
                <td>Mix topics so you must identify the concept first</td>
                <td>Every 4th session opens with a cross-chapter quiz</td>
              </tr>
              <tr>
                <td>Minimal-pair drills</td>
                <td>Learn the boundary between sibling concepts</td>
                <td>A "confusables" registry with one-line discriminators</td>
              </tr>
              <tr>
                <td>Error log as boosted queue</td>
                <td>Reweight practice toward past mistakes</td>
                <td>Errors table tagged by trap type; resurfaced after ~7 days</td>
              </tr>
              <tr>
                <td>Distractor autopsy</td>
                <td>Explain why each wrong option is wrong</td>
                <td>Per-option autopsies stored on every question</td>
              </tr>
              <tr>
                <td>Skeleton dump + reteach</td>
                <td>Free-recall a chapter, then patch only the gaps</td>
                <td>Revise mode diffs your dump against the objectives</td>
              </tr>
              <tr>
                <td>Qualifier + timing</td>
                <td>Practise under time pressure and adversarial wording</td>
                <td>Visible per-question timer; qualifier-flip generator</td>
              </tr>
              <tr>
                <td>Confidence calibration</td>
                <td>Track how sure you felt versus how right you were</td>
                <td>Mandatory 50/70/90 rating stored on every attempt</td>
              </tr>
            </tbody>
          </table>
        </div>
        <aside className="principle">
          <span className="principle-label">Fourth principle</span>
          <p>
            A technique that lives only in a prompt is a suggestion the model can
            quietly ignore. Give each one a table, a column, or a deterministic
            function, and it becomes a guarantee instead of a hope.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>5. The model reads and writes state through tools</h2>
        <p>
          The line between teacher and registrar is enforced by a small set of
          tools the model can call: log an error, add a confusable pair, create a
          recall prompt, update an objective's status, search the objectives,
          search the book chunks, fetch what's due. The model never edits the
          database directly and never invents an ID — it must look one up first.
          Every enum argument is strict, and the database rejects anything
          off-list.
        </p>
        <p>
          So when a student gets a question wrong mid-conversation, the model
          doesn't just say "noted" — it calls the error-logging tool with the
          concept, the trap type, and the student's stated confidence, and a real
          row appears in the boosted-review queue. The teaching is fluid; the
          bookkeeping is exact.
        </p>
        <aside className="principle">
          <span className="principle-label">Fifth principle</span>
          <p>
            Give the model verbs, not write-access. Tools with strict, validated
            arguments let it affect real state without ever being trusted to get
            the state itself right.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>6. START is pure code, no model involved</h2>
        <p>
          The single most important screen — what to do this session — has no LLM
          in it at all. A plain function reads the database and assembles the
          session plan: it computes pacing (objectives remaining ÷ days until the
          exam), counts what review is due, finds the book with the most
          unlearned material and the next untouched objective, and emits an
          ordered list of blocks. If anything is due, review comes first; then
          quiz, learn, and close.
        </p>
        <p>
          The student shows up; the decisions are already made. There is nothing
          for the model to get wrong, because the model was never asked.
        </p>
        <aside className="principle">
          <span className="principle-label">Sixth principle</span>
          <p>
            The decisions that must be right every single time are exactly the
            ones to keep away from the model. Determinism where it matters; AI
            only where variation is the value.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>7. The gotchas that only production teaches</h2>
        <p>
          Several problems were invisible in local development and only appeared
          once the tool was deployed and used against a live database:
        </p>
        <ul className="article-list">
          <li>
            <strong>The reasoning model self-budgets its tokens.</strong> Capping
            the token limit on a model that thinks before it answers can starve
            the visible output, truncating JSON mid-object. The fix was to stop
            capping it and let it allocate its own budget.
          </li>
          <li>
            <strong>The serverless function timeout is real.</strong> Generating
            a hard cross-concept question on the heavyweight model ran past the
            60-second cap and failed. The resolution was model-by-load: the fast
            model for the heavy multi-concept work, the strong model only where it
            stays under the cap.
          </li>
          <li>
            <strong>The math renderer is picky.</strong> The display only renders
            one LaTeX delimiter style; the model sometimes emitted another, which
            showed up as raw text. The fix was belt-and-braces: mandate the right
            style in the prompt <em>and</em> normalize the output in code before
            rendering.
          </li>
          <li>
            <strong>The database driver returns big integers as strings.</strong>
            Deduplicating retrieved passages by ID silently failed because the
            IDs were strings, not numbers, until they were cast at the SQL level.
          </li>
          <li>
            <strong>Runtime-loaded files weren't bundled.</strong> The instruction
            files read from disk at runtime were absent in the production bundle —
            fine locally, a crash in production — until the build was told
            explicitly to include them.
          </li>
        </ul>
        <aside className="principle">
          <span className="principle-label">Seventh principle</span>
          <p>
            The bugs that matter live in the gap between "works on my machine" and
            "works deployed." Reasoning-token budgets, function timeouts, driver
            type coercion, and bundler file-tracing are all invisible locally and
            obvious only in production. Test against the real thing.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>8. How it was actually built</h2>
        <p>
          The portal was built with a subagent-driven method: a fresh agent per
          task working from a precise, self-contained brief — exact files to
          touch, exact interfaces to implement, and an explicit list of what not
          to touch. A controller session integrated each piece, ran the type
          checker and the build after every integration, tested against the live
          database and APIs rather than mocks, cleaned up test data, and
          committed. Logic-heavy work — the prompts and the scheduling math — got
          reviewed at the spec level before any code was written.
        </p>
        <aside className="principle">
          <span className="principle-label">Eighth principle</span>
          <p>
            Parallel agents need narrow, written briefs and a controller that
            verifies against reality after every merge. The discipline of the
            integration loop — typecheck, build, runtime-test, clean — is what
            keeps a fleet of agents from compounding each other's mistakes.
          </p>
        </aside>
      </section>

      <section className="article-section">
        <h2>9. The general recipe</h2>
        <p>
          Stripped of the specific exam, here is the reusable pattern for an
          AI-assisted learning tool that you can actually trust:
        </p>
        <ol className="article-list article-list--ordered">
          <li>
            Draw the line first: list every responsibility and sort it into
            "must be exact" (code) versus "judgement call" (model).
          </li>
          <li>
            Put all durable state in a real database; let the model read and
            write it only through strict, validated tools.
          </li>
          <li>
            Ground every factual claim in retrieved source passages, and tune how
            much you retrieve to the task.
          </li>
          <li>
            Give each pedagogical technique a concrete mechanic — a table, a
            column, a deterministic function — not just a line in a prompt.
          </li>
          <li>
            Keep the decisions that must always be right (scheduling, pacing,
            routing) entirely out of the model.
          </li>
          <li>
            Test against the live database and the real deployment target; the
            costly bugs hide there.
          </li>
        </ol>
        <aside className="principle principle--meta">
          <span className="principle-label">The meta-lesson</span>
          <p>
            The same lesson as the Socratic co-pilot, from the other direction:
            reliability comes from moving responsibility out of the model and
            into the system around it. The LLM is the reasoning engine; the
            database, the tools, and the deterministic code are the discipline.
            Decide what varies, and let only that vary.
          </p>
        </aside>
      </section>

      <footer className="article-footnote">
        <p>
          <em>Conceptual build notes.</em> The companion artifact is a deployed,
          single-user FRM Part II study portal: retrieval-grounded teaching over
          six textbooks, with spaced repetition, error tracking, and pacing all
          owned by deterministic code. This document records the reasoning behind
          it so the pattern can be adapted to other subjects and exams.
        </p>
      </footer>
    </article>
  )
}
