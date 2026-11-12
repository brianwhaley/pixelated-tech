import { TimesheetNewPage } from '@pixelated-tech/components/adminserver';
import { PageTitleHeader } from '@pixelated-tech/components';

export default function TimesheetNewPageWrapper({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
	return <>
		<PageTitleHeader title="Submit a New Timesheet" />
		<TimesheetNewPage domain="amavajanitorial.com" searchParams={searchParams} />
	</>;
}
