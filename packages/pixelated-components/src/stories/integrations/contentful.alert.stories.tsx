import React from 'react';
import { ContentfulAlert } from '@/components/integrations/contentful.alert.components';

export default {
	title: 'Integrations/Contentful Alert',
	component: ContentfulAlert,
};

const Template = (args: any) => <ContentfulAlert {...args} />;

export const Default = Template.bind({});
Default.args = {
	alertContentType: 'alert',
};
