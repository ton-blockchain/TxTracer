import {test, expect, Page} from "@playwright/test"

const TON_CX =
  "https://ton.cx/tx/43546193000009:eiNquL3saa5GwCpRQt/g3EW/A7MGB8X4j9+G2uuOOTs=:EQCVervJ0JDFlSdOsPos17zHdRBU-kHHl09iXOmRIW-5lwXW"
const TON_CX_TESTNET =
  "https://testnet.ton.cx/tx/34542319000001:BBKTzwCTnY3xK6299queIJHIEhlB27FwxUNZVAO1uXs=:EQAkEiMt8S8Ur-umCyUn6YPXxpTzlSHH3T1vglKIFvuNObcl"

const TONVIEWER =
  "https://tonviewer.com/transaction/7a236ab8bdec69ae46c02a5142dfe0dc45bf03b30607c5f88fdf86daeb8e393b"
const TONVIEWER_TESTNET =
  "https://testnet.tonviewer.com/transaction/041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b"

const TONSCAN = "https://tonscan.org/tx/eiNquL3saa5GwCpRQt/g3EW/A7MGB8X4j9+G2uuOOTs="
const TONSCAN_TESTNET =
  "https://testnet.tonscan.org/tx/BBKTzwCTnY3xK6299queIJHIEhlB27FwxUNZVAO1uXs="

const TONCOIN =
  "https://explorer.toncoin.org/transaction?account=EQCVervJ0JDFlSdOsPos17zHdRBU-kHHl09iXOmRIW-5lwXW&lt=43546193000009&hash=7a236ab8bdec69ae46c02a5142dfe0dc45bf03b30607c5f88fdf86daeb8e393b"
const TONCOIN_TESTNET =
  "https://test-explorer.toncoin.org/transaction?account=EQAkEiMt8S8Ur-umCyUn6YPXxpTzlSHH3T1vglKIFvuNObcl&lt=34542319000001&hash=041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b"

const DTON = "https://dton.io/tx/F64C6A3CDF3FAD1D786AACF9A6130F18F3F76EEB71294F53BBD812AD3703E70A"
const DTON_TESTNET =
  "https://testnet.dton.io/tx/041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b"

async function startTracing(page: Page, link: string) {
  const searchInput = page.getByPlaceholder("Search by transaction hash or explorer link")
  await expect(searchInput).toBeVisible()
  await searchInput.fill(link)
  await expect(searchInput).toHaveValue(link)

  const traceButton = page.getByRole("button", {name: "Trace"})
  await expect(traceButton).toBeVisible()
  await expect(traceButton).toBeEnabled()
  await traceButton.click()
}

test.describe("TxTracer Viewers Links", () => {
  test("should successfully trace ton.cx link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, TON_CX)
    await checkPageLoaded(page)
  })

  test("should successfully trace testnet ton.cx link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, TON_CX_TESTNET)
    await checkPageLoaded(page)
  })

  test("should successfully trace tonviewer link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, TONVIEWER)
    await checkPageLoaded(page)
  })

  test("should successfully trace tonscan link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, TONSCAN)
    await checkPageLoaded(page)
  })

  test("should successfully trace toncoin link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, TONCOIN)
    await checkPageLoaded(page)
  })

  test("should successfully trace testnet tonviewer link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, TONVIEWER_TESTNET)
    await checkPageLoaded(page)
  })

  test("should successfully trace testnet tonscan link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, TONSCAN_TESTNET)
    await checkPageLoaded(page)
  })

  test("should successfully trace testnet toncoin link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, TONCOIN_TESTNET)
    await checkPageLoaded(page)
  })

  test("should successfully trace dton link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, DTON)
    await checkPageLoaded(page)
  })

  test("should successfully trace testnet dton link", async ({page}: {page: Page}) => {
    await wait()
    await page.goto("/")
    await startTracing(page, DTON_TESTNET)
    await checkPageLoaded(page)
  })
})

async function checkPageLoaded(page: Page) {
  const stepCounter = page.getByTestId("step-counter-info")
  await expect(stepCounter).toBeVisible({timeout: 30000})
}

async function wait(): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, 5_000))
}
