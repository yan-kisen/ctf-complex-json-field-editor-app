// @ts-nocheck
import { FieldExtensionSDK } from '@contentful/app-sdk'

import '@contentful/forma-36-react-components/dist/styles.css'
// import * as JSONEditor from '@json-editor/json-editor/dist/jsoneditor'
// @ts-ignore
// import { JSONEditor } from '@json-editor/json-editor/dist/jsoneditor'
import { JSONEditor } from '@json-editor/json-editor/dist/nonmin/jsoneditor'
import consola, { LogLevel } from 'consola'
import _debounce from 'lodash/debounce'
import React, { useEffect, useState } from 'react'
import { render } from 'react-dom'

interface FieldProps {
  sdk: FieldExtensionSDK
}

const logger = consola.create({ level: LogLevel.Debug, async: false }).withTag('JsonEditorField')

const JsonEditorField = ({ sdk }: FieldProps) => {
  logger.log(`START`)

  // ## Create DOM Ref
  const $ref = React.createRef()

  // ## Read props
  const extensionId = sdk.ids.app ?? 'no tag'
  const schemaRefFieldId = sdk.parameters.instance.schemaRefFieldId || 'jsonSchemaRef'
  const schemaEntryId = sdk.entry.fields[schemaRefFieldId]?.getValue()?.sys?.id

  // ## Define State
  const [isLoaded, setIsLoaded] = useState(false)
  const [jsonSchema, setJsonSchema] = useState(null)

  const [value, setValue] = useState(sdk.field.getValue() || {})
  const [detachExternalChangeHandler, setDetachExternalChangeHandler] = useState(null)
  const [jsonEditor, setJSONEditor] = useState(null)

  // ## Use Contentful's builtin auto-resizer
  useEffect(() => {
    props.sdk.window.startAutoResizer()
    props.sdk.field.onValueChanged((val) => {
      logger.info(`resize`, val)
      props.sdk.window.updateHeight()
    })
  })

  // ## Use contentful's builtin auto-resizer
  useEffect(() => {
    /**
     * External change callback
     * @param value
     */
    const onExternalChange = (value) => {
      logger.withTag('onExternalChange').debug(value)
      setValue(value)
    }

    /**
     * Initialize the Editor
     * @param editorRef
     */
    const initializeEditor = (editorRef: JSONEditor) => {
      const watcherCallback = () => {
        sdk.window.updateHeight()
        validateAndSave()
      }

      Object.keys(editorRef.editors).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(editorRef.editors, key) && key !== 'root') {
          editorRef.watch(key, watcherCallback.bind(editorRef, key))
        }
      })

      const validateAndSave = _debounce(() => {
        const errors = editorRef.validate()
        if (errors.length === 0) {
          sdk.field.setValue(editorRef.getValue())
        } else {
          // @ts-ignore
          const error = errors.find((element) => element.path !== 'root')
          sdk.notifier.error(`${error.path}: ${error.message}`)
        }
      }, 150)
    }

    const loadSchema = async (entryId: string) => {
      try {
        const entryProps = await sdk.space.getEntry(entryId)

        logger.withTag('loadSchema').debug(entryProps)
        // @ts-ignore
        const loadedSchema = entryProps.fields?.jsonSchema?.[sdk.field.locale]

        if (loadedSchema) {
          setJsonSchema(loadedSchema)
        }
        return loadedSchema
      } catch (e) {
        logger.withTag('loadSchema').warn(e)
      }
    }

    const createEditor = () => {
      loadSchema(schemaEntryId)

      try {
        const editorRef = new JSONEditor($ref.current, {
          compact: false,
          disable_array_add: false,
          disable_array_delete: false,
          disable_array_reorder: false,
          enable_array_copy: false,
          disable_collapse: true,
          disable_edit_json: true,
          disable_properties: true,
          array_controls_top: true,
          form_name_root: 'root',
          iconlib: null,
          remove_button_labels: false,
          no_additional_properties: true,
          required_by_default: true,
          keep_oneof_values: true,
          schema: jsonSchema,
          show_errors: 'never', // interaction | change | always | never
          startval: value,
          template: 'default',
          display_required_only: false,
          show_opt_in: true,
          prompt_before_delete: false,
          object_layout: 'table',
          plugin: {
            selectize: true,
          },
        })

        editorRef.on('ready', () => {
          initializeEditor(editorRef)
          debugger
          setJSONEditor(editorRef)
          setIsLoaded(true)
        })

        return editorRef
      } catch (error) {
        logger.error(error)
      }
      // sdk.space
      //   .getEntry(schemaEntryId)
      //   .then((entryProps) => {
      //     logger.debug(entryProps)
      //     // @ts-ignore
      //     const loadedSchema = entryProps.fields?.jsonSchema?.[sdk.field.locale]
      //
      //     if (loadedSchema) {
      //       setJsonSchema(loadedSchema)
      //
      //       // TODO: add some sort of validation here
      //
      //       try {
      //         // @ts-ignore // TODO: Import the dependency
      //         const editorRef = new JSONEditor($ref.current, {
      //           // eslint-disable-line no-undef
      //           compact: false,
      //           disable_array_add: false,
      //           disable_array_delete: false,
      //           disable_array_reorder: false,
      //           enable_array_copy: false,
      //           disable_collapse: true,
      //           disable_edit_json: true,
      //           disable_properties: true,
      //           array_controls_top: true,
      //           form_name_root: 'root',
      //           iconlib: null,
      //           remove_button_labels: false,
      //           no_additional_properties: true,
      //           required_by_default: true,
      //           keep_oneof_values: true,
      //           schema: jsonSchema,
      //           show_errors: 'never', // interaction | change | always | never
      //           startval: value,
      //           template: 'default',
      //           display_required_only: false,
      //           show_opt_in: true,
      //           prompt_before_delete: false,
      //           object_layout: 'table',
      //           plugin: {
      //             selectize: true,
      //           },
      //         })
      //
      //         editorRef.on('ready', () => {
      //           initializeEditor(editorRef)
      //           setIsLoaded(true)
      //         })
      //
      //         return editorRef
      //       } catch (error) {
      //         logger.error(error)
      //       }
      //     }
      //   })
      //   .catch((e) => {
      //     logger.warn(e)
      //   })
    }

    sdk.window.startAutoResizer()

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    if (!detachExternalChangeHandler) {
      // @ts-ignore
      setDetachExternalChangeHandler(sdk.field.onValueChanged(onExternalChange))
    }

    if ($ref && !jsonEditor) {
      const timer = setTimeout(() => {
        console.log('Hello, World!')
        createEditor().then(() => {
          logger.success(`createEditorfinished`)
        })
        clearTimeout(timer)
      }, 1000)
      // clearTimeout(timer)
      // createEditor()
    }

    return function cleanup() {
      if (detachExternalChangeHandler) {
        // @ts-ignore
        detachExternalChangeHandler()
      }

      if (jsonEditor) {
        // @ts-ignore
        jsonEditor.destroy()
        setJSONEditor(null)
      }
    }

    // sdk.field.onValueChanged((val) => {
    //   logger.debug('value change', val)
    //   sdk.window.updateHeight()
    // })
  }, [detachExternalChangeHandler, jsonEditor, $ref, sdk.field, sdk.space, sdk.notifier, sdk.parameters, sdk.window, value])

  // ## Update contentful field value whenever value changes
  // useEffect(() => {
  //   //
  //   sdk.field.setValue(value)
  // }, [value, sdk.field])

  return (
    <div ref={$ref as any} />
    // <div style={{ visibility: isLoaded ? 'visible' : 'hidden' }} ref={$ref as any} />
    //   <div style={{ visibility: isLoaded ? 'hidden' : 'visible' }}>
    //     <SkeletonContainer>
    //       <SkeletonBodyText numberOfLines={2} />
    //     </SkeletonContainer>
    //   </div>
    // </>
  )
  render
}

export default JsonEditorField
