import {expect} from "@playwright/test"

import {test} from "./fixtures/fixtures"
import {generateRandomAsmCode} from "./utils"

test.describe("TxTracer Playground", () => {
  test("should open from main page", async ({page, playgroundPage}) => {
    await playgroundPage.goto()
    const playgroundCard = page.getByText("Assembly Playground")

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

    const tutorial = await playgroundPage.getTutorialText()
    await expect(tutorial).not.toBeVisible()

    const hasTutorialFlag = await playgroundPage.isTutorialCompletedInStorage()
    expect(hasTutorialFlag).toBe(true)

    await page.reload()
    const tutorialAfterReload = await playgroundPage.getTutorialText()
    await expect(tutorialAfterReload).not.toBeVisible()
  })

  test("should skip tutorial via Escape key", async ({page, playgroundPage}) => {
    await playgroundPage.goto()

    const tutorial = await playgroundPage.getTutorialText()
    await expect(tutorial).toBeVisible()

    await page.keyboard.press("Escape")
    const tutorialAfterEscape = await playgroundPage.getTutorialText()
    await expect(tutorialAfterEscape).not.toBeVisible()

    const hasTutorialFlag = await playgroundPage.isTutorialCompletedInStorage()
    expect(hasTutorialFlag).toBe(true)

    await page.reload()
    const tutorialAfterReload = await playgroundPage.getTutorialText()
    await expect(tutorialAfterReload).not.toBeVisible()
  })

  test("should 'Execute' code via Ctrl+Enter", async ({page, playgroundPage}) => {
    await playgroundPage.skipTutorial()
    await playgroundPage.goto()
    const stepCounterText = await playgroundPage.getStepCounterText()
    expect(stepCounterText).toBe("Ready to execute")

    await page.keyboard.press("Control+Enter")

    const exitCodeBadge = page.getByText("Exit code: 0")
    await expect(exitCodeBadge).toBeVisible()
  })

  test("should 'Execute' code via button", async ({page, playgroundPage}) => {
    await playgroundPage.skipTutorial()
    await playgroundPage.goto()
    const stepCounterText = await playgroundPage.getStepCounterText()
    expect(stepCounterText).toBe("Ready to execute")

    const executeButton = page.getByRole("button", {name: "Execute"})
    await executeButton.click()

    const exitCodeBadge = page.getByText("Exit code: 0")
    await expect(exitCodeBadge).toBeVisible()
  })

  test("should write some code, share it and open shared link", async ({page, playgroundPage}) => {
    await playgroundPage.skipTutorial()
    await playgroundPage.goto()
    const randomAsmCode = generateRandomAsmCode()
    await playgroundPage.clearEditor()

    await playgroundPage.typeInEditor(randomAsmCode)
    const codeBefore = await playgroundPage.getEditorText()
    await page.getByRole("button", {name: "Share"}).click()
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
    await page.goto(sharedUrl)
    await page.waitForTimeout(250)
    const codeAfter = await playgroundPage.getEditorText()

    expect(codeAfter.trim()).toBe(codeBefore.trim())
  })

  test("should show error on invalid ASM code", async ({page, playgroundPage}) => {
    const INSTRUCTION = "INVALID"
    await playgroundPage.skipTutorial()
    await playgroundPage.goto()

    await playgroundPage.clearEditor()
    await playgroundPage.typeInEditor(INSTRUCTION)
    const executeButton = page.getByRole("button", {name: "Execute"})
    await executeButton.click()

    const errorEl = page.getByTestId("error-banner-info")
    const errorText = await errorEl.textContent()
    expect(errorText).toContain(
      `Failed to execute assembly code: playground.tasm:1: Unexpected instruction: ${INSTRUCTION}×`,
    )
  })
})
