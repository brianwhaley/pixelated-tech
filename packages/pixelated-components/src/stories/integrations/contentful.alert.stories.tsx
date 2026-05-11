import React from 'react';
import { ContentfulAlerts } from '@/components/integrations/contentful.alert.components';

export default {
	title: 'Integrations/Contentful Alerts',
	component: ContentfulAlerts,
};

const Template = (args: any) => <ContentfulAlerts {...args} />;

export const Default = Template.bind({});
Default.args = {
	alertContentType: 'alert',
};
