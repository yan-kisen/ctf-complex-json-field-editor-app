// @ts-nocheck
import { ContentType, FieldExtensionSDK } from '@contentful/app-sdk'
import { Button, Card, DropdownList, DropdownListItem, EntryCard } from '@contentful/forma-36-react-components'
// ## TODO-START: Maybe simplify by using this import...
// import { FetchingWrappedEntryCard } from '@contentful/field-editor-reference'
// ## TODO-END
// import { SingleEntryReferenceEditor } from '@contentful/field-editor-reference'
import consola, { LogLevel } from 'consola'
import { EntryProps } from 'contentful-management/dist/typings/entities/entry'
import { React, useEffect, useState } from 'react'
import { ActionProps, ActionTypes } from '../app-types.d.ts'
import { formatEntryLink, getContentTypeDefinition, getStatusText, getSysId } from '../lib/contentful-util'

interface EntryReferenceField {
  sdk: FieldExtensionSDK
  contentTypeDefinitions: Array<ContentType>
  key: string
  rootValue?: Record<string, unknown>
  pathParts: Array<string, number>
  idx?: number
  dispatch: React.Dispatch<ActionProps>
  options: {
    contentTypes: string[]
  }
}

const EntryReferenceField = ({ sdk, contentTypeDefinitions, dispatch, rootValue, pathParts, options }: EntryReferenceField) => {
  const isDebug = sdk.parameters.instance.isDebug || false

  const logger = consola.create({ level: isDebug ? LogLevel.Debug : LogLevel.Warn, async: true }).withTag('EntryReferenceField')

  logger.debug(`RENDER`, { pathParts, rootValue })

  const [fieldValue, setFieldValue] = useState(rootValue || undefined)

  const [referencedEntry, setReferencedEntry] = useState({} as Partial<EntryProps>)

  function getDisplayText(entry: EntryProps): string {
    if (contentTypeDefinitions.length && entry.sys) {
      const contentType = getContentTypeDefinition(entry, contentTypeDefinitions)

      const displayField = contentType?.displayField

      return entry.fields[displayField]?.[sdk.field.locale] ?? entry.sys.id
    }
  }

  // use contentful's builtin auto-resizer
  useEffect(() => {
    // sdk.window.startAutoResizer()
  })

  // check for unresolved names and fetch them from Contentful if necessary
  useEffect(async () => {
    const referencedEntryId = getSysId(fieldValue)
    let referencedEntryData
    if (referencedEntryId) {
      referencedEntryData = await sdk.space.getEntry(referencedEntryId)
    }
    logger.debug('referencedEntryData', referencedEntryData)
    setReferencedEntry(referencedEntryData)
  }, [fieldValue])

  // open entry selection dialog and append selected entries to the end of our list
  const onAddButtonClicked = () => {
    const dialogOptions = {
      locale: sdk.field.locale,
    }
    if (options.contentTypes) {
      dialogOptions.contentTypes = options.contentTypes
    }
    sdk.dialogs
      .selectSingleEntry(dialogOptions)
      .then((selectedEntry: EntryProps) => {
        logger.debug(`selectedEntry`, selectedEntry)
        setReferencedEntry(selectedEntry)
        const value = formatEntryLink(selectedEntry.sys.id)
        setFieldValue(value)

        dispatch({ type: ActionTypes.MODIFY_FIELD_VAL, payload: { value, path: pathParts } })
        // update JSON
      })
      .catch(() => {
        /* do nothing */
      })
  }

  // remove ingredient from list
  const onDeleteButtonClicked = () => {
    setFieldValue(undefined)
    setReferencedEntry(undefined)
    // onValueUpdate(null)
    dispatch({ type: ActionTypes.MODIFY_FIELD_VAL, payload: { value: undefined, path: pathParts } })
  }

  return (
    <>
      {/* TODO: Display button */}
      {fieldValue && referencedEntry ? (
        <EntryCard
          contentType={referencedEntry.sys?.contentType.sys.id}
          size="small"
          title={getDisplayText(referencedEntry)}
          status={getStatusText(referencedEntry)}
          onClick={async () => {
            await sdk.navigator.openEntry(referencedEntry.sys?.id, { slideIn: true })
          }}
          dropdownListElements={
            <DropdownList>
              <DropdownListItem isTitle>Actions</DropdownListItem>
              <DropdownListItem onClick={onAddButtonClicked}>Edit</DropdownListItem>
              <DropdownListItem onClick={onDeleteButtonClicked}>Remove</DropdownListItem>
            </DropdownList>
          }
        />
      ) : (
        <Card>
          <Button icon="Plus" buttonType="positive" isFullWidth={true} onClick={onAddButtonClicked}>
            Add Reference
          </Button>
        </Card>
      )}
    </>
  )
}

export default EntryReferenceField
