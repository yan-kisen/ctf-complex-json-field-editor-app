// @ts-nocheck
import { FieldExtensionSDK } from '@contentful/app-sdk'

import { Accordion, AccordionItem, Button, Card, SkeletonBodyText, SkeletonContainer, Spinner } from '@contentful/forma-36-react-components'
import consola, { LogLevel } from 'consola'
import { EntryProps } from 'contentful-management/dist/typings/entities/entry'
import _isEqual from 'lodash/isEqual'
import _set from 'lodash/set'

import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { ActionProps, ActionTypes, AppInstanceParameters, FormSchema } from '../app-types.d.ts'
import { moveArrayItem } from '../lib/json-util'
import { JsonFieldArray } from './JsonFieldArray'
import { JsonFieldGroup } from './JsonFieldGroup'

interface FieldProps {
  sdk: FieldExtensionSDK
}

const ACTIONS = {
  MODIFY_FIELD_VAL: 'modify-field-value',
  ADD_FIELD_GROUP: 'add-field-group',
  REMOVE_FIELD_GROUP: 'remove-field-group',
  REORDER_FIELD_GROUP: 'reorder-field-group',
}

// TODO: Tweak Consola Config
const logger = consola.create({ level: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Warn, async: true }).withTag('ComplexJsonFieldEditor')

// TODO: How to handle this?
logger.wrapConsole()

function reducer(state, action: ActionProps) {
  const isArray = Array.isArray(state)
  let updatedState = isArray ? [...state] : { ...state }
  // TODO: Simplify payload object structure
  const actionPayload = action.payload
  const propertyPath = actionPayload.path
  const payloadOpts = actionPayload.opts
  let updatedArray = [...(payloadOpts?.array ?? [])]

  switch (action?.type) {
    case ActionTypes.RESET_FORM:
      // debugger
      updatedState = actionPayload.value
      break
    case ActionTypes.MODIFY_FIELD_VAL:
      updatedState = _set(updatedState, propertyPath, actionPayload.value)
      // debugger
      break
    case ActionTypes.ADD_FIELD_GROUP:
      updatedState = _set(updatedState, propertyPath, actionPayload.value || {}) // TODO: Define default value in Schema (for objects construct based on child default values)
      break
    case ActionTypes.REMOVE_ARRAY_ITEM:
      updatedArray.splice(payloadOpts.index, 1)
      updatedState = _set(updatedState, propertyPath, updatedArray)
      break
    case ActionTypes.REORDER_ARRAY_ITEMS:
      updatedArray = moveArrayItem(payloadOpts.array, payloadOpts.index, payloadOpts.positionChange)
      if (isArray && propertyPath.length === 0) {
        // ## updating root element (since we cant target an unnamed array
        updatedState = updatedArray
      } else {
        updatedState = _set(updatedState, propertyPath, updatedArray)
      }
      break
    case ActionTypes.MOVE_ARRAY_ITEM_UP:
      return reducer(updatedState, { type: ActionTypes.REORDER_ARRAY_ITEMS, payload: { ...actionPayload, opts: { ...actionPayload.opts, positionChange: -1 } } })
    // updatedState = _set(updatedState, propertyPath, moveArrayItem(payloadOpts.array, payloadOpts.index, -1))
    // break
    case ActionTypes.MOVE_ARRAY_ITEM_DOWN:
      return reducer(updatedState, { type: ActionTypes.REORDER_ARRAY_ITEMS, payload: { ...actionPayload, opts: { ...actionPayload.opts, positionChange: +1 } } })
      // return reducer(updatedState, _set({ ...action }, ['payload', 'opts', 'index'], +1))
      // updatedState = _set(updatedState, propertyPath, moveArrayItem(payloadOpts.array, payloadOpts.index, +1))
      break
  }

  logger.info('reducer', { action, state, updatedState })
  return updatedState
}

