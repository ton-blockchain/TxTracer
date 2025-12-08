import {expect} from "@playwright/test"

import {test} from "./fixtures/fixtures"
import {generateRandomFuncCode} from "./utils"

test.describe("TxTracer Code Explorer", () => {
  test("should open from main page", async ({page}) => {
    await page.goto("/")
    const codeExplorerCard = page.getByText("Code Explorer")

    await codeExplorerCard.click()
    expect(page.url()).toContain("/code-explorer/")
  })

  test("should skip tutorial via arrow keys", async ({page, codeExplorerPage}) => {
    await codeExplorerPage.goto()
    const totalSteps = await codeExplorerPage.getTutorialTotalSteps()

    for (let i = 0; i < totalSteps; i++) {
      await page.keyboard.press("ArrowRight")
      await page.waitForTimeout(200)
    }

    const tutorial = codeExplorerPage.getTutorialText()
    await expect(tutorial).not.toBeVisible()

    await page.reload()
    const tutorialAfterReload = codeExplorerPage.getTutorialText()
    await expect(tutorialAfterReload).not.toBeVisible()
  })

  test("should skip tutorial via Escape key", async ({page, codeExplorerPage}) => {
    await codeExplorerPage.goto()

    const tutorial = codeExplorerPage.getTutorialText()
    await expect(tutorial).toBeVisible()

    await page.keyboard.press("Escape")
    const tutorialAfterEscape = codeExplorerPage.getTutorialText()
    await expect(tutorialAfterEscape).not.toBeVisible()

    await page.reload()
    const tutorialAfterReload = codeExplorerPage.getTutorialText()
    await expect(tutorialAfterReload).not.toBeVisible()
  })

  test("should 'Compile' code via Ctrl+Enter", async ({page, codeExplorerPage}) => {
    await codeExplorerPage.goto(true)

    await page.keyboard.press("Control+Enter")
    await codeExplorerPage.waitCompile()

    const asmCode = await codeExplorerPage.getAsmEditorText()
    expect(asmCode.trim()).not.toBe("")
    expect(asmCode).not.toContain("Compile to see assembly here")
  })

  test("should 'Compile' code via button", async ({codeExplorerPage}) => {
    await codeExplorerPage.goto(true)

    await codeExplorerPage.compile()
    await codeExplorerPage.waitCompile()

    const asmCode = await codeExplorerPage.getAsmEditorText()
    expect(asmCode.trim()).not.toBe("")
    expect(asmCode).not.toContain("Compile to see assembly here")
  })

  test("should write some FunC code, share it and open shared link", async ({
    page,
    codeExplorerPage,
  }) => {
    await codeExplorerPage.goto(true)

    const randomFuncCode = generateRandomFuncCode()
    await codeExplorerPage.clearFuncEditor()
    await codeExplorerPage.typeInFuncEditor(randomFuncCode)

    const codeBefore = await codeExplorerPage.getFuncEditorText()
    await codeExplorerPage.share()

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
    await page.goto(sharedUrl)
    await page.waitForTimeout(250)

    const codeAfter = await codeExplorerPage.getFuncEditorText()
    expect(codeAfter.trim()).toBe(codeBefore.trim())
  })

  test("should have two editors side by side", async ({page, codeExplorerPage}) => {
    await codeExplorerPage.goto(true)

    const editors = page.locator(".monaco-editor")
    await expect(editors).toHaveCount(2)

    const funcCode = await codeExplorerPage.getFuncEditorText()
    expect(funcCode).toContain("recv_internal")

    const asmCode = await codeExplorerPage.getAsmEditorText()
    expect(asmCode).not.toContain("// Compile to see assembly here")
    expect(asmCode).not.toHaveLength(0)
  })

  test("should open settings menu", async ({codeExplorerPage}) => {
    await codeExplorerPage.goto(true)

    await codeExplorerPage.openSettings()
    await codeExplorerPage.checkSettingsMenuVisibility()
  })

  test("should check right editor only read-only", async ({page, codeExplorerPage}) => {
    await codeExplorerPage.goto(true)
    await codeExplorerPage.getAsmEditor().click()
    await page.keyboard.type("random_text")
    await expect(codeExplorerPage.getMonacoAlert()).toBeVisible()
  })

  test("should check 'Show instruction docs' setting visibility", async ({
    page,
    codeExplorerPage,
  }) => {
    await codeExplorerPage.goto(true)

    const asmCodeLineEl = page.getByText("SETCP 0")
    await asmCodeLineEl.hover()
    const tooltip = codeExplorerPage.getTooltip()
    await page.waitForTimeout(500)
    await expect(tooltip).not.toBeVisible()

    await codeExplorerPage.openSettings()
    await codeExplorerPage.checkSettingsMenuVisibility()
    const showVariablesCheckbox = page.getByText("Show instruction docs")
    await expect(showVariablesCheckbox).not.toBeChecked()
    await showVariablesCheckbox.click()
    await expect(showVariablesCheckbox).toBeChecked()
    await codeExplorerPage.closeSettings()

    await asmCodeLineEl.hover()
    await page.waitForTimeout(500)
    await expect(tooltip).toBeVisible()

    const text = await codeExplorerPage.getTooltip().allInnerTexts()
    expect(text).toHaveLength(1)
    expect(text[0]).toContain("SETCP")
    expect(text[0]).toContain("Stack (top is on the right): ∅ → ∅")
    expect(text[0]).toContain("Gas: 26")
    expect(text[0]).toContain("Opcode: FF00")
    expect(text[0]).toContain(
      "Selects TVM codepage 0 <= num < 240. If the codepage is not supported, throws an invalid opcode exception.",
    )
  })

  test("should check 'Show variables on hover' setting visibility", async ({
    page,
    codeExplorerPage,
  }) => {
    await codeExplorerPage.goto(true)

    const asmCodeLineEl = page.getByText("POP s2")
    await asmCodeLineEl.hover()
    const tooltip = codeExplorerPage.getTooltip()
    await page.waitForTimeout(500)
    await expect(tooltip).not.toBeVisible()

    await codeExplorerPage.openSettings()
    await codeExplorerPage.checkSettingsMenuVisibility()
    const showVariablesCheckbox = page.getByText("Show variables on hover")
    await expect(showVariablesCheckbox).not.toBeChecked()
    await showVariablesCheckbox.click()
    await expect(showVariablesCheckbox).toBeChecked()
    await codeExplorerPage.closeSettings()

    await asmCodeLineEl.hover()
    await page.waitForTimeout(500)
    await expect(tooltip).toBeVisible()

    const text = await codeExplorerPage.getTooltip().allInnerTexts()
    expect(text).toHaveLength(1)
    expect(text[0]).toContain("Live variables:")
    expect(text[0]).toContain("Parameter in_msg: slice")
    expect(text[0]).toContain("Parameter in_msg_cell: cell")
    expect(text[0]).toContain("Parameter msg_value: int")
  })

  test("should check 'Auto-compile on change' setting", async ({codeExplorerPage}) => {
    await codeExplorerPage.goto(true)

    const beforeAsmText = codeExplorerPage.getAsmEditorText()
    await codeExplorerPage.clearFuncEditor()
    await codeExplorerPage.typeInFuncEditor(
      `#include "stdlib.fc";\n\n() recv_internal() {\n    throw(1);\n}`,
    )
    await codeExplorerPage.waitCompile()
    const afterAsmText = codeExplorerPage.getAsmEditorText()
    expect(beforeAsmText).not.toBe(afterAsmText)
  })

  test("should disable 'Auto-compile on change' and verify right code block unchanged", async ({
    codeExplorerPage,
  }) => {
    await codeExplorerPage.goto(true)

    await codeExplorerPage.openSettings()
    await codeExplorerPage.checkSettingsMenuVisibility()
    const autoCompileCheckbox = codeExplorerPage.page.getByText("Auto-compile on change")
    await autoCompileCheckbox.click()
    await expect(autoCompileCheckbox).not.toBeChecked()

    await codeExplorerPage.closeSettings()

    const beforeAsmText = await codeExplorerPage.getAsmEditorText()

    await codeExplorerPage.clearFuncEditor()
    await codeExplorerPage.typeInFuncEditor(
      `#include "stdlib.fc";\n\n() recv_internal() {\n    throw(2);\n}`,
    )
    await codeExplorerPage.page.waitForTimeout(250)
    const afterAsmText = await codeExplorerPage.getAsmEditorText()

    expect(beforeAsmText).not.toBe(afterAsmText)
    expect(afterAsmText).toBe("// Compile to see assembly here")
  })
})
