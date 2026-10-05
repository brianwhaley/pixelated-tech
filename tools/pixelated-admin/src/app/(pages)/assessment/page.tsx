import { getAdminDataDirectory, getAdminDataFiles } from '@pixelated-tech/components/adminserver';
import AssessmentTemplate from './assessment-template';

export default async function AssessmentPage() {
	const files = await getAdminDataFiles(getAdminDataDirectory(process.cwd(), 'assessment'));
	return <AssessmentTemplate files={files} />;
}
