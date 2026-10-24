import React from 'react';
import { ContentfulAlerts } from '../../components/integrations/contentful.alert.components';

export default {
	title: 'Integrations/Contentful',
	component: ContentfulAlerts,
};

const Template = (args: any) => <ContentfulAlerts {...args} />;

export const ContentfulAlertsStory: any = Template.bind({});
ContentfulAlertsStory.args = {
	alertContentType: 'alert',
};
