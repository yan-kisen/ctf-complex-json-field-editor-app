import { SidebarExtensionSDK } from '@contentful/app-sdk'
import { Accordion, AccordionItem, Button, Card, Paragraph } from '@contentful/forma-36-react-components'
import consola, { LogLevel } from 'consola'
import { EntryProps } from 'contentful-management/dist/typings/entities/entry'
import React, { useEffect, useMemo, useState } from 'react'
import { ActionTypes, AppInstanceParameters, FormSchema } from '../app-types'

interface SidebarProps {
  sdk: SidebarExtensionSDK
}

// TODO: Tweak Consola Config
const logger = consola.create({ level: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Warn, async: true }).withTag('Sidebar')

// TODO: Have shared AppState across locations
const Sidebar = ({ sdk }: SidebarProps) => {
  const instanceParams: AppInstanceParameters = sdk.parameters.instance
  const schemaRefFieldId = instanceParams.schemaRefFieldId || 'jsonSchemaRef'
  const jsonFieldId = instanceParams.jsonFieldId || 'jsonData'
  const loadSampleData = instanceParams.loadSampleData || false
  const isDebug = instanceParams.isDebug || false
  const isArray = instanceParams.isArray || false // TODO: separate Object/Array field editors into separate Apps to prevent having to set this globally as an instance param

  const defaultValue = isArray ? [] : {}
  const schemaRefField = sdk.entry.fields[schemaRefFieldId]

  const [sampleData, setSampleData] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonSchema, setJsonSchema] = useState({} as FormSchema)
  const [schemaRefEntryId, setSchemaRefEntryId] = useState(schemaRefField.getValue()?.sys.id)

  // With the field ID we can reference individual fields from an entry
  const contentField = sdk.entry.fields[schemaRefFieldId]
  const referencedEntry = sdk.entry.fields[schemaRefFieldId]

  // Get the current value from the blog post field and store it in React state
  const [blogText, setBlogText] = useState(referencedEntry.getValue())

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

  // ## Load remote schema
  useMemo(async () => {
    if (schemaRefEntryId) {
      setJsonSchema({} as FormSchema)
      await loadRemoteSchema(schemaRefEntryId)
    }
  }, [schemaRefEntryId])

  /**
   * Load JSON Schema reference
   * // TODO: Move to common lib to share state with Sidebar extension
   * @param entryId
   */
  async function loadRemoteSchema(entryId: string) {
    setIsLoading(true)
    try {
      const referencedEntryProps = (await sdk.space.getEntry(entryId)) as EntryProps
      // logger.debug('loadRemoteSchema', entryId, entryProps)
      const loadedSchema = referencedEntryProps.fields?.jsonSchema?.[sdk.locales.default] // TODO: verify locale selection
      if (loadedSchema) {
        logger.debug(`loadRemoteSchema`, entryId, loadedSchema)
        setJsonSchema(loadedSchema)

        setSampleData(referencedEntryProps.fields?.sampleJson?.[sdk.locales.default] ?? defaultValue)
      }
    } catch (e) {
      logger.withTag('loadRemoteSchema').warn(`error loading remote schema [${entryId}]`, e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {(() => {
        if (isDebug) {
          return (
            <Card className="f36-background-color--coral-mid">
              <Accordion>
                <AccordionItem title="Toggle Form Schema">
                  <pre>{JSON.stringify(jsonSchema, null, 1)}</pre>
                </AccordionItem>
              </Accordion>
              <div className="f36-margin-vertical--xs">
                <Button
                  buttonType="primary"
                  isFullWidth={true}
                  icon="Download"
                  onClick={() => {
                    logger.debug('reset sample data')
                    sdk.entry.fields[jsonFieldId].setValue(sampleData)
                  }}
                >
                  Reload Sample Data
                </Button>
              </div>
            </Card>
          )
        }
      })()}
    </>
  )
}

export default Sidebar
