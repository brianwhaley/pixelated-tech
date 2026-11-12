import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEFAULT_PASSCODE_COOKIE, getAuthenticatedTimesheetUser } from '@pixelated-tech/components/adminserver';
import { PageTitleHeader } from '@pixelated-tech/components';

const DOMAIN = 'amavajanitorial.com';

export default async function TimesheetsPage() {
	const cookieStore = await cookies();
	const user = await getAuthenticatedTimesheetUser(DOMAIN, cookieStore.get(DEFAULT_PASSCODE_COOKIE)?.value);

	if (!user) redirect('/timesheets/login');
	redirect(user.role === 'admin' ? '/timesheets/admin' : '/timesheets/summary');

	return <PageTitleHeader title="Timesheets" />;
}