const ComplexJsonFieldEditor = ({ sdk }: FieldProps) => {
  // ## Read params
  const instanceParams: AppInstanceParameters = sdk.parameters.instance
  const isDebug = instanceParams.isDebug || false
  const isArray = instanceParams.isArray || false

  const configuredSchemaRefEntryId = instanceParams.schemaRefEntryId // Allow us to hardcode the schemaRef ID in the instance parameters
  const schemaRefFieldId = instanceParams.schemaRefFieldId || 'jsonSchemaRef'
  const schemaRefField = sdk.entry.fields[schemaRefFieldId]

  const defaultValue = isArray ? [] : {}

  // ## Define State
  const [fieldValue, dispatch] = useReducer(reducer, sdk.field.getValue() || defaultValue)
  // ## TODO: reimplement state management with immer --> https://immerjs.github.io/immer/example-setstate#useimmerreducer
  const [sampleData, setSampleData] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonSchema, setJsonSchema] = useState(null as FormSchema)
  const [schemaRefEntryId, setSchemaRefEntryId] = useState(configuredSchemaRefEntryId ?? schemaRefField.getValue()?.sys.id)
  const [detachExternalChangeHandler, setDetachExternalChangeHandler] = useState(null)
  const [contentTypeDefinitions, setContentTypeDefinitions] = useState([])
  // const [jsonEditor, setJSONEditor] = useState(null)

  // logger.debug('fieldValue', fieldValue)
  // logger.debug('defaultValue', defaultValue)

  // ## Use Contentful's builtin auto-resizer
  useEffect(() => {
    sdk.window.startAutoResizer()
    // sdk.field.onValueChanged((val) => {
    //   if (val !== fieldValue) {
    //     logger.info(`onValueChanged`, val)
    //     sdk.window.updateHeight()
    //   }
    // })
  }, [])

  /*
  // ## Reload on external Change // TODO: Fix this...
  useEffect(() => {
    /!**
     * External change callback
     * @param value
     *!/
    const onExternalChange = (value) => {
      logger.withTag('onExternalChange').debug(value)
      replaceFieldValue(value)
    }
    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    if (!detachExternalChangeHandler) {
      // @ts-ignore
      setDetachExternalChangeHandler(sdk.field.onValueChanged(onExternalChange))
    }

    return function cleanup() {
      if (detachExternalChangeHandler) {
        // @ts-ignore
        detachExternalChangeHandler()
      }
    }
  }, [detachExternalChangeHandler, sdk.field, fieldValue])
*/
  useEffect(() => {
    const detach = sdk.field.onValueChanged((newVal) => {
      ;(async () => {
        // const value = sdk.field.getValue()
        // debugger
        if (!_isEqual(newVal, sdk.field.getValue())) {
          logger.debug(`onValueChanged`, newVal, fieldValue)
          replaceFieldValue(newVal)
          // debugger
          sdk.window.updateHeight()
        }
      })()
    })
    return () => detach()
  }, [sdk.field, fieldValue])

  // // ## Load remote schema
  // useEffect(() => {
  //   const detach = schemaRefField.onValueChanged((newVal) => {
  //     ;(async () => {
  //       if (newVal?.sys?.id !== schemaRefEntryId || !jsonSchema) {
  //         logger.withTag('schemaRefField').debug('onValueChanged', newVal)
  //         setJsonSchema(null)
  //         await loadRemoteSchema(newVal.sys.id)
  //       }
  //     })()
  //   })
  //   return () => detach()
  // }, [schemaRefField, schemaRefEntryId])

  // ## Load remote schema
  useMemo(async () => {
    if (schemaRefEntryId) {
      setJsonSchema(null)
      await loadRemoteSchema(schemaRefEntryId)
    }
  }, [schemaRefEntryId])

  // ## Load Environment ContentTypes
  useMemo(async () => {
    if (!contentTypeDefinitions.length) {
      const result = await sdk.space.getContentTypes()
      const contentTypeDefinitions = result.items
      setContentTypeDefinitions(contentTypeDefinitions)
      logger.debug('load ContentType Definitions', contentTypeDefinitions)
    }
  }, [contentTypeDefinitions])

  function replaceFieldValue(newVal) {
    logger.debug('replaceFieldValue', newVal)
    if (!_isEqual(newVal, sdk.field.getValue())) {
      dispatch({ type: ActionTypes.RESET_FORM, payload: { value: newVal, path: '' } })
    }
  }

  /**
   * Load JSON Schema reference
   * // TODO: Move to common lib to share state with Sidebar extension
   * @param entryId
   */
  async function loadRemoteSchema(entryId) {
    setIsLoading(true)
    try {
      const referencedEntryProps = (await sdk.space.getEntry(entryId)) as EntryProps
      // logger.debug('loadRemoteSchema', entryId, entryProps)
      const loadedSchema = referencedEntryProps.fields?.jsonSchema?.[sdk.field.locale]
      if (loadedSchema) {
        logger.debug(`loadRemoteSchema`, entryId, loadedSchema)
        setJsonSchema(loadedSchema)
        setSampleData(referencedEntryProps.fields?.sampleJson?.[sdk.field.locale] ?? defaultValue)
      }
    } catch (e) {
      logger.withTag('loadRemoteSchema').warn(`error loading remote schema [${entryId}]`, e)
    } finally {
      setIsLoading(false)
    }
  }

  // ## Update contentful field value whenever rows data changes
  useEffect(() => {
    logger.debug(`updating fieldValue`, fieldValue)
    sdk.field.setValue(fieldValue)
  }, [fieldValue, sdk.field])

  if (isLoading || !jsonSchema) {
    return (
      <SkeletonContainer>
        <SkeletonBodyText numberOfLines={2}>
          <div>
            Loading <Spinner />
          </div>
        </SkeletonBodyText>
      </SkeletonContainer>
    )
  }
  return (
    <div>
      {(() => {
        // NOTE: Moved to `Sidebar.tsx`
        if (isDebug) {
          return (
            <Card className="f36-background-color--coral-mid">
              <Accordion>
                <AccordionItem title="Toggle Form Schema">
                  <pre>{JSON.stringify(jsonSchema, null, 1)}</pre>
                </AccordionItem>
              </Accordion>
              <div className="f36-margin-vertical--xs">
                <Button buttonType="primary" isFullWidth={true} icon="Download" onClick={() => replaceFieldValue(sampleData)}>
                  Reload Sample Data
                </Button>
              </div>
            </Card>
          )
        }
      })()}

      {!isArray && jsonSchema.properties && (
        <section>
          <JsonFieldGroup key="root" sdk={sdk} fields={jsonSchema.properties} rootValue={fieldValue} dispatch={dispatch} pathParts={[]} contentTypeDefinitions={contentTypeDefinitions} />
        </section>
      )}

      {isArray && jsonSchema.items && (
        <section>
          <JsonFieldArray sdk={sdk} schema={jsonSchema} rootValue={fieldValue} dispatch={dispatch} pathParts={[]} contentTypeDefinitions={contentTypeDefinitions} />
        </section>
      )}
    </div>
  )
}

export default ComplexJsonFieldEditor
