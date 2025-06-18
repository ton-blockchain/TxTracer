import type {Locator, Page} from "@playwright/test"

export class PlaygroundPage {
  private stepCounter: Locator
  private editor: Locator

  constructor(public readonly page: Page) {
    this.stepCounter = this.page.getByTestId("step-counter-info")
    this.editor = this.page.locator(".view-lines")
  }

  async goto() {
    await this.page.goto("/play/")
  }

  /**
   * This provides an ability to skip tutorial
   */
  async skipTutorial() {
    await this.page.addInitScript(() => {
      localStorage.setItem("tutorial-completed-playground-page", "true")
    })
  }

  async focusEditor() {
    await this.editor.click()
  }

  async clearEditor() {
    await this.editor.click()
    await this.page.keyboard.press(`Control+A`)
    await new Promise(resolve => setTimeout(resolve, 250))
    await this.page.keyboard.press("Delete")
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  async typeInEditor(code: string) {
    await this.editor.click()
    await this.page.keyboard.type(code)
    await this.page.keyboard.press("Escape") // Dismiss any suggestion popups
  }

  async getEditorText() {
    const lines = await this.editor.allInnerTexts()
    return lines.join("\n")
  }

  async getStepCounterText() {
    return await this.stepCounter.textContent()
  }

  getTutorialPopup() {
    return this.page
      .getByRole("heading", {name: "Welcome to Assembly Playground"})
      .locator("..")
      .locator("..")
  }

  getTutorialText() {
    return this.page.getByText("Welcome to Assembly Playground")
  }

  async getTutorialTotalSteps() {
    const popup = this.getTutorialPopup()
    const stepText = await popup.locator("text=of").innerText()
    return parseInt(stepText.match(/of (\d+)/)?.[1] || "0", 10)
  }

  async isTutorialCompletedInStorage() {
    return await this.page.evaluate(() => {
      return localStorage.getItem("tutorial-completed-playground-page") !== null
    })
  }
}
