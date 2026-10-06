import { getAdminDataDirectory, getAdminDataFiles } from '@pixelated-tech/components/adminserver';
import AssessmentTemplate from './assessment-template';
import { PageTitleHeader } from '@pixelated-tech/components';

export default async function AssessmentPage() {
	const files = await getAdminDataFiles(getAdminDataDirectory(process.cwd(), 'assessment'));
	return (
		<>
			<PageTitleHeader title="Assessment" />
			<AssessmentTemplate files={files} />
		</>
	);
}
