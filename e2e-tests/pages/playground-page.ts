import type {Locator, Page} from "@playwright/test"

export class PlaygroundPage {
  private stepCounter: Locator
  private editor: Locator
  private tooltip: Locator
  private executeButton: Locator
  private shareButton: Locator
  private exitCodeBadge: Locator

  constructor(public readonly page: Page) {
    this.stepCounter = this.page.getByTestId("step-counter-info")
    this.editor = this.page.locator(".view-lines")
    this.tooltip = this.page.locator(".monaco-hover-content").last()
    this.executeButton = this.page.getByRole("button", {name: "Execute"})
    this.shareButton = this.page.getByRole("button", {name: "Share"})
    this.exitCodeBadge = this.page.getByTestId("status-badge")
  }

  async execute() {
    await this.executeButton.click()
  }

  async share() {
    await this.shareButton.click()
  }

  async getExitCodeBadgeText() {
    return await this.exitCodeBadge.textContent()
  }

  async goto(skipTutorial: boolean = false) {
    if (skipTutorial) {
      await this.page.addInitScript(() => {
        localStorage.setItem("tutorial-completed-playground-page", "true")
      })
    }
    await this.page.goto("/play/")
    await this.page.waitForLoadState("networkidle")
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
    await new Promise(resolve => setTimeout(resolve, 250))
    await this.page.keyboard.press("Escape")
    await new Promise(resolve => setTimeout(resolve, 250))
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
      .getByRole("heading", {name: "Welcome to Playground"})
      .locator("..")
      .locator("..")
  }

  getTutorialText() {
    return this.page.getByText("Welcome to Playground")
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

  getTooltip() {
    return this.tooltip
  }

  async waitForExitCodeBadge() {
    await this.exitCodeBadge.waitFor({state: "visible"})
  }
}
