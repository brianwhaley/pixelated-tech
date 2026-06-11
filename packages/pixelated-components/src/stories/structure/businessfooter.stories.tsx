import React from 'react';
import { BusinessFooter } from '@/components/structure/businessfooter';

export default {
  title: 'General/BusinessFooter',
  component: BusinessFooter,
};

const Template = () => (
  <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <BusinessFooter />
  </div>
);

export const Default = {
  render: Template,
};
