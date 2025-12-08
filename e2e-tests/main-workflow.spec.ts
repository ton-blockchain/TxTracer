import {test, expect, type Page} from "@playwright/test"

import {getGasInfo, getStepInfo} from "./utils"

const VALID_TEST_HASH_PLACEHOLDER =
  "5c7d6c306ca8a6ada7716d02f63e18a5b6f91ab9851caef0d22bd26e97eff7e8"

async function startTracing(page: Page) {
  const searchInput = page.getByPlaceholder("Search by transaction hash or explorer link")
  await expect(searchInput).toBeVisible()
  await searchInput.fill(VALID_TEST_HASH_PLACEHOLDER)
  await expect(searchInput).toHaveValue(VALID_TEST_HASH_PLACEHOLDER)

  const traceButton = page.getByRole("button", {name: "Trace"})
  await expect(traceButton).toBeVisible()
  await expect(traceButton).toBeEnabled()
  await traceButton.click()
}

test.describe("TxTracer Main Workflow", () => {
  test("should display the application title", async ({page}: {page: Page}) => {
    await page.goto("/")

    const titleElement = page.getByTestId("app-title")
    await expect(titleElement).toBeVisible()
    await expect(titleElement).toHaveText("TxTracerThe Open Network")
  })

  test("should have an input field for transaction hash", async ({page}: {page: Page}) => {
    await page.goto("/")

    const searchInput = page.getByPlaceholder("Search by transaction hash or explorer link")
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeEnabled()
  })

  test("should automatically add a hash from URL parameter to input", async ({
    page,
  }: {
    page: Page
  }) => {
    await page.goto(`/?tx=${VALID_TEST_HASH_PLACEHOLDER}`)

    const searchInput = page.getByPlaceholder("Search by transaction hash or explorer link")
    await expect(searchInput).toHaveValue(VALID_TEST_HASH_PLACEHOLDER)
  })
})

test.describe("TxTracer Stepping Logic", () => {
  test("should correctly update navigation buttons, step and gas counters", async ({
    page,
  }: {
    page: Page
  }) => {
    await page.goto("/")
    await startTracing(page)

    const stepCounter = page.getByTestId("step-counter-info")
    const gasCounter = page.getByTestId("cumulative-gas-counter")
    const firstButton = page.getByTestId("go-to-first-step-button")
    const prevButton = page.getByTestId("prev-step-button")
    const nextButton = page.getByTestId("next-step-button")
    const lastButton = page.getByTestId("go-to-last-step-button")

    await expect(stepCounter).toBeVisible({timeout: 30000})
    await expect(gasCounter).toBeVisible({timeout: 1000})

    let stepInfo = getStepInfo(await stepCounter.textContent())
    expect(stepInfo).not.toBeNull()
    if (!stepInfo) throw new Error("Initial step info not found")

    const initialGas = getGasInfo(await gasCounter.textContent())
    expect(initialGas).not.toBeNull()

    expect(stepInfo.current).toBe(1)
    await expect(firstButton).toBeDisabled()
    await expect(prevButton).toBeDisabled()
    if (stepInfo.total === 1) {
      await expect(nextButton).toBeDisabled()
      await expect(lastButton).toBeDisabled()
    } else {
      await expect(nextButton).toBeEnabled()
      await expect(lastButton).toBeEnabled()
    }

    if (stepInfo.total > 1) {
      for (let i = 1; i < stepInfo.total; i++) {
        const currentGasBeforeClick = getGasInfo(await gasCounter.textContent())
        await nextButton.click()
        const currentLoopStepInfo = getStepInfo(await stepCounter.textContent())
        expect(currentLoopStepInfo?.current).toBe(i + 1)
        const currentGasAfterClick = getGasInfo(await gasCounter.textContent())
        expect(currentGasAfterClick).not.toBeNull()

        if (currentGasBeforeClick !== null && currentGasAfterClick !== null) {
          expect(currentGasAfterClick).toBeGreaterThanOrEqual(currentGasBeforeClick)
        }

        await expect(firstButton).toBeEnabled()
        await expect(prevButton).toBeEnabled()
        if (currentLoopStepInfo?.current === stepInfo.total) {
          await expect(nextButton).toBeDisabled()
          await expect(lastButton).toBeDisabled()
        } else {
          await expect(nextButton).toBeEnabled()
          await expect(lastButton).toBeEnabled()
        }
      }
      stepInfo = getStepInfo(await stepCounter.textContent())
      expect(stepInfo?.current).toBe(stepInfo?.total)
      await expect(nextButton).toBeDisabled()
      await expect(lastButton).toBeDisabled()
    }

    if (stepInfo.total > 1) {
      for (let i = stepInfo.total; i > 1; i--) {
        const currentGasBeforeClick = getGasInfo(await gasCounter.textContent())
        await prevButton.click()
        const currentLoopStepInfo = getStepInfo(await stepCounter.textContent())
        expect(currentLoopStepInfo?.current).toBe(i - 1)
        const currentGasAfterClick = getGasInfo(await gasCounter.textContent())
        expect(currentGasAfterClick).not.toBeNull()

        if (currentGasBeforeClick !== null && currentGasAfterClick !== null) {
          expect(currentGasAfterClick).toBeLessThanOrEqual(currentGasBeforeClick)
        }

        await expect(nextButton).toBeEnabled()
        await expect(lastButton).toBeEnabled()
        if (currentLoopStepInfo?.current === 1) {
          await expect(firstButton).toBeDisabled()
          await expect(prevButton).toBeDisabled()
        } else {
          await expect(firstButton).toBeEnabled()
          await expect(prevButton).toBeEnabled()
        }
      }
      stepInfo = getStepInfo(await stepCounter.textContent()) // update stepInfo
      expect(stepInfo?.current).toBe(1)
      await expect(firstButton).toBeDisabled()
      await expect(prevButton).toBeDisabled()
    }

    if (stepInfo.total > 1) {
      await lastButton.click()
      stepInfo = getStepInfo(await stepCounter.textContent())
      expect(stepInfo?.current).toBe(stepInfo?.total)
      const gasAtLast = getGasInfo(await gasCounter.textContent())
      expect(gasAtLast).not.toBeNull()
      await expect(firstButton).toBeEnabled()
      await expect(prevButton).toBeEnabled()
      await expect(nextButton).toBeDisabled()
      await expect(lastButton).toBeDisabled()

      await firstButton.click()
      stepInfo = getStepInfo(await stepCounter.textContent())
      expect(stepInfo?.current).toBe(1)
      const gasAtFirst = getGasInfo(await gasCounter.textContent())
      expect(gasAtFirst).not.toBeNull()

      if (gasAtLast !== null && gasAtFirst !== null) {
        expect(gasAtFirst).toBeLessThanOrEqual(gasAtLast)
      }
      await expect(firstButton).toBeDisabled()
      await expect(prevButton).toBeDisabled()
      await expect(nextButton).toBeEnabled()
      await expect(lastButton).toBeEnabled()
    }
  })
})

