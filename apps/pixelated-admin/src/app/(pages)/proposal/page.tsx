import { getAdminDataDirectory, getAdminDataFiles } from '@pixelated-tech/components/adminserver';
import ProposalTemplate from './proposal-template';
import { PageTitleHeader } from '@pixelated-tech/components';

export default async function ProposalPage() {
	const files = await getAdminDataFiles(getAdminDataDirectory(process.cwd(), 'proposal'));
	return (
		<>
			<PageTitleHeader title="Proposal" />
			<ProposalTemplate files={files} />
		</> 
	);
}
