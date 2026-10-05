import { getAdminDataDirectory, getAdminDataFiles } from '@pixelated-tech/components/adminserver';
import ProposalTemplate from './proposal-template';

export default async function ProposalPage() {
	const files = await getAdminDataFiles(getAdminDataDirectory(process.cwd(), 'proposal'));
	return <ProposalTemplate files={files} />;
}
