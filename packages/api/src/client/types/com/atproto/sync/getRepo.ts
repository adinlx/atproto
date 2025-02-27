/**
* GENERATED CODE - DO NOT MODIFY
*/
import { Headers, XRPCError } from '@atproto/xrpc'

export interface QueryParams {
  /**
   * The DID of the repo.
   */
  did: string;
  /**
   * A past commit CID.
   */
  from?: string;
}

export interface CallOptions {
  headers?: Headers;
}

export type InputSchema = undefined

export interface Response {
  success: boolean;
  headers: Headers;
  data: Uint8Array;
}

export function toKnownErr(e: any) {
  if (e instanceof XRPCError) {
  }
  return e
}
