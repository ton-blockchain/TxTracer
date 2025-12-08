import {Suspense, useCallback, useEffect, useRef, useState, lazy} from "react"

import {Allotment} from "allotment"
import "allotment/dist/style.css"

import type * as monaco from "monaco-editor"

import InlineLoader from "@shared/ui/InlineLoader"
import PageHeader from "@shared/ui/PageHeader"
import Tutorial, {useTutorial} from "@shared/ui/Tutorial"

import {
  CompileButton,
  SettingsDropdown,
  CompilerErrors,
  LanguageSelector,
  type CodeLanguage,
} from "@app/pages/GodboltPage/components"

import {useSourceMapHighlight} from "@app/pages/GodboltPage/hooks"

import {ShareButton} from "@shared/ui/ShareButton/ShareButton.tsx"

import {TUTORIAL_STEPS} from "@app/pages/GodboltPage/Tutorial.ts"

import type {FuncCompilationResult} from "@features/godbolt/lib/func/compilation.ts"

import type {TolkCompilationResult} from "@features/godbolt/lib/tolk/types.ts"

import {useGodboltSettings} from "./hooks/useGodboltSettings"
import {useFuncCompilation} from "./hooks/useFuncCompilation.ts"
import {useTolkCompilation} from "./hooks/useTolkCompilation.ts"
import {clearShareHash, decodeCodeFromUrl, decodeLanguageFromUrl} from "./urlCodeSharing"

import styles from "./GodboltPage.module.css"

const CodeEditor = lazy(() => import("@shared/ui/CodeEditor"))

const DEFAULT_FUNC_CODE = `#include "stdlib.fc";

() recv_internal(int msg_value, cell in_msg_cell, slice in_msg) {
    var cs = in_msg_cell.begin_parse();
    var flags = cs~load_uint(4);  ;; int_msg_info$0 ihr_disabled:Bool   bounce:Bool bounced:Bool
    if (flags & 1) {
        ;; ignore all bounced messages
        return ();
    }
    if (in_msg.slice_bits() < 32) {
        ;; ignore simple transfers
        return ();
    }
    int op = in_msg~load_uint(32);
    if (op != 0x706c7567) & (op != 0x64737472) { ;; "plug" & "dstr"
        ;; ignore all messages not related to plugins
        return ();
    }
    slice s_addr = cs~load_msg_addr();
    (int wc, int addr_hash) = parse_std_addr(s_addr);

    ;; ... other code

    throw(wc + addr_hash);
}
`

const DEFAULT_ASM_CODE = `// Compile to see assembly here`
const DEFAULT_TOLK_CODE = `tolk 1.0

// this struct defines storage layout of the contract
struct Storage {
    id: uint32  // required to allow multiple independent counter instances, since the contract address depends on its initial state
    counter: uint32 // the current counter value
}

// load contract data from the persistent storage
fun Storage.load() {
    return Storage.fromCell(contract.getData())
}

// save contract data into the persistent storage
fun Storage.save(mutate self) {
    contract.setData(self.toCell())
}

// the struct uses a 32-bit opcode prefix for message identification
struct (0x7e8764ef) IncreaseCounter {
    queryId: uint64 = 0  // query id, typically included in messages
    increaseBy: uint32
}

struct (0x3a752f06) ResetCounter {
    queryId: uint64
}

// using unions to represent available messages
// this allows processing them with pattern matching
type AllowedMessage = IncreaseCounter | ResetCounter

// the main entrypoint: called when a contract receives an message from other contracts
fun onInternalMessage(in: InMessage) {
    // use \`lazy\` to defer loading fields until they are accessed
    val msg = lazy AllowedMessage.fromSlice(in.body);

    match (msg) {
        IncreaseCounter => {
            // load contract storage lazily (efficient for large or partial reads/updates)
            var storage = lazy Storage.load();

            storage.counter += msg.increaseBy;
            storage.save();
        }

        ResetCounter => {
            var storage = lazy Storage.load();

            storage.counter = 0;
            storage.save();
        }

        else => {
            // ignore empty messages, "wrong opcode" for others
            assert (in.body.isEmpty()) throw 0xFFFF
        }
    }
}

// a handler for bounced messages (not used here, may be ommited)
fun onBouncedMessage(in: InMessageBounced) {
}

// get methods are a means to conveniently read contract data using, for example, HTTP APIs
// note that unlike in many other smart contract VMs, get methods cannot be called by other contracts
get fun currentCounter(): int {
    val storage = lazy Storage.load();
    return storage.counter;
}

get fun initialId(): int {
    val storage = lazy Storage.load();
    return storage.id;
}
`
const STORAGE_LANG_KEY = "txtracer-godbolt-lang"

