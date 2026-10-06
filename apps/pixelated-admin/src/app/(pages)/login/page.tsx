import { PageSection } from '@pixelated-tech/components';
import Login from '../../components/Login';
import { PageTitleHeader } from '@pixelated-tech/components';
export default function LoginPage() {
	return (
		<>
			<PageTitleHeader title="Login" />
			<PageSection id="login-section" maxWidth="1024px" columns={1}>
				<Login />
			</PageSection>
		</>
	);
}