// Per-request credential, reachable from a tool without the model ever
// seeing or selecting it. Identity is `x-aep.identity.mode: "on-behalf-of"`:
// forward the caller's own Authorization header downstream, held out-of-band.
import { AsyncLocalStorage } from "node:async_hooks";

export interface CallContext {
  authorization?: string;
}

export const callContext = new AsyncLocalStorage<CallContext>();
