// _@ts-nocheck
import { ContentType, FieldExtensionSDK } from '@contentful/app-sdk'

import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Button, Grid, GridItem, Heading, IconButton, Typography } from '@contentful/forma-36-react-components'
import '@contentful/forma-36-react-components/dist/styles.css'
import consola, { LogLevel } from 'consola'

import React, { useState } from 'react'
// @ts-ignore
import { ActionProps, ActionTypes, FormSchema } from '../app-types.d.ts'
import { getJsonSchemaDefaultValues } from '../lib/json-util'
import { JsonFieldGroup } from './JsonFieldGroup'

interface JsonFieldArrayProps {
  key?: string
  sdk: FieldExtensionSDK
  contentTypeDefinitions: Array<ContentType>
  schema: FormSchema
  rootValue?: Array<Record<string, unknown>>
  pathParts: Array<string | number>
  idx?: number
  dispatch: React.Dispatch<ActionProps>
}

export const JsonFieldArray: React.FC<JsonFieldArrayProps> = ({ sdk, schema, pathParts, rootValue, dispatch, contentTypeDefinitions, idx }: JsonFieldArrayProps) => {
  // @ts-ignore
  const isDebug = sdk.parameters.instance.isDebug || false

  const logger = consola.create({ level: isDebug ? LogLevel.Debug : LogLevel.Warn, async: true }).withTag('JsonFieldArray')

  logger.debug(`RENDER`, { pathParts, rootValue, schema })

  const schemaItems = schema.items
  const schemaOptions = schema.options || {}
  // const schemaProperties = schemaItems?.properties ?? {}

  // TODO: double check why we were previously able to read from `schemaItems.properties`
  const schemaProperties = schemaItems?.properties ?? schemaItems
  const schemaValueArray = rootValue || []
  const [accordionExpanded, setAccordionExpanded] = useState(true)

  return (
    <div>
      <Grid columns={'12fr'} rows={1} justifyContent={'space-between'}>
        <Accordion>
          <AccordionHeader
            ariaId={0}
            handleClick={() => {
              setAccordionExpanded(!accordionExpanded)
            }}
            isExpanded={accordionExpanded}
            element="h4"
          >
            <Typography>
              <Heading>{schema.title}</Heading>
            </Typography>
          </AccordionHeader>
          <AccordionPanel isExpanded={accordionExpanded} ariaId={0}>
            <Accordion>
              {(() => {
                return schemaValueArray.map((arrayItem, arrayItemIdx) => {
                  const arrayPathParts = [...pathParts]
                  const arrayItemPathParts = [...pathParts].concat(arrayItemIdx)
                  const displayField = schemaOptions.displayField || 'title'
                  const defaultItemTitle = schemaOptions.arrayItemTitle || 'Item'
                  const arrayItemDisplayTitle = displayField ? arrayItem[displayField] ?? defaultItemTitle : 'Untitled'

                  return (
                    <Grid columns={12} rows={2} justifyContent={'space-evenly'} key={`array-${arrayItemIdx}-Grid`}>
                      <GridItem area={'span 9 / span 9'}>
                        {/*// @ts-ignore*/}
                        <AccordionItem title={`[# ${arrayItemIdx}] ${arrayItemDisplayTitle}`} isExpanded={arrayItemIdx === 0} ariaId={'TODO'}>
                          {(() => {
                            return <JsonFieldGroup sdk={sdk} fields={schemaProperties} rootValue={arrayItem} dispatch={dispatch} key={`array-${arrayItemIdx}`} pathParts={arrayItemPathParts} contentTypeDefinitions={contentTypeDefinitions} />
                          })()}
                        </AccordionItem>
                        {/*</AccordionItem>*/}
                      </GridItem>
                      <GridItem rowStart={0} area={'span 3 / span 3 '}>
                        <Grid rowGap="spacingS" rows="repeat(2, auto)" justifyContent="evenly" columns={2}>
                          <GridItem rowStart={0} area={'span 1'}>
                            <Grid rowGap="spacingXs" rows="repeat(2, auto)">
                              <IconButton
                                label="Move Up"
                                buttonType="primary"
                                iconProps={{ icon: 'ChevronUp' }}
                                disabled={arrayItemIdx === 0}
                                onClick={() =>
                                  dispatch({
                                    type: ActionTypes.MOVE_ARRAY_ITEM_UP,
                                    payload: {
                                      opts: {
                                        array: schemaValueArray,
                                        index: arrayItemIdx,
                                        positionChange: -1,
                                      },
                                      path: arrayPathParts,
                                    },
                                  })
                                }
                              />
                              <IconButton
                                label="Move Down"
                                buttonType="primary"
                                iconProps={{ icon: 'ChevronDown' }}
                                disabled={arrayItemIdx + 1 === schemaValueArray.length}
                                onClick={() =>
                                  dispatch({
                                    type: ActionTypes.MOVE_ARRAY_ITEM_DOWN,
                                    payload: {
                                      opts: {
                                        array: schemaValueArray,
                                        index: arrayItemIdx,
                                        positionChange: +1,
                                      },
                                      path: arrayPathParts,
                                    },
                                  })
                                }
                              />
                            </Grid>
                          </GridItem>
                          <GridItem rowStart={0} columnStart={4} area={'span 2 / auto'}>
                            <IconButton
                              label="Remove"
                              buttonType="negative"
                              iconProps={{ icon: 'Delete' }}
                              onClick={() =>
                                dispatch({
                                  type: ActionTypes.REMOVE_ARRAY_ITEM,
                                  payload: {
                                    path: arrayPathParts,
                                    opts: {
                                      array: schemaValueArray,
                                      index: arrayItemIdx,
                                    },
                                  },
                                })
                              }
                            />
                          </GridItem>
                        </Grid>
                      </GridItem>
                    </Grid>
                  )
                })
              })()}
              <Grid alignContent={'flex-start'}>
                <GridItem columnEnd={12}>
                  <Button
                    buttonType="positive"
                    icon="PlusCircleTrimmed"
                    className="f36-margin-vertical--s"
                    onClick={() => {
                      logger.debug('Add Row!')
                      dispatch({ type: ActionTypes.ADD_FIELD_GROUP, payload: { path: pathParts.concat([schemaValueArray.length]), value: getJsonSchemaDefaultValues(schemaItems) } })
                    }}
                  >
                    Add Item
                  </Button>
                </GridItem>
              </Grid>
            </Accordion>
          </AccordionPanel>
        </Accordion>
      </Grid>
    </div>
  )
}
