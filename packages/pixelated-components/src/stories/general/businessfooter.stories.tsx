import React from 'react';
import { BusinessFooter } from '@/components/general/businessfooter';

const sampleSiteInfo = {
  name: 'Manning Metalworks',
  email: 'manningmetalworks@gmail.com',
  telephone: '(973) 906-0441',
  address: {
    streetAddress: '24 West Hanover Avenue',
    addressLocality: 'Morris Plains',
    addressRegion: 'NJ',
    postalCode: '07950',
    addressCountry: 'US',
  },
  openingHours: [
    { day: 'Mon', open: '09:00', close: '17:00' },
    { day: 'Tue', open: '09:00', close: '17:00' },
    { day: 'Wed', open: '09:00', close: '17:00' },
    { day: 'Thu', open: '09:00', close: '17:00' },
    { day: 'Fri', open: '09:00', close: '17:00' },
    { day: 'Sat', closed: true },
    { day: 'Sun', closed: true },
  ],
};

export default {
  title: 'General/BusinessFooter',
  component: BusinessFooter,
  argTypes: {
    googleMapsApiKey: { control: { type: 'text' } },
  },
};

const Template = (args: any) => (
  <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <BusinessFooter {...args} />
  </div>
);

export const Default = {
  render: Template,
  args: {
    siteInfo: sampleSiteInfo,
    googleMapsApiKey: '',
  },
};

export const WithMapsApiKey = {
  render: Template,
  args: {
    siteInfo: sampleSiteInfo,
    googleMapsApiKey: 'FAKE_API_KEY',
  },
};
