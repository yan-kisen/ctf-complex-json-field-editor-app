// @ts-nocheck
import { ContentType, FieldExtensionSDK } from '@contentful/app-sdk'

import { Card, CheckboxField, FieldGroup, TextField } from '@contentful/forma-36-react-components'
import '@contentful/forma-36-react-components/dist/styles.css'
import consola, { LogLevel } from 'consola'

import React, { SyntheticEvent } from 'react'
import { FIELD_OBJ_FORMATS } from '../app-constants'
import { ActionProps, ActionTypes, FormSchema } from '../app-types.d.ts'
import EntryReferenceField from './EntryReferenceField'
import { JsonFieldArray } from './JsonFieldArray'

interface JsonFieldGroupProps {
  key: string
  sdk: FieldExtensionSDK
  isArray?: boolean
  contentTypeDefinitions: Array<ContentType>
  fields: {
    [k: string]: FormSchema
  }
  rootValue?: Record<string, unknown>
  pathParts: Array<string | number>
  idx?: number
  dispatch: React.Dispatch<ActionProps>
}

export const JsonFieldGroup: React.FC<JsonFieldGroupProps> = ({ sdk, fields, pathParts, rootValue, isArray, dispatch, contentTypeDefinitions, idx }: JsonFieldGroupProps) => {
  const isDebug = sdk.parameters.instance.isDebug || false

  const logger = consola.create({ level: isDebug ? LogLevel.Debug : LogLevel.Warn, async: true }).withTag('JsonFieldGroup')

  logger.debug(`RENDER`, { pathParts, rootValue, fields })

  /**
   * Event handler for sub-field value update
   * @param e
   */
  function onUpdateFieldValue(e: SyntheticEvent) {
    // e.preventDefault()
    let value = e.target.value

    // logger.success(e.target)
    // debugger
    const parent = e.target.closest('[data-test-id="ctf-array-field-group"]')

    // const parentPathParts = parent.dataset?.['pathParts'].split('.') || [...pathParts]
    const parentPathParts = [...pathParts]
    // debugger
    switch (e.target.type) {
      case 'number':
        try {
          value = parseInt(value, 10)
        } catch (e) {
          logger.warn(`could not parse value [${value}]`)
        }
        break
      case 'checkbox':
        value = e.target.checked
        break
    }

    // ## Only update if value has changed
    if (e.target.dataset?.['originalValue'] !== value) {
      const fieldKey = e.target.dataset?.['fieldKey'] ?? e.target.id
      const fieldPathParts = [...parentPathParts]

      fieldPathParts.push(fieldKey)
      logger.info('dispatching...', { parentPathParts, fieldPathParts })
      dispatch({ type: ActionTypes.MODIFY_FIELD_VAL, payload: { value, path: fieldPathParts } })
    }
  }

  function resolveFieldValue(fieldValue: unknown, fieldType: string) {
    let value = fieldValue
    switch (fieldType) {
      case 'number': {
        try {
          value = parseInt(value, 10)
        } catch (e) {
          logger.warn(`could not parse number [${value}]`)
          value = undefined
        }
        break
      }
      case 'boolean': {
        value = typeof fieldValue === 'string' ? fieldValue === 'true' : fieldValue
      }
    }
    return value
  }

  return (
    <div>
      <Card className="row f36-margin-vertical--s f36-content-width--full block">
        <div className="f36-content-width--full">
          {Object.entries(fields).map(([fieldKey, subSchema], fieldIdx) => {
            logger.trace(fieldKey, subSchema)
            const fieldId = subSchema.id || fieldKey // TODO: Would the `id` ever be different than the property name?
            const inputLabelId = `${fieldId}--${pathParts.join('__')}--${fieldIdx}` // NOTE: We need to keep a unique id for the form label otherwise checkboxes will toggle inputs in other array elements
            // const fieldKey= subSchema.id || fieldKey // TODO: Would the `id` ever be different than the property name?
            const fieldPathParts = [...pathParts].concat(fieldId)
            const subSchemaOptions = subSchema.options || {}
            // debugger
            return (
              <FieldGroup row={true} data-idx={fieldIdx} data-path-parts={[...pathParts].concat(fieldIdx).join('.')} testId="ctf-array-field-group" key={`ctf-field-group-${fieldId}-${fieldIdx}`}>
                <div key={`group-item_${fieldId}--${fieldIdx}`}>
                  {(() => {
                    // NOTE: Switch needs to be embedded in IIFE (https://stackoverflow.com/questions/55237619/expression-expected-in-react-using-switch-statement)

                    switch (subSchema.type) {
                      case 'array': {
                        return <JsonFieldArray pathParts={fieldPathParts} contentTypeDefinitions={contentTypeDefinitions} dispatch={dispatch} sdk={sdk} schema={subSchema} rootValue={rootValue[fieldId]} />
                      }
                      case 'object': {
                        // debugger;
                        logger.debug(`handling object`)
                        switch (subSchema.format) {
                          case FIELD_OBJ_FORMATS.CTF_REFERENCE:
                            // return <EntryCard contentType={} />
                            return <EntryReferenceField sdk={sdk} dispatch={dispatch} pathParts={fieldPathParts} key={`ctf-ref-${fieldId}-${fieldIdx}`} contentTypeDefinitions={contentTypeDefinitions} rootValue={rootValue[fieldId]} options={{ contentTypes: subSchemaOptions.allowedContentTypes }} />
                          // return <SingleEntryReferenceEditor sdk={sdk} hasCardEditActions={true} isInitiallyDisabled={false} parameters={{}} viewType="link" />

                          case FIELD_OBJ_FORMATS.FIELD_GROUP:
                            return <h1>Field Grouplaceholder</h1>

                          default:
                            // logger.debug('what the heck')
                            return (
                              subSchema.properties && (
                                <section>
                                  <JsonFieldGroup key={`obj-${fieldKey}-${fieldIdx}`} sdk={sdk} fields={subSchema.properties} rootValue={rootValue} dispatch={dispatch} contentTypeDefinitions={contentTypeDefinitions} pathParts={fieldPathParts} />
                                </section>
                              )
                            )
                        }
                        break
                      }
                      // NOTE: treating number & text the same
                      case 'string':
                      case 'integer':
                      case 'number':
                        return (
                          // TODO: check for additional display options
                          <div className="cf-form-field f36-content-width--full">
                            <TextField // value={row['question']}
                              placeholder={subSchema.title}
                              labelText={subSchema.title} // TODO: Pass along formatting options
                              width={subSchemaOptions.fullWidth ? 'full' : ''}
                              rows={subSchema.format === 'textarea' ? 2 : 1} // TODO: double check ID field ID mapping
                              name={inputLabelId}
                              id={inputLabelId}
                              // id={fieldId}
                              textInputProps={{
                                onChange: onUpdateFieldValue,
                                'data-original-value': rootValue[fieldKey],
                                'data-field-key': fieldKey,
                                value: resolveFieldValue(rootValue[fieldKey], subSchema.type),
                                type: subSchema.type === 'string' ? subSchema.format || 'text' : 'number',
                              }}
                              textarea={subSchema.format === 'textarea'}
                            />
                          </div>
                        )
                      case 'boolean':
                        return (
                          <div className="cf-form-field f36-content-width--full">
                            <CheckboxField
                              labelText={subSchema.title}
                              name={inputLabelId}
                              id={inputLabelId}
                              inputProps={{
                                'data-field-key': fieldKey,
                              }}
                              checked={resolveFieldValue(rootValue[fieldKey] || false, 'boolean')}
                              onChange={onUpdateFieldValue}
                            />
                          </div>
                        )
                      default:
                        return (
                          <div key={`prop-${fieldKey}-${fieldIdx}`}>
                            <strong>{fieldKey}</strong>
                            <pre>{JSON.stringify(subSchema, null, 1)}</pre>
                          </div>
                        )
                    }
                  })()}
                </div>
              </FieldGroup>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
