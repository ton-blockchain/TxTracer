import {test as base} from "@playwright/test"

import {PlaygroundPage} from "../pages/playground-page"

type Fixtures = {
  readonly playgroundPage: PlaygroundPage
}

export const test = base.extend<Fixtures>({
  playgroundPage: async ({page}, useFixture) => {
    const playgroundPage = new PlaygroundPage(page)
    await useFixture(playgroundPage)
  },
})
