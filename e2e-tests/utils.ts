import {type Page} from "@playwright/test"

export const getStepInfo = (text: string | null): {current: number; total: number} | null => {
  if (!text) return null
  const match = text.match(/Step (\d+) of (\d+)/)
  if (match) {
    return {current: parseInt(match[1], 10), total: parseInt(match[2], 10)}
  }
  return null
}

export const getGasInfo = (text: string | null): number | null => {
  if (!text) return null
  const match = text.match(/Used gas: (\d+)/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

export async function getStepCounterText(page: Page) {
  return await page.getByTestId("step-counter-info").textContent()
}

/**
 * Skip all available tutorials
 * @param page
 */
export const skipTutorialsOnLoad = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem("tutorial-completed-playground-page", "true")
    localStorage.setItem("tutorial-completed-godbolt-page", "true")
  })
}

export const focusEditor = async (page: Page) => {
  const editor = page.locator(".view-lines")
  await editor.click()
}

/**
 * Clear editor from all text content
 * @param page
 */
export const clearEditor = async (page: Page) => {
  const editor = page.locator(".view-lines")
  await editor.click()
  const modifier = process.platform === "darwin" ? "Meta" : "Control"
  await page.keyboard.press(`${modifier}+A`)
  await page.keyboard.press("Delete")
}

/**
 * Write code in editor
 * @param page
 * @param code
 */
export const typeInEditor = async (page: Page, code: string) => {
  const editor = page.locator(".view-lines")
  await editor.click()
  await page.keyboard.type(code)
  await page.keyboard.press("Escape") // Dismiss any suggestion popups
}

export const getEditorText = async (page: Page) => {
  const editor = page.locator(".view-lines")
  const lines = await editor.allInnerTexts()
  return lines.join("\n")
}

export const pressCommandOnEditor = async (page: Page) => {
  const modifier = process.platform === "darwin" ? "Meta" : "Control"
  await page.keyboard.down(modifier)
}

export const getAvailableToClickLines = async (page: Page) => {
  return await page.$$eval(".clickable-line-decoration", decorations => {
    return decorations
      .map(dec => {
        const lineNumberEl = dec.parentElement?.querySelector(".line-numbers")
        return lineNumberEl?.textContent?.trim()
      })
      .filter((n): n is string => !!n)
  })
}

export const clickLine = async (page: Page, line: number) => {
  const el = page.locator(`(//div[contains(@class, "view-lines")])[1]/*[${line}]`)
  return await el.click()
}

export const getLineContent = async (page: Page, line: number) => {
  const el = page.locator(`(//div[contains(@class, "view-lines")])[1]/*[${line}]`)
  return await el.textContent()
}

export const generateRandomAsmCode = () => {
  const instructions = ["SETCP 0", "SWAP", "DROP", "NOP", "CTOS", "POP s3"]
  const lines: string[] = []
  const count = Math.floor(Math.random() * 4) + 2 // generate 2–5 lines
  for (let i = 0; i < count; i++) {
    const line = instructions[Math.floor(Math.random() * instructions.length)]
    lines.push(line)
  }
  return lines.join("\n")
}

export const wait = async (delay: number) => {
  return new Promise(resolve => setTimeout(resolve, delay))
}
