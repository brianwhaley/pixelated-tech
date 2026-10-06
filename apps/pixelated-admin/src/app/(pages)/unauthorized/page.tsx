import { Unauthorized } from '@pixelated-tech/components/adminclient';
import { PageTitleHeader } from '@pixelated-tech/components';

export default function UnauthorizedPage() {
	return (
		<>
			<PageTitleHeader title="Unauthorized" />
			<Unauthorized />
		</>
	);
}
