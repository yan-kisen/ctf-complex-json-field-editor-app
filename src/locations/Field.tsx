import { FieldExtensionSDK } from '@contentful/app-sdk'

import * as React from 'react'
import ComplexJsonFieldEditor from '../components/ComplexJsonFieldEditor'

interface FieldProps {
  sdk: FieldExtensionSDK
}

const Field: React.FC<FieldProps> = ({ sdk }: FieldProps) => {
  return <ComplexJsonFieldEditor sdk={sdk} />
}

export default Field
