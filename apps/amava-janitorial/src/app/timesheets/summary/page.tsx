import { TimesheetSummaryPage } from '@pixelated-tech/components/server';
import { PageTitleHeader } from '@pixelated-tech/components';

export default function TimesheetSummaryPageWrapper() {
	return <>
		<PageTitleHeader title="My Timesheets" />
		<TimesheetSummaryPage domain="amavajanitorial.com" />
	</>;
}
