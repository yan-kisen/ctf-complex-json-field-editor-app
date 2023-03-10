import { AppExtensionSDK, FieldExtensionSDK, init, locations, SidebarExtensionSDK } from '@contentful/app-sdk'
import '@contentful/forma-36-fcss/dist/styles.css'
import '@contentful/forma-36-react-components/dist/styles.css'
import '@contentful/forma-36-tokens/dist/css/index.css'

import consola, { LogLevel } from 'consola'
import * as React from 'react'
import { render } from 'react-dom'
import './index.css'

import Config from './locations/ConfigScreen'
import Field from './locations/Field'
import LocalhostWarning from './locations/LocalhostWarning'
import Sidebar from './locations/Sidebar'

const logger = consola.create({ level: LogLevel.Debug, async: false }).withTag('ctf-json-field-editor-app')

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  const root = document.getElementById('root')
  render(<LocalhostWarning />, root)
} else {
  init((sdk) => {
    // logger.info('init')
    const root = document.getElementById('root')

    // All possible locations for your app
    // Feel free to remove unused locations
    // Dont forget to delete the file too :)
    const ComponentLocationSettings = [
      {
        location: locations.LOCATION_APP_CONFIG,
        component: <Config sdk={sdk as AppExtensionSDK} />,
      },
      {
        location: locations.LOCATION_ENTRY_FIELD,
        component: <Field sdk={sdk as FieldExtensionSDK} />,
      },
      // {
      //   location: locations.LOCATION_ENTRY_EDITOR,
      //   component: <EntryEditor sdk={sdk as EditorExtensionSDK} />,
      // },
      // {
      //   location: locations.LOCATION_DIALOG,
      //   component: <Dialog sdk={sdk as DialogExtensionSDK} />,
      // },
      {
        location: locations.LOCATION_ENTRY_SIDEBAR,
        component: <Sidebar sdk={sdk as SidebarExtensionSDK} />,
      },
      // {
      //   location: locations.LOCATION_PAGE,
      //   component: <Page sdk={sdk as PageExtensionSDK} />,
      // },
    ]

    // Select a component depending on a location in which the app is rendered.
    ComponentLocationSettings.forEach((componentLocationSetting) => {
      if (sdk.location.is(componentLocationSetting.location)) {
        // logger.info('render')
        render(componentLocationSetting.component, root)
      }
    })
  })
}
