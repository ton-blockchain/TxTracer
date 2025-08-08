import {type Locator, type Page, expect} from "@playwright/test"

export class CodeExplorerPage {
  private funcEditor: Locator
  private asmEditor: Locator
  private compileButton: Locator
  private shareButton: Locator
  private settingsButton: Locator
  private settingsMenu: Locator
  private errorBanner: Locator
  private tutorialPopup: Locator
  private tutorialText: Locator
  private monacoAlert: Locator
  private tooltip: Locator

  constructor(public readonly page: Page) {
    this.funcEditor = this.page.locator(".view-lines").first()
    this.asmEditor = this.page.locator(".view-lines").last()
    this.compileButton = this.page.getByTestId("compile-button")
    this.shareButton = this.page.getByTestId("share-button")
    this.settingsButton = this.page.getByTestId("settings-button")
    this.settingsMenu = this.page.getByRole("menu", {name: "Settings menu"})
    this.errorBanner = this.page.getByTestId("error-banner-info")
    this.monacoAlert = this.page
      .getByRole("alert")
      .filter({hasText: "Cannot edit in read-only editor"})
    this.tutorialPopup = this.page
      .getByRole("heading", {name: "Welcome to Code Explorer"})
      .locator("..")
      .locator("..")
    this.tutorialText = this.page.getByRole("heading", {name: "Welcome to Code Explorer"})
    this.tooltip = this.page.locator(".monaco-hover-content").last()
  }

  async goto(skipTutorial: boolean = false) {
    if (skipTutorial) {
      await this.page.addInitScript(() => {
        localStorage.setItem("tutorial-completed-godbolt-page", "true")
      })
    }
    await this.page.goto("/code-explorer/")
    await this.page.waitForLoadState("networkidle")
  }

  async focusFuncEditor() {
    await this.funcEditor.click()
  }

  async clearFuncEditor() {
    await this.focusFuncEditor()
    await this.page.keyboard.press("Control+a")
    await this.page.keyboard.press("Delete")
  }

  async typeInFuncEditor(code: string) {
    await this.focusFuncEditor()
    await this.page.keyboard.type(code)
  }

  async getFuncEditorText(): Promise<string> {
    return await this.page.evaluate(() => {
      const editor = document.querySelector(".monaco-editor .view-lines")
      // replace non-breaking spaces with regular spaces
      return editor?.textContent?.replace(/\u00A0/g, " ") || ""
    })
  }

  async getAsmEditorText(): Promise<string> {
    return await this.page.evaluate(() => {
      const editors = document.querySelectorAll(".monaco-editor .view-lines")
      const asmEditor = editors[1]
      const text = asmEditor?.textContent || ""
      // replace non-breaking spaces with regular spaces
      return text.replace(/\u00A0/g, " ")
    })
  }

  async compile() {
    await this.compileButton.click()
  }

  async share() {
    await this.shareButton.click()
  }

  async openSettings() {
    await this.settingsButton.click()
  }

  checkSettingsMenuVisibility() {
    return expect(this.settingsMenu).toBeVisible()
  }

  async closeSettings() {
    await this.page.keyboard.press("Escape")
  }

  getAsmEditor() {
    return this.asmEditor
  }

  async getErrorText(): Promise<string | null> {
    if (await this.errorBanner.isVisible()) {
      return await this.errorBanner.textContent()
    }
    return null
  }

  getTutorialPopup() {
    return this.tutorialPopup
  }

  getTutorialText() {
    return this.tutorialText
  }

  async getTutorialTotalSteps() {
    const popup = this.getTutorialPopup()
    const stepText = await popup.locator("text=of").innerText()
    return parseInt(stepText.match(/of (\d+)/)?.[1] || "0", 10)
  }

  async waitCompile() {
    await expect(this.compileButton).toBeEnabled()
    await this.page.waitForTimeout(200)
  }

  getMonacoAlert() {
    return this.monacoAlert
  }

  getTooltip() {
    return this.tooltip
  }
}
