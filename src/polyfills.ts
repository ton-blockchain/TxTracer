import {Buffer} from "buffer"
globalThis.Buffer = Buffer
// @ts-expect-error TS2740
globalThis.process = {env: {}}
