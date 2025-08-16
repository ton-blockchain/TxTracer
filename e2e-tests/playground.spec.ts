import {expect} from "@playwright/test"

import {test} from "./fixtures/fixtures"
import {generateRandomAsmCode} from "./utils"

test.describe("TxTracer Playground", () => {
  test("should open from main page", async ({page}) => {
    await page.goto("/")
    const playgroundCard = page.getByText("Playground")

    await playgroundCard.click()
    expect(page.url()).toContain("/play/")
  })

  test("should skip skip tutorial via arrow keys", async ({page, playgroundPage}) => {
    await playgroundPage.goto()
    const totalSteps = await playgroundPage.getTutorialTotalSteps()

    for (let i = 0; i < totalSteps; i++) {
      await page.keyboard.press("ArrowRight")
      await page.waitForTimeout(200)
    }

    const tutorial = playgroundPage.getTutorialText()
    await expect(tutorial).not.toBeVisible()

    const hasTutorialFlag = await playgroundPage.isTutorialCompletedInStorage()
    expect(hasTutorialFlag).toBe(true)

    await page.reload()
    const tutorialAfterReload = playgroundPage.getTutorialText()
    await expect(tutorialAfterReload).not.toBeVisible()
  })

  test("should skip tutorial via Escape key", async ({page, playgroundPage}) => {
    await playgroundPage.goto()

    const tutorial = playgroundPage.getTutorialText()
    await expect(tutorial).toBeVisible()

    await page.keyboard.press("Escape")
    const tutorialAfterEscape = playgroundPage.getTutorialText()
    await expect(tutorialAfterEscape).not.toBeVisible()

    const hasTutorialFlag = await playgroundPage.isTutorialCompletedInStorage()
    expect(hasTutorialFlag).toBe(true)

    await page.reload()
    const tutorialAfterReload = playgroundPage.getTutorialText()
    await expect(tutorialAfterReload).not.toBeVisible()
  })

  test("should 'Execute' code via Ctrl+Enter", async ({page, playgroundPage}) => {
    await playgroundPage.goto(true)
    const stepCounterText = await playgroundPage.getStepCounterText()
    expect(stepCounterText).toBe("Ready to execute")

    await page.keyboard.press("Control+Enter")

    const exitCodeBadgeText = await playgroundPage.getExitCodeBadgeText()
    expect(exitCodeBadgeText).toBe("Exit code: 0")
  })

  test("should 'Execute' code via button", async ({playgroundPage}) => {
    await playgroundPage.goto(true)
    const stepCounterText = await playgroundPage.getStepCounterText()
    expect(stepCounterText).toBe("Ready to execute")

    await playgroundPage.execute()

    const exitCodeBadgeText = await playgroundPage.getExitCodeBadgeText()
    expect(exitCodeBadgeText).toBe("Exit code: 0")
  })

  test("should write some code, share it and open shared link", async ({page, playgroundPage}) => {
    await playgroundPage.goto(true)
    const randomAsmCode = generateRandomAsmCode()
    await playgroundPage.clearEditor()

    await playgroundPage.typeInEditor(randomAsmCode)
    const codeBefore = await playgroundPage.getEditorText()
    await playgroundPage.share()
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
    await page.goto(sharedUrl)
    await page.waitForTimeout(250)
    const codeAfter = await playgroundPage.getEditorText()

    expect(codeAfter.trim()).toBe(codeBefore.trim())
  })

  test("should show error on invalid ASM code", async ({page, playgroundPage}) => {
    const INSTRUCTION = "INVALID"
    await playgroundPage.goto(true)

    await playgroundPage.clearEditor()
    await playgroundPage.typeInEditor(INSTRUCTION)
    await playgroundPage.execute()

    const errorEl = page.getByTestId("error-banner-info")
    const errorText = await errorEl.textContent()
    expect(errorText).toContain(
      `Failed to execute assembly code: playground.tasm:1: Unexpected instruction: ${INSTRUCTION}×`,
    )
  })

  test("should hover instruction before execution and get tooltip", async ({
    page,
    playgroundPage,
  }) => {
    const INSTRUCTION = "ADD"
    await playgroundPage.goto(true)

    await playgroundPage.clearEditor()
    await playgroundPage.typeInEditor(INSTRUCTION)
    const instruction = page.getByText(INSTRUCTION)
    await instruction.hover()

    await expect(playgroundPage.getTooltip()).toBeVisible()
    const text = await playgroundPage.getTooltip().allInnerTexts()
    expect(text).toHaveLength(1)
    expect(text[0]).toContain(INSTRUCTION)
    expect(text[0]).toContain("Not executed")
  })

  test("should hover instruction after execution and get tooltip", async ({
    page,
    playgroundPage,
  }) => {
    await playgroundPage.goto(true)

    // Execute the code first
    await playgroundPage.execute()
    await playgroundPage.waitForExitCodeBadge()

    // Now hover over the instruction
    const instruction = page.getByText("PUSHINT_8 42")
    await instruction.hover()

    await expect(playgroundPage.getTooltip()).toBeVisible()
    const text = await playgroundPage.getTooltip().allInnerTexts()
    expect(text).toHaveLength(1)
    expect(text[0]).toContain("PUSHINT_8")
    expect(text[0]).toContain("Executions: 1")
  })
})
