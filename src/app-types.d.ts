/**
 * Custom types for this App
 */
import { JSONSchema4 } from '@types/json-schema'

// TODO: define App State Type
export interface AppState {}

/*
Simplified based on JSON Schema 4
 */
export type FormSchema = JSONSchema4 & {
  options: {
    fullWidth?: boolean
    flex?: boolean
    contentTypes?: [],
    displayField?:string // object only
  }
}

export type ActionProps = {
  type: ActionTypes
  payload: {
    path: string | Array<string | number>
    value: number | string | boolean | Record<string, unknown>
    opts?: {
      [k: string]: unknown
    }
  }
}

export enum ActionTypes {
  RESET_FORM,
  MODIFY_FIELD_VAL,
  ADD_FIELD_GROUP,
  REMOVE_ARRAY_ITEM,
  MOVE_ARRAY_ITEM_UP,
  MOVE_ARRAY_ITEM_DOWN,
  REORDER_ARRAY_ITEMS,
}

export type Action =
  | { type: ActionTypes.MODIFY_FIELD_VAL; groupId: string; fieldKey: string }
  | { type: ActionTypes.ADD_FIELD_GROUP; groupId: string }
  | { type: ActionTypes.REMOVE_ARRAY_ITEM; groupId: string; name: string }
  | { type: ActionTypes.MOVE_ARRAY_ITEM_UP; groupId: string }
  | { type: ActionTypes.MOVE_ARRAY_ITEM_DOWN; groupId: string }
  | { type: ActionTypes.REORDER_ARRAY_ITEMS; groupId: string; oldIndex: number; newIndex: number }

export type DISPATCH_OPTS = {
  type: string
  payload: {
    name: string // fieldName
    path: string // jsonPath
    value: number | string | boolean | Record<string, unknown>
  }
}

export type AppInstallationParameters = {
  todo: string
}

export type AppInstanceParameters = {
  schemaRefFieldId?: string
  jsonFieldId?: string
  loadSampleData?: boolean
  isDebug?: boolean
  isArray?: boolean
}
