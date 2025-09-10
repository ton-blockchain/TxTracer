const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-DtpNl2i4.js","./Badge-De5zwYv5.js","./ton-vendor-BkcVSvwD.js","./Badge-BRsnVF_y.css","./monaco-editor-core-BNZEfIW9.js","./monaco-editor-core-GL-q52Lm.css","./index-DiTwyiv7.js","./ton-assembly-CfeKxQzp.js","./ton-sandbox-ma_peu3f.js","./control-registers-EZNZdin2.js","./error-codes-B36bHDJL.js","./index-CiNhpJcB.css"])))=>i.map(i=>d[i]);
import{j as t,B as J,F as q,R as T,r as s,u as Q,a as X,b as Z,T as ee,H as te,P as oe}from"./Badge-De5zwYv5.js";import{_ as ne}from"./monaco-editor-core-BNZEfIW9.js";import{I as ae}from"./InlineLoader-Cor-GcL3.js";import{u as se,a as re,T as ie}from"./TraceSidePanel-s6mnyI6p.js";import{executeAssemblyCode as ce}from"./executor-DNkvzj6u.js";import{S as le}from"./StatusBadge-DTemP9Xg.js";import{n as k}from"./traceTx-CSoGjILS.js";import ue from"./index-CqXlcNcE.js";import{B as de,d as me,c as pe,u as he,S as xe,T as ge}from"./ButtonLoader-Ym9PXpuS.js";import"./ton-vendor-BkcVSvwD.js";import"./index-DiTwyiv7.js";import"./ton-assembly-CfeKxQzp.js";import"./ton-sandbox-ma_peu3f.js";import"./Tooltip-B4S-T1Wt.js";import"./error-codes-B36bHDJL.js";import"./index-CW3W-OfE.js";const ye="_traceViewWrapper_7xotu_1",fe="_appContainer_7xotu_9",be="_headerContent_7xotu_19",Ce="_txStatusContainer_7xotu_25",Se="_mainActionContainer_7xotu_32",Ee="_mainContent_7xotu_40",ve="_editorContainer_7xotu_72",ke="_executeButton_7xotu_84",_e="_sidebarArea_7xotu_138",i={traceViewWrapper:ye,appContainer:fe,headerContent:be,txStatusContainer:Ce,mainActionContainer:Se,mainContent:Ee,editorContainer:ve,executeButton:ke,sidebarArea:_e};function Te({onClick:r,loading:l}){return t.jsx(J,{onClick:r,disabled:l,className:i.executeButton,title:l?"Executing Assembly Code...":"Execute Assembly Code (Ctrl/Cmd+Enter)","aria-label":l?"Executing assembly code...":"Execute assembly code","aria-describedby":"execution-status","aria-keyshortcuts":"Control+Enter",children:l?t.jsx(de,{children:"Execute"}):t.jsxs(t.Fragment,{children:[t.jsx(q,{size:16,"aria-hidden":"true"}),"Execute"]})})}const we=[{title:"Welcome to Assembly Playground",content:`This tool lets you write and execute TON Assembly (TVM) code step by step.

Perfect for learning TVM instructions and debugging smart contracts!

Press Esc to close this tutorial at any time.`,target:"",placement:"bottom"},{title:"Assembly Code Editor",content:`Here you can write your TVM assembly instructions.

Each line represents one instruction that will be executed by the TVM.

The default code shows basic stack operations - feel free to modify it!`,target:'[class*="mainContent"] > div:first-child',placement:"right"},{title:"Initial Stack Setup",content:`Before executing code, you can set up an initial stack with test values.

This is useful for testing functions that expect specific inputs.`,target:'[class*="stack-viewer"]',placement:"left"},{title:"Add Elements onto the Stack",content:"Click + button to add elements onto the Stack one by one, or click Import button to insert the entire stack from VM logs",target:'[class*="stack-header-actions"]',placement:"left"},{title:"Execute Your Code",content:`I'll automatically execute the code for you to demonstrate the trace functionality.

Click Execute manually or press Ctrl+Enter to run your assembly code.`,target:'[role="toolbar"] button:first-child',placement:"bottom",autoAction:{type:"click",selector:'[role="toolbar"] button:first-child',delay:400}},{title:"Execution Status",content:`The status badge shows if the execution succeeded or failed.

• Green badge - Successful execution (exit code 0)
• Red badge - Failed execution (non-zero exit code)

Exit codes help identify what went wrong in the code.`,target:'[role="status"]',placement:"bottom"},{title:"Great! Code Executed",content:`Perfect! The code execution completed successfully.

On the right panel, you can now view the initial stack state before the first instruction execution.`,target:'[class*="mainContent"] > div:last-child',placement:"left"},{title:"Navigate Through Steps",content:`Use the navigation buttons to step through your code execution.

I'll automatically click the 'Next' button to show you how the stack changes.

Watch the stack section below!`,target:'[class*="navigation-controls"]',placement:"left",autoAction:{type:"click",selector:'[data-testid="next-step-button"]',delay:400}},{title:"Gas Usage Tracking",content:`Notice how the gas counter increased!

Each TVM instruction consumes gas (computational cost).

This helps you optimize your smart contracts for efficiency.`,target:'[data-testid="cumulative-gas-counter"]',placement:"left"},{title:"Stack Visualization",content:`Look at the stack section below - see how values changed!

TVM is a stack-based virtual machine. Instructions push/pop values to/from the stack.

Try clicking Next/Prev buttons to see the stack evolve.`,target:'[class*="stack-viewer"]',placement:"left"},{title:"Share Your Code",content:`Use the share button to generate links to your code.

Perfect for collaboration, asking for help, or showcasing your smart contracts!`,target:'[role="toolbar"] button:nth-child(2)',placement:"bottom"},{title:"Ready to Code!",content:`You're all set! You now know how to:

• Write assembly code
• Execute and debug step by step
• Monitor gas usage and stack changes
• Set up initial test conditions

Try modifying the code or writing your own code.

Happy debugging! 🚀`,target:'[role="toolbar"]',placement:"bottom"}],Ae=T.lazy(()=>ne(()=>import("./index-DtpNl2i4.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11]),import.meta.url)),je=`PUSHINT_8 42
PUSHINT_8 100
ADD
PUSHINT_16 200
SUB

NOP
`,_="txtracer-playground-assembly-code",f="txtracer-playground-initial-stack";function Ne(){const[r,l]=s.useState(()=>{const e=me();return e!==null?(pe(),e):localStorage.getItem(_)??je}),[n,p]=s.useState(void 0),[u,b]=s.useState(!1),[d,w]=s.useState(()=>{try{const e=localStorage.getItem(f);return e?JSON.parse(e,(o,a)=>{if(o==="value"&&typeof a=="string"&&a.match(/^-?\d+$/))try{return BigInt(a)}catch{return a}return a}):[]}catch(e){return localStorage.removeItem(f),console.warn("Failed to restore initial stack from localStorage:",e),[]}}),{setError:C,clearError:h}=Q(),x=he({tutorialKey:"playground-page",autoStart:!0}),c=n?.traceInfo,{selectedStep:m,currentStep:A,currentStack:j,totalSteps:N,canGoPrev:P,canGoNext:I,handlePrev:L,handleNext:M,goToFirstStep:R,goToLastStep:B,findStepByLine:O,highlightLine:G,transitionType:V}=se(c),D=re(c),F=s.useMemo(()=>c?c.steps.map(e=>({name:e.instructionName,gasCost:k(e)})):[],[c]),U=s.useMemo(()=>{if(!c)return 0;let e=0;for(let o=0;o<m;o++){const a=c.steps[o];a&&(e+=k(a))}return e},[c,m]),g=s.useCallback(async()=>{if(r.trim()){b(!0),h();try{const e=await ce(r,d);p(e),console.log(e.vmLogs)}catch(e){const o=e instanceof Error?e.message:"Unknown error";C(`Failed to execute assembly code: ${o}`),p(void 0)}finally{b(!1)}}},[r,h,d,C]);s.useEffect(()=>{const e=o=>{(o.ctrlKey||o.metaKey)&&o.key==="Enter"&&(o.preventDefault(),u||g())};return document.addEventListener("keydown",e),()=>{document.removeEventListener("keydown",e)}},[g,u]),s.useEffect(()=>{localStorage.setItem(_,r)},[r]),s.useEffect(()=>{try{localStorage.setItem(f,JSON.stringify(d,(e,o)=>typeof o=="bigint"?o.toString():o))}catch(e){console.warn("Failed to save initial stack to localStorage:",e)}},[d]);const H=s.useCallback(e=>{l(e),p(void 0),h()},[h]),W=s.useCallback(e=>{w(e),p(void 0)},[]),S=(()=>{const e=n?.traceInfo?.steps;if(!e)return{line:void 0,approx:!1};const o=e[m];if(!o||o.loc!==void 0)return{line:void 0,approx:!1};let a=m-1,E=1;for(;a>=0&&e[a]?.loc===void 0;)E++,a--;const v=a>=0?e[a]:void 0,Y=v?.loc?.line!==void 0?v.loc.line+1:void 0,$=E>1;return{line:Y,approx:$}})(),y=s.useMemo(()=>{if(n)return n.exitCode&&n.exitCode.num!==0?"failed":"success"},[n]),z=y!==void 0,K=`Exit code: ${n?.exitCode?.num??0}`;return t.jsxs("div",{className:i.traceViewWrapper,children:[t.jsxs(ue,{pageTitle:"playground",children:[z&&t.jsx("div",{className:i.txStatusContainer,role:"status","aria-live":"polite",children:y&&t.jsx(le,{type:y,text:K,exitCode:n?.exitCode?.num})}),t.jsx("div",{className:i.headerContent,children:t.jsxs("div",{className:i.mainActionContainer,role:"toolbar","aria-label":"Assembly code actions",children:[t.jsx(Te,{onClick:()=>void g(),loading:u}),t.jsx(xe,{value:r})]})})]}),t.jsxs("div",{id:"execution-status",className:"sr-only","aria-live":"polite","aria-atomic":"true",children:[u&&"Executing assembly code...",n&&!u&&"Assembly code executed successfully",n?.exitCode&&n.exitCode.num!==0&&!u&&`Execution completed with exit code ${n.exitCode.num}`]}),t.jsx("div",{className:"sr-only",children:"Press Ctrl+Enter or Cmd+Enter to execute the assembly code"}),t.jsx("main",{className:i.appContainer,role:"main","aria-label":"Assembly code playground",children:t.jsxs("div",{className:i.mainContent,children:[t.jsxs("div",{className:i.editorContainer,children:[t.jsx("h2",{id:"code-editor-heading",className:"sr-only",children:"Assembly Code Editor"}),t.jsx(s.Suspense,{fallback:t.jsx(ae,{message:"Loading Editor...",loading:!0}),children:t.jsx(Ae,{code:r,onChange:H,readOnly:!1,highlightLine:G,lineExecutionData:D,implicitRetLine:S.line,implicitRetLabel:S.approx?"↵ implicit RET (approximate position)":void 0,shouldCenter:V==="button",exitCode:n?.exitCode,onLineClick:O,language:"tasm"})})]}),t.jsx(ie,{selectedStep:m,totalSteps:N,currentStep:A,currentStack:j,canGoPrev:P,canGoNext:I,onPrev:L,onNext:M,onFirst:R,onLast:B,placeholderMessage:"Ready to execute",instructionDetails:F,cumulativeGas:U,showGas:!0,showStackSetup:!0,initialStack:d,onInitialStackChange:W,hasExecutionResults:!!n,className:i.sidebarArea})]})}),t.jsx(ge,{steps:we,isOpen:x.isOpen,onClose:x.closeTutorial,onComplete:x.completeTutorial})]})}X.createRoot(document.getElementById("root")).render(t.jsx(T.StrictMode,{children:t.jsx(Z,{children:t.jsx(ee,{children:t.jsx(te,{children:t.jsx(oe,{loadingMessage:"Loading Playground...",children:t.jsx(Ne,{})})})})})}));
