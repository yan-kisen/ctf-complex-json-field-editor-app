/**
 * Shared App State & Things
 *
 * @author Yan Kisen
 *
 * @since 10/01/2021
 */

import consola, { LogLevel } from 'consola'
import _transform from 'lodash/transform'
import { FormSchema } from '../app-types'

// TODO: Tweak Consola Config
const logger = consola.create({ level: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Warn, async: true }).withTag('json-util')

export function noop() {
  // TODO
}

// ## Object Utils

/**
 * Reorder elements of an array
 * @param items
 * @param startIdx
 * @param positionChange
 */
export const moveArrayItem = (items: Array<unknown>, startIdx: number, positionChange: number) => {
  // const currentIndex = items.findIndex((fieldGroup) => fieldGroup.id === id)
  const arrayCopy = [...items]
  const movedElement = arrayCopy.splice(startIdx, 1)[0]
  arrayCopy.splice(startIdx + positionChange, 0, movedElement)
  return arrayCopy
}

/**
 * Recurses a JSON Schema to build a default object for adding to an Array
 * @param jsonSchema
 */
export function getJsonSchemaDefaultValues(jsonSchema: FormSchema): Record<string, unknown> {
  function transformer(result: Record<string, unknown>, value: Record<string, unknown>, key: string) {
    let defaultVal = value['default']
    switch (value['type']) {
      case 'array':
        defaultVal = []
        break
      case 'object':
        if (value['properties']) {
          // @ts-ignore
          defaultVal = _transform(value['properties'] as Record<string, unknown>, transformer, {})
        }

        break
    }

    result[key] = defaultVal
  }

  // @ts-ignore
  const result = _transform(jsonSchema['properties'], transformer, {})

  logger.debug('getJsonSchemaDefaultValues', result)
  return result
}
