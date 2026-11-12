import { TimesheetAdminPage } from '@pixelated-tech/components/server';
import { PageTitleHeader } from '@pixelated-tech/components';

export default function TimesheetAdminPageWrapper({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
	return <>
		<PageTitleHeader title="Timesheet Admin" />
		<TimesheetAdminPage domain="amavajanitorial.com" searchParams={searchParams} />
	</>;
}
