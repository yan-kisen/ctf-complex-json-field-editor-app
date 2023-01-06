/**
 * Utilities
 *
 * @author Yan Kisen
 *
 * @since 09/30/2021
 */

import { ContentType } from '@contentful/app-sdk'
import { EntryCardStatus } from '@contentful/forma-36-react-components/dist/components/Card/EntryCard/EntryCard'
// import { Link } from '@contentful/app-sdk';
// import { Link } from 'contentful-management/dist/typings/common-types'
// import { Entry,EntryProps } from 'contentful-management/dist/typings/entities/entry'
import { Asset, Entry, EntryProps, Link } from 'contentful-management/types'

/**
 * Format JSON for Contentful Entry Link
 * @param entryId
 */
export function formatEntryLink(entryId: string): Link<'Entry'> | undefined {
  let returnValue = undefined
  if (entryId && entryId.length > 0) {
    returnValue = {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: entryId,
      },
    }
  }
  // @ts-ignore
  return returnValue
}

/**
 * Format JSON for Contentful Asset Link
 * @param assetId
 */
export function formatAssetLink(assetId: string): Link<'Asset'> {
  return {
    sys: {
      type: 'Link',
      linkType: 'Asset',
      id: assetId,
    },
  }
}

/**
 * Extract the Entity Sys ID if exists
 * @param link
 */
export function getSysId(link: Link<'Asset' | 'Entry'>): string | undefined {
  return link?.sys?.id
}

/**
 * Filter the ContentType definitions to match the given Entry
 * @param entry
 * @param contentTypeDefinitions
 */
export function getContentTypeDefinition(entry: EntryProps, contentTypeDefinitions: Array<ContentType>): ContentType | undefined {
  return contentTypeDefinitions.find((item) => item.sys.id === entry?.sys?.contentType?.sys.id)
}

/**
 * [CMA Only] Detect if an Entry or Asset is in a Draft State
 *
 * @param entity { cmaEntry | cmaAsset}
 * @return {boolean}
 */
export function isDraftState(entity: Entry | Asset): boolean {
  return !entity.sys.publishedVersion
}

/**
 * [CMA Only] Detect if an Entry or Asset is in a Draft State
 *
 *
 * @param entity { Entry | cmaAsset}
 * @return {boolean}
 */
export function isChanged(entity: Entry | Asset): boolean {
  const sys = entity.sys // NOTE: info about the BangBang (!!) https://stackoverflow.com/q/784929/
  return !!sys.publishedVersion && sys.version >= sys.publishedVersion + 2
}

/**
 * Detect if an entity is in published state (Management API))
 * @param entity
 * @return {boolean}
 */
export function isPublished(entity: Entry | Asset): boolean {
  const sys = entity.sys
  return !!sys.publishedVersion && sys.version === sys.publishedVersion + 1
}

/**
 * Detect if an entity is in archived state (Management API))
 * @param entity
 * @return {boolean}
 */
export function isArchived(entity: Entry | Asset): boolean {
  const sys = entity.sys
  return !!sys.archivedVersion
}

export function getStatusText(entity: Entry | Asset): EntryCardStatus | string {
  if (entity.sys) {
    if (isDraftState(entity)) return 'draft'
    if (isArchived(entity)) return 'archived'
    if (isPublished(entity)) return 'published'
    if (isChanged(entity)) return 'changed'
  }
  return ''
}
