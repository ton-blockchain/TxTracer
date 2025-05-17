import {extractTxInfoFromLink, type ExtractionResult} from "@features/txTrace/lib/links.ts"

describe("should parse links", () => {
  it("should parse ton.cx link", () => {
    const res = extractTxInfoFromLink(
      "https://ton.cx/tx/56166043000001:T6Y6ZoW71mrznFA0RyU/xV5ILpz9WUPJ9i9/4xPq1Is=:EQCqKZrrce8Ss6SZaLI-OkH2w8-xtPP9_ZvyyIZLhy9Hmpf8",
    )
    checkTripleResult(res, {
      testnet: false,
      lt: 56166043000001n,
      hash: "T6Y6ZoW71mrznFA0RyU/xV5ILpz9WUPJ9i9/4xPq1Is=",
      address: "EQCqKZrrce8Ss6SZaLI-OkH2w8-xtPP9_ZvyyIZLhy9Hmpf8",
    })
  })

  it("should parse testnet ton.cx link", () => {
    const res = extractTxInfoFromLink(
      "https://testnet.ton.cx/tx/34542319000001:BBKTzwCTnY3xK6299queIJHIEhlB27FwxUNZVAO1uXs=:EQAkEiMt8S8Ur-umCyUn6YPXxpTzlSHH3T1vglKIFvuNObcl",
    )
    checkTripleResult(res, {
      testnet: true,
      lt: 34542319000001n,
      hash: "BBKTzwCTnY3xK6299queIJHIEhlB27FwxUNZVAO1uXs=",
      address: "EQAkEiMt8S8Ur-umCyUn6YPXxpTzlSHH3T1vglKIFvuNObcl",
    })
  })

  it("shouldn't parse incorrect ton.cx links", () => {
    expect(() =>
      extractTxInfoFromLink(
        "https://ton.cx/tx/56166043000001:T6Y6ZoW71mrznFA0RyU/xV5ILpz9WUPJ9i9/4xPq1Is=:EQCqKZrrce8Ss6SZaLI-OkH2w8-xtPP9_ZvyyIZLhy9Hm8",
      ),
    ).toThrow("Unknown address type: EQCqKZrrce8Ss6SZaLI-OkH2w8-xtPP9_ZvyyIZLhy9Hm8")
  })

  it("should parse tonviewer.com link", () => {
    const res = extractTxInfoFromLink(
      "https://tonviewer.com/transaction/7a236ab8bdec69ae46c02a5142dfe0dc45bf03b30607c5f88fdf86daeb8e393b",
    )
    checkHashResult(res, {
      testnet: false,
      hash: "7a236ab8bdec69ae46c02a5142dfe0dc45bf03b30607c5f88fdf86daeb8e393b",
    })
  })

  it("should parse testnet tonviewer.com link", () => {
    const res = extractTxInfoFromLink(
      "https://testnet.tonviewer.com/transaction/041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b",
    )
    checkHashResult(res, {
      testnet: true,
      hash: "041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b",
    })
  })

  it("should parse tonscan.org link", () => {
    const res = extractTxInfoFromLink(
      "https://tonscan.org/tx/7a236ab8bdec69ae46c02a5142dfe0dc45bf03b30607c5f88fdf86daeb8e393b",
    )
    checkHashResult(res, {
      testnet: false,
      hash: "7a236ab8bdec69ae46c02a5142dfe0dc45bf03b30607c5f88fdf86daeb8e393b",
    })
  })

  it("should parse testnet tonscan.org link", () => {
    const res = extractTxInfoFromLink(
      "https://testnet.tonscan.org/tx/041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b",
    )
    checkHashResult(res, {
      testnet: true,
      hash: "041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b",
    })
  })

  it("should parse explorer.toncoin.org link", () => {
    const res = extractTxInfoFromLink(
      "https://explorer.toncoin.org/transaction?account=EQCVervJ0JDFlSdOsPos17zHdRBU-kHHl09iXOmRIW-5lwXW&lt=43546193000009&hash=7a236ab8bdec69ae46c02a5142dfe0dc45bf03b30607c5f88fdf86daeb8e393b",
    )
    checkTripleResult(res, {
      testnet: false,
      lt: 43546193000009n,
      hash: "eiNquL3saa5GwCpRQt/g3EW/A7MGB8X4j9+G2uuOOTs=",
      address: "EQCVervJ0JDFlSdOsPos17zHdRBU-kHHl09iXOmRIW-5lwXW",
    })
  })

  it("should parse testnet explorer.toncoin.org link", () => {
    const res = extractTxInfoFromLink(
      "https://test-explorer.toncoin.org/transaction?account=EQAkEiMt8S8Ur-umCyUn6YPXxpTzlSHH3T1vglKIFvuNObcl&lt=34542319000001&hash=041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b",
    )
    checkTripleResult(res, {
      testnet: true,
      lt: 34542319000001n,
      hash: "BBKTzwCTnY3xK6299queIJHIEhlB27FwxUNZVAO1uXs=",
      address: "EQAkEiMt8S8Ur-umCyUn6YPXxpTzlSHH3T1vglKIFvuNObcl",
    })
  })

  it("shouldn't parse incorrect explorer.toncoin.org links", () => {
    expect(() =>
      extractTxInfoFromLink(
        "https://test-explorer.toncoin.org/transaction?account=EQAkEiMt8S8Ur-umCyUn6YPXxpTzlSHH3T1vglKIFvuNl&lt=34542319000001&hash=041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b",
      ),
    ).toThrow("Unknown address type: EQAkEiMt8S8Ur-umCyUn6YPXxpTzlSHH3T1vglKIFvuNl")
  })

  it("should parse explorer.toncoin.org link", () => {
    const res = extractTxInfoFromLink(
      "https://dton.io/tx/F64C6A3CDF3FAD1D786AACF9A6130F18F3F76EEB71294F53BBD812AD3703E70A",
    )
    checkHashResult(res, {
      testnet: false,
      hash: "f64c6a3cdf3fad1d786aacf9a6130f18f3f76eeb71294f53bbd812ad3703e70a",
    })
  })

  it("should parse testnet explorer.toncoin.org link", () => {
    const res = extractTxInfoFromLink(
      "https://testnet.dton.io/tx/F64C6A3CDF3FAD1D786AACF9A6130F18F3F76EEB71294F53BBD812AD3703E70A",
    )
    checkHashResult(res, {
      testnet: true,
      hash: "f64c6a3cdf3fad1d786aacf9a6130f18f3f76eeb71294f53bbd812ad3703e70a",
    })
  })

  function checkTripleResult(
    res: ExtractionResult | undefined,
    expected: {
      testnet: boolean
      lt: bigint
      hash: string
      address: string
    },
  ) {
    expect(res).toBeDefined()
    if (res?.$ !== "BaseInfo") {
      expect(false).toBe(true)
      return
    }
    const info = res.info
    expect(res.testnet).toBe(expected.testnet)
    expect(info.lt).toBe(expected.lt)
    expect(info.hash.toString("base64")).toBe(expected.hash)
    expect(info.address.toString()).toBe(expected.address)
  }

  function checkHashResult(
    res: ExtractionResult | undefined,
    expected: {
      testnet: boolean
      hash: string
    },
  ) {
    expect(res).toBeDefined()
    if (res?.$ !== "SingleHash") {
      expect(false).toBe(true)
      return
    }
    expect(res.testnet).toBe(expected.testnet)
    expect(res.hash).toBe(expected.hash)
  }
})