const FUNC_EDITOR_KEY = "txtracer-godbolt-func-code"
const TOLK_EDITOR_KEY = "txtracer-godbolt-tolk-code"
const ASM_EDITOR_KEY = "txtracer-godbolt-asm-code"

function GodboltPage() {
  const [initiallyCompiled, setInitiallyCompiled] = useState<boolean>(false)
  const [language, setLanguage] = useState<CodeLanguage>(() => {
    const fromUrl = decodeLanguageFromUrl()
    if (fromUrl === "func" || fromUrl === "tolk") {
      clearShareHash()
      return fromUrl
    }
    const saved = localStorage.getItem(STORAGE_LANG_KEY)
    return saved === "tolk" ? "tolk" : "func"
  })
  const [funcCode, setFuncCode] = useState(() => {
    const sharedCode = decodeCodeFromUrl()
    if (sharedCode !== null && (decodeLanguageFromUrl() ?? "func") === "func") {
      clearShareHash()
      return sharedCode
    }
    return localStorage.getItem(FUNC_EDITOR_KEY) ?? DEFAULT_FUNC_CODE
  })
  const [tolkCode, setTolkCode] = useState(() => {
    const sharedCode = decodeCodeFromUrl()
    if (sharedCode != null && decodeLanguageFromUrl() === "tolk") {
      clearShareHash()
      return sharedCode
    }
    return localStorage.getItem("txtracer-godbolt-tolk-code") ?? DEFAULT_TOLK_CODE
  })
  const [asmCode] = useState(() => {
    return localStorage.getItem(ASM_EDITOR_KEY) ?? DEFAULT_ASM_CODE
  })

  useEffect(() => {
    localStorage.setItem(FUNC_EDITOR_KEY, funcCode)
  }, [funcCode])
  useEffect(() => {
    localStorage.setItem(TOLK_EDITOR_KEY, tolkCode)
  }, [tolkCode])
  useEffect(() => {
    localStorage.setItem(ASM_EDITOR_KEY, asmCode)
  }, [asmCode])
  useEffect(() => {
    localStorage.setItem(STORAGE_LANG_KEY, language)
  }, [language])

  const funcEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const asmEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const [editorsReady, setEditorsReady] = useState({func: false, asm: false})

  const func = useFuncCompilation()
  const handleFuncCompile = func.handleCompile
  const clearFuncErrors = func.clearError
  const setFuncResult = func.setResult
  const tolk = useTolkCompilation()
  const handleTolkCompile = tolk.handleCompile
  const clearTolkErrors = tolk.clearError
  const setTolkResult = tolk.setResult

  const result: FuncCompilationResult | TolkCompilationResult | undefined =
    language === "func" ? func.result : tolk.result
  const compiling = language === "func" ? func.compiling : tolk.compiling
  const error = language === "func" ? func.error : tolk.error
  const errorMarkers = language === "func" ? func.errorMarkers : tolk.errorMarkers

  const sourceMap = (() => {
    if (result?.lang === "func" && result?.sourceMap) {
      return result.sourceMap
    }
    return undefined
  })()

  const {
    funcHighlightGroups,
    asmHighlightGroups,
    funcHoveredLines,
    asmHoveredLines,
    funcPreciseHighlightRanges,
    handleFuncLineHover,
    handleAsmLineHover,
    filteredAsmCode,
    getVariablesForAsmLine,
  } = useSourceMapHighlight(
    sourceMap,
    result?.mapping,
    funcEditorRef,
    asmEditorRef,
    result?.assembly,
  )

  const displayedAsmCode = result?.assembly ? (filteredAsmCode ?? "") : asmCode

  const godboltSettingsHook = useGodboltSettings()
  const {showVariablesInHover, showDocsInHover, autoCompile} = godboltSettingsHook

  const tutorial = useTutorial({tutorialKey: "godbolt-page", autoStart: true})

  const handleCodeChange = useCallback(
    (newCode: string) => {
      if (language === "func") {
        setFuncCode(newCode)
        clearFuncErrors()
        if (!autoCompile) {
          setFuncResult(undefined)
          return
        }
        void handleFuncCompile(newCode)
      } else {
        setTolkCode(newCode)
        clearTolkErrors()
        if (!autoCompile) {
          setTolkResult(undefined)
          return
        }
        void handleTolkCompile(newCode)
      }
    },
    [
      language,
      clearFuncErrors,
      autoCompile,
      handleFuncCompile,
      setFuncResult,
      clearTolkErrors,
      handleTolkCompile,
      setTolkResult,
    ],
  )

  const compileCode = useCallback(() => {
    if (language === "func") {
      void handleFuncCompile(funcCode)
    } else {
      void handleTolkCompile(tolkCode)
    }
  }, [language, handleFuncCompile, funcCode, handleTolkCompile, tolkCode])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault()
        if (!compiling) {
          if (language === "func") void handleFuncCompile(funcCode)
          else void handleTolkCompile(tolkCode)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [funcCode, compiling, language, tolkCode, handleFuncCompile, handleTolkCompile])

  // Compile code on page open
  useEffect(() => {
    if (initiallyCompiled) return
    if (editorsReady.func && editorsReady.asm) {
      if (language === "func") void handleFuncCompile(funcCode)
      else void handleTolkCompile(tolkCode)
      setInitiallyCompiled(true)
    }
  }, [
    editorsReady.func,
    editorsReady.asm,
    handleFuncCompile,
    handleTolkCompile,
    funcCode,
    tolkCode,
    initiallyCompiled,
    language,
  ])

  // Auto-compile when switching language
  useEffect(() => {
    if (!editorsReady.func || !editorsReady.asm) return
    if (language === "func") void handleFuncCompile(funcCode)
    else void handleTolkCompile(tolkCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  return (
    <div className={styles.traceViewWrapper}>
      <PageHeader pageTitle="explorer">
        <LanguageSelector value={language} onChange={setLanguage} />
        <div className={styles.mainActionContainer} role="toolbar" aria-label="Code editor actions">
          <CompileButton
            onCompile={() => void compileCode()}
            loading={compiling}
            className={styles.executeButton}
          />
          <ShareButton value={language === "func" ? funcCode : tolkCode} lang={language} />
          <SettingsDropdown hooks={godboltSettingsHook} />
        </div>
      </PageHeader>

      <div id="compile-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {compiling && "Compiling code..."}
        {result && !compiling && "Code compiled successfully"}
        {error && !compiling && `Compilation failed: ${error}`}
      </div>

      <div className="sr-only">Press Ctrl+Enter or Cmd+Enter to compile the FunC code</div>

      <main className={styles.appContainer} role="main" aria-label="Code editor workspace">
        <Allotment defaultSizes={[50, 50]} className={styles.editorsContainer} separator={false}>
          <Allotment.Pane minSize={200}>
            <section
              className={styles.editorPanel + " " + styles.editorPanelLeft}
              aria-labelledby="func-editor-heading"
            >
              <h2 id="func-editor-heading" className="sr-only">
                FunC Source Code Editor
              </h2>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
                  code={language === "func" ? funcCode : tolkCode}
                  onChange={handleCodeChange}
                  readOnly={false}
                  language={language}
                  highlightGroups={funcHighlightGroups}
                  hoveredLines={funcHoveredLines}
                  highlightRanges={funcPreciseHighlightRanges}
                  onLineHover={handleFuncLineHover}
                  markers={errorMarkers}
                  needBorderRadius={false}
                  onEditorMount={editor => {
                    funcEditorRef.current = editor
                    setEditorsReady(prev => ({...prev, func: true}))
                  }}
                />
              </Suspense>
              <CompilerErrors
                markers={errorMarkers}
                filename={language === "func" ? "main.fc" : "main.tolk"}
                onNavigate={(line, column) => {
                  const editor = funcEditorRef.current
                  if (!editor) return
                  editor.revealPositionInCenter({lineNumber: line, column})
                  editor.setPosition({lineNumber: line, column})
                  editor.focus()
                }}
              />
            </section>
          </Allotment.Pane>

          <Allotment.Pane minSize={200}>
            <section
              className={styles.editorPanel + " " + styles.editorPanelRight}
              aria-labelledby="asm-editor-heading"
            >
              <h2 id="asm-editor-heading" className="sr-only">
                Generated Assembly Code Output
              </h2>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
                  code={displayedAsmCode}
                  readOnly={true}
                  language="tasm"
                  highlightGroups={asmHighlightGroups}
                  hoveredLines={asmHoveredLines}
                  onLineHover={handleAsmLineHover}
                  getVariablesForLine={getVariablesForAsmLine}
                  showVariablesDocs={showVariablesInHover}
                  showInstructionDocs={showDocsInHover}
                  needBorderRadius={false}
                  onEditorMount={editor => {
                    asmEditorRef.current = editor
                    setEditorsReady(prev => ({...prev, asm: true}))
                  }}
                />
              </Suspense>
            </section>
          </Allotment.Pane>
        </Allotment>
      </main>

      <Tutorial
        steps={TUTORIAL_STEPS}
        isOpen={tutorial.isOpen}
        onClose={tutorial.closeTutorial}
        onComplete={tutorial.completeTutorial}
      />
    </div>
  )
}

export default GodboltPage
