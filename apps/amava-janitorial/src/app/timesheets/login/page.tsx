import { TimesheetLoginPage } from '@pixelated-tech/components/server';
import { PageTitleHeader } from '@pixelated-tech/components';

export default function TimesheetsLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
	return <>
		<PageTitleHeader title="Timesheets" />
		<TimesheetLoginPage searchParams={searchParams} />
	</>;
}
