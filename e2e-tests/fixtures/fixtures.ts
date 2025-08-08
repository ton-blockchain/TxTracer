import {test as base} from "@playwright/test"

import {PlaygroundPage} from "../pages/playground-page"
import {CodeExplorerPage} from "../pages/code-explorer-page"

type Fixtures = {
  readonly playgroundPage: PlaygroundPage
  readonly codeExplorerPage: CodeExplorerPage
}

export const test = base.extend<Fixtures>({
  playgroundPage: async ({page}, useFixture) => {
    const playgroundPage = new PlaygroundPage(page)
    await useFixture(playgroundPage)
  },
  codeExplorerPage: async ({page}, useFixture) => {
    const codeExplorerPage = new CodeExplorerPage(page)
    await useFixture(codeExplorerPage)
  },
})
