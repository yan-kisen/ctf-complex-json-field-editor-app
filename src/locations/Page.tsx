import { PageExtensionSDK } from '@contentful/app-sdk';
import { Paragraph } from '@contentful/forma-36-react-components';
import React from 'react';

interface PageProps {
  sdk: PageExtensionSDK;
}

const Page = (props: PageProps) => {
  return <Paragraph>Hello Page Component</Paragraph>;
};

export default Page;