test.describe("TxTracer Code Editor Interaction", () => {
  const UNIQUE_TEXT_ON_TARGET_LINE = "THROWIF_SHORT 36"
  const EXPECTED_STEP_NUMBER_AFTER_CTRL_CLICK = 13

  test("should navigate to the correct trace step on Ctrl+Click in Code Editor", async ({
    page,
  }: {
    page: Page
  }) => {
    await page.goto(`/`)

    await startTracing(page)

    const codeEditorContainer = page.getByTestId("code-editor-container")
    const codeEditorViewLines = codeEditorContainer.locator(".view-lines")
    await expect(codeEditorViewLines).toBeVisible({timeout: 30000})
    const stepCounter = page.getByTestId("step-counter-info")
    await expect(stepCounter).toBeVisible()

    const targetLineLocator = codeEditorViewLines.locator(".view-line", {
      hasText: UNIQUE_TEXT_ON_TARGET_LINE,
    })
    await expect(targetLineLocator).toBeVisible({timeout: 10000})
    await expect(targetLineLocator).toHaveCount(1)

    await targetLineLocator.click({modifiers: ["Control"]})

    const expectedStepTextPattern = new RegExp(`Step ${EXPECTED_STEP_NUMBER_AFTER_CTRL_CLICK} of`)
    await expect(stepCounter).toHaveText(expectedStepTextPattern, {timeout: 5000})
  })
})

test.describe("TxTracer Transaction Details Interaction", () => {
  test("should expand and collapse transaction details section", async ({page}: {page: Page}) => {
    await page.goto("/")
    await startTracing(page)

    const stepCounter = page.getByTestId("step-counter-info")
    await expect(stepCounter).toBeVisible({timeout: 30000})

    const detailsHeader = page.getByTestId("details-header")
    const detailsContent = page.getByTestId("details-content")

    await expect(detailsContent).not.toBeVisible()

    await expect(detailsHeader).toBeVisible()
    await detailsHeader.click()
    await expect(detailsContent).toBeVisible({timeout: 2000})

    const exampleDetailElement = detailsContent.getByText("Account", {exact: true})
    await expect(exampleDetailElement).toBeVisible()

    await detailsHeader.click()
    await expect(detailsContent).not.toBeVisible({timeout: 2000})
  })
})
